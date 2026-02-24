---
title: Database Operations
description: Provision managed databases, run migrations, execute SQL queries, and manage schemas with the Eve CLI.
sidebar_position: 3
---

# Database Operations

Eve Horizon provides managed Postgres databases provisioned through your manifest, plus a full suite of CLI tools for migrations, schema inspection, SQL access, and credential management. Databases are scoped to environments -- each environment gets its own isolated tenant.

## Managed database overview

Managed databases are platform-provisioned Postgres instances declared in your manifest. Unlike regular services, managed DB services are **not** rendered into Kubernetes manifests -- the orchestrator provisions a tenant when you deploy an environment.

The provisioning lifecycle follows this flow:

```mermaid
graph LR
    A[Declare in Manifest] --> B[Deploy Environment]
    B --> C[Orchestrator Provisions]
    C --> D[Credentials Stored]
    D --> E[Injected at Deploy]
```

Key characteristics:

- Provisioning occurs on first deploy for each environment
- Each environment gets an isolated database tenant
- Credentials are managed by the platform and available via interpolation
- Managed DB availability depends on platform configuration -- ask an admin if provisioning is disabled

## Provisioning via manifest

Declare a managed database as a service with `x-eve.role: managed_db`:

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

| Field | Required | Description |
|-------|----------|-------------|
| `role` | Yes | Must be `managed_db` |
| `class` | Yes | Database tier -- `db.p1`, `db.p2`, or `db.p3` |
| `engine` | Yes | Database engine (currently `postgres`) |
| `engine_version` | No | Engine version (e.g., `"16"`) |

### Database tiers

| Tier | Use case |
|------|----------|
| `db.p1` | Development and testing |
| `db.p2` | Staging and light production |
| `db.p3` | Production workloads |

### Referencing managed values

Other services reference managed database values using interpolation placeholders that are resolved at deploy time:

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
    ports: [3000]
    environment:
      DATABASE_URL: ${managed.db.url}
    depends_on:
      db:
        condition: service_healthy
```

The `${managed.<service>.<field>}` syntax resolves to the provisioned values when the environment is deployed. Use `eve db status` to confirm tenant readiness before relying on managed values.

## Database status and credentials

### Checking status

Verify that your managed database is provisioned and ready:

```bash
eve db status --env staging
```

This shows the provisioning state, connection details, and health of the managed database for the specified environment.

### Credential rotation

Rotate database credentials when needed for security compliance:

```bash
eve db rotate-credentials --env staging
```

After rotation, redeploy services that reference managed database values so they pick up the new credentials.

## Migrations

Eve ships a purpose-built migration container image, `public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest`, for database migrations.

### Creating a new migration

```bash
eve db new create_users_table
```

This creates a new migration file under `db/migrations/` with the naming convention `YYYYMMDDHHmmss_create_users_table.sql`. The timestamp prefix ensures migrations execute in the correct order.

You can specify a custom migrations directory:

```bash
eve db new create_users_table --path db/custom-migrations
```

### Migration file conventions

Eve-migrate expects:

- `db/migrations/` directory for migration files
- Timestamped names: `YYYYMMDDHHmmss_description.sql`
- Regex: `/^(\d{14})_([a-z0-9_]+)\.sql$/`
- One file = one migration (multiple SQL statements allowed)

Behavior:

- Each migration runs in its own transaction.
- `schema_migrations` tracks `name`, `checksum`, and `applied_at`.
- SHA256 checksums prevent silent drift after a migration has run.
- `pgcrypto` and `uuid-ossp` extensions are installed when needed.
- Baseline migration behavior handles pre-existing schema objects safely.

### Running migrations

Apply pending migrations to an environment:

```bash
eve db migrate --env staging
```

To use a custom migrations path:

```bash
eve db migrate --env staging --path db/migrations
```

### Migration commands with direct URLs

All migration commands support `--url` to bypass managed DB resolution:

```bash
eve db migrate --url "postgres://app:app@localhost:5432/myapp" --path db/migrations
eve db migrations --url "postgres://app:app@localhost:5432/myapp"
```

### Listing applied migrations

View which migrations have been applied:

```bash
eve db migrations --env staging
```

### Migration as a pipeline step

For automated workflows, you can run migrations as a pipeline step using a service with `x-eve.role: job`:

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

pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: release
        depends_on: [build]
        action: { type: release }
      - name: migrate
        depends_on: [release]
        action: { type: job, service: migrate }
      - name: deploy
        depends_on: [migrate]
        action: { type: deploy }
```

This ensures migrations run before the application deploy step, and the pipeline fails if the migration fails.

To use a custom migration engine (for example Flyway), keep the same `x-eve.files` mount and replace `image`/`command`:

```yaml
services:
  migrate:
    image: flyway/flyway:10
    command: >-
      -url=${DATABASE_URL}
      -locations=filesystem:/migrations
      migrate
    x-eve:
      role: job
      files:
        - source: db/migrations
          target: /migrations
```

### Local migration workflow

For local compose stacks:

```bash
# docker-compose.yml
migrate:
  image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
  environment:
    DATABASE_URL: postgres://app:app@db:5432/myapp
  volumes:
    - ./db/migrations:/migrations:ro
  depends_on:
    db:
      condition: service_healthy
```

```bash
docker compose run --rm migrate
docker compose down -v && docker compose up -d db && docker compose run --rm migrate   # reset
```

## Schema management

### Inspecting the schema

View the current database schema for an environment:

```bash
eve db schema --env staging
```

