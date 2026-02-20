---
title: Agent-Native Design
description: Design principles for building applications where agents are first-class citizens — parity, granularity, composability, and emergent capability.
sidebar_position: 1
---

# Agent-Native Design

Eve Horizon is built around a foundational commitment: anything a human can do, an agent can do too. This is not a feature bolted on after the fact. The entire API surface, CLI design, and execution model exist so that humans and agents share the same interface, the same permissions, and the same primitives. This page describes the principles that make this work and how to apply them when building your own applications on the platform.

## The four principles

Four design principles guide every API, CLI command, and extension point in Eve Horizon. They also serve as a design checklist when you build applications that agents will operate.

### 1. Parity — agents can do everything users can

Every user action must have an agent-equivalent path. In Eve, the CLI is the parity layer. If a user can run `eve job create`, an agent can too. There is no separate "agent API" and no hidden admin panel with capabilities that agents cannot reach.

When building your own application on Eve, apply the same test:

| Check | How to verify |
|-------|---------------|
| Can agents create, read, update, and delete every entity? | Map UI actions to CLI or API equivalents |
| Are there UI-only workflows? | Expose them as API endpoints or CLI commands |
| Can agents discover what is available? | Provide `list` operations for every entity type |
| Is CRUD complete for every entity? | Missing any single operation breaks parity |

Parity does not mean agents must use a graphical interface. It means the *capabilities* behind every interface are reachable through a programmatic path.

### 2. Granularity — atomic primitives, not bundled logic

Features should emerge from agent loops, not from monolithic tool calls. Each operation does one thing. The agent decides the sequence and composition.

**Wrong:** `deploy_and_monitor(app)` bundles judgment into code. The agent cannot deploy without monitoring, or monitor without deploying.

**Wrong:** `classify_and_organize_files(files)` makes classification decisions inside the tool. The agent should decide classification.

**Right:** `eve build create`, `eve build run`, `eve env deploy`, `eve job follow` are separate, composable primitives. The agent decides the sequence, handles errors between steps, and adapts.

In Eve, the manifest defines *what* exists (services, pipelines, environments). The agent decides *how* and *when* to compose those primitives. The design test: if changing behavior requires editing code rather than editing prompts or skills, your tools are not atomic enough.

### 3. Composability — new features equal new prompts

When tools are atomic and parity exists, you add capabilities by writing new skills and prompts, not by writing new code.

Consider the `eve-pipelines-workflows` skill. It teaches agents to compose existing `eve pipeline` and `eve workflow` commands into sophisticated deployment strategies. No new CLI commands were added. No new API endpoints were created. The skill is pure instruction — it tells the agent how to use what already exists.

Apply this to your own application: if adding a feature requires new API endpoints, you may be bundling logic. Ask whether existing primitives can be composed differently through a new skill instead.

### 4. Emergent capability — agents surprise you

Build atomic tools. Agents will compose them into solutions you did not explicitly design. Observe the patterns that emerge. Optimize the common ones. Repeat.

In practice: agents compose `eve job create --parent` with `eve job dep add` and depth propagation to build arbitrary work hierarchies. The platform did not prescribe this pattern. Agents discovered it from the available primitives. The same thing will happen with your application's API if your primitives are truly atomic and composable.

## API design for agents

Eve's REST API follows conventions that make it naturally consumable by both humans (via the CLI) and agents (via the same CLI or direct HTTP calls).

### CLI as thin wrapper

The published CLI (`@eve/cli`) does three things: parse arguments, call the API, and format the response. It never accesses the database directly, never contains business logic, and never makes validation decisions. If validation changes, it changes once in the API.

This means agents can use the CLI directly, or call the REST API with `curl`, and get identical behavior. The `--json` flag on every command produces machine-readable output for agents that parse responses programmatically.

### REST conventions

The API uses predictable patterns that agents can learn once and apply everywhere:

| Pattern | Example |
|---------|---------|
| List a collection | `GET /projects/{id}/jobs` |
| Create a resource | `POST /projects/{id}/jobs` |
| Idempotent find-or-create | `POST /resources/ensure` |
| Read a resource | `GET /jobs/{job_id}` |
| Partial update | `PATCH /jobs/{job_id}` |
| Delete | `DELETE /jobs/{job_id}` |

