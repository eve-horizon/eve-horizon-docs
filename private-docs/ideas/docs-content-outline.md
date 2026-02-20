# Eve Horizon Docs — Content Outline

> Comprehensive content tree for the Docusaurus docs site.
> Each entry includes: page path, title, one-line purpose, key sections, and source doc mappings.
> Audience: new users (primary), advanced users and agents (secondary).

---

## Sidebar structure (condensed)

```
Get Started
├── What is Eve Horizon?
├── Install the CLI
├── Quickstart
├── Core Concepts
└── Your First Deploy

Guides
├── Manifest Authoring
├── Services & Databases
├── Pipelines & CI/CD
├── Environments & Promotion
├── Skills & Skill Packs
├── Agents & Teams
├── Chat & Conversations
├── Local Development
└── Secrets & Auth

Reference
├── CLI Commands
├── Manifest Schema
├── Job API
├── Events & Webhooks
├── Builds & Releases
├── Pipelines Reference
├── Workflows Reference
├── Environment Gating
├── Harnesses & Workers
└── OpenAPI Spec

Agent Integration
├── Agent-Native Design
├── Skills System
├── Orchestration Patterns
├── Chat Gateway & Routing
├── Threads & Coordination
└── llms.txt Spec

Operations
├── Deployment Guide
├── Observability & Receipts
├── Database Operations
├── Security & Key Rotation
└── Troubleshooting

Changelog
```

---

## Page-level detail

### 1. Get Started

#### 1.1 `docs/get-started/what-is-eve-horizon`

**Title:** What is Eve Horizon?
**Purpose:** First page a new user reads — what it is, who it's for, why it exists.

Sections:
- What is Eve Horizon? (one paragraph)
- Core philosophy: CLI-first, job-centric, event-driven, skills-based, isolated execution
- Who is it for? (developer teams, AI-augmented workflows, platform engineers)
- How it works (simplified execution flow diagram)
- What can it do? (table: CI/CD, code review, docs, development, custom workflows)
- Architecture at a glance (simplified system diagram)
- Next steps: Install the CLI

Key diagram: Simplified system overview (user → CLI → API → orchestrator → worker → agent)

Sources: `system-overview.md`, `unified-architecture.md`, `README.md`

---

#### 1.2 `docs/get-started/install`

**Title:** Install the CLI
**Purpose:** Get the Eve CLI installed and verify it works.

Sections:
- Prerequisites (Node.js 18+, SSH key, GitHub account)
- Install via npm/pnpm
- Verify installation (`eve --help`)
- Install from source (for contributors)
- Shell completions (if available)

Sources: `user-getting-started-guide.md`, `cli-tools-and-credentials.md`

---

#### 1.3 `docs/get-started/quickstart`

**Title:** Quickstart (5 minutes)
**Purpose:** Fastest path from zero to a running job.

Sections:
- Initialize a project (`eve init my-project`)
- Run the bootstrap skill (agent-assisted setup)
- Create your first job
- Watch execution (`eve job follow`)
- Check results (`eve job result`)
- What just happened? (brief explanation)

Sources: `user-getting-started-guide.md`

---

#### 1.4 `docs/get-started/core-concepts`

**Title:** Core Concepts
**Purpose:** Mental model for how Eve Horizon works — the 8 concepts you need.

Sections:
- **Organizations & Projects** — containers for work and configuration
- **Jobs** — the unit of work (phases: idea → backlog → ready → active → review → done)
- **Skills** — reusable AI capabilities in SKILL.md format
- **Manifest** — `.eve/manifest.yaml` as the source of truth
- **Pipelines** — deterministic step sequences for CI/CD
- **Workflows** — on-demand agent-driven processes
- **Events** — the automation spine (GitHub, Slack, cron, system)
- **Agents & Teams** — personas with skills, policies, and dispatch modes

Key diagram: Job lifecycle state machine (idea → done)
Key diagram: Event flow (source → API → orchestrator → jobs)

Sources: `system-overview.md`, `unified-architecture.md`, `job-api.md`, `pipelines.md`, `workflows.md`, `events.md`, `agents.md`, `skills.md`

---

#### 1.5 `docs/get-started/first-deploy`

**Title:** Your First Deploy
**Purpose:** Walk through deploying an app to staging using Eve.

Sections:
- Prerequisites (project set up, manifest configured, secrets set)
- Write the manifest (minimal services + environments + pipeline)
- Sync the manifest (`eve project sync`)
- Set secrets (`eve secrets set`)
- Trigger a deploy (`eve env deploy staging`)
- Watch the pipeline (`eve pipeline logs`)
- Verify the deployment (`eve env show staging`)
- Next steps: production deploy with approval gates

Key diagram: Deploy pipeline flow (build → release → deploy)

Sources: `manifest.md`, `deployment.md`, `pipelines.md`, `secrets.md`

---

### 2. Guides

#### 2.1 `docs/guides/manifest-authoring`

**Title:** Manifest Authoring
**Purpose:** How to write and maintain `.eve/manifest.yaml` for your project.

