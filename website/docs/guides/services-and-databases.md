---
title: Services & Databases
description: Define services, managed databases, health checks, persistent storage, and inter-service dependencies in your Eve manifest.
sidebar_position: 2
---

# Services & Databases

Eve services follow Docker Compose conventions with Eve-specific extensions for ingress, roles, managed databases, and storage. This guide covers every aspect of service configuration — from basic container definitions through platform-managed databases and persistent volumes.

## Service basics

Each key under `services` in your manifest defines a named service. At minimum, a service needs either an `image` to pull or a `build` context to build from:

```yaml
services:
  api:
    build:
      context: ./apps/api
    image: acme-api
    ports: [3000]
    environment:
      NODE_ENV: production
```

When both `build` and `image` are present, Eve builds the image from the context and pushes it to the registry using the `image` value as the tag. When only `image` is present, Eve pulls the image directly.

### Build configuration

The `build` block defines how to build the container image:

```yaml
services:
  api:
    build:
      context: ./apps/api          # Build context path (relative to repo root)
      dockerfile: Dockerfile.prod  # Optional: defaults to Dockerfile
      args:                        # Optional: build arguments
        NODE_VERSION: "20"
    image: acme-api
```

If a service has `build` but no `image` field and a usable registry is configured, Eve automatically derives the image name from the service name. Explicitly setting `image` is still recommended for clarity.

### Environment variables

