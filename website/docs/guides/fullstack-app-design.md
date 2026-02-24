---
title: Fullstack App Design
description: Architect a fullstack application on Eve Horizon — manifest-driven services, managed databases, build pipelines, deployment strategies, secrets, and observability.
sidebar_position: 10
---

# Fullstack App Design

Eve Horizon is a platform where the manifest is the blueprint and every design decision is intentional. This guide walks through the architecture of a fullstack application — from service topology through deployment, secrets, and observability — so that both humans and agents can reason about the system by reading a single file.

## The manifest as blueprint

The `.eve/manifest.yaml` is the single source of truth for your application's shape. Treat it as an architectural document, not just configuration. If an agent or operator cannot understand your app by reading the manifest, the manifest is incomplete.

Here is what each section declares:

| Concern | Manifest section | Design decision |
|---------|-----------------|-----------------|
| Service topology | `services` | What processes run and how they connect |
| Infrastructure | `services[].x-eve` | Managed DB, ingress, roles |
| Build strategy | `services[].build` + `registry` | What gets built and where images live |
| Release pipeline | `pipelines` | How code flows from commit to production |
| Environment shape | `environments` | Which environments exist and what pipelines they use |
| Agent configuration | `x-eve.agents`, `x-eve.chat` | Agent profiles, team dispatch, chat routing |
| Runtime defaults | `x-eve.defaults` | Harness, workspace, and git policies |

This means the manifest serves three audiences at once: it tells the platform how to deploy, it tells agents how the app is shaped, and it tells humans what design decisions were made.

## Service topology patterns

Most Eve apps follow one of three patterns. Start with the simplest one that fits.

### API + Database (minimal)

A single HTTP service backed by a managed database. Suitable for APIs, webhooks, and simple web applications.

```yaml
services:
  api:
    build:
      context: ./apps/api
    ports: [3000]
    x-eve:
      ingress:
        public: true
        port: 3000
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"
```

### API + Worker + Database

Add a background worker when you need to process queues, run scheduled jobs, or handle long-running tasks separately from HTTP serving.

```yaml
services:
  api:
    build:
      context: ./apps/api
    ports: [3000]
    x-eve:
      ingress:
        public: true
        port: 3000
  worker:
    build:
      context: ./apps/worker
    x-eve:
      role: worker
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"
```

### Multi-service

For applications with a separate frontend, backend, worker, and external dependencies.

```yaml
services:
  web:
    build:
      context: ./apps/web
    ports: [80]
    x-eve:
      ingress:
        public: true
        port: 80
  api:
    build:
      context: ./apps/api
    ports: [3000]
    x-eve:
      ingress:
        public: true
        port: 3000
      api_spec:
        type: openapi
        spec_url: /openapi.json
  worker:
    build:
      context: ./apps/worker
    x-eve:
      role: worker
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"
  redis:
    image: redis:7
    x-eve:
      external: true
      url: redis://redis:6379
```

## Five service design rules

These rules emerge from how Eve provisions and connects services. Following them avoids the most common architectural mistakes.

1. **One concern per service.** Separate HTTP serving from background processing. An API service should not also run scheduled jobs. This gives the platform independent scaling and failure isolation.

2. **Use managed DB for Postgres.** Declare `x-eve.role: managed_db` and let the platform provision, connect, and inject credentials. No manual connection strings. Reference the URL with `${managed.db.url}` in other services.

3. **Mark external services explicitly.** Use `x-eve.external: true` with `x-eve.url` for services hosted outside Eve (Redis, third-party APIs, external databases). This tells the platform not to deploy them but to make their connection information available.

4. **Use `x-eve.role: job` for one-off tasks.** Migrations, seeds, and data backfills are job services, not persistent processes. Mark them with the `job` role so the platform knows they run to completion and exit.

5. **Expose ingress intentionally.** Only services that need external HTTP access get `x-eve.ingress.public: true`. Internal services communicate via cluster networking. Every public endpoint is a security surface.

## Platform-injected environment variables