Sections:
- Manifest purpose and location
- Top-level fields (`schema`, `project`, `registry`, `services`, `environments`, `pipelines`, `workflows`)
- Service definitions (Compose-style with Eve extensions)
- Eve extensions (`x-eve`: ingress, role, api_spec, storage, files, managed)
- Secret interpolation (`${secret.KEY}`)
- Variable interpolation (`${ENV_NAME}`, `${PROJECT_ID}`, etc.)
- Managed databases (`role: managed_db`)
- Default job settings (`x-eve.defaults`)
- Agent profiles (`x-eve.agents`)
- AgentPacks (`x-eve.packs`)
- Validating the manifest (`eve manifest validate`)
- Syncing to the platform (`eve project sync`)
- Common patterns and examples

Sources: `manifest.md`, `configuration-model-refactor.md`

---

#### 2.2 `docs/guides/services-and-databases`

**Title:** Services & Databases
**Purpose:** Define services, health checks, dependencies, and managed databases in the manifest.

Sections:
- Service fields (`image`, `build`, `environment`, `ports`, `depends_on`, `healthcheck`)
- Health checks (Docker-style)
- Service dependencies and ordering
- Eve service roles (`component`, `worker`, `job`, `managed_db`)
- Managed databases (provisioning, status, credentials, scaling)
- Persistent storage (`x-eve.storage`)
- File mounts (`x-eve.files`)
- External services (`x-eve.external`)
- API spec registration (`x-eve.api_spec`)

Sources: `manifest.md`, `db.md`

---

#### 2.3 `docs/guides/pipelines-and-cicd`

**Title:** Pipelines & CI/CD
**Purpose:** Build automated CI/CD workflows with manifest-defined pipelines.

Sections:
- What is a pipeline? (ordered steps → job graph)
- Step types: `action`, `script`, `agent`, `run`
- Built-in actions: `build`, `release`, `deploy`, `run`, `job`, `create-pr`, `notify`, `env-ensure`, `env-delete`
- Dependencies between steps (`depends_on`)
- GitHub triggers (push, pull_request with action/branch filtering)
- Branch pattern matching (exact, wildcard)
- Running pipelines (`eve pipeline run`)
- Monitoring runs (`eve pipeline logs`, `--follow`)
- Approving/cancelling runs
- Pipeline inputs (manifest-level and CLI-level)
- Build → Release → Deploy flow
- PR preview environments (complete example)
- Error handling and failure hints

Key diagram: Pipeline job graph expansion (steps → jobs with dependencies)

Sources: `pipelines.md`, `builds.md`, `ci-cd.md`

---

#### 2.4 `docs/guides/environments-and-promotion`

**Title:** Environments & Promotion
**Purpose:** Configure environments, approval gates, and promote releases across stages.

Sections:
- Defining environments in the manifest
- Environment overrides (service-level)
- Pipeline-linked environments
- Pipeline inputs (per-environment defaults)
- Approval gates (`approval: required`)
- Direct deploy vs. pipeline deploy (`--direct`)
- Promotion workflow (test → staging → production)
- Release resolution (`eve release resolve`)
- Environment gating (concurrent deploy prevention)
- Environment CLI commands (`eve env deploy`, `eve env show`, `eve env diagnose`)

Key diagram: Promotion flow (build once → deploy to test → promote to staging → promote to production)

Sources: `manifest.md`, `pipelines.md`, `environment-gating.md`, `deployment.md`

---

#### 2.5 `docs/guides/skills-and-skillpacks`

**Title:** Skills & Skill Packs
**Purpose:** Create, install, and manage reusable AI capabilities.

Sections:
- What are skills? (SKILL.md format, progressive disclosure)
- Directory structure (`.agents/skills/`, `.claude/skills/`)
- SKILL.md format (frontmatter, body, guidelines)
- Bundled resources (`references/`, `scripts/`, `assets/`)
- Installing skills (`skills.txt` or AgentPacks)
- Creating a custom skill
- Skill packs (grouping related skills)
- Creating your own skill pack
- Official packs: eve-work, eve-se
- Distribution patterns (in-repo, git URL, global)
- AgentPacks via manifest (`x-eve.packs` + lockfile)
- Migrating from skills.txt to AgentPacks (`eve migrate skills-to-packs`)
- Search priority and shadowing
- Troubleshooting

Sources: `skills.md`, `skillpacks.md`, `skills-manifest.md`

---

#### 2.6 `docs/guides/agents-and-teams`

**Title:** Agents & Teams
**Purpose:** Configure AI agents, teams, and dispatch modes.

Sections:
- What are agents? (personas with skills + policies)
- agents.yaml structure (slug, skill, workflow, harness_profile, access, policies, gateway)
- Agent slugs (org-unique, used for gateway routing)
- Gateway exposure policies (none, discoverable, routable)
- Teams and dispatch modes (fanout, council, relay)
- teams.yaml structure (lead, members, dispatch)
- Syncing agent config (`eve agents sync`)
- Harness profiles (`x-eve.agents.profiles`)
- Planning councils (multi-model parallel evaluation)
- Agent install targets (`x-eve.install_agents`)

Sources: `agents.md`, `manifest.md`

---

#### 2.7 `docs/guides/chat-and-conversations`

**Title:** Chat & Conversations
**Purpose:** Connect Eve to Slack, Nostr, and WebChat for conversational AI workflows.

