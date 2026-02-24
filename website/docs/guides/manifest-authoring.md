---
title: Manifest Authoring
description: Write and maintain Eve manifest files that define your project's services, environments, pipelines, and platform extensions.
sidebar_position: 1
---

# Manifest Authoring

The `.eve/manifest.yaml` file is the single source of truth for how your project builds, deploys, and runs. It uses Docker Compose-style service definitions extended with Eve-specific configuration under `x-eve`. This guide walks through every section of the manifest, from basic structure to advanced patterns.

## Manifest purpose and location

Every Eve project has one manifest at `.eve/manifest.yaml` in the repository root. It declares:

- **Services** — what containers your project runs
- **Environments** — where those containers deploy (staging, production, PR previews)
- **Pipelines** — how builds, tests, and deploys are orchestrated
- **Workflows** — on-demand or scheduled operations
- **Platform extensions** — agent profiles, skill packs, default job settings

When you run `eve project sync`, the CLI reads this file, validates it, and pushes the parsed configuration to the Eve API. The API stores a hash of the manifest so subsequent deploys can detect drift.

## Top-level fields

A minimal manifest needs only `services`, but most projects define several top-level fields:

```yaml
schema: eve/compose/v2
project: acme-web

registry:
  host: public.ecr.aws/w7c4v0w3
  namespace: eve-horizon
  auth:
    username_secret: REGISTRY_USERNAME
    token_secret: REGISTRY_PASSWORD

services:
  # ...

environments:
  # ...

pipelines:
  # ...

workflows:
  # ...

x-eve:
  # ...
```

| Field | Required | Description |
|-------|----------|-------------|
| `schema` | No | Schema identifier, currently `eve/compose/v2` |
| `project` | No | Human-friendly project slug (informational) |
| `registry` | No | Container registry config — `"eve"`, `"none"`, or an object |
| `services` | Yes | Compose-style service definitions |
| `environments` | No | Deploy targets with overrides |
| `pipelines` | No | Deterministic step-based pipelines |
| `workflows` | No | On-demand workflow definitions |
| `versioning` | No | Release/version policy (semver, tagging) |
| `x-eve` | No | Eve-specific top-level extensions |

Unknown fields are allowed for forward compatibility.

### Registry

The registry block tells Eve where to push and pull container images:

```yaml
# Full object form
registry:
  host: public.ecr.aws/w7c4v0w3
  namespace: eve-horizon
  auth:
    username_secret: REGISTRY_USERNAME
    token_secret: REGISTRY_PASSWORD
```

Two shorthand string values are also accepted:

```yaml
registry: "eve"    # Use the Eve-native internal registry (JWT-authenticated)
registry: "none"   # Opt out of registry auth and pull secrets
```

When set to `"eve"`, the deployer uses an API-issued JWT to authenticate with the internal registry. When set to `"none"`, Eve assumes public images or external auth and skips creating Kubernetes `imagePullSecrets`.

## Service definitions

Services follow Docker Compose conventions. Each key under `services` is a service name, and the value describes the container:

```yaml
services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    image: ghcr.io/acme/api
    ports: [3000]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    x-eve:
      ingress:
        public: true
        port: 3000
```

### Standard service fields

| Field | Description |
|-------|-------------|
| `image` | Base image (used for pull; also the push target when `build` is present) |
| `build` | Build context with optional `dockerfile` and `args` |
| `environment` | Environment variable map (supports secret and variable interpolation) |
| `ports` | Container ports (Compose-style — numbers or `"host:container"` strings) |
| `depends_on` | Dependency ordering with optional health conditions |
| `healthcheck` | Docker-style health check (test command, interval, timeout, retries, start_period) |
| `x-eve` | Eve extensions (see below) |

### Health checks

Health checks use the Docker Compose format. Eve uses them to determine when a service is ready:

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "app"]
  interval: 5s
  timeout: 3s
  retries: 5
  start_period: 10s
```

The `test` field accepts either a string or an array. `CMD` is the standard test type.

### Dependencies and ordering

Use `depends_on` with a condition to control startup ordering:

```yaml
depends_on:
  db:
    condition: service_healthy
```

Supported conditions:

- `service_started` (or `started`) — wait until the container starts
- `service_healthy` (or `healthy`) — wait until the health check passes

## Eve extensions (`x-eve`)

Every service can include an `x-eve` block (also accepted as `x_eve`) for Eve-specific configuration:

| Field | Description |
|-------|-------------|
| `role` | `component` (default), `worker`, `job`, or `managed_db` |
| `ingress` | Public routing: `{ public: true, port: 3000 }` |
| `api_spec` | Single API spec registration |
| `api_specs` | Multiple API specs (array) |
| `external` | If `true`, the service is not deployed (external dependency) |
| `url` | Connection string for external services |
| `worker_type` | Worker pool type for worker-role services |
| `files` | Mount repository files into the container |
| `storage` | Persistent volume configuration |
| `managed` | Managed DB config (requires `role: managed_db`) |

### Ingress

If a service exposes ports and your environment has a domain, Eve creates public ingress by default. You can explicitly control this:

```yaml
x-eve:
  ingress:
    public: true
    port: 3000
    alias: my-api    # Optional custom subdomain (3-63 chars, lowercase alphanumeric + hyphens)