Every deployed service automatically receives a set of environment variables from the platform. Design your application code to read these rather than hardcoding URLs.

| Variable | Description | Example |
|----------|-------------|---------|
| `EVE_API_URL` | Internal cluster URL for server-to-server calls | `http://eve-api:4701` |
| `EVE_PUBLIC_API_URL` | Public ingress URL for browser-facing code | `https://api.eh1.incept5.dev` |
| `EVE_PROJECT_ID` | The project ID | `proj_01abc123...` |
| `EVE_ORG_ID` | The organization ID | `org_01xyz789...` |
| `EVE_ENV_NAME` | The environment name | `staging`, `production` |

Use `EVE_API_URL` for backend/server-side calls from your container to the Eve API (internal cluster networking). Use `EVE_PUBLIC_API_URL` for browser/client-side calls or any code running outside the cluster.

```javascript
// Server-side: call Eve API from your backend
const eveApiUrl = process.env.EVE_API_URL;

// Client-side: expose to browser for frontend API calls
const publicApiUrl = process.env.EVE_PUBLIC_API_URL;
```

Services can override these by defining them explicitly in their `environment` section, but in most cases the injected values are what you want.

## Database design

### Provisioning

Declare a managed database in the manifest and the platform provisions it on first deploy:

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

The `class` field controls the managed DB tier — `db.p1`, `db.p2`, or `db.p3` for progressively more resources. Reference the connection URL in other services with `${managed.db.url}`.

Use `eve db status --env <env>` to confirm tenant readiness before relying on managed values.

### Migration strategy

Migrations are first-class citizens in Eve. Use the CLI to create and apply them:

```bash
eve db new create_users          # Create a new migration file
eve db migrate --env staging     # Apply pending migrations
eve db migrations --env staging  # List migration status
eve db schema --env staging      # Inspect current schema
```

Migration files follow the `YYYYMMDDHHmmss_description.sql` naming convention under `db/migrations/` by default. Never modify production schemas by hand.

For pipeline-driven migrations, declare a migration job service:

```yaml
services:
  migrate:
    image: flyway/flyway:10
    command: -url=jdbc:postgresql://db:5432/app -user=app -password=${secret.DB_PASSWORD} migrate
    depends_on:
      db:
        condition: service_healthy
    x-eve:
      role: job
```

### Row-Level Security

If agents or users will query the database directly, scaffold RLS helpers early:

```bash
eve db rls init --with-groups
```

Retrofitting row-level security is painful. Design for it from the start, especially in agentic apps where agents interact with data through SQL.

### Access patterns

| Who queries | How | Auth |
|-------------|-----|------|
| App service | `${managed.db.url}` in service env | Connection string injected at deploy |
| Agent via CLI | `eve db sql --env <env>` | Job token scopes access |
| Agent via RLS | SQL with `app.current_user_id()` | Session context set by runtime |

Keep app data and agent data separate using distinct schemas or naming conventions. App tables serve the product; agent tables serve memory and coordination.

## Build and release pipeline

### The canonical flow

Every production application should follow the `build -> release -> deploy` pipeline:

```yaml
pipelines:
  deploy:
    steps:
      - name: build
        action:
          type: build
      - name: release
        depends_on: [build]
        action:
          type: release
      - name: deploy
        depends_on: [release]
        action:
          type: deploy
```

This matters because the build step produces SHA256 image digests, the release step pins those exact digests into an immutable release record, and the deploy step uses the pinned release. You deploy exactly what you built — no tag drift, no `latest` surprises.

### Registry options

| Option | When to use |
|--------|-------------|
| `registry: "eve"` | Default. Internal registry with JWT auth. Simplest setup. |
| BYO registry (GHCR, ECR) | When you need images accessible outside Eve or have existing CI. |
| `registry: "none"` | Public base images only. No custom builds. |