Sections:
- Chat gateway overview (pluggable provider architecture)
- Slack integration (webhook, `@eve <slug> <command>`, listener commands)
- Nostr integration (DMs, public mentions, NIP-04 encryption)
- WebChat (browser-native, WebSocket, JWT auth)
- Chat routing (`chat.yaml`: routes, targets, matching rules)
- Route targets: `agent:`, `team:`, `workflow:`, `pipeline:`
- Threads and continuity (thread keys, message history)
- Org-wide agent directory (`@eve agents list`)
- Default agent slug (`eve org update --default-agent`)
- Listening (passive ingestion, channel/thread scoped)
- Simulation (`eve chat simulate`)

Key diagram: Chat message flow (Slack → Gateway → Route → Agent → Job → Reply)

Sources: `chat-gateway.md`, `chat-routing.md`, `threads.md`

---

#### 2.8 `docs/guides/local-development`

**Title:** Local Development
**Purpose:** Set up and iterate on Eve projects locally.

Sections:
- Runtime modes: Docker Compose vs. Kubernetes (k3d)
- Docker Compose quick start (`./bin/eh start docker`)
- Kubernetes quick start (`./bin/eh k8s start`)
- When to use which mode (comparison table)
- macOS prerequisites (Docker Desktop, Node.js, pnpm, k3d, kubectl)
- Local config files (`.env`, `system-secrets.env.local`, `.eve-horizon.yaml`)
- Creating orgs and projects locally
- Running jobs against local repos
- Load balancer recovery (k3d sleep/wake)
- Web auth in local dev (GoTrue, SSO, Mailpit)

Sources: `deployment.md`, `k8s-local-stack.md`, `unified-architecture.md`

---

#### 2.9 `docs/guides/secrets-and-auth`

**Title:** Secrets & Auth
**Purpose:** Manage secrets, authenticate, and control access.

Sections:
- Secret scopes (system → org → user → project, highest wins)
- Setting secrets (`eve secrets set`, `eve secrets import`)
- Manifest secret interpolation (`${secret.KEY}`)
- Local dev secrets (`.eve/dev-secrets.yaml`)
- Secret validation (`eve project sync --validate-secrets`)
- Safe secrets (ensure + export for webhook setup)
- Authentication overview (RS256 JWT, SSH challenge-response)
- CLI login (`eve auth login`)
- Bootstrap flow (auto-open, recovery, secure modes)
- Inviting users (`eve admin invite`)
- Self-service access requests (`eve auth request-access`)
- Syncing OAuth tokens (`eve auth sync`)
- GitHub key auto-discovery
- RBAC (org roles: owner, admin, member)
- Org and project membership management
- Token types (user tokens, job tokens)
- Nostr authentication

Sources: `secrets.md`, `auth.md`, `identity-providers.md`

---

### 3. Reference

#### 3.1 `docs/reference/cli-commands`

**Title:** CLI Commands
**Purpose:** Complete CLI reference — every command, flag, and output format.

Sections:
- Global flags (`--json`, `--help`, `--profile`)
- **Profile**: `create`, `use`, `show`, `set`, `list`
- **Auth**: `login`, `logout`, `status`, `bootstrap`, `sync`, `creds`, `token`, `mint`, `request-access`, `whoami`, `permissions`
- **Admin**: `invite`, `access-requests` (list, approve, reject)
- **Org**: `list`, `ensure`, `update`, `members` (list, add, remove)
- **Project**: `list`, `ensure`, `sync`, `bootstrap`, `members`
- **Job**: `create`, `list`, `ready`, `show`, `update`, `follow`, `wait`, `result`, `logs`, `diagnose`, `dep` (add, remove, list)
- **Review**: `submit`, `approve`, `reject`
- **Pipeline**: `list`, `show`, `run`, `runs`, `show-run`, `approve`, `cancel`, `logs`
- **Env**: `deploy`, `show`, `diagnose`, `list`
- **Build**: `create`, `list`, `show`, `run`, `runs`, `logs`, `artifacts`, `diagnose`, `cancel`
- **Release**: `resolve`
- **Secrets**: `list`, `show`, `set`, `import`, `ensure`, `export`, `validate`
- **DB**: `schema`, `rls`, `sql`, `migrate`, `migrations`, `new`, `status`, `rotate-credentials`, `scale`, `destroy`
- **Event**: `list`, `show`, `emit`
- **Harness**: `list`
- **Agents**: `sync`, `config`
- **Packs**: `status`, `resolve`
- **Thread**: `list`, `show`, `messages`, `post`, `follow`
- **Chat**: `simulate`
- **Webhooks**: `list`, `create`, `show`, `delete`, `enable`, `deliveries`, `test`, `replay`, `replay-status`
- **System**: `health`, `status`, `orchestrator status`, `orchestrator set-concurrency`
- **Manifest**: `validate`
- **Supervise**: `<job-id>`

Sources: `user-getting-started-guide.md`, `cli-tools-and-credentials.md`, `job-cli.md`, all CLI sections across docs

---

#### 3.2 `docs/reference/manifest-schema`

**Title:** Manifest Schema
**Purpose:** Authoritative field-by-field manifest specification.

Sections:
- Top-level fields (table: field, required, type, description)
- `services` field reference (all Compose-style + Eve extensions)
- `x-eve` extensions per service (table: field, type, description)
- `environments` field reference
- `pipelines` field reference (steps, triggers)
- `workflows` field reference
- `registry` field reference (string shorthand + object form)
- `versioning` field reference
- `x-eve.defaults` reference
- `x-eve.agents` reference (profiles, councils)
- `x-eve.packs` reference (source, ref, install_agents)
- `x-eve.requires` reference (secret requirements)
- Platform-injected environment variables (table)
- Secret interpolation syntax
- Variable interpolation syntax
- Managed database placeholders (`${managed.<service>.<field>}`)