Every list endpoint returns paginated results with consistent `limit`/`offset` parameters and a `pagination` envelope. Every resource includes `created_at` and `updated_at` timestamps in ISO 8601 UTC.

### The ensure pattern

The `/ensure` endpoint implements find-or-create semantics, making setup scripts idempotent:

```bash
# Safe to run multiple times
eve org ensure "My Org"
eve project ensure --name "my-project" --repo-url "https://..."
```

If the resource exists and parameters match, it returns the existing resource. If parameters conflict, it returns a `409`. If the resource does not exist, it creates it. This is critical for agents that may retry operations or run setup sequences without tracking prior state.

### Identifiers

Eve uses a hybrid ID scheme designed for both machine processing and human readability:

| Entity | Format | Example |
|--------|--------|---------|
| Org, Project | TypeID | `org_01H455VBF...`, `proj_01H455VBF...` |
| Job (root) | Slug + hash | `myproj-a3f2dd12` |
| Job (child) | Parent + suffix | `myproj-a3f2dd12.1` |
| Attempt | UUID + per-job number | `attempt_number: 1` |

OpenAPI is generated code-first from NestJS controllers and Zod schemas. The canonical spec is the contract; agents can fetch it programmatically and use it to discover endpoints they have not been explicitly taught.

## Extension points

Eve is designed to be extended without forking. Extensions are additive, and configuration is layered: global, project, job, override.

### Current extension points

| Extension | Mechanism | Description |
|-----------|-----------|-------------|
| **Skills** | `skills.txt` or `x-eve.packs` in manifest | Install skills from repo-local paths, Git repos, or AgentPack sources |
| **CLI plugins** | `~/.eve/plugins/` or `./.eve/plugins/` | Add custom subcommands without modifying the core CLI |
| **Worker types** | `hints.worker_type` + `EVE_WORKER_URLS` | Route jobs to specialized runtime environments |
| **On-clone hooks** | `.eve/hooks/on-clone.sh` | Run setup scripts after workspace clone |
| **Config layering** | `~/.eve/config`, project config, env, flags | Override settings at any level |

### Planned extension points

| Extension | Status | Description |
|-----------|--------|-------------|
| Worker image registry | Planned | Dynamic worker discovery and routing |
| Skill pack registry | Planned | Version-pinned skill distribution across teams |
| Job hooks | Planned | Project-specific setup and cleanup contracts |
| Event bus / webhooks | Planned | Replace polling with push-based event delivery |
| External secrets providers | Planned | Integrate with Vault, AWS Secrets Manager, etc. |

The principle behind all extension points: configuration is layered, extensions are additive, and extension contracts are stable and versioned.

## App-to-Eve API access

Applications deployed on Eve can call the Eve REST API from their backend services. This enables applications to create jobs, trigger deploys, and query platform state programmatically.

### Agent-to-app API access

Eve agents discover and call app-published APIs through a uniform interface. Applications declare their API in the manifest:

```yaml
services:
  coordinator:
    build:
      context: ./apps/coordinator
    ports: [3000]
    x-eve:
      api_spec:
        type: openapi
        spec_url: /openapi.json
```

On deploy, Eve fetches the OpenAPI spec and registers it. Agents then discover and call the API using the CLI:

```bash
eve api list                      # List available APIs in the project
eve api spec coordinator          # Read the OpenAPI spec
eve api call coordinator GET /api/nodes   # Call with automatic auth
```

Authentication is handled automatically via `EVE_JOB_TOKEN`. The agent never manages credentials directly.

### Service-to-Eve API access

Backend services call the Eve API using long-lived user tokens stored as project secrets:

```bash
# Mint a token for the service account
eve auth mint --email app-bot@example.com --org org_xxx --ttl 90

# Store it as a project secret
eve secrets set EVE_API_TOKEN <token> --project proj_xxx
```

The token is injected into the service environment via manifest configuration. Eve automatically provides `EVE_API_URL` (internal cluster URL for server-to-server calls), `EVE_PUBLIC_API_URL` (public URL for browser-facing code), `EVE_PROJECT_ID`, `EVE_ORG_ID`, and `EVE_ENV_NAME` in every service container.

### Token verification

