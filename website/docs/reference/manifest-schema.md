---
title: Manifest Schema
description: Complete field reference for .eve/manifest.yaml — top-level fields, services, x-eve extensions, environments, pipelines, workflows, agents, packs, and interpolation syntax.
sidebar_position: 2
---

# Manifest Schema

The `.eve/manifest.yaml` file is the single source of truth for how an Eve Horizon project builds, deploys, and runs. It uses Docker Compose-style service definitions extended with Eve-specific fields under `x-eve`.

The current schema identifier is `eve/compose/v2`. Unknown fields are allowed for forward compatibility.

## Minimal Example

```yaml
schema: eve/compose/v2
project: my-project

registry:
  host: public.ecr.aws/w7c4v0w3
  namespace: eve-horizon
  auth:
    username_secret: REGISTRY_USERNAME
    token_secret: REGISTRY_PASSWORD

services:
  db:
    image: postgres:16
    ports: [5432]
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${secret.DB_PASSWORD}
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build:
      context: ./apps/api
    ports: [3000]
    environment:
      DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
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

environments:
  test:
    pipeline: deploy-test

pipelines:
  deploy-test:
    steps:
      - name: migrate
        action: { type: job, service: migrate }
      - name: deploy
        depends_on: [migrate]
        action: { type: deploy }
```

## Top-Level Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `schema` | No | `string` | Schema identifier, e.g., `eve/compose/v2` |
| `project` | No | `string` | Human-friendly project slug (informational) |
| `registry` | No | `object \| "eve" \| "none"` | Container registry configuration |
| `services` | Yes | `map<string, Service>` | Compose-style service definitions |
| `environments` | No | `map<string, Environment>` | Environment definitions and overrides |
| `pipelines` | No | `map<string, Pipeline>` | Deterministic step-based pipelines |
| `workflows` | No | `map<string, Workflow>` | On-demand workflow definitions |
| `versioning` | No | `object` | Release/version policy (semver, tagging) |
| `x-eve` | No | `object` | Eve-specific top-level extensions |

---

## Services

Services follow Docker Compose conventions. Each key under `services` is a service name.

### Service Fields

| Field | Type | Description |
|-------|------|-------------|
| `image` | `string` | Base image (tag optional -- Eve tags at build time) |
| `build` | `object` | Build configuration |
| `build.context` | `string` | Build context directory (required if `build` is set) |
| `build.dockerfile` | `string` | Dockerfile path relative to context |
| `build.args` | `map<string, string>` | Build-time arguments |
| `environment` | `map<string, string>` | Environment variable map |
| `ports` | `array<string \| number>` | Container ports (Compose-style entries) |
| `depends_on` | `map<string, object>` | Dependency ordering with health conditions |
| `healthcheck` | `object` | Docker-style health check |
| `command` | `string \| array` | Override the container command |
| `volumes` | `array<string>` | Volume mounts (Compose syntax) |
| `x-eve` | `object` | Eve extensions (see below) |

### Dependency Conditions

```yaml
depends_on:
  db:
    condition: service_healthy
```

Supported values: `service_started` (alias: `started`), `service_healthy` (alias: `healthy`).

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

All timing fields are optional duration strings (e.g., `5s`, `10s`).

---

## Service `x-eve` Extensions

Each service may include an `x-eve` block (or `x_eve` in code) for Eve-specific behavior.

| Field | Type | Description |
|-------|------|-------------|
| `role` | `string` | `component` (default), `worker`, `job`, or `managed_db` |
| `ingress` | `object` | Public routing configuration |
| `ingress.public` | `boolean` | Enable public ingress (default: `true` when ports are exposed) |
| `ingress.port` | `number` | Port to route traffic to |
| `ingress.alias` | `string` | Custom subdomain alias (3-63 chars, lowercase alphanumeric + hyphens) |
| `api_spec` | `object` | Single API spec registration |
| `api_specs` | `array<ApiSpec>` | Multiple API spec registrations |
| `external` | `boolean` | If `true`, service is not deployed (external dependency) |
| `connection_url` | `string` | Connection string for external services |
| `worker_type` | `string` | Worker pool type for worker-role services |
| `files` | `array<FileMount>` | Mount repo files into the container |
| `storage` | `object` | Persistent volume configuration |
| `managed` | `object` | Managed database config (requires `role: managed_db`) |

### Roles

- **`component`** (default) -- a long-running service deployed to Kubernetes.
- **`worker`** -- a background worker service.
- **`job`** -- a one-off container (migrations, seeds) runnable as a pipeline step.
- **`managed_db`** -- a platform-provisioned database (not deployed to Kubernetes).

### API Spec Registration

```yaml
x-eve:
  api_spec:
    type: openapi       # openapi | postgrest | graphql
    spec_url: /openapi.json
    on_deploy: true      # refresh spec after each deploy (default: true)
    auth: eve            # eve | none (default: eve)
    name: my-api         # optional display name
```

`spec_url` may be relative (resolved against the service URL) or absolute.

### File Mounts

```yaml
x-eve:
  files:
    - source: ./config/app.conf    # relative path in repo
      target: /etc/app/app.conf    # absolute path in container
```