To scope to a specific project:

```bash
eve db schema --env staging --project proj_xxx
```

### Row-level security

Inspect the RLS policies configured on your database:

```bash
eve db rls --env staging
```

This shows all active row-level security policies, which tables they apply to, and the policy expressions.

Initialize or refresh the default RLS scaffolding:

```bash
eve db rls init --env staging --with-groups
```

## SQL access

The `eve db sql` command provides direct SQL access to environment databases. This is useful for ad hoc queries, debugging, and data inspection.

### Read queries

```bash
# Inline query
eve db sql --env staging --sql "SELECT count(*) FROM users"

# Query from a file
eve db sql --env staging --file ./queries/user-report.sql
```

### Write queries

Write operations require the `--write` flag as a safety measure:

```bash
eve db sql --env staging --sql "UPDATE users SET active = true WHERE id = 42" --write
```

:::warning
The `--write` flag is a safety gate, not a permission check. Always verify your SQL before running write operations against production environments.
:::

### SQL access patterns

| Pattern | Command |
|---------|---------|
| Quick count | `eve db sql --env staging --sql "SELECT count(*) FROM orders"` |
| Table inspection | `eve db sql --env staging --sql "SELECT * FROM users LIMIT 10"` |
| Report from file | `eve db sql --env staging --file ./reports/monthly.sql` |
| Data fix | `eve db sql --env staging --sql "UPDATE ..." --write` |

## Scaling

Scale a managed database to a different tier:

```bash
eve db scale --env staging --class db.p2
```

This changes the database tier for the specified environment. The operation may involve a brief maintenance window depending on the platform configuration.

## Database reset and wipe

Use these commands when you need to reinitialize a database:

- `eve db reset`: drop + recreate + run migrations
- `eve db wipe`: drop + recreate without running migrations

```bash
eve db reset --env staging --force
eve db wipe --env staging --force
```

```bash
eve db reset --url "postgres://app:app@localhost:5432/myapp" --force
eve db wipe --url "postgres://app:app@localhost:5432/myapp" --force
```

## Backup and restore

Managed databases are backed up by the platform according to the tier's backup policy. For manual backup operations, use the SQL access commands to export data:

```bash
# Export a table to check data before a migration
eve db sql --env staging --sql "SELECT * FROM users" > users-backup.json
```

For full backup and restore procedures, coordinate with your platform administrator -- the managed database infrastructure handles automated backups at the platform level.

## Destroying a managed database

Remove a managed database tenant from an environment:

```bash
eve db destroy --env staging --force
```

The `--force` flag is required to confirm destruction. This permanently removes the database tenant and all its data for the specified environment.

:::danger
Database destruction is irreversible. Ensure you have backups before running `eve db destroy`.
:::

## Admin APIs

Platform administrators can manage managed database instances directly:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/managed-db/instances` | GET | List all managed DB instances |
| `/admin/managed-db/instances` | POST | Register a new instance |
| `/admin/managed-db/instances/:id` | GET | Get instance details |

Per-environment tenant endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/projects/:id/envs/:env/db/managed` | GET | Get tenant status |
| `/projects/:id/envs/:env/db/managed/rotate` | POST | Rotate credentials |
| `/projects/:id/envs/:env/db/managed/scale` | POST | Change tier |
| `/projects/:id/envs/:env/db/managed` | DELETE | Destroy tenant |

## CLI reference

Most `eve db` commands accept `--url <postgres-url>` as an alternative to `--env` for direct connection mode.

| Command | Purpose |
|---------|---------|
| `eve db status --env <name>` | Check managed DB provisioning state |
| `eve db status --url <postgres-url>` | Check DB status for direct URL mode |
| `eve db schema --env <name>` | Inspect database schema |
| `eve db schema --url <postgres-url>` | Inspect schema for direct URL |
| `eve db rls --env <name>` | View row-level security policies |
| `eve db rls --url <postgres-url>` | View RLS policies for direct URL |
| `eve db rls init --env <name> --with-groups` | Bootstrap RLS scaffolding for groups |
| `eve db rls init --url <postgres-url> --with-groups` | Bootstrap RLS scaffolding in direct URL mode |
| `eve db sql --env <name> --sql "..."` | Execute read query |
| `eve db sql --env <name> --sql "..." --write` | Execute write query |
| `eve db sql --env <name> --file ./query.sql` | Execute query from file |
| `eve db sql --url <postgres-url> --sql "..."` | Execute read query in direct URL mode |
| `eve db migrate --env <name>` | Run pending migrations |
| `eve db migrate --url <postgres-url>` | Run pending migrations for direct URL mode |
| `eve db migrations --env <name>` | List applied migrations |
| `eve db migrations --url <postgres-url>` | List applied migrations for direct URL mode |
| `eve db new <description>` | Create new migration file |
| `eve db new <description> --path <dir>` | Create migration in custom local path |
| `eve db rotate-credentials --env <name>` | Rotate database credentials |
| `eve db reset --env <name> --force` | Drop/recreate and rerun migrations |
| `eve db reset --url <postgres-url> --force` | Drop/recreate direct URL and rerun migrations |
| `eve db wipe --env <name> --force` | Drop/recreate without migration replay |
| `eve db wipe --url <postgres-url> --force` | Drop/recreate direct URL without migration replay |
| `eve db scale --env <name> --class <tier>` | Change database tier |
| `eve db destroy --env <name> --force` | Remove database tenant |

See [CLI Commands](/docs/reference/cli-commands) for the full command reference.