```

Set `public: false` to disable ingress for a service that exposes ports.

### API spec registration

Register an OpenAPI, PostgREST, or GraphQL spec so Eve can discover your service's API:

```yaml
x-eve:
  api_spec:
    type: openapi          # openapi | postgrest | graphql
    spec_url: /openapi.json
```

The `spec_url` is relative to the service URL by default. When `on_deploy` is `true` (the default), Eve fetches the spec after each deployment.

### File mounts

Mount files from your repository into the container:

```yaml
x-eve:
  files:
    - source: ./config/app.conf     # Relative path in repo
      target: /etc/app/app.conf     # Absolute path in container
```

### Persistent storage

Attach a persistent volume to a service:

```yaml
x-eve:
  storage:
    mount_path: /data
    size: 10Gi
    access_mode: ReadWriteOnce    # ReadWriteOnce | ReadWriteMany | ReadOnlyMany
    storage_class: standard
```

## Secret interpolation

Reference secrets stored in Eve using the `${secret.KEY}` syntax anywhere in environment values:

```yaml
environment:
  DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
  API_KEY: ${secret.STRIPE_KEY}
```

Secrets are resolved at deploy time. The actual values never appear in the manifest or in the synced configuration.

You can declare required secrets for validation during sync:

```yaml
x-eve:
  requires:
    secrets: [GITHUB_TOKEN, REGISTRY_TOKEN]
```

Pipeline steps can also declare their own secret requirements:

```yaml
pipelines:
  ci:
    steps:
      - name: integration-tests
        script:
          run: "pnpm test"
        requires:
          secrets: [DATABASE_URL]
```

Use `eve manifest validate` or `eve project sync --validate-secrets` to verify all required secrets are present before deploying.

## Variable interpolation

Eve injects platform environment variables into all deployed services automatically:

| Variable | Description |
|----------|-------------|
| `EVE_API_URL` | Internal cluster URL for server-to-server calls |
| `EVE_PUBLIC_API_URL` | Public ingress URL for browser-facing apps |
| `EVE_PROJECT_ID` | The project ID (e.g., `proj_01abc123`) |
| `EVE_ORG_ID` | The organization ID (e.g., `org_01xyz789`) |
| `EVE_ORG_SLUG` | The organization slug (e.g., `acme`) |
| `EVE_ENV_NAME` | The environment name (e.g., `staging`) |

You can reference these in your application code without declaring them in the manifest:

```javascript
// Server-side: internal cluster networking
const eveApi = process.env.EVE_API_URL;

// Client-side: public ingress for browser calls
const publicApi = process.env.EVE_PUBLIC_API_URL;
```

Services can override these values by defining them explicitly in their `environment` block.

## Pipeline and workflow triggers

Events can automatically trigger pipelines and workflows when their `trigger` blocks are present.

### Pipeline triggers

```yaml
pipelines:
  ci-cd-main:
    trigger:
      github:
        event: push
        branch: main
```

```yaml
pipelines:
  ci-cd-main:
    trigger:
      github:
        event: pull_request
        action: [opened, synchronize, reopened]
        base_branch: main
```

```yaml
pipelines:
  remediation:
    trigger:
      system:
        event: job.failed
        pipeline: deploy
```

### Workflow triggers

```yaml
workflows:
  log-audit:
    trigger:
      cron:
        schedule: "0 0 * * *"
```

```yaml
workflows:
  manual-release:
    trigger:
      manual: true
```

Use these trigger blocks in your manifest to keep build, remediation, and scheduled ops declarative.

## Managed databases

Declare a platform-managed database by setting `x-eve.role: managed_db`:

```yaml
services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1        # Tier: db.p1, db.p2, db.p3
        engine: postgres
        engine_version: "16"
```

Managed database services are **not** deployed to Kubernetes. Instead, Eve provisions a database tenant when you deploy an environment for the first time. Key points:

- **Provisioning** happens on first deploy for each environment
- **Credentials** are managed by the platform and can be rotated with [eve db](/docs/reference/cli-appendix#eve-db) commands
- **Scaling** is handled with [eve db](/docs/reference/cli-appendix#eve-db) commands
- **Status** can be checked with [eve db](/docs/reference/cli-appendix#eve-db) commands

Other services can reference managed database values using `${managed.<service>.<field>}` placeholders, which are resolved at deploy time.

## Default job settings (`x-eve.defaults`)

The top-level `x-eve.defaults` block sets project-wide defaults for job execution — harness selection, model preferences, git behavior, and resource budgets:

```yaml
x-eve:
  defaults:
    env: staging
    harness_preference:
      harness: mclaude
      profile: primary-orchestrator
      options:
        model: opus-4.5
        reasoning_effort: high
    hints:
      permission_policy: auto_edit
      resource_class: job.c1
      max_cost:
        currency: usd
        amount: 5
      max_tokens: 200000
    git:
      ref_policy: auto
      branch: job/${job_id}
      create_branch: if_missing
      commit: manual
      push: never
    workspace:
      mode: job