For GHCR, add OCI labels to Dockerfiles for automatic repository linking:

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/YOUR_ORG/YOUR_REPO"
```

### Multi-stage Dockerfiles

Every service with a custom image needs a `build` section in the manifest:

```yaml
services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    image: ghcr.io/org/my-api
```

Use multi-stage Dockerfiles. BuildKit handles them natively. Place the OCI label on the final stage.

## Deployment and environments

### Environment strategy

| Environment | Type | Purpose | Pipeline |
|-------------|------|---------|----------|
| `staging` | persistent | Integration testing, demos | `deploy` |
| `production` | persistent | Live traffic | `deploy` (with promotion) |
| `preview-*` | temporary | PR previews, feature branches | `deploy` (auto-cleanup) |

Link each environment to a pipeline in the manifest:

```yaml
environments:
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required
```

### Deployment patterns

**Standard deploy** triggers the linked pipeline:

```bash
eve env deploy staging --ref main --repo-dir .
```

**Direct deploy** bypasses the pipeline for emergencies:

```bash
eve env deploy staging --ref <sha> --direct
```

**Promotion** builds once in staging, then promotes the same release artifacts to production. The build step's digests carry forward, guaranteeing identical images:

```bash
# Build, test, and release in staging
eve env deploy staging --ref <sha>

# Promote the same release to production
eve release resolve v1.2.3
eve env deploy production --ref <sha> --inputs '{"release_id":"rel_xxx"}'
```

### The recovery ladder

When a deploy fails, escalate through these stages:

```mermaid
graph LR
  A[Diagnose] --> B[Logs]
  B --> C[Rollback]
  C --> D[Reset]
```

1. **Diagnose**: `eve env diagnose <project> <env>` — shows health, recent deploys, and service status.
2. **Logs**: `eve env logs <project> <env>` — container output.
3. **Rollback**: Redeploy the previous known-good release.
4. **Reset**: `eve env reset <project> <env>` — nuclear option, reprovisions from scratch.

Design your app to be rollback-safe: migrations should be forward-compatible, and services should handle schema version mismatches gracefully during rolling deploys.

## Secrets and configuration

### Cascading precedence

Secrets resolve with cascading precedence: **project > user > org > system**. A project-level `API_KEY` overrides an org-level `API_KEY`.

### Five secrets design rules

1. **Set secrets per-project.** Use `eve secrets set KEY "value" --project proj_xxx`. Keep project secrets self-contained.

2. **Use interpolation in the manifest.** Reference `${secret.KEY}` in service environment blocks. The platform resolves at deploy time.

3. **Validate before deploying.** Run `eve manifest validate --validate-secrets` to catch missing secret references before they cause deploy failures.

4. **Use `.eve/dev-secrets.yaml` for local development.** Mirror the production secret keys with local values. This file is gitignored.

   ```yaml
   # .eve/dev-secrets.yaml
   secrets:
     default:
       DB_PASSWORD: dev_password
     staging:
       DB_PASSWORD: staging_password
   ```

5. **Never store secrets in environment variables directly.** Always use `${secret.KEY}` interpolation. This ensures secrets flow through the platform's resolution and audit chain.

### Git credentials

Agents need repository access. Set either `github_token` (HTTPS) or `ssh_key` (SSH) as project secrets. The worker injects these automatically during git operations.

```bash
eve secrets set github_token "ghp_xxx" --project proj_xxx
```

## Observability and debugging

### The debugging ladder

Escalate through these stages — start at the top, each gives more detail at more cost:

```bash
# 1. Status — quick health check
eve env show <project> <env>

# 2. Diagnose — detailed environment state
eve env diagnose <project> <env>

# 3. Logs — container output
eve env logs <project> <env>

# 4. Pipeline logs — step-by-step execution
eve pipeline logs <pipeline> <run-id> --follow

# 5. Recover — rollback or reset
eve env deploy <project> <env> --ref <known-good-sha>
```

Most issues resolve at stages 1-2.

### Build debugging

When builds fail:

```bash
eve build list --project <project_id>     # Find the build
eve build diagnose <build_id>             # Full state: spec, runs, artifacts, logs
eve build logs <build_id>                 # Timestamped build output
```

Common causes: missing registry credentials, Dockerfile path mismatch, build context too large. The `diagnose` command classifies errors automatically with actionable hints.

### Health checks

Design services with health endpoints. Eve polls health to determine deployment readiness — a deploy is complete when `ready === true` and `active_pipeline_run === null`.

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

## Complete annotated manifest

Here is a complete manifest for a fullstack application with web frontend, API backend, worker, and managed database. This is the kind of manifest you would find in a production Eve project.

```yaml
schema: eve/compose/v2
project: fullstack-example