### Persistent Storage

```yaml
x-eve:
  storage:
    mount_path: /data
    size: 10Gi
    access_mode: ReadWriteOnce    # ReadWriteOnce | ReadWriteMany | ReadOnlyMany
    storage_class: standard
```

### Managed Databases

Services with `role: managed_db` are provisioned by the platform, not deployed to Kubernetes.

```yaml
services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1          # tier: db.p1, db.p2, db.p3
        engine: postgres       # only postgres currently supported
        engine_version: "16"
```

- Provisioning happens on first deploy for an environment.
- Use `eve db status --env <name>` to view provisioning state.
- Other services reference managed values with `${managed.<service>.<field>}` placeholders (resolved at deploy time).

---

## Environments

Environments link pipelines to deploy targets and support per-environment overrides.

```yaml
environments:
  staging:
    pipeline: deploy
    pipeline_inputs:
      smoke_test: true
      timeout: 1800
    approval: required
    overrides:
      services:
        api:
          environment:
            NODE_ENV: staging
    workers:
      - type: default
        service: worker
        replicas: 2
```

| Field | Type | Description |
|-------|------|-------------|
| `pipeline` | `string` | Pipeline to run when deploying this environment |
| `pipeline_inputs` | `map<string, any>` | Default inputs for the pipeline run (merged with CLI `--inputs`, CLI wins) |
| `approval` | `string` | Set to `required` to gate deploy and job steps |
| `overrides` | `object` | Compose-style service overrides for this environment |
| `overrides.services` | `map<string, Service>` | Per-service environment/config overrides |
| `workers` | `array<object>` | Worker pool selection for this environment |

### Environment Pipeline Behavior

When `pipeline` is set, `eve env deploy <env>` triggers a pipeline run instead of a direct deployment. This enables consistent build/test/deploy workflows and promotion patterns.

To bypass the pipeline and perform a direct deployment:

```bash
eve env deploy staging --ref <sha> --direct
```

### Promotion Pattern

```yaml
environments:
  test:
    pipeline: deploy-test
  staging:
    pipeline: deploy
    pipeline_inputs:
      smoke_test: true
  production:
    pipeline: deploy
    approval: required
```

```bash
# Build + test + release in test
eve env deploy test --ref <sha>

# Promote to staging (reuse release)
eve release resolve v1.2.3
eve env deploy staging --ref <sha> --inputs '{"release_id":"rel_xxx"}'

# Promote to production (approval gate)
eve env deploy production --ref <sha> --inputs '{"release_id":"rel_xxx"}'
```

---

## Pipelines

Pipelines define deterministic step graphs that expand into job graphs at runtime.

```yaml
pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: unit-tests
        script:
          run: "pnpm test"
          timeout: 1800
      - name: release
        depends_on: [build, unit-tests]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }
```

### Step Types

Each step is one of the following:

| Type | Field | Description |
|------|-------|-------------|
| **action** | `action.type` | Built-in action: `build`, `release`, `deploy`, `run`, `job`, `create-pr` |
| **script** | `script.run` | Shell command executed by the worker |
| **agent** | `agent.prompt` | AI agent job with an optional config block |
| **run** | `run` | Shorthand for `script.run` |

### Step Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Step identifier (unique within pipeline) |
| `depends_on` | `array<string>` | Step names that must complete before this step runs |
| `action` | `object` | Built-in action configuration |
| `script` | `object` | Script execution (`run`, `command`, `timeout`) |
| `agent` | `object` | AI agent job (`prompt`, optional config) |
| `run` | `string` | Shorthand for `script.run` |
| `requires` | `object` | Step-level requirements |
| `requires.secrets` | `array<string>` | Secrets required by this step (validated during sync) |

### Action Types

| Action | Description |
|--------|-------------|
| `build` | Build container images for services with `build` config |
| `release` | Create a tagged release from build artifacts |
| `deploy` | Deploy services to the target environment |
| `run` | Run a one-off container |
| `job` | Execute a service marked as `role: job` (e.g., migrations) |
| `create-pr` | Create a pull request from job changes |

---

## Workflows

Workflows are manifest-defined jobs stored and returned as-is. The platform extracts `db_access` when present.

```yaml
workflows:
  nightly-audit:
    db_access: read_only
    steps:
      - agent:
          prompt: "Audit errors and summarize anomalies"
```

Invoke workflows with the CLI:

```bash
eve workflow run nightly-audit --input '{"scope":"last-24h"}'
eve workflow invoke nightly-audit    # run and wait for result
```

---

## Registry

The `registry` field configures container image storage.

### Object Form

```yaml
registry:
  host: public.ecr.aws/w7c4v0w3
  namespace: eve-horizon
  auth:
    username_secret: REGISTRY_USERNAME
    token_secret: REGISTRY_PASSWORD
```

| Field | Type | Description |
|-------|------|-------------|
| `host` | `string` | Registry hostname |
| `namespace` | `string` | Image namespace/prefix |
| `auth.username_secret` | `string` | Secret name for registry username |
| `auth.token_secret` | `string` | Secret name for registry password/token |