Sources: `manifest.md`

---

#### 3.3 `docs/reference/job-api`

**Title:** Job API
**Purpose:** Complete Job API specification — endpoints, request/response shapes, lifecycle.

Sections:
- Overview and terminology (Job vs. Task)
- Identifier formats (TypeID, slug-based job IDs, attempt IDs)
- API endpoints (full table)
- Create job (request/response shapes, all fields documented)
- Update job
- Job phases and transitions
- Claim/release workflow
- Review workflow (submit, approve, reject)
- Job hierarchy (parent-child, max depth 3)
- Dependency model (blocked_by, blocks, relation types)
- Scheduling behavior (priority, FIFO)
- Execution receipts (timing, LLM usage, cost)
- Job result API (formats: text, json, full)
- Wait API (SSE, exit codes)
- Stream API (SSE logs, raw mode)
- Compare attempts
- Session continuity
- Git controls (ref resolution, branch creation, commit/push policies)
- Manifest defaults merge behavior
- Budget hints and enforcement

Sources: `job-api.md`, `job-context.md`, `job-control-signals.md`, `job-git-controls.md`

---

#### 3.4 `docs/reference/events-and-webhooks`

**Title:** Events & Webhooks
**Purpose:** Event model, sources, routing, and outbound webhook subscriptions.

Sections:
- Event model (fields: type, source, status, payload, dedupe_key)
- Event sources: `github`, `slack`, `cron`, `manual`, `app`, `system`, `runner`
- GitHub webhook integration (push, pull_request)
- Slack webhook integration
- System events (job.failed, pipeline.failed, doc mutations)
- Runner events (started, progress, completed, failed)
- Resource hydration events
- LLM usage events (`llm.call`)
- Orchestrator event routing (trigger matching, claiming)
- Deduplication
- Event CLI (`eve event list`, `show`, `emit`)
- Webhook subscriptions (org-scoped, project-scoped)
- Webhook payload format (CloudEvents 1.0)
- Signature verification (`X-Eve-Signature-256`)
- Delivery + retry schedule
- Replay semantics
- Webhook CLI reference

Sources: `events.md`, `webhooks.md`

---

#### 3.5 `docs/reference/builds-and-releases`

**Title:** Builds & Releases
**Purpose:** Build primitives, release management, and artifact tracking.

Sections:
- Core concepts: BuildSpec (what), BuildRun (how), BuildArtifact (output)
- Build API endpoints
- Build CLI commands
- Build backends (Docker Buildx, BuildKit, Kaniko)
- Release integration (build_id → release → digest-based deploy)
- Build diagnostics (`eve build diagnose`)
- Error classification (auth, clone, build, timeout, resource, registry)
- BuildKit output in failures
- Pre-build visibility (clone/checkout/workspace logs)
- Build logs and streaming

Sources: `builds.md`, `container-registry.md`

---

#### 3.6 `docs/reference/pipelines`

**Title:** Pipelines Reference
**Purpose:** Pipeline specification — step types, triggers, runs, streaming.

Sections:
- Pipeline definition in manifest
- Step types: `action`, `script`, `agent`, `run`
- Built-in actions (complete list with `with` parameters)
- Job graph expansion (step → job, dependency edges)
- Build outputs (BuildSpec → BuildRun → BuildArtifact → Release)
- Trigger schema (GitHub push, pull_request with action/branch filters)
- Branch pattern matching (exact, wildcards)
- Pipeline API endpoints
- Pipeline CLI commands
- Run status and cancellation
- Pipeline logs and streaming (snapshot and live)
- Failure hints and build linkage
- Environment deploy as pipeline alias
- Pipeline inputs (manifest + CLI merge)

Sources: `pipelines.md`

---

#### 3.7 `docs/reference/workflows`

**Title:** Workflows Reference
**Purpose:** Manifest-defined workflow specification.

Sections:
- Workflow definition in manifest
- Workflow hints (remediation gates, timeouts, harness preferences)
- Workflow triggers
- Invocation (API, CLI, event)
- db_access field
- Skills-based workflows (planned)

Sources: `workflows.md`, `workflow-invocation.md`, `skills-workflows.md`

---

#### 3.8 `docs/reference/environment-gating`

**Title:** Environment Gating
**Purpose:** How concurrent deploy prevention works.

Sections:
- Overview (exclusive access during deployment)
- When to use (deployments, migrations, mutex)
- Automatic gate acquisition (`env:{project_id}:{env_name}`)
- Gate lifecycle (acquire → hold → release)
- TTL and timeout
- Combining explicit and environment gates
- Checking blocked jobs
- Monitoring and debugging (logs, API responses, SQL queries)

Sources: `environment-gating.md`

---

#### 3.9 `docs/reference/harnesses-and-workers`

**Title:** Harnesses & Workers
**Purpose:** Harness invocation, worker types, and permission policies.