Environment variables are declared as a key-value map. Values support [secret interpolation](/docs/guides/manifest-authoring#secret-interpolation) and [platform variables](/docs/guides/manifest-authoring#variable-interpolation):

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
      LOG_LEVEL: info
```

Eve also injects platform variables (`EVE_API_URL`, `EVE_PROJECT_ID`, `EVE_ENV_NAME`, etc.) automatically into every deployed service. You can override any injected variable by declaring it explicitly.

### Ports

Ports follow Docker Compose conventions. You can specify them as numbers or strings:

```yaml
ports: [3000]            # Container port only
ports: ["3000:3000"]     # host:container mapping
ports: [3000, 8080]      # Multiple ports
```

When a service exposes ports and the environment has a domain configured, Eve creates ingress routing by default. Control this with the `x-eve.ingress` block.

## Health checks

Health checks tell Eve when a service is ready to receive traffic. They use the standard Docker Compose format:

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
```

| Field | Default | Description |
|-------|---------|-------------|
| `test` | — | Command to run. Array form (`["CMD", ...]`) or string |
| `interval` | — | Time between checks (e.g., `10s`, `30s`) |
| `timeout` | — | Maximum time for a single check |
| `retries` | 3 | Consecutive failures before marking unhealthy |
| `start_period` | — | Grace period before health checks begin |

For database services, use the engine's built-in readiness tool:

```yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
      timeout: 3s
      retries: 5
```

:::tip
Always define health checks for services that other services depend on. Without a health check, `condition: service_healthy` dependencies cannot be satisfied.
:::

## Service dependencies and ordering

Use `depends_on` to declare startup ordering between services:

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
```

Two conditions are supported:

| Condition | Also accepted as | Behavior |
|-----------|------------------|----------|
| `service_started` | `started` | Wait until the container starts |
| `service_healthy` | `healthy` | Wait until the health check passes |

Dependencies form a directed acyclic graph. Eve resolves the graph and starts services in the correct order. Circular dependencies are rejected at validation time.

The following diagram shows how dependencies control startup ordering for a typical web application:

```mermaid
graph LR
  db[db] --> migrate[migrate]
  db --> api[api]
  api --> web[web]
```

## Eve service roles

The `x-eve.role` field determines how Eve treats a service at deploy time:

| Role | Description |
|------|-------------|
| `component` | Default. Long-running service deployed to Kubernetes |
| `worker` | Worker pool service (uses `worker_type` for routing) |
| `job` | One-off task — migrations, seed scripts, cleanup. Not deployed as a long-running service |
| `managed_db` | Platform-provisioned database. Not deployed to Kubernetes |

### Component (default)

The default role. Services without an explicit role are treated as long-running components:

```yaml
services:
  api:
    build:
      context: ./apps/api
    ports: [3000]
    x-eve:
      role: component   # Optional — this is the default
```

### Worker

Worker services participate in a worker pool. Specify `worker_type` to route work appropriately:

```yaml
services:
  processor:
    build:
      context: ./apps/processor
    x-eve:
      role: worker
      worker_type: default
```

Environments can configure worker pools with replica counts:

```yaml
environments:
  staging:
    workers:
      - type: default
        service: processor
        replicas: 2
```

### Job

Job services run as one-off tasks. They are not deployed as persistent containers — instead, they are executed on demand by pipeline steps or CLI commands:

```yaml
services:
  migrate:
    image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
    environment:
      DATABASE_URL: ${managed.db.url}
      MIGRATIONS_DIR: /migrations
    depends_on:
      db:
        condition: service_healthy
    x-eve:
      role: job
      files:
        - source: db/migrations
          target: /migrations
```

Reference job services from pipeline steps using the `job` action type:

```yaml
pipelines:
  deploy:
    steps:
      - name: migrate
        action: { type: job, service: migrate }
      - name: deploy
        depends_on: [migrate]
        action: { type: deploy }
```

### Recommended migration pattern (Eve-native)

For the simplest setup, use `public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest` as a `role: job` service:

```yaml
services:
  migrate:
    image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
    environment:
      DATABASE_URL: ${managed.db.url}
      MIGRATIONS_DIR: /migrations
    x-eve:
      role: job
      files:
        - source: db/migrations
          target: /migrations
```

Migration file conventions:

- Keep SQL files in `db/migrations/`
- Use `YYYYMMDDHHmmss_description.sql` naming
- Regex pattern: `^(\d{14})_([a-z0-9_]+)\.sql$`
- One migration file per logical migration (may contain multiple SQL statements)

Eve migration behavior:

- Tracks applied migrations in `schema_migrations` (`name`, `checksum`, `applied_at`)
- Re-runs with `ROLLBACK` safety for failed scripts
- Auto-creates `pgcrypto` and `uuid-ossp`
- Auto-baseline when the database already contains existing schema objects

### Local development example

For docker-compose workflows:

```yaml
services:
  migrate:
    image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
    environment:
      DATABASE_URL: postgres://app:app@db:5432/myapp
    volumes:
      - ./db/migrations:/migrations:ro
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: myapp
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
      timeout: 3s
      retries: 5
```

```bash
docker compose run --rm migrate        # Apply migrations
docker compose down -v && docker compose up -d db && docker compose run --rm migrate
```

:::note
You can still run a BYO migration tool if your org requires it, but the Eve-migrate container is the recommended default for documentation parity.
:::

## Managed databases

For production workloads, use Eve's managed database provisioning instead of running your own Postgres container. Managed databases are declared as services with `x-eve.role: managed_db`:

```yaml
services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"
```

### Configuration fields

| Field | Description |
|-------|-------------|
| `class` | Database tier — `db.p1` (small), `db.p2` (medium), `db.p3` (large) |
| `engine` | Database engine — currently only `postgres` is supported |
| `engine_version` | Engine version string (e.g., `"16"`) |

### Provisioning lifecycle

Managed databases are provisioned when you deploy an environment for the first time. They are **not** rendered into Kubernetes manifests — the platform handles provisioning, credentials, and networking separately.

The lifecycle flow looks like this:

```mermaid
graph LR
  sync[Sync manifest] --> deploy[Deploy environment]
  deploy --> provision[Provision tenant]
  provision --> ready[DB ready]
  ready --> connect[Services connect]
```

### Credentials and connection

The platform manages credentials automatically. Other services can reference managed database values using interpolation placeholders:

```yaml
services:
  api:
    environment:
      DATABASE_URL: ${managed.db.url}
```

These placeholders are resolved at deploy time when the managed database is available.

### Managing your database

Use the `eve db` CLI commands to interact with managed databases:

```bash
# Check provisioning status
eve db status --env staging

# View the current schema
eve db schema --env staging

# Run a read-only query
eve db sql --env staging --sql "SELECT count(*) FROM users"

# Run a write query (requires --write flag)
eve db sql --env staging --sql "UPDATE settings SET value='v2'" --write

# Run SQL from a file
eve db sql --env staging --file ./scripts/seed.sql

# Run migrations
eve db migrate --env staging --path db/migrations

# List applied migrations
eve db migrations --env staging

# Create a new migration file
eve db new create_users_table --path db/migrations
```

Migration files follow the naming convention `YYYYMMDDHHmmss_description.sql` and live under `db/migrations/` by default.

### Scaling and maintenance

```bash
# Scale to a larger tier
eve db scale --env staging --class db.p2

# Rotate database credentials
eve db rotate-credentials --env staging

# Destroy the managed database (irreversible)
eve db destroy --env staging --force
```

:::warning
`eve db destroy` permanently deletes the managed database and all its data. This action cannot be undone. Always ensure you have a backup before running this command.
:::

## Persistent storage

For services that need to persist data across container restarts (without using a managed database), attach a persistent volume with `x-eve.storage`:

```yaml
services:
  minio:
    image: minio/minio:latest
    ports: [9000]
    x-eve:
      storage:
        mount_path: /data
        size: 50Gi
        access_mode: ReadWriteOnce
        storage_class: standard
```

| Field | Description |
|-------|-------------|
| `mount_path` | Absolute path inside the container |
| `size` | Volume size (e.g., `10Gi`, `50Gi`) |
| `access_mode` | `ReadWriteOnce`, `ReadWriteMany`, or `ReadOnlyMany` |
| `storage_class` | Kubernetes storage class name |

:::info
Persistent volumes survive container restarts but are scoped to the environment. Deleting an environment removes its volumes.
:::

## File mounts

Mount files from your repository directly into a container using `x-eve.files`:

```yaml
services:
  nginx:
    image: nginx:alpine
    x-eve:
      files:
        - source: ./config/nginx.conf
          target: /etc/nginx/nginx.conf
        - source: ./config/certs/
          target: /etc/nginx/certs/
```

| Field | Description |
|-------|-------------|
| `source` | Relative path in the repository |
| `target` | Absolute path in the container |

File mounts are read from the repository at the deployed git SHA, ensuring the container always receives the version of the file that matches the deployed code.

## External services

Mark a service as external when it represents a dependency that Eve should not deploy — such as a third-party API or a database hosted elsewhere:

```yaml
services:
  stripe:
    x-eve:
      external: true
      url: https://api.stripe.com

  legacy-db:
    x-eve:
      external: true
      url: postgres://user:pass@legacy-host:5432/mydb
```

External services appear in the dependency graph and can be referenced by other services, but Eve skips them during deployment. This is useful for documenting the full system topology in a single manifest.

## API spec registration

Register your service's API specification so Eve can discover and catalog it:

```yaml
services:
  api:
    x-eve:
      api_spec:
        type: openapi
        spec_url: /openapi.json
```

Supported spec types:

| Type | Default spec URL | Description |
|------|------------------|-------------|
| `openapi` | `/openapi.json` | OpenAPI / Swagger specification |
| `postgrest` | `/` | PostgREST auto-generated API |
| `graphql` | `/graphql` | GraphQL schema introspection |

When `on_deploy` is `true` (the default), Eve fetches the spec after each deployment and registers it for agent discovery. Set `auth: "none"` if the spec endpoint does not require Eve authentication.

For services with multiple APIs, use `api_specs` instead:

```yaml
services:
  api:
    x-eve:
      api_specs:
        - type: openapi
          spec_url: /v1/openapi.json
          name: v1
        - type: openapi
          spec_url: /v2/openapi.json
          name: v2
```

## Environment overrides for services

Environments can override service configuration without changing the base definitions. This lets you keep a single service block while varying behavior per environment:

```yaml
services:
  api:
    build:
      context: ./apps/api
    image: acme-api
    ports: [3000]
    environment:
      NODE_ENV: production
      LOG_LEVEL: info

environments:
  staging:
    pipeline: deploy
    overrides:
      services:
        api:
          environment:
            NODE_ENV: staging
            LOG_LEVEL: debug
  production:
    pipeline: deploy
    approval: required
```

Overrides are merged with the base service configuration at deploy time. Only the specified fields are overridden — unmentioned fields retain their base values. This pattern is especially useful for tuning resource limits, log levels, or feature flags per environment without duplicating your entire service definition.

## Putting it all together

Here is a complete services block for a typical fullstack application with a managed database, an API server, a web frontend, and a migration job:

```yaml
services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"

  api:
    build:
      context: ./apps/api
    image: acme-api
    ports: [3000]
    environment:
      DATABASE_URL: ${managed.db.url}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    x-eve:
      ingress:
        public: true
        port: 3000
      api_spec:
        type: openapi
        spec_url: /openapi.json

  web:
    build:
      context: ./apps/web
    image: acme-web
    ports: [80]
    depends_on:
      api:
        condition: service_healthy
    x-eve:
      ingress:
        public: true
        port: 80

  migrate:
    image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
    environment:
      DATABASE_URL: ${managed.db.url}
      MIGRATIONS_DIR: /migrations
    depends_on:
      db:
        condition: service_healthy
    x-eve:
      role: job
      files:
        - source: db/migrations
          target: /migrations
```

This configuration gives you a managed Postgres database provisioned by the platform, an API with public ingress and OpenAPI discovery, a web frontend, and a migration job that runs before deployments via pipeline steps. All secrets and managed connection strings are resolved at deploy time.

## What's next?

- Wire up your build pipeline: [Pipelines & CI/CD](./pipelines.md)
- Manage deploy targets: [Environments & Promotion](./environments.md)
- See the full service schema: [Manifest Schema](/docs/reference/manifest-schema)
