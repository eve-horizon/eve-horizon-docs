---
title: CLI Commands
description: Quick-reference overview of every eve command, organized by category with links to the CLI Appendix for full details.
sidebar_position: 1
---

# CLI Commands

The `eve` CLI is the single entry point to the Eve Horizon platform. Every operation -- from bootstrapping a local cluster to deploying production services, creating AI jobs, and managing secrets -- runs through it. The CLI is designed to work identically for humans and AI agents.

This page is an overview and quick-reference card. For full usage details, flags, and examples on every subcommand, see the [CLI Appendix](/docs/reference/cli-appendix).

## Global Flags

These flags apply to every command:

| Flag | Description |
|------|-------------|
| `--help` | Show help for the current command or subcommand |
| `--json` | Output machine-readable JSON instead of formatted text |
| `--profile <name>` | Use a named repo profile (stored in `.eve/profile.yaml`) |
| `--api-url <url>` | Override the Eve API URL for this invocation |
| `--org <id>` | Override the default organization ID |
| `--project <id>` | Override the default project ID |

Profiles store persistent defaults so you do not need to repeat `--org`, `--project`, or `--api-url` on every call. See [eve profile](/docs/reference/cli-appendix#eve-profile) for setup.

## Command Categories

### Getting Started

| Command | Description |
|---------|-------------|
| [eve init](/docs/reference/cli-appendix#eve-init) | Initialize a new project from a starter template |

### Project Management

| Command | Description |
|---------|-------------|
| [eve org](/docs/reference/cli-appendix#eve-org) | Manage organizations -- list, create, update, delete, members, membership requests |
| [eve org delete](/docs/reference/cli-appendix#eve-org) | Delete an organization (soft or hard) -- `eve org delete <org_id> [--hard] [--force]` |
| [eve project](/docs/reference/cli-appendix#eve-project) | Manage projects -- ensure, sync manifest, status, members |
| [eve project delete](/docs/reference/cli-appendix#eve-project) | Delete a project (soft or hard) -- `eve project delete <project_id> [--hard] [--force]` |
| [eve manifest](/docs/reference/cli-appendix#eve-manifest) | Validate manifests for schema correctness and required secrets |
| [eve profile](/docs/reference/cli-appendix#eve-profile) | Manage repo-local CLI profiles (API URL, org, project defaults) |

### Development

| Command | Description |
|---------|-------------|
| [eve local](/docs/reference/cli-appendix#eve-local) | Manage a local k3d Kubernetes cluster running the Eve platform (includes automatic ECR Public auth and pull retries during `eve local up`) |
| [eve db](/docs/reference/cli-appendix#eve-db) | Inspect and manage environment databases -- schema, RLS, SQL, migrations, snapshots, restore, backup status |
| [eve api](/docs/reference/cli-appendix#eve-api) | Explore project API sources, view specs, call endpoints with Eve auth |

### Jobs & Execution

| Command | Description |
|---------|-------------|
| [eve job](/docs/reference/cli-appendix#eve-job) | Create, list, update, claim, follow, and review jobs |
| [eve supervise](/docs/reference/cli-appendix#eve-supervise) | Long-poll for child job events (lead agent coordination) |
| [eve harness](/docs/reference/cli-appendix#eve-harness) | Inspect available harnesses, variants, and auth status |
| [eve providers](/docs/reference/cli-appendix#eve-providers) | List registered AI providers, show details, and discover available models |

### Deployment

| Command | Description |
|---------|-------------|
| [eve env](/docs/reference/cli-appendix#eve-env) | Manage environments -- create, deploy, rollback, reset, diagnose, logs |
| [eve env undeploy](/docs/reference/cli-appendix#eve-env) | Tear down K8s deployment but keep config -- `eve env undeploy <env> [--project=] [--force]` |
| [eve build](/docs/reference/cli-appendix#eve-build) | Manage builds -- create specs, trigger runs, view logs and artifacts |
| [eve build delete](/docs/reference/cli-appendix#eve-build) | Delete a build spec and its runs/artifacts -- `eve build delete <build_id>` |
| [eve build prune](/docs/reference/cli-appendix#eve-build) | Prune old builds -- `eve build prune [--project=] [--keep=10]` |
| [eve release](/docs/reference/cli-appendix#eve-release) | Resolve and inspect releases by tag |
| [eve release delete](/docs/reference/cli-appendix#eve-release) | Delete a release -- `eve release delete <tag> [--project=]` |
| [eve release prune](/docs/reference/cli-appendix#eve-release) | Prune old releases -- `eve release prune [--project=] [--keep=5]` |
| [eve pipeline](/docs/reference/cli-appendix#eve-pipeline) | Run and inspect manifest-defined pipelines |
| [eve pipeline delete](/docs/reference/cli-appendix#eve-pipeline) | Delete a pipeline -- `eve pipeline delete <name> [--project=]` |
| [eve workflow](/docs/reference/cli-appendix#eve-workflow) | Inspect and invoke manifest-defined workflows |
| [eve endpoint](/docs/reference/cli-appendix#eve-endpoint) | Register, inspect, and diagnose private Tailscale-connected endpoints |

### Events & Webhooks

| Command | Description |
|---------|-------------|
| [eve event](/docs/reference/cli-appendix#eve-event) | Emit and inspect events for app integration and pipeline triggers |
| [eve github](/docs/reference/cli-appendix#eve-github) | Configure and verify GitHub webhook integration for a project |
| [eve webhooks](/docs/reference/cli-appendix#eve-webhooks) | Manage outbound webhook subscriptions, delivery logs, and replays |

### Agents & Chat

| Command | Description |
|---------|-------------|
| [eve agents](/docs/reference/cli-appendix#eve-agents) | Inspect agent policy config, sync agents/teams/chat config, and apply pack-defined workflows |
| [eve agents delete](/docs/reference/cli-appendix#eve-agents) | Delete an agent -- `eve agents delete <slug> [--project=]` |
| [eve agents delete-team](/docs/reference/cli-appendix#eve-agents) | Delete a team -- `eve agents delete-team <team_id> [--project=]` |
| [eve packs](/docs/reference/cli-appendix#eve-packs) | Manage AgentPack lockfile and resolution |
| [eve skills](/docs/reference/cli-appendix#eve-skills) | Install skills from manifest-defined packs (`x-eve.packs`) and `skills.txt` sources |
| [eve chat](/docs/reference/cli-appendix#eve-chat) | Simulate chat messages for gateway testing |
| [eve thread](/docs/reference/cli-appendix#eve-thread) | Manage org-scoped coordination threads for agent teams |
| [eve thread delete](/docs/reference/cli-appendix#eve-thread) | Delete a thread -- `eve thread delete <thread_id>` |
| [eve integrations](/docs/reference/cli-appendix#eve-integrations) | Manage chat integrations (Slack) -- shareable install links, hot-load settings |

### Auth & Secrets

| Command | Description |
|---------|-------------|
| [eve auth](/docs/reference/cli-appendix#eve-auth) | Authenticate via SSH challenge (with SSH key auto-discovery), manage tokens, sync AI credentials |
| [eve user](/docs/reference/cli-appendix#eve-user) | Show user profile and memberships (`me` shorthand supported) |
| [eve identity](/docs/reference/cli-appendix#eve-identity) | Generate identity link tokens for external providers (for example Slack) |
| [eve access](/docs/reference/cli-appendix#eve-access) | Check permissions, manage roles and bindings, sync policy-as-code |
| [eve secrets](/docs/reference/cli-appendix#eve-secrets) | Manage secrets at system, org, user, or project scope |
| [eve admin](/docs/reference/cli-appendix#eve-admin) | Administrative operations — list users (org and project memberships), invites, ingress aliases, billing, usage, service accounts, access requests |

### Knowledge

| Command | Description |
|---------|-------------|
| [eve docs](/docs/reference/cli-appendix#eve-docs) | Manage versioned org documents -- write, read, search, review lifecycle |
| [eve ingest](/docs/reference/cli-appendix#eve-ingest) | Upload files for ingest processing with broad file-type MIME inference, list ingest records, and inspect ingest status |
| [eve memory](/docs/reference/cli-appendix#eve-memory) | Manage canonical agent memory namespaces backed by org docs |
| [eve kv](/docs/reference/cli-appendix#eve-kv) | Agent key-value state with optional TTL |
| [eve search](/docs/reference/cli-appendix#eve-search) | Unified org search across memory, docs, threads, attachments, events |
| [eve fs](/docs/reference/cli-appendix#eve-fs) | Manage org filesystem sync plus sharing and public-path publishing |
| [eve resources](/docs/reference/cli-appendix#eve-resources) | Resolve resource URIs into content snapshots |

### Observability

| Command | Description |
|---------|-------------|
| [eve analytics](/docs/reference/cli-appendix#eve-analytics) | Org analytics -- job counts, pipeline success rates, environment health |
| [eve system](/docs/reference/cli-appendix#eve-system) | System health, status, logs, pods, events, orchestrator settings (admin) |

### Migration

| Command | Description |
|---------|-------------|
| [eve migrate](/docs/reference/cli-appendix#eve-migrate) | Migration helpers for upgrading config formats (e.g., `skills-to-packs`) |

## Common Workflows

### First-time setup

```bash
# Initialize a new project
eve init my-project
cd my-project

# Configure a CLI profile with your org and project
eve profile set --org org_xxx --project proj_xxx

# Authenticate
eve auth login --email you@example.com
```

### Create and follow a job

```bash
# Create a job (defaults to 'ready' phase, immediately schedulable)
eve job create --description "Fix the login bug in auth.ts"

# Stream execution logs in real time
eve job follow MyProj-abc123

# Wait for completion with exit code
eve job wait MyProj-abc123 --timeout 300
```

### Deploy to an environment

```bash
# Sync your manifest to the API
eve project sync

# Deploy via the environment's pipeline
eve env deploy staging --ref main --repo-dir .

# Check deployment status
eve project status --env staging
```

### Manage secrets

```bash
# Set a project-level secret
eve secrets set GITHUB_TOKEN ghp_xxx --project proj_xxx --type github_token

# Validate manifest-required secrets
eve secrets validate --project proj_xxx

# Sync local AI tool credentials
eve auth sync --project proj_xxx
```

## Environment Variables

The CLI reads these environment variables when present:

| Variable | Purpose |
|----------|---------|
| `EVE_API_URL` | Default API URL (overridden by `--api-url` or profile) |
| `EVE_JOB_ID` | Current job ID (set automatically inside job runners) |
| `EVE_AGENT_ID` | Agent identifier (set automatically inside job runners) |
| `EVE_ATTEMPT_ID` | Current attempt UUID (set automatically inside job runners) |
| `EVE_PARENT_JOB_ID` | Parent job ID for coordination (set for child jobs) |
| `EVE_PROJECT_ID` | Current project ID (set automatically in deployed services) |
| `EVE_ORG_ID` | Current org ID (set automatically in deployed services) |
| `EVE_DB_URL` | Database URL injected into services |
| `EVE_ENV_NAME` | Current environment name |

:::note
Collection endpoints return list responses in a JSON envelope when using `--json`, typically `{ "data": [...] }`.
::: 

## Next Steps

- [CLI Appendix](/docs/reference/cli-appendix) -- full usage, flags, and examples for every subcommand
- [Manifest Schema](/docs/reference/manifest-schema) -- the `.eve/manifest.yaml` field reference
- [Job API](/docs/reference/job-api) -- job lifecycle, creation parameters, and control signals