The deployer uses these secrets to create Kubernetes `imagePullSecrets`.

### String Form

```yaml
registry: "eve"    # Use Eve-native registry (internal, JWT-based auth)
registry: "none"   # Opt out of registry auth (public images or external auth)
```

---

## `x-eve.defaults`

Default settings for jobs created in this project. Merged on job creation; explicit job fields override defaults.

```yaml
x-eve:
  defaults:
    env: staging
    harness: mclaude
    harness_profile: primary-orchestrator
    harness_options:
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

| Field | Type | Description |
|-------|------|-------------|
| `env` | `string` | Default target environment for jobs |
| `harness` | `string` | Default harness (e.g., `mclaude`) |
| `harness_profile` | `string` | Default profile from `x-eve.agents` |
| `harness_options` | `object` | Model, reasoning effort, and variant overrides |
| `hints` | `object` | Scheduling hints: `permission_policy`, `resource_class`, `max_cost`, `max_tokens` |
| `git` | `object` | Default git controls (see [Job API -- Git Controls](/docs/reference/job-api#git-controls)) |
| `workspace` | `object` | Default workspace configuration |

---

## `x-eve.agents`

Define per-project agent profiles and councils for orchestration.

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

Each profile is an ordered array of harness/model candidates. The orchestrator selects the first available candidate, or runs councils in parallel.

The manifest sync API returns parsed agent config as `parsed_agents`, consumed by orchestrators via `eve agents config`.

---

## `x-eve.packs`

AgentPacks import agent, team, chat, and skills configuration from external repositories.

```yaml
x-eve:
  # Default agents to install skills for (defaults to [claude-code])
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

| Field | Type | Description |
|-------|------|-------------|
| `source` | `string` | Local path, `owner/repo`, `github:owner/repo`, or git URL |
| `ref` | `string` | 40-character SHA (required for remote sources) |
| `install_agents` | `array<string>` | Override which agents receive this pack's skills |

Packs are resolved by `eve agents sync` and locked in `.eve/packs.lock.yaml`. Use `eve packs status` to check lockfile state and drift.

---

## `x-eve.requires`

Declare required secrets for validation during manifest sync.

```yaml
x-eve:
  requires:
    secrets: [GITHUB_TOKEN, REGISTRY_TOKEN]
```

Pipeline steps can also declare per-step secret requirements:

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

Validate with:

```bash
eve project sync --validate-secrets     # validate during sync
eve project sync --strict               # fail on missing secrets
eve manifest validate                   # pre-flight check without syncing
```

---

## Platform-Injected Environment Variables

Eve automatically injects these variables into all deployed services:

| Variable | Description |
|----------|-------------|
| `EVE_API_URL` | Internal cluster URL for server-to-server calls (e.g., `http://eve-api:4701`) |
| `EVE_PUBLIC_API_URL` | Public ingress URL for browser-facing apps (e.g., `https://api.eh1.incept5.dev`) |
| `EVE_PROJECT_ID` | The project ID (e.g., `proj_01abc123...`) |
| `EVE_ORG_ID` | The organization ID (e.g., `org_01xyz789...`) |
| `EVE_ENV_NAME` | The environment name (e.g., `staging`, `production`) |

Use `EVE_API_URL` for backend/server-side calls within the cluster. Use `EVE_PUBLIC_API_URL` for browser or external calls.

Job runners additionally receive `EVE_ENV_NAMESPACE`, `EVE_JOB_ID`, `EVE_ATTEMPT_ID`, `EVE_AGENT_ID`, and `EVE_PARENT_JOB_ID`.

Services can override any of these by defining them explicitly in their `environment` section.

---

## Secret Interpolation

Reference secrets in environment values with the `${secret.<KEY>}` syntax:

```yaml
environment:
  DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
  API_KEY: ${secret.THIRD_PARTY_API_KEY}
```

Secrets are resolved at deploy time from the project's secret store. They are never written to the manifest or exposed in logs.

---

## Variable Interpolation

Environment values support variable interpolation for deploy-time context:

| Variable | Description |
|----------|-------------|
| `${ENV_NAME}` | Current environment name |
| `${PROJECT_ID}` | Project ID |
| `${ORG_ID}` | Organization ID |
| `${COMPONENT_NAME}` | Service/component name |

Example:

```yaml
environment:
  POSTGRES_DB: app_${ENV_NAME}
  LOG_PREFIX: ${PROJECT_ID}/${ENV_NAME}
```

---

## Managed Database Placeholders

When a service depends on a managed database, reference provisioned values with `${managed.<service>.<field>}`:

```yaml
environment:
  DATABASE_URL: ${managed.db.connection_url}
```

These placeholders are resolved at deploy time once the managed database is provisioned.

---

## See Also

- [CLI Commands](/docs/reference/cli-commands) -- `eve project sync`, `eve manifest validate`
- [Job API](/docs/reference/job-api) -- how `x-eve.defaults` merges into job creation
- [Pipelines](/docs/reference/pipelines) -- pipeline execution details
- [Workflows](/docs/reference/workflows) -- workflow invocation patterns