Sections:
- Invocation flow (worker → eve-agent-cli → harness binary)
- Supported harnesses: mclaude, claude, zai, gemini, code, codex
- Per-harness configuration (binary, config dir, auth, model, CLI args)
- Permission policies (default, auto_edit, never, yolo)
- Worker variants (base, python, rust, node, java, kotlin, full)
- Worker image registry (ECR, versioning, tagging)
- Workspace directory structure
- Environment contract (paths, security context, volumes)
- Repository preparation (remote vs. local)
- Git controls (ref resolution, branch creation, commit/push)
- Authentication per harness (OAuth, API keys, credential files)
- OAuth token refresh
- Managed models (platform-hosted, bridge routing)
- Execution logging
- Harness config root and variants
- Adding a new BYOK model

Sources: `harness-execution.md`, `harness-adapters.md`, `worker-types.md`, `harness-policy.md`

---

#### 3.10 `docs/reference/openapi`

**Title:** OpenAPI Spec
**Purpose:** Link to the live OpenAPI specification.

Sections:
- API base URL
- Swagger UI location (`/docs`)
- OpenAPI spec download (JSON/YAML)
- Authentication header format
- API philosophy (REST, CLI-first, standard envelopes)
- Rate limits and best practices

Sources: `openapi.md`, `api-philosophy.md`

---

### 4. Agent Integration

#### 4.1 `docs/agent-integration/agent-native-design`

**Title:** Agent-Native Design
**Purpose:** Design principles for building apps that agents can operate naturally.

Sections:
- What is agent-native? (parity, granularity, composability, emergent capability)
- CLI-first as agent-native (same interface for humans and agents)
- Job tokens for app ↔ Eve communication
- Designing for agent consumption (structured output, JSON mode, deterministic behavior)
- API access from apps (`EVE_API_URL`, token verification)
- Agent-native checklist for app developers

Sources: `api-philosophy.md`, `agent-app-api-access.md`, `app-service-eve-api-access.md`

---

#### 4.2 `docs/agent-integration/skills-system`

**Title:** Skills System (Deep Dive)
**Purpose:** Advanced skills architecture — loading, resolution, runtime behavior.

Sections:
- Skill loading in job execution (clone → on-clone hook → install → harness reads)
- Search priority (project universal → global universal → project Claude → global Claude)
- SKILL.md format specification (frontmatter, body, progressive disclosure)
- Bundled resources (references, scripts, assets — loading behavior)
- Integration with Eve Horizon (worker clone hook)
- AgentPacks resolution (`eve agents sync`, lockfile)
- Skill invocation by agents (`skill read <name>`)

Sources: `skills.md`, `skills-manifest.md`

---

#### 4.3 `docs/agent-integration/orchestration-patterns`

**Title:** Orchestration Patterns
**Purpose:** How to decompose complex work using job hierarchies, dependencies, and team dispatch.

Sections:
- Job hierarchy (parent-child, max depth 3, ID format)
- Dependency types (blocks, conditional_blocks, waits_for)
- Team dispatch (fanout mode)
- Coordination threads (inter-agent communication within team dispatches)
- Coordination inbox (`.eve/coordination-inbox.md`)
- Supervision stream (`eve supervise`)
- Priority-based scheduling
- Depth propagation patterns
- Parallel decomposition patterns

Key diagram: Team dispatch flow (lead job → child jobs → coordination thread → results)

Sources: `orchestrator.md`, `orchestration-skill.md`, `threads.md`, `job-api.md`

---

#### 4.4 `docs/agent-integration/chat-gateway`

**Title:** Chat Gateway & Routing
**Purpose:** Technical reference for the gateway provider architecture and routing.

Sections:
- Provider interface (name, transport, capabilities, lifecycle)
- Webhook vs. subscription transports
- Provider registry (factory pattern, per-integration instances)
- Slack provider (event flow, signature validation, slug resolution)
- Nostr provider (relay connection, NIP-04, Schnorr verification)
- WebChat provider (WebSocket, JWT auth, heartbeat)
- Multi-tenant mapping (team_id → org_id)
- Thread key format (account_id:channel:thread_id)
- Gateway exposure policy (none, discoverable, routable)

Sources: `chat-gateway.md`, `chat-routing.md`, `integrations.md`

---

#### 4.5 `docs/agent-integration/threads-and-coordination`

**Title:** Threads & Coordination
**Purpose:** Thread primitives, coordination threads, and inter-agent communication.

Sections:
- Thread overview (continuity for chat-driven work)
- Core fields (project_id, key, channel, peer, summary, workspace_key)
- Org threads (org-scoped, multi-project coordination)
- Thread key format and conventions
- Message logging (direction, actor metadata, job linkage)
- Listener subscriptions (passive agent ingestion)
- Coordination threads (auto-created for team dispatches)
- Coordination key convention (`coord:job:{parent_job_id}`)
- End-of-attempt relay (automatic status messages)
- Message kinds (status, directive, question, update)
- Thread API endpoints
- Thread CLI commands
- Supervision stream (`eve supervise`)

Sources: `threads.md`

---

#### 4.6 `docs/agent-integration/llms-txt`

**Title:** llms.txt Spec
**Purpose:** How Eve Horizon docs expose content for agent discovery.

Sections:
- What is llms.txt? (title + summary + URL per page)
- What is llms-full.txt? (full rendered text, stripped of HTML)
- Generation at build time (Docusaurus plugin / post-build script)
- Deterministic output (sorted path order, normalized spacing)
- Served as static files
- `/api/search` endpoint (complementary, for structured queries)
- How agents should use these files

Sources: `eve-docs-site-bootstrap.md`

---

### 5. Operations