```

These defaults apply to all jobs in the project unless overridden at the job level.

:::warning
`harness_preference` replaces `harness`, `harness_profile`, and `harness_options` in `x-eve.defaults`.
Legacy fields are still accepted but deprecated.
:::

## Agent profiles (`x-eve.agents`)

Define per-project agent profiles and councils for AI orchestration:

```yaml
x-eve:
  agents:
    version: 1
    availability:
      drop_unavailable: true
    profiles:
      primary-orchestrator:
        - harness: mclaude
          model: opus-4.5
          reasoning_effort: high
      primary-reviewer:
        - harness: mclaude
          model: opus-4.5
          reasoning_effort: high
        - harness: codex
          model: gpt-5.2-codex
          reasoning_effort: x-high
      planning-council:
        - profile: primary-planner
        - harness: gemini
          model: gemini-3
```

Profiles list harness/model combinations in preference order. If `drop_unavailable` is `true`, unavailable harnesses are silently skipped. The manifest sync API returns the parsed policy as `parsed_agents` for orchestrators to consume.

## AgentPacks (`x-eve.packs`)

AgentPacks import agent, team, chat, and skill configuration from external repositories:

```yaml
x-eve:
  # Which agents to install skills for (defaults to [claude-code])
  install_agents: [claude-code, codex, gemini-cli]

  packs:
    # Local pack
    - source: ./skillpacks/my-pack

    # Remote pack (ref required for remote sources)
    - source: incept5/eve-skillpacks
      ref: 0123456789abcdef0123456789abcdef01234567

    # Per-pack agent override
    - source: ./skillpacks/claude-only
      install_agents: [claude-code]
```

- `source` can be a local path, `owner/repo`, `github:owner/repo`, or a git URL.
- Remote sources require `ref` as a 40-character git SHA.
- Packs are resolved by [eve agents sync](/docs/reference/cli-appendix#eve-agents-sync) and locked in `.eve/packs.lock.yaml`.
- Use `eve packs status` to check lockfile state and drift.
- Use `_remove: true` to omit pack-provided entries in overlays:

```yaml
agents:
  deprecated-pack-agent:
    _remove: true
```

## Validating your manifest

Before syncing, validate the manifest locally:

```bash
eve manifest validate
```

This runs schema validation and, optionally, secret validation:

```bash
eve manifest validate --validate-secrets
eve manifest validate --strict    # Fail on missing secrets
```

The validator checks:

- Schema conformance against the Zod-based manifest schema
- Service coherence (e.g., `build` without `image` and no registry configured)
- Pipeline references (environment pointing to a non-existent pipeline)
- Secret requirements (when `--validate-secrets` is set)

## Syncing to the platform

Push the manifest to Eve so the platform can act on it:

```bash
eve project sync
```

This reads `.eve/manifest.yaml`, hashes it, and sends it to the API. The response includes:

- `manifest_hash` — used by subsequent deploys to detect drift
- `parsed_defaults` — the resolved `x-eve.defaults` block
- `parsed_agents` — the resolved `x-eve.agents` block
- `warnings` — any coherence issues detected
- `secret_validation` — results if `--validate-secrets` was passed

Use `--strict` to fail on any validation warnings:

```bash
eve project sync --validate-secrets --strict
```

## Common patterns

### Fullstack app with managed database

```yaml
schema: eve/compose/v2
project: acme-web
registry: "eve"

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
    x-eve:
      ingress:
        public: true
        port: 80

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
    depends_on:
      db:
        condition: service_healthy

environments:
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required

pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: migrate
        action: { type: job, service: migrate }
      - name: release
        depends_on: [build, migrate]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }
```

### Migration-only service

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
    depends_on:
      db:
        condition: service_healthy

:::note
If you already run migrations with Flyway or another migration engine, keep that approach as a BYO migration option.
:::
```

Services with `role: job` are runnable as one-off tasks (migrations, seed scripts). They don't run as long-lived deployments.

### External service reference

```yaml
services:
  stripe:
    x-eve:
      external: true
      url: https://api.stripe.com
```

External services are not deployed by Eve. They exist in the manifest so other services and the platform can reference them as dependencies.

## What's next?

- Deep-dive into service configuration: [Services & Databases](./services-and-databases.md)
- Set up your build pipeline: [Pipelines & CI/CD](./pipelines.md)
- See the full schema reference: [Manifest Schema](/docs/reference/manifest-schema)
- Validate from the CLI: [eve manifest validate](/docs/reference/cli-appendix#eve-manifest-validate)