When an agent calls your app's API, the request includes an `Authorization: Bearer` header with a job token. Verify it using remote verification (simplest), local JWKS verification (faster), or any standard JWT library against the JWKS endpoint at `$EVE_API_URL/.well-known/jwks.json`.

Token claims include:

| Claim | Description |
|-------|-------------|
| `type` | `"job"` for agent tokens |
| `org_id` | Organization ID |
| `project_id` | Project ID |
| `job_id` | Job ID |
| `permissions` | Array of granted permissions |
| `exp` | Expiry (Unix timestamp, max 24h) |

## Platform primitives

The following table summarizes the primitives available for building agent-native applications on Eve. Each primitive is accessible through both the CLI and the REST API.

| Primitive | Description | CLI |
|-----------|-------------|-----|
| **Jobs** | Create, orchestrate, and compose into hierarchies | [eve job](/docs/reference/cli-appendix#eve-job) |
| **Agents & Teams** | Personas, dispatch modes, chat routing | [eve agents](/docs/reference/cli-appendix#eve-agents) |
| **Pipelines** | Deterministic build/deploy sequences | [eve pipeline](/docs/reference/cli-appendix#eve-pipeline) |
| **Gateway** | Multi-provider chat with agent discovery | [eve chat](/docs/reference/cli-appendix#eve-chat) |
| **Builds & Releases** | Immutable artifacts with promotion | [eve build](/docs/reference/cli-appendix#eve-build) |
| **Skills** | Knowledge distribution via SKILL.md | [eve agents sync](/docs/reference/cli-appendix#eve-agents-sync) |
| **Events** | Automation triggers and event spine | [eve event](/docs/reference/cli-appendix#eve-event) |
| **Secrets** | Environment-scoped secret management | [eve secrets](/docs/reference/cli-appendix#eve-secrets) |
| **Threads** | Chat continuity and coordination | [eve thread](/docs/reference/cli-appendix#eve-thread) |

### Emerging primitives

Several primitives are in active development:

- **Job Attachments** — pass structured context (plans, reports, insights) between agents without file gymnastics.
- **Org Document Store** — persistent org-wide knowledge that survives job boundaries, with full-text search and agent-native search/replace editing.
- **Cross-Project Queries** — org-level endpoints for portfolio views and dashboards without N+1 API calls.
- **Service Account Auth** — scoped, auditable service-to-API tokens replacing the current long-lived user token approach.

## Design patterns

### Files as universal interface

Agents know `cat`, `grep`, `mv`, `mkdir`. Eve leans into this:

- `.eve/manifest.yaml` is the single source of truth. Agents read and edit it directly.
- Agent configurations live in repo files (`agents.yaml`, `teams.yaml`) rather than in a database.
- Directory structure is information architecture: `{entity_type}/{entity_id}/content`.

### Context injection

System prompts should include three layers of context:

1. **Available resources** — what exists, with counts: "12 notes in `/notes`, 3 projects"
2. **Capabilities** — what agents can do: "Create, edit, tag, delete notes"
3. **Recent activity** — what happened: "User created 'Project kickoff' 2 hours ago"

Eve injects `EVE_API_URL`, `EVE_PROJECT_ID`, `EVE_ORG_ID`, and `EVE_ENV_NAME` into every job environment. Skills provide domain vocabulary.

### Explicit completion signals

Jobs return `json-result` blocks with `eve.status` set to `"success"`, `"failed"`, or `"waiting"`. No heuristic completion detection. Explicit signals always.

### Dynamic capability discovery

Agents discover capabilities at runtime rather than relying on hard-coded knowledge:

- `eve job list` discovers available work
- `eve agents list` discovers available agents
- `eve api list` discovers available APIs
- The skills system auto-discovers capabilities at install time
- The gateway routes messages to agents by slug; new agents are instantly addressable

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Agent as router only | Let agents act, not just route |
| Workflow-shaped tools (`analyze_and_deploy`) | Break into atomic primitives |
| UI-only actions | Maintain parity with CLI/API paths |
| Context starvation | Inject resources via skills and env vars |
| Heuristic completion | Use explicit `json-result` signals |
| Static API mapping | Use dynamic capability discovery |
| Per-user tokens for backends | Use service accounts or `eve auth mint` |

## Next steps

Learn how agents discover and use skills: [Skills System](./skills-system.md)