#### 5.1 `docs/operations/deployment-guide`

**Title:** Deployment Guide
**Purpose:** Deploy Eve Horizon and user apps — from local k3d to production k8s.

Sections:
- Runtime modes (Docker Compose vs. Kubernetes)
- Docker Compose quick start (`./bin/eh start docker`)
- Kubernetes quick start (`./bin/eh k8s start`, `k8s deploy`, `k8s status`)
- K8s architecture (API, orchestrator, worker, runner pods, Postgres)
- Ingress routing (URL pattern, domain resolution, local `lvh.me`)
- TLS (cert-manager, wildcard certs)
- Worker image registry (ECR images, versioning, tagging, multi-arch)
- Version pinning strategy (production, dev, security updates)
- Manifest variable interpolation at deploy time
- Secrets provisioning (system secrets → K8s → restart)
- Digest-based deployments (immutable image references)
- AWS deployment (k3s on VPS, infra template repo)
- Comparison: Docker Compose vs. K8s (table)
- Web auth services (GoTrue, SSO broker, Mailpit)

Sources: `deployment.md`, `k8s-local-stack.md`

---

#### 5.2 `docs/operations/observability`

**Title:** Observability & Receipts
**Purpose:** Monitoring, logging, cost tracking, and diagnostics.

Sections:
- Execution logging (event types: event, system, system_error, parse_error, spawn_error)
- LLM usage events (`llm.call` — token counts, model, timing)
- Execution receipts (timing, LLM usage, base_cost_usd, billed_cost)
- Job diagnostics (`eve job diagnose`)
- Build diagnostics (`eve build diagnose`)
- Pipeline logs and streaming
- System health (`eve system health`, `eve system status`)
- Orchestrator status and concurrency
- Runner pod management and reaper
- Workspace janitor (disk safety)

Sources: `observability.md`, `analytics.md`, `pricing-and-billing.md`

---

#### 5.3 `docs/operations/database-operations`

**Title:** Database Operations
**Purpose:** Environment database tooling and managed database lifecycle.

Sections:
- `eve db` CLI commands (schema, rls, sql, migrate, migrations, new)
- Migration file format (`YYYYMMDDHHmmss_description.sql`)
- Running migrations in pipelines (job service pattern)
- Managed databases (manifest declaration, provisioning, status)
- Managed DB CLI (`eve db status`, `rotate-credentials`, `scale`, `destroy`)
- Managed values interpolation (`${managed.<service>.<field>}`)
- Admin APIs for managed DB instances

Sources: `db.md`, `manifest.md`

---

#### 5.4 `docs/operations/security`

**Title:** Security & Key Rotation
**Purpose:** Security model, key rotation, incident response.

Sections:
- Authentication architecture (RS256 + HS256 dual-mode)
- Key generation
- Key rotation procedure (grace period, JWKS)
- Emergency rotation
- JWKS endpoint (`/.well-known/jwks.json`)
- Token types and claims
- Agent sandbox security
- Secret encryption at rest
- Git auth injection (HTTPS token, SSH key)
- Worker secret injection (allowlisted env vars only)
- Incident response playbook (contain, invalidate, audit, recover, document)
- Bootstrap security modes (auto-open, recovery, secure)

Sources: `auth.md`, `secrets.md`, `agent-sandbox-security.md`, `agent-secret-isolation.md`

---

#### 5.5 `docs/operations/troubleshooting`

**Title:** Troubleshooting
**Purpose:** Common issues, debug playbooks, and diagnostic commands.

Sections:
- **Auth issues**: no registered SSH key, challenge expired, not authenticated, wrong profile, bootstrap already completed
- **Job issues**: stuck in ready, failed, blocked on gates, timeout
- **Deploy issues**: API connection refused, load balancer stale, ingress not working
- **Build issues**: error codes (auth, clone, build, timeout, resource, registry)
- **Secret issues**: resolution failures, missing keys, scope hierarchy
- **Diagnostic commands**: `eve job diagnose`, `eve build diagnose`, `eve env diagnose`, `eve system health`
- **Log inspection**: `eve job logs`, `eve pipeline logs`, orchestrator/worker logs
- **Recovery**: attempt recovery, orphan cleanup, gate release

Sources: `user-getting-started-guide.md`, `cli-debugging.md`, `deploy-polling.md`, `secrets.md`

---

### 6. Changelog

#### 6.1 `blog/`

**Title:** Changelog
**Purpose:** Release notes, announcements, migration guides.

Format: Docusaurus blog — one post per release or significant change.

---

## Diagram index

| Location | Diagram | Type | Purpose |
|----------|---------|------|---------|
| Core Concepts | Job lifecycle | State diagram | Show phase transitions |
| Core Concepts | Event flow | Sequence diagram | Source → API → orchestrator → jobs |
| What is Eve Horizon? | System overview | Architecture | Simplified user → result flow |
| First Deploy | Deploy pipeline | Sequence diagram | Build → release → deploy |
| Pipelines & CI/CD | Job graph expansion | Graph | Steps → jobs with dependencies |
| Environments | Promotion flow | Sequence diagram | Build once → promote through stages |
| Chat & Conversations | Chat message flow | Sequence diagram | Slack → gateway → route → job → reply |
| Orchestration Patterns | Team dispatch | Sequence diagram | Lead → children → coordination → results |
| Deployment Guide | K8s architecture | Architecture | Services, pods, volumes, ingress |
| Harnesses & Workers | Invocation flow | Flowchart | Worker → eve-agent-cli → harness |