# Container registry — use Eve's internal registry or bring your own
registry:
  host: public.ecr.aws/w7c4v0w3
  namespace: eve-horizon
  auth:
    username_secret: REGISTRY_USERNAME
    token_secret: REGISTRY_PASSWORD

services:
  # --- Managed database (provisioned by Eve, not deployed to K8s) ---
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"

  # --- API service (public ingress, connects to managed DB) ---
  api:
    build:
      context: ./apps/api
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

  # --- Web frontend (public ingress, talks to API) ---
  web:
    build:
      context: ./apps/web
    ports: [80]
    environment:
      API_URL: http://${ENV_NAME}-api:3000
      PUBLIC_URL: https://web.${ENV_NAME}.example.com
    x-eve:
      ingress:
        public: true
        port: 80

  # --- Migration job (runs on deploy, then exits) ---
  migrate:
    image: flyway/flyway:10
    command: >-
      -url=jdbc:postgresql://db:5432/app
      -user=app
      -password=${secret.DB_PASSWORD}
      -locations=filesystem:/migrations
      migrate
    volumes:
      - ./db/migrations:/migrations:ro
    depends_on:
      db:
        condition: service_healthy
    x-eve:
      role: job

# --- Environments ---
environments:
  test:
    pipeline: deploy-test
    overrides:
      services:
        api:
          environment:
            NODE_ENV: test
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required

# --- Pipelines ---
pipelines:
  deploy-test:
    steps:
      - name: migrate
        action: { type: job, service: migrate }
      - name: deploy
        depends_on: [migrate]
        action: { type: deploy }
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: release
        depends_on: [build]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }

# --- Eve extensions ---
x-eve:
  defaults:
    env: staging
    harness: mclaude
  requires:
    secrets: [REGISTRY_USERNAME, REGISTRY_PASSWORD, DB_PASSWORD]
```

## Design checklist

Use this checklist when designing a new fullstack app or evaluating an existing one.

**Service topology:**
- [ ] Each service has one responsibility
- [ ] Managed DB declared for Postgres needs
- [ ] External services marked with `x-eve.external: true`
- [ ] Only public-facing services have ingress enabled
- [ ] Platform-injected env vars used (not hardcoded URLs)

**Database:**
- [ ] Migrations managed via `eve db new` / `eve db migrate`
- [ ] RLS scaffolded if agents or users query directly
- [ ] App data separated from agent data by schema or convention

**Pipeline:**
- [ ] Canonical `build -> release -> deploy` pipeline defined
- [ ] Registry chosen and credentials set as secrets
- [ ] OCI labels on Dockerfiles (for GHCR)
- [ ] Image digests flow through release (no tag-based deploys)

**Environments:**
- [ ] Staging and production environments defined
- [ ] Each environment linked to a pipeline
- [ ] Promotion workflow defined (build once, deploy many)
- [ ] Recovery procedure known (diagnose -> rollback -> reset)

**Secrets:**
- [ ] All secrets set per-project via `eve secrets set`
- [ ] Manifest uses `${secret.KEY}` interpolation
- [ ] `eve manifest validate --validate-secrets` passes
- [ ] `.eve/dev-secrets.yaml` exists for local development
- [ ] Git credentials (`github_token` or `ssh_key`) configured

**Observability:**
- [ ] Services expose health endpoints
- [ ] The debugging ladder is understood (status -> diagnose -> logs -> recover)
- [ ] Pipeline logs are accessible via `eve pipeline logs --follow`

## What's next?

Layer agentic capabilities onto this foundation: [Agentic App Design](./agentic-app-design)