---

## Source mapping summary

| Source Doc | Primary Target | Secondary Targets |
|------------|---------------|-------------------|
| `system-overview.md` | What is Eve Horizon?, Core Concepts | |
| `unified-architecture.md` | Core Concepts, Deployment Guide | |
| `user-getting-started-guide.md` | Quickstart, Install, CLI Commands, Troubleshooting | |
| `manifest.md` | Manifest Authoring, Manifest Schema | Services, Environments |
| `pipelines.md` | Pipelines & CI/CD, Pipelines Reference | |
| `workflows.md` | Workflows Reference | |
| `workflow-invocation.md` | Workflows Reference | |
| `skills-workflows.md` | Workflows Reference | |
| `skills.md` | Skills & Skill Packs, Skills System | |
| `skillpacks.md` | Skills & Skill Packs | |
| `skills-manifest.md` | Skills System | |
| `events.md` | Events & Webhooks | Core Concepts |
| `webhooks.md` | Events & Webhooks | |
| `agents.md` | Agents & Teams | Core Concepts |
| `harness-execution.md` | Harnesses & Workers | |
| `harness-adapters.md` | Harnesses & Workers | |
| `harness-policy.md` | Harnesses & Workers | |
| `worker-types.md` | Harnesses & Workers | Deployment Guide |
| `deployment.md` | Deployment Guide | Local Development |
| `k8s-local-stack.md` | Local Development, Deployment Guide | |
| `builds.md` | Builds & Releases | Pipelines & CI/CD |
| `container-registry.md` | Builds & Releases | Deployment Guide |
| `secrets.md` | Secrets & Auth | Security |
| `auth.md` | Secrets & Auth, Security | |
| `identity-providers.md` | Secrets & Auth | Security |
| `chat-gateway.md` | Chat & Conversations, Chat Gateway | |
| `chat-routing.md` | Chat & Conversations, Chat Gateway | |
| `threads.md` | Threads & Coordination | Chat & Conversations |
| `orchestrator.md` | Orchestration Patterns | Observability |
| `orchestration-skill.md` | Orchestration Patterns | |
| `environment-gating.md` | Environment Gating | Environments & Promotion |
| `job-api.md` | Job API | Core Concepts |
| `job-cli.md` | CLI Commands | |
| `job-context.md` | Job API | |
| `job-control-signals.md` | Job API | |
| `job-git-controls.md` | Job API, Harnesses & Workers | |
| `db.md` | Database Operations | Services & Databases |
| `agent-runtime.md` | Chat Gateway | Deployment Guide |
| `agent-harness-design.md` | Harnesses & Workers | |
| `agent-sandbox-security.md` | Security | |
| `agent-secret-isolation.md` | Security | |
| `agent-app-api-access.md` | Agent-Native Design | |
| `app-service-eve-api-access.md` | Agent-Native Design | |
| `api-philosophy.md` | OpenAPI Spec, Agent-Native Design | |
| `extension-points.md` | Agent-Native Design | |
| `openapi.md` | OpenAPI Spec | |
| `observability.md` | Observability | |
| `analytics.md` | Observability | |
| `pricing-and-billing.md` | Observability | |
| `ci-cd.md` | Pipelines & CI/CD | |
| `cli-debugging.md` | Troubleshooting | CLI Commands |
| `cli-tools-and-credentials.md` | Install, CLI Commands | |
| `configuration-model-refactor.md` | Manifest Schema | |
| `deploy-polling.md` | Troubleshooting | Deployment Guide |
| `inference-ollama.md` | Harnesses & Workers | |
| `ollama-api-key-auth.md` | Harnesses & Workers | |
| `integrations.md` | Chat Gateway | |
| `pr-preview-environments.md` | Pipelines & CI/CD | |
| `testing-strategy.md` | (internal — defer to phase 3) | |
| `template.md` | (internal — not for public docs) | |

---

## Open questions

1. **Pricing/billing page**: Include in phase 1 or defer? Source (`pricing-and-billing.md`) covers rate cards, receipts, and budget enforcement. Recommendation: include a lightweight "Cost Tracking" section under Observability; defer a dedicated pricing page.

2. **Testing strategy**: Public or internal? Recommendation: keep internal. Users don't need Eve's internal test strategy. Instead, document how users test their own apps using Eve pipelines.

3. **CLI copy-paste snippets**: All pages or selected? Recommendation: all Get Started and Guide pages include runnable snippets. Reference pages include complete command signatures but fewer narrative snippets.

4. **Diagram style guide page**: Listed in bootstrap plan under Reference. Recommendation: create as a Reference page in phase 1 since Mermaid is a first-class feature.

5. **Ollama/inference docs**: Include or defer? Source docs cover Ollama integration. Recommendation: brief section under Harnesses & Workers; expand if demand warrants.

---

## Phase mapping

### Phase 0 — Foundation (no content authored)
- Scaffold Docusaurus, configure Mermaid/dark/light, wire manifest

### Phase 1 — Public docs release
**Must-ship pages:**
- All Get Started (5 pages)
- Manifest Authoring, Pipelines & CI/CD, Skills & Skill Packs, Secrets & Auth, Local Development (5 guides)
- CLI Commands, Manifest Schema, Job API (3 reference)
- llms.txt Spec (1 agent integration)
- Deployment Guide, Troubleshooting (2 operations)

**Total: 16 pages**

### Phase 2 — Search API + agent integration + remaining guides
- Services & Databases, Environments & Promotion, Agents & Teams, Chat & Conversations (4 guides)
- Events & Webhooks, Builds & Releases, Pipelines Reference, Workflows Reference, Environment Gating, Harnesses & Workers, OpenAPI Spec (7 reference)
- Agent-Native Design, Skills System, Orchestration Patterns, Chat Gateway, Threads & Coordination (5 agent integration)
- Observability, Database Operations, Security (3 operations)
- /api/search endpoint, private sync skill

**Total: 19 pages + infrastructure**

### Phase 3 — Polish and scale
- Diagram Style Guide
- Version-specific docs (if needed)
- Analytics integration
- Pricing & Resource Management page
- Additional troubleshooting playbooks

### Phase 4+ — Planned platform features (when implemented)

The following capabilities exist in `docs/ideas/` and `docs/plans/` as active design documents.
They are **not yet implemented** in the current system and should be documented only as they ship.

#### Eve PM (Product Management Agent Platform)
- Living specification system for PMs
- Universal Hopper (accepts docs, screenshots, voice memos)
- Agent-powered requirement extraction and triage
- Spec tree with provenance tracking
- Epic creation and handoff to Eve jobs
- Potential new top-level sidebar section: "Eve PM"
- Sources: `docs/ideas/eve-pm-overview.md`, `docs/plans/eve-pm-living-spec-plan.md`

#### Automated Software Factory (AgentPack)
- Multi-agent team for idea → production code
- Agent roles: PM (brief), Planner (spec), Coder (impl), Verifier (test)
- Dispatch topologies: relay, council, supervision
- Potential section under Agent Integration: "Software Factory"
- Sources: `docs/ideas/automated-software-factory-v4.md`

#### App Marketplace
- Distribution model for Eve apps (public, private, unlisted catalogs)
- SaaS pricing via usage ledger, entitlements
- Feature catalog mapping manifest capabilities to showcase cards
- Potential new top-level sidebar section: "Marketplace"
- Sources: `docs/ideas/eve-app-marketplace.md`

#### Resource Management & Budgets
- Per-org usage ledger, resource classes (job.c1, svc.s1, db.p1)
- Versioned rate cards, balance ledger with prepaid credits
- Budget enforcement (per-job max_cost, per-org hard_cap, suspension)
- Spend CLI: `eve org spend`, `eve project spend`
- Potential new guide: "Cost Tracking & Budgets"
- Sources: `docs/plans/resource-management-and-cost-tracking-v2.md`, `docs/plans/platform-resource-plane.md`

#### Platform Agents (Self-Managing Infrastructure)
- System Health Agent, Auto-Remediation Agent, Infra Provisioner
- Cluster Scaler, Cost Optimizer, Capacity Planner
- Run as real Eve agents in a system org/project
- Potential section under Operations: "Platform Agents"
- Sources: `docs/plans/platform-agents.md`

#### Managed Services Expansion
- **Managed Postgres DBaaS**: cloud Postgres per app environment (three modes: container, external, managed)
- **Eve-Native Container Registry**: zero-config image storage backed by S3/GCS/MinIO
- **Managed Ollama**: org/project-scoped LLM inference pools with budgeted usage
- Potential expansion of Services & Databases guide
- Sources: `docs/plans/managed-postgres-dbaas-plan.md`, `docs/plans/eve-native-container-registry-plan.md`, `docs/ideas/ollama-cluster-managed-models.md`

#### Unified Permissions
- Single permission-based system (`{resource}:{action}`, 33+ permissions)
- Replaces dual RBAC roles + scopes
- Permission catalog, role definitions, service accounts
- Potential expansion of Secrets & Auth guide
- Sources: `docs/plans/unified-permissions-plan.md`

#### Nostr & Sovereign Agent Integration
- Agent-native PaaS for Bitcoin-autonomous agents (nostrworld.com)
- Nostr keypair as identity, Lightning payments
- DVMs (Data Vending Machines) for computational work
- Potential new section: "Nostr Integration"
- Sources: `docs/ideas/nostrworld-agentic-paas.md`, `docs/ideas/nostr-integration.md`

#### Platform Primitives for Agentic Apps
- Job attachments (documents attached to jobs for agent context passing)
- Org document store (DB-backed, versioned, full-text search)
- Cross-project queries (`GET /orgs/:id/jobs`, `/stats`, `/events`)
- Service account authentication (API keys for backend-to-API calls)
- Potential expansion of Agent-Native Design page
- Sources: `docs/ideas/platform-primitives-for-agentic-apps.md`

---

## Design principles (should frame all documentation)

These cross-cutting principles emerged from the source corpus and should inform tone and structure:

1. **CLI-first, API-centric** — all features accessible via `eve` CLI; the REST API is the substrate
2. **Agent-native** — one happy-path command per operation, discoverable via OpenAPI, same interface for humans and agents
3. **Primitives over framework** — composition over complexity; small composable building blocks
4. **Deterministic and replayable** — snapshots, deduplication, audit trails
5. **Least privilege by default** — explicit permissions, scoped tokens, secrets never in plaintext
6. **Document-addressed everything** — canonical addressing with event emission for docs, attachments, resources
