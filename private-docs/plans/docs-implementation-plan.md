# Eve Horizon Docs — Full Implementation Plan

> Orchestrable plan for authoring all documentation pages with parallel sub-agents.
> Each work unit is self-contained and can run independently.

---

## Architecture

### Execution model

This plan is designed for **parallel orchestration**. Work is divided into **waves** — within each wave, all work units run concurrently. Waves have dependency ordering where necessary (e.g., the CLI Appendix must exist before pages link into it).

```
Wave 0: CLI Appendix + Source Research Index
Wave 1: Get Started (5 pages) — can start immediately
Wave 2: Guides (11 pages) — can start immediately, parallel with Wave 1
Wave 3: Reference (10 pages) — can start immediately, parallel with Wave 1+2
Wave 4: Agent Integration (6 pages) — can start immediately
Wave 5: Operations (5 pages) — can start immediately
Wave 6: Sidebar + build validation — after all pages written
```

In practice, **all waves can run in parallel** except Wave 0 (CLI Appendix) which should complete first so other pages can link to it, and Wave 6 which validates the complete site.

### Sub-agent contract

Every sub-agent receives:
1. **Page spec** — title, path, purpose, sections, target length
2. **Source files** — exact paths to read from `../../incept5/eve-horizon/` and `../../incept5/eve-skillpacks/`
3. **Research mandate** — "Read the source files FIRST. Extract real CLI commands, real flag names, real YAML structures. Do not fabricate."
4. **Style rules** — see below
5. **Cross-reference map** — which other pages to link to, CLI Appendix section anchors

### Page style rules

All sub-agents must follow these rules:

1. **Frontmatter**: Every page starts with Docusaurus frontmatter:
   ```yaml
   ---
   sidebar_position: N
   title: Page Title
   description: One-line description for SEO and llms.txt
   ---
   ```

2. **CLI examples**: Every page that mentions a CLI command must include a runnable example in a fenced code block with `bash` language tag. Use realistic but clearly fake IDs (`proj_acme`, `org_xxx`, `MyApp-abc123`).

3. **Manifest examples**: When showing manifest YAML, use fenced `yaml` blocks. Show only the relevant section, not the entire manifest, unless the page is specifically about manifest structure.

4. **Mermaid diagrams**: Use `mermaid` fenced code blocks. Prefer sequence diagrams for flows, state diagrams for lifecycles, graph TD for hierarchies.

5. **Admonitions**: Use Docusaurus admonitions sparingly:
   - `:::tip` for best practices
   - `:::warning` for common mistakes
   - `:::info` for cross-references
   - `:::danger` for destructive operations

6. **CLI Appendix links**: When a CLI command is mentioned, link to the appendix:
   ```markdown
   See [`eve env deploy`](/docs/reference/cli-appendix#eve-env-deploy) for all flags.
   ```

7. **Length targets**: Get Started pages ~800-1200 words. Guide pages ~1500-2500 words. Reference pages ~2000-4000 words. CLI Appendix will be the longest page.

8. **No fabrication**: Every CLI flag, every YAML field, every API endpoint must come from the source. If something isn't in the source, don't include it.

---

## Wave 0 — Foundation (must complete first)

### WU-0.1: CLI Appendix

**Path**: `website/docs/reference/cli-appendix.md`
**Title**: CLI Reference (Complete)
**Purpose**: Definitive CLI tree — every command, every subcommand, every flag, every example. Other pages link here.

**Research sources**:
- `../../incept5/eve-horizon/packages/cli/src/lib/help.ts` — THE authoritative source (2700 lines)
- `../../incept5/eve-horizon/packages/cli/src/commands/*.ts` — for any flags not in help.ts

**Structure**:
```
# CLI Reference (Complete)

## Global Options
  --help, --api-url, --profile, --org, --project, --json

## Commands (alphabetical)

### eve access
#### eve access can
#### eve access explain
#### eve access groups
#### eve access memberships
#### eve access validate
#### eve access plan
#### eve access sync

### eve admin
#### eve admin invite
#### eve admin ingress-aliases

### eve agents
...

### eve analytics
...

### eve auth
...

(continue for all 30+ top-level commands)
```

Each subcommand entry follows this template:
```markdown
#### eve <command> <subcommand>

<one-line description>

```
Usage: eve <command> <subcommand> [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--flag` | `string` | — | Description |

**Examples:**
```bash
eve <command> <subcommand> --flag value
```
```

**Target length**: 8000-12000 words (this is the longest page — it's the appendix)
**Sidebar position**: Last in Reference section

**Anchor convention**: Every subcommand gets an anchor matching `#eve-{command}-{subcommand}` (e.g., `#eve-env-deploy`, `#eve-job-create`). Other pages link to these anchors.

---

## Wave 1 — Get Started (5 pages, parallel)

### WU-1.1: What is Eve Horizon?

**Path**: `website/docs/get-started/what-is-eve-horizon.md`
**Sidebar position**: 1

**Research sources**:
- `../../incept5/eve-horizon/docs/system/system-overview.md`
- `../../incept5/eve-horizon/docs/system/unified-architecture.md`
- `../../incept5/eve-horizon/README.md`
- `../../incept5/eve-horizon/ARCHITECTURE.md`

**Sections**:
1. Opening paragraph — what Eve Horizon is in 3 sentences
2. Core philosophy — CLI-first, job-centric, event-driven, skills-based, isolated execution
3. Who is it for? — app teams, AI-augmented teams, solo operators, technical founders
4. How it works — simplified flow diagram (Mermaid sequence: user → CLI → API → orchestrator → worker → agent → result)
5. What can it do? — table: CI/CD, code review, docs, development, custom workflows
6. Architecture at a glance — simplified system diagram (Mermaid graph)
7. Next steps → Install the CLI

**Diagrams**:
- Mermaid sequence: simplified execution flow
- Mermaid graph: architecture overview (API, orchestrator, workers, gateway, DB)

---

### WU-1.2: Install the CLI

**Path**: `website/docs/get-started/install.md`
**Sidebar position**: 2

**Research sources**:
- `../../incept5/eve-horizon/docs/system/user-getting-started-guide.md`
- `../../incept5/eve-horizon/docs/system/cli-tools-and-credentials.md`
- `../../incept5/eve-horizon/packages/cli/package.json` — for package name and version

**Sections**:
1. Prerequisites — Node.js 18+, Git, SSH key
2. Install via npm: `npm install -g @anthropic/eve-cli` (verify exact package name from source)
3. Verify: `eve --help`
4. Shell completions (if available)
5. Keep updated: `npm update -g @anthropic/eve-cli`
6. Next steps → Quickstart

**CLI examples**: `eve --help`, `eve --version`

---

### WU-1.3: Quickstart

**Path**: `website/docs/get-started/quickstart.md`
**Sidebar position**: 3

**Research sources**:
- `../../incept5/eve-horizon/docs/system/user-getting-started-guide.md`
- `../../incept5/eve-skillpacks/eve-se/eve-bootstrap/SKILL.md`
- `../../incept5/eve-skillpacks/eve-se/eve-new-project-setup/SKILL.md`

**Sections**:
1. Initialize a project: `eve init my-project`
2. Set up profile and auth (from bootstrap skill)
3. Create your first job: `eve job create --description "..."`
4. Watch execution: `eve job follow <job-id>`
5. Check results: `eve job result <job-id>`
6. What just happened? — brief explanation of the job lifecycle
7. Next steps → Core Concepts

**CLI examples**: Full runnable sequence from init through result

---

### WU-1.4: Core Concepts

**Path**: `website/docs/get-started/core-concepts.md`
**Sidebar position**: 4

**Research sources**:
- `../../incept5/eve-horizon/docs/system/system-overview.md`
- `../../incept5/eve-horizon/docs/system/unified-architecture.md`
- `../../incept5/eve-horizon/docs/system/job-api.md`
- `../../incept5/eve-horizon/docs/system/pipelines.md`
- `../../incept5/eve-horizon/docs/system/workflows.md`
- `../../incept5/eve-horizon/docs/system/events.md`
- `../../incept5/eve-horizon/docs/system/agents.md`
- `../../incept5/eve-horizon/docs/system/skills.md`

**Sections**:
1. Organizations & Projects — containers for work and config
2. Jobs — unit of work (phases: idea → backlog → ready → active → review → done)
3. Skills — reusable AI capabilities in SKILL.md format
4. Manifest — `.eve/manifest.yaml` as source of truth
5. Pipelines — deterministic step sequences for CI/CD
6. Workflows — on-demand agent-driven processes
7. Events — the automation spine
8. Agents & Teams — personas with skills, policies, dispatch modes

**Diagrams**:
- Mermaid state diagram: job lifecycle (idea → done)
- Mermaid sequence: event flow (source → API → orchestrator → jobs)

---

### WU-1.5: Your First Deploy

**Path**: `website/docs/get-started/first-deploy.md`
**Sidebar position**: 5

**Research sources**:
- `../../incept5/eve-horizon/docs/system/manifest.md`
- `../../incept5/eve-horizon/docs/system/deployment.md`
- `../../incept5/eve-horizon/docs/system/pipelines.md`
- `../../incept5/eve-horizon/docs/system/secrets.md`
- `../../incept5/eve-horizon/examples/fullstack-example/.eve/manifest.yaml`
- `../../incept5/eve-skillpacks/eve-se/eve-deploy-debugging/SKILL.md`

**Sections**:
1. Prerequisites — project set up, CLI installed
2. Write the manifest — minimal services + environments + pipeline (full YAML example from fullstack-example)
3. Sync the manifest: `eve project sync`
4. Set secrets: `eve secrets set GITHUB_TOKEN <token> --project <id>`
5. Trigger a deploy: `eve env deploy staging --ref main --repo-dir .`
6. Watch the pipeline: `eve pipeline logs <pipeline> <run-id> --follow`
7. Verify: `eve env show <project> staging`
8. Next steps → production deploy with approval gates

**Manifest example**: Real minimal manifest from fullstack-example
**Diagram**: Mermaid sequence: deploy pipeline flow (build → release → deploy)

---

## Wave 2 — Guides (11 pages, parallel)

### WU-2.1: Manifest Authoring

**Path**: `website/docs/guides/manifest-authoring.md`
**Sidebar position**: 1

**Research sources**:
- `../../incept5/eve-horizon/docs/system/manifest.md`
- `../../incept5/eve-horizon/docs/system/configuration-model-refactor.md`
- `../../incept5/eve-horizon/packages/shared/src/schemas/manifest.ts` — Zod schema (ground truth)
- `../../incept5/eve-horizon/examples/fullstack-example/.eve/manifest.yaml`
- `../../incept5/eve-skillpacks/eve-se/eve-manifest-authoring/SKILL.md`

**Sections**:
1. Manifest purpose and location (`.eve/manifest.yaml`)
2. Top-level fields (`schema`, `project`, `registry`, `services`, `environments`, `pipelines`, `workflows`)
3. Service definitions (Compose-style with Eve extensions)
4. Eve extensions (`x-eve`: ingress, role, api_spec, storage, files, managed)
5. Secret interpolation (`${secret.KEY}`)
6. Variable interpolation (`${ENV_NAME}`, `${PROJECT_ID}`, etc.)
7. Managed databases (`role: managed_db`)
8. Default job settings (`x-eve.defaults`)
9. Agent profiles (`x-eve.agents`)
10. AgentPacks (`x-eve.packs`)
11. Validating: `eve manifest validate`
12. Syncing: `eve project sync`
13. Common patterns and examples

**Manifest examples**: Full annotated manifest, section-by-section
**Links**: [Manifest Schema](/docs/reference/manifest-schema), [CLI Appendix: eve manifest validate](/docs/reference/cli-appendix#eve-manifest-validate)

---

### WU-2.2: Services & Databases

**Path**: `website/docs/guides/services-and-databases.md`
**Sidebar position**: 2

**Research sources**:
- `../../incept5/eve-horizon/docs/system/manifest.md` (services section)
- `../../incept5/eve-horizon/docs/system/db.md`
- `../../incept5/eve-horizon/packages/shared/src/schemas/manifest.ts` — ServiceSchema, ServiceXeveSchema, ManagedDbConfigSchema

**Sections**:
1. Service fields (`image`, `build`, `environment`, `ports`, `depends_on`, `healthcheck`)
2. Health checks (Docker-style)
3. Service dependencies and ordering
4. Eve service roles (`component`, `worker`, `job`, `managed_db`)
5. Managed databases (provisioning, status, credentials, scaling)
6. Persistent storage (`x-eve.storage`)
7. File mounts (`x-eve.files`)
8. External services (`x-eve.external`)
9. API spec registration (`x-eve.api_spec`)

**Manifest examples**: Service definition, managed DB, healthcheck
**CLI examples**: `eve db schema`, `eve db migrate`, `eve db sql`

---

### WU-2.3: Pipelines & CI/CD

**Path**: `website/docs/guides/pipelines.md`
**Sidebar position**: 3

**Research sources**:
- `../../incept5/eve-horizon/docs/system/pipelines.md`
- `../../incept5/eve-horizon/docs/system/builds.md`
- `../../incept5/eve-horizon/docs/system/ci-cd.md`
- `../../incept5/eve-horizon/docs/system/pr-preview-environments.md`
- `../../incept5/eve-skillpacks/eve-se/eve-pipelines-workflows/SKILL.md`

**Sections**:
1. What is a pipeline? (ordered steps → job graph)
2. Step types: `action`, `script`, `agent`, `run`
3. Built-in actions: `build`, `release`, `deploy`, `run`, `job`, `create-pr`, `notify`, `env-ensure`, `env-delete`
4. Dependencies between steps (`depends_on`)
5. GitHub triggers (push, pull_request with action/branch filtering)
6. Branch pattern matching
7. Running: `eve pipeline run`
8. Monitoring: `eve pipeline logs --follow`
9. Approving/cancelling runs
10. Pipeline inputs
11. Build → Release → Deploy canonical flow
12. PR preview environments (complete example)

**Manifest examples**: Pipeline definition, triggers, PR preview pipeline
**Diagram**: Mermaid graph: job graph expansion (steps → jobs with dependencies)

---

### WU-2.4: Environments & Promotion

**Path**: `website/docs/guides/environments.md`
**Sidebar position**: 4

**Research sources**:
- `../../incept5/eve-horizon/docs/system/manifest.md` (environments section)
- `../../incept5/eve-horizon/docs/system/pipelines.md`
- `../../incept5/eve-horizon/docs/system/environment-gating.md`
- `../../incept5/eve-horizon/docs/system/deployment.md`

**Sections**:
1. Defining environments in the manifest
2. Environment overrides (service-level)
3. Pipeline-linked environments
4. Pipeline inputs (per-environment defaults)
5. Approval gates (`approval: required`)
6. Direct deploy vs. pipeline deploy (`--direct`)
7. Promotion workflow (test → staging → production)
8. Release resolution: `eve release resolve`
9. Environment gating (concurrent deploy prevention)
10. Environment CLI: `eve env deploy`, `eve env show`, `eve env diagnose`, `eve env rollback`, `eve env reset`

**Manifest examples**: Environment definitions with overrides, approval gates
**Diagram**: Mermaid sequence: promotion flow

---

### WU-2.5: Skills & Skill Packs

**Path**: `website/docs/guides/skills.md`
**Sidebar position**: 5

**Research sources**:
- `../../incept5/eve-horizon/docs/system/skills.md`
- `../../incept5/eve-horizon/docs/system/skillpacks.md`
- `../../incept5/eve-horizon/docs/system/skills-manifest.md`
- `../../incept5/eve-skillpacks/ARCHITECTURE.md`
- `../../incept5/eve-skillpacks/README.md`

**Sections**:
1. What are skills? (SKILL.md format)
2. Directory structure (`.agents/skills/`, `.claude/skills/`)
3. SKILL.md format (frontmatter, body, guidelines)
4. Bundled resources (`references/`, `scripts/`, `assets/`)
5. Installing skills (`skills.txt`)
6. Creating a custom skill
7. Skill packs and creating your own
8. Official packs: eve-work, eve-se, eve-design
9. AgentPacks via manifest (`x-eve.packs` + lockfile)
10. Migrating: `eve migrate skills-to-packs`
11. Search priority and shadowing

**File examples**: SKILL.md format, skills.txt format
**CLI examples**: `eve skills install`, `eve packs status`, `eve packs resolve`

---

### WU-2.6: Agents & Teams

**Path**: `website/docs/guides/agents-and-teams.md`
**Sidebar position**: 6

**Research sources**:
- `../../incept5/eve-horizon/docs/system/agents.md`
- `../../incept5/eve-horizon/docs/system/manifest.md` (x-eve.agents section)
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/agents-teams.md`
- `../../incept5/eve-skillpacks/eve-design/eve-agentic-app-design/SKILL.md`

**Sections**:
1. What are agents? (personas with skills + policies)
2. agents.yaml structure (slug, skill, workflow, harness_profile, access, policies, gateway)
3. Agent slugs and gateway exposure
4. Teams and dispatch modes (fanout, council, relay)
5. teams.yaml structure
6. Syncing: `eve agents sync`
7. Harness profiles (`x-eve.agents.profiles`)
8. Planning councils
9. Agent install targets (`x-eve.install_agents`)

**YAML examples**: agents.yaml, teams.yaml, manifest x-eve.agents section
**CLI examples**: `eve agents config`, `eve agents sync`, `eve agents runtime-status`

---

### WU-2.7: Chat & Conversations

**Path**: `website/docs/guides/chat.md`
**Sidebar position**: 7

**Research sources**:
- `../../incept5/eve-horizon/docs/system/chat-gateway.md`
- `../../incept5/eve-horizon/docs/system/chat-routing.md`
- `../../incept5/eve-horizon/docs/system/threads.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/gateways.md`

**Sections**:
1. Chat gateway overview (pluggable providers)
2. Slack integration (webhook, `@eve <slug> <command>`)
3. Nostr integration (DMs, public mentions)
4. WebChat (browser-native, WebSocket)
5. Chat routing (`chat.yaml`: routes, targets, matching rules)
6. Route targets: `agent:`, `team:`, `workflow:`, `pipeline:`
7. Threads and continuity
8. Org-wide agent directory
9. Simulation: `eve chat simulate`

**YAML examples**: chat.yaml with routes
**Diagram**: Mermaid sequence: chat message flow (Slack → Gateway → Route → Agent → Job → Reply)
**CLI examples**: `eve chat simulate`, `eve integrations slack connect`

---

### WU-2.8: Local Development

**Path**: `website/docs/guides/local-development.md`
**Sidebar position**: 8

**Research sources**:
- `../../incept5/eve-horizon/docs/system/deployment.md`
- `../../incept5/eve-horizon/docs/system/k8s-local-stack.md`
- `../../incept5/eve-skillpacks/eve-se/eve-local-dev-loop/SKILL.md`

**Sections**:
1. Runtime modes: `eve local` (k3d) vs Docker Compose
2. k3d quick start: `eve local up`
3. Docker Compose quick start: `./bin/eh start docker`
4. When to use which mode (comparison table)
5. macOS prerequisites
6. Local config files (`.eve/profile.yaml`, `.eve/dev-secrets.yaml`)
7. Creating orgs and projects locally
8. Running jobs against local repos
9. Local stack diagnostics: `eve local status`, `eve local health`, `eve local logs`

**CLI examples**: `eve local up`, `eve local status --watch`, `eve local logs api --follow`, `eve local down --destroy`

---

### WU-2.9: Secrets & Auth

**Path**: `website/docs/guides/secrets-and-auth.md`
**Sidebar position**: 9

**Research sources**:
- `../../incept5/eve-horizon/docs/system/secrets.md`
- `../../incept5/eve-horizon/docs/system/auth.md`
- `../../incept5/eve-horizon/docs/system/identity-providers.md`
- `../../incept5/eve-skillpacks/eve-se/eve-auth-and-secrets/SKILL.md`

**Sections**:
1. Secret scopes (system → org → user → project, highest wins)
2. Setting secrets: `eve secrets set`, `eve secrets import`
3. Manifest secret interpolation (`${secret.KEY}`)
4. Local dev secrets (`.eve/dev-secrets.yaml`)
5. Secret validation: `eve secrets validate`, `eve project sync --validate-secrets`
6. Authentication overview (RS256 JWT, SSH challenge-response)
7. CLI login: `eve auth login`
8. Bootstrap flow: `eve auth bootstrap`
9. Inviting users: `eve admin invite`
10. Access requests: `eve auth request-access` (if available)
11. Syncing OAuth tokens: `eve auth sync`
12. RBAC (org roles: owner, admin, member)

**CLI examples**: Full auth flow, secrets CRUD

---

### WU-2.10: Fullstack App Design (NEW)

**Path**: `website/docs/guides/fullstack-app-design.md`
**Sidebar position**: 10

**Research sources**:
- `../../incept5/eve-skillpacks/eve-design/eve-fullstack-app-design/SKILL.md` — primary source
- `../../incept5/eve-horizon/examples/fullstack-example/.eve/manifest.yaml`
- `../../incept5/eve-horizon/examples/fullstack-example/.eve/access.yaml`
- `../../incept5/eve-horizon/docs/system/manifest.md`
- `../../incept5/eve-horizon/docs/system/deployment.md`
- `../../incept5/eve-horizon/docs/system/builds.md`
- `../../incept5/eve-horizon/docs/system/secrets.md`
- `../../incept5/eve-horizon/docs/system/db.md`

**Sections**:
1. The manifest as blueprint — single source of truth principle
2. Service topology patterns:
   - API + Database (minimal)
   - API + Worker + Database
   - Multi-service (web, api, worker, db, redis)
3. Five service design rules (from skill)
4. Platform-injected environment variables
5. Database design:
   - Managed DB provisioning via manifest
   - Migration strategy (`eve db new`, `eve db migrate`)
   - RLS from the start (`eve db rls init --with-groups`)
6. Build and release pipeline:
   - Canonical `build → release → deploy` flow
   - Registry options (eve, BYO, none)
   - Multi-stage Dockerfiles
7. Deployment and environments:
   - Staging (persistent), production (persistent), preview (temporary)
   - Standard, direct, promotion patterns
   - Recovery ladder: diagnose → logs → rollback → reset
8. Secrets and configuration:
   - Cascading precedence
   - Five design rules
9. Observability and debugging:
   - The debugging ladder (5 steps)
   - Build debugging
   - Health checks
10. Design checklist (comprehensive)

**Manifest examples**: Complete fullstack-example manifest, annotated
**CLI examples**: Full deploy cycle, DB operations, debugging commands

---

### WU-2.11: Agentic App Design (NEW)

**Path**: `website/docs/guides/agentic-app-design.md`
**Sidebar position**: 11

**Research sources**:
- `../../incept5/eve-skillpacks/eve-design/eve-agentic-app-design/SKILL.md` — primary source
- `../../incept5/eve-skillpacks/eve-design/eve-agent-native-design/SKILL.md`
- `../../incept5/eve-skillpacks/eve-design/eve-agent-native-design/references/eve-horizon-primitives.md`
- `../../incept5/eve-horizon/docs/system/agents.md`
- `../../incept5/eve-horizon/docs/system/chat-gateway.md`
- `../../incept5/eve-horizon/docs/system/threads.md`
- `../../incept5/eve-horizon/docs/system/events.md`

**Sections**:
1. Prerequisite: the fullstack foundation (link to fullstack guide)
2. Agent-native design principles (parity, granularity, composability, emergent capability)
3. Agent architecture (`agents.yaml`):
   - Slug, skill, harness profile, gateway policy, permission policy, git policies
   - Decision table: when to use each policy
4. Team design (`teams.yaml`):
   - Fanout, council, relay dispatch modes
   - When to use each
5. Multi-model inference:
   - Harness profiles in manifest
   - Model selection matrix (task → profile strategy)
   - Managed models and local inference
6. Memory design:
   - Storage primitive table (information type → primitive)
   - Namespace conventions for org docs
   - Lifecycle strategy
7. Event-driven coordination:
   - Trigger patterns
   - Self-healing pattern (job.failed → diagnose)
   - Custom app events: `eve event emit`
8. Chat and human-agent interface:
   - Gateway providers (Slack, Nostr, WebChat)
   - Routing via `chat.yaml`
   - Gateway vs backend-proxied decision
9. Jobs as coordination primitive:
   - Parent-child orchestration
   - Attachments for structured context
   - Coordination threads
10. Access and security:
    - Service accounts: `eve auth mint`
    - Access groups via `.eve/access.yaml`
    - Permission policies per agent
11. "Is this app truly agent-native?" checklist

**YAML examples**: agents.yaml, teams.yaml, chat.yaml, access.yaml, manifest x-eve.agents
**CLI examples**: `eve agents sync`, `eve event emit`, `eve auth mint`, `eve access sync`
**Diagrams**: Mermaid: team dispatch flow, event-driven self-healing

---

## Wave 3 — Reference (10 pages + CLI Appendix, parallel)

### WU-3.1: CLI Commands (Overview)

**Path**: `website/docs/reference/cli-commands.md`
**Sidebar position**: 1

**Purpose**: This page becomes a readable overview / quick-reference card that links into the CLI Appendix for details. NOT a duplicate of the appendix.

**Research sources**:
- `../../incept5/eve-horizon/packages/cli/src/lib/help.ts` — top-level help output

**Sections**:
1. Global flags (`--json`, `--help`, `--profile`, `--api-url`, `--org`, `--project`)
2. Command categories (table with command, description, link to appendix section):
   - Getting Started: `init`
   - Project Management: `org`, `project`, `manifest`
   - Development: `local`, `db`, `api`
   - Jobs & Execution: `job`, `supervise`, `harness`
   - Deployment: `env`, `build`, `release`, `pipeline`, `workflow`
   - Events & Webhooks: `event`, `webhooks`
   - Agents & Chat: `agents`, `packs`, `skills`, `chat`, `thread`
   - Auth & Secrets: `auth`, `access`, `secrets`, `admin`
   - Knowledge: `docs`, `memory`, `kv`, `search`, `fs`, `resources`
   - Observability: `analytics`, `system`
   - Inference: `ollama`
   - Migration: `migrate`

**Cross-links**: Every command name links to its CLI Appendix section

---

### WU-3.2: Manifest Schema

**Path**: `website/docs/reference/manifest-schema.md`
**Sidebar position**: 2

**Research sources**:
- `../../incept5/eve-horizon/docs/system/manifest.md`
- `../../incept5/eve-horizon/packages/shared/src/schemas/manifest.ts` — Zod schemas (ground truth)
- `../../incept5/eve-horizon/examples/fullstack-example/.eve/manifest.yaml`

**Sections**:
1. Top-level fields (table: field, required, type, description)
2. `services` reference (all Compose + Eve extensions)
3. `x-eve` extensions per service (table)
4. `environments` reference
5. `pipelines` reference (steps, triggers)
6. `workflows` reference
7. `registry` reference
8. `x-eve.defaults` reference
9. `x-eve.agents` reference (profiles, councils)
10. `x-eve.packs` reference
11. `x-eve.requires` reference
12. Platform-injected environment variables (table)
13. Secret interpolation syntax
14. Variable interpolation syntax
15. Managed database placeholders

**Tables**: Comprehensive field tables extracted from Zod schema

---

### WU-3.3: Job API

**Path**: `website/docs/reference/job-api.md`
**Sidebar position**: 3

**Research sources**:
- `../../incept5/eve-horizon/docs/system/job-api.md`
- `../../incept5/eve-horizon/docs/system/job-context.md`
- `../../incept5/eve-horizon/docs/system/job-control-signals.md`
- `../../incept5/eve-horizon/docs/system/job-git-controls.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/jobs.md`
- `../../incept5/eve-skillpacks/eve-work/eve-job-lifecycle/SKILL.md`

**Sections**: (as specified in content outline, section 3.3)

**Diagrams**: Mermaid state: job phase transitions

---

### WU-3.4: Events & Webhooks

**Path**: `website/docs/reference/events-and-webhooks.md`
**Sidebar position**: 4

**Research sources**:
- `../../incept5/eve-horizon/docs/system/events.md`
- `../../incept5/eve-horizon/docs/system/webhooks.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/events.md`

**Sections**: (as specified in content outline, section 3.4)

---

### WU-3.5: Builds & Releases

**Path**: `website/docs/reference/builds-and-releases.md`
**Sidebar position**: 5

**Research sources**:
- `../../incept5/eve-horizon/docs/system/builds.md`
- `../../incept5/eve-horizon/docs/system/container-registry.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/builds-releases.md`

**Sections**: (as specified in content outline, section 3.5)

---

### WU-3.6: Pipelines Reference

**Path**: `website/docs/reference/pipelines.md`
**Sidebar position**: 6

**Research sources**:
- `../../incept5/eve-horizon/docs/system/pipelines.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/pipelines-workflows.md`
- `../../incept5/eve-skillpacks/eve-se/eve-pipelines-workflows/SKILL.md`

**Sections**: (as specified in content outline, section 3.6)

---

### WU-3.7: Workflows Reference

**Path**: `website/docs/reference/workflows.md`
**Sidebar position**: 7

**Research sources**:
- `../../incept5/eve-horizon/docs/system/workflows.md`
- `../../incept5/eve-horizon/docs/system/workflow-invocation.md`
- `../../incept5/eve-horizon/docs/system/skills-workflows.md`

**Sections**: (as specified in content outline, section 3.7)

---

### WU-3.8: Environment Gating

**Path**: `website/docs/reference/environment-gating.md`
**Sidebar position**: 8

**Research sources**:
- `../../incept5/eve-horizon/docs/system/environment-gating.md`

**Sections**: (as specified in content outline, section 3.8)

---

### WU-3.9: Harnesses & Workers

**Path**: `website/docs/reference/harnesses-and-workers.md`
**Sidebar position**: 9

**Research sources**:
- `../../incept5/eve-horizon/docs/system/harness-execution.md`
- `../../incept5/eve-horizon/docs/system/harness-adapters.md`
- `../../incept5/eve-horizon/docs/system/worker-types.md`
- `../../incept5/eve-horizon/docs/system/harness-policy.md`
- `../../incept5/eve-horizon/packages/shared/src/harnesses/registry.ts`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/harnesses.md`

**Sections**: (as specified in content outline, section 3.9)

---

### WU-3.10: OpenAPI Spec

**Path**: `website/docs/reference/openapi.md`
**Sidebar position**: 10

**Research sources**:
- `../../incept5/eve-horizon/docs/system/openapi.md`
- `../../incept5/eve-horizon/docs/system/api-philosophy.md`
- `../../incept5/eve-horizon/docs/system/openapi.yaml` — actual spec

**Sections**: (as specified in content outline, section 3.10)

---

## Wave 4 — Agent Integration (6 pages, parallel)

### WU-4.1: Agent-Native Design

**Path**: `website/docs/agent-integration/agent-native-design.md`
**Sidebar position**: 1

**Research sources**:
- `../../incept5/eve-horizon/docs/system/api-philosophy.md`
- `../../incept5/eve-horizon/docs/system/agent-app-api-access.md`
- `../../incept5/eve-horizon/docs/system/app-service-eve-api-access.md`
- `../../incept5/eve-horizon/docs/system/extension-points.md`
- `../../incept5/eve-skillpacks/eve-design/eve-agent-native-design/SKILL.md`
- `../../incept5/eve-skillpacks/eve-design/eve-agent-native-design/references/eve-horizon-primitives.md`

**Sections**: (as specified in content outline, section 4.1)

---

### WU-4.2: Skills System (Deep Dive)

**Path**: `website/docs/agent-integration/skills-system.md`
**Sidebar position**: 2

**Research sources**:
- `../../incept5/eve-horizon/docs/system/skills.md`
- `../../incept5/eve-horizon/docs/system/skills-manifest.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/skills-system.md`

**Sections**: (as specified in content outline, section 4.2)

---

### WU-4.3: Orchestration Patterns

**Path**: `website/docs/agent-integration/orchestration.md`
**Sidebar position**: 3

**Research sources**:
- `../../incept5/eve-horizon/docs/system/orchestrator.md`
- `../../incept5/eve-horizon/docs/system/orchestration-skill.md`
- `../../incept5/eve-horizon/docs/system/threads.md`
- `../../incept5/eve-horizon/docs/system/job-api.md`
- `../../incept5/eve-skillpacks/eve-work/eve-orchestration/SKILL.md`
- `../../incept5/eve-skillpacks/eve-work/eve-orchestration/references/parallel-decomposition.md`

**Sections**: (as specified in content outline, section 4.3)
**Diagram**: Mermaid sequence: team dispatch flow

---

### WU-4.4: Chat Gateway & Routing

**Path**: `website/docs/agent-integration/chat-gateway.md`
**Sidebar position**: 4

**Research sources**:
- `../../incept5/eve-horizon/docs/system/chat-gateway.md`
- `../../incept5/eve-horizon/docs/system/chat-routing.md`
- `../../incept5/eve-horizon/docs/system/integrations.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/gateways.md`

**Sections**: (as specified in content outline, section 4.4)

---

### WU-4.5: Threads & Coordination

**Path**: `website/docs/agent-integration/threads.md`
**Sidebar position**: 5

**Research sources**:
- `../../incept5/eve-horizon/docs/system/threads.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/agents-teams.md`

**Sections**: (as specified in content outline, section 4.5)

---

### WU-4.6: llms.txt Spec

**Path**: `website/docs/agent-integration/llms-txt.md`
**Sidebar position**: 6

**Research sources**:
- `../../incept5/eve-horizon/eve-horizon-docs/private-docs/ideas/eve-docs-site-bootstrap.md`
- `../../incept5/eve-horizon/eve-horizon-docs/website/docusaurus.config.ts` — llms-txt plugin config

**Sections**: (as specified in content outline, section 4.6)

---

## Wave 5 — Operations (5 pages, parallel)

### WU-5.1: Deployment Guide

**Path**: `website/docs/operations/deployment.md`
**Sidebar position**: 1

**Research sources**:
- `../../incept5/eve-horizon/docs/system/deployment.md`
- `../../incept5/eve-horizon/docs/system/k8s-local-stack.md`
- `../../incept5/eve-skillpacks/eve-se/eve-deploy-debugging/SKILL.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/deploy-debug.md`

**Sections**: (as specified in content outline, section 5.1)

---

### WU-5.2: Observability & Receipts

**Path**: `website/docs/operations/observability.md`
**Sidebar position**: 2

**Research sources**:
- `../../incept5/eve-horizon/docs/system/observability.md`
- `../../incept5/eve-horizon/docs/system/analytics.md`
- `../../incept5/eve-horizon/docs/system/pricing-and-billing.md`

**Sections**: (as specified in content outline, section 5.2)
**CLI examples**: `eve analytics summary`, `eve analytics jobs`, `eve analytics env-health`

---

### WU-5.3: Database Operations

**Path**: `website/docs/operations/database.md`
**Sidebar position**: 3

**Research sources**:
- `../../incept5/eve-horizon/docs/system/db.md`
- `../../incept5/eve-horizon/docs/system/manifest.md` (managed DB section)

**Sections**: (as specified in content outline, section 5.3)

---

### WU-5.4: Security & Key Rotation

**Path**: `website/docs/operations/security.md`
**Sidebar position**: 4

**Research sources**:
- `../../incept5/eve-horizon/docs/system/auth.md`
- `../../incept5/eve-horizon/docs/system/secrets.md`
- `../../incept5/eve-horizon/docs/system/agent-sandbox-security.md`
- `../../incept5/eve-horizon/docs/system/agent-secret-isolation.md`
- `../../incept5/eve-skillpacks/eve-work/eve-read-eve-docs/references/secrets-auth.md`

**Sections**: (as specified in content outline, section 5.4)
**New section**: Access control via `eve access` (groups, bindings, policy-as-code from `.eve/access.yaml`)
**CLI examples**: `eve access groups create`, `eve access plan`, `eve access sync`

---

### WU-5.5: Troubleshooting

**Path**: `website/docs/operations/troubleshooting.md`
**Sidebar position**: 5

**Research sources**:
- `../../incept5/eve-horizon/docs/system/user-getting-started-guide.md`
- `../../incept5/eve-horizon/docs/system/cli-debugging.md`
- `../../incept5/eve-horizon/docs/system/deploy-polling.md`
- `../../incept5/eve-horizon/docs/system/secrets.md`
- `../../incept5/eve-skillpacks/eve-se/eve-troubleshooting/SKILL.md`

**Sections**: (as specified in content outline, section 5.5)

---

## Wave 6 — Integration (sequential, after all pages written)

### WU-6.1: Update Sidebar

**Path**: `website/sidebars.ts`

Update the sidebar to include:
- New pages: `guides/fullstack-app-design`, `guides/agentic-app-design`
- New page: `reference/cli-appendix`
- Correct sidebar positions for all pages

**New sidebar structure**:
```typescript
{
  docs: [
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: [
        'get-started/what-is-eve-horizon',
        'get-started/install',
        'get-started/quickstart',
        'get-started/core-concepts',
        'get-started/first-deploy',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/manifest-authoring',
        'guides/services-and-databases',
        'guides/pipelines',
        'guides/environments',
        'guides/skills',
        'guides/agents-and-teams',
        'guides/chat',
        'guides/local-development',
        'guides/secrets-and-auth',
        'guides/fullstack-app-design',
        'guides/agentic-app-design',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/cli-commands',
        'reference/manifest-schema',
        'reference/job-api',
        'reference/events-and-webhooks',
        'reference/builds-and-releases',
        'reference/pipelines',
        'reference/workflows',
        'reference/environment-gating',
        'reference/harnesses-and-workers',
        'reference/openapi',
        'reference/cli-appendix',
      ],
    },
    // ... Agent Integration, Operations unchanged
  ],
}
```

### WU-6.2: Build Validation

Run `pnpm build` in `website/` to verify:
- All pages compile
- No broken links
- No broken Mermaid diagrams
- Sidebar renders correctly
- llms.txt generates

### WU-6.3: Cross-link Audit

Verify every CLI command mention links to the CLI Appendix. Verify inter-page links resolve. Fix any 404s.

---

## Appendix A — Source file index

Quick reference for sub-agents. All paths relative to `../../incept5/eve-horizon/`.

### System docs (`docs/system/`)
| File | Primary topic |
|------|--------------|
| `agent-app-api-access.md` | App→Eve API access |
| `agent-harness-design.md` | Harness architecture |
| `agent-runtime.md` | Agent runtime service |
| `agent-sandbox-security.md` | Sandbox security model |
| `agent-secret-isolation.md` | Secret isolation |
| `agents.md` | Agent & team config |
| `analytics.md` | Analytics & metrics |
| `api-philosophy.md` | API design principles |
| `app-service-eve-api-access.md` | Service→Eve API |
| `auth.md` | Authentication system |
| `builds.md` | Build system |
| `chat-gateway.md` | Chat gateway |
| `chat-routing.md` | Chat routing |
| `ci-cd.md` | CI/CD patterns |
| `cli-debugging.md` | CLI debugging |
| `cli-tools-and-credentials.md` | CLI setup |
| `configuration-model-refactor.md` | Manifest v2 |
| `container-registry.md` | Registry |
| `db.md` | Database operations |
| `deploy-polling.md` | Deploy polling |
| `deployment.md` | Deployment guide |
| `environment-gating.md` | Env gating |
| `events.md` | Events system |
| `extension-points.md` | Extension points |
| `harness-adapters.md` | Harness adapters |
| `harness-execution.md` | Harness execution |
| `harness-policy.md` | Permission policies |
| `identity-providers.md` | Identity providers |
| `inference-ollama.md` | Ollama inference |
| `integrations.md` | Integrations |
| `job-api.md` | Job API spec |
| `job-cli.md` | Job CLI commands |
| `job-context.md` | Job context |
| `job-control-signals.md` | Control signals |
| `job-git-controls.md` | Git controls |
| `k8s-local-stack.md` | Local k3d stack |
| `manifest.md` | Manifest spec |
| `observability.md` | Observability |
| `ollama-api-key-auth.md` | Ollama auth |
| `openapi.md` | OpenAPI spec |
| `orchestration-skill.md` | Orchestration |
| `orchestrator.md` | Orchestrator |
| `pipelines.md` | Pipelines spec |
| `pr-preview-environments.md` | PR previews |
| `pricing-and-billing.md` | Pricing |
| `secrets.md` | Secrets system |
| `skillpacks.md` | Skill packs |
| `skills-manifest.md` | Skills manifest |
| `skills-workflows.md` | Skills workflows |
| `skills.md` | Skills system |
| `system-overview.md` | System overview |
| `threads.md` | Threads system |
| `unified-architecture.md` | Architecture |
| `user-getting-started-guide.md` | Getting started |
| `webhooks.md` | Webhooks |
| `worker-types.md` | Worker types |
| `workflow-invocation.md` | Workflow invocation |
| `workflows.md` | Workflows spec |

### CLI source (`packages/cli/src/`)
| File | Purpose |
|------|---------|
| `lib/help.ts` | Complete CLI help text (authoritative for all commands/flags) |
| `commands/*.ts` | Individual command implementations |

### Schema source (`packages/shared/src/schemas/`)
| File | Purpose |
|------|---------|
| `manifest.ts` | Manifest Zod schema (ground truth) |
| `agent-config.ts` | Agent config schema |
| `agents.ts` | Agent/team schemas |
| `job.ts` | Job schemas |
| `pipeline.ts` | Pipeline schemas |
| `webhook.ts` | Webhook schemas |

### Example files
| File | Purpose |
|------|---------|
| `examples/fullstack-example/.eve/manifest.yaml` | Complete manifest example |
| `examples/fullstack-example/.eve/access.yaml` | Access control example |
| `.eve/manifest.yaml` | Self-referential manifest |
| `.eve/profile.yaml` | Profile config example |

### Skillpack sources (`../../incept5/eve-skillpacks/`)
| File | Purpose |
|------|---------|
| `eve-design/eve-fullstack-app-design/SKILL.md` | Fullstack design skill |
| `eve-design/eve-agentic-app-design/SKILL.md` | Agentic design skill |
| `eve-design/eve-agent-native-design/SKILL.md` | Agent-native principles |
| `eve-design/eve-agent-native-design/references/eve-horizon-primitives.md` | Platform primitives |
| `eve-se/eve-*/SKILL.md` | SE skills (bootstrap, manifest, deploy, etc.) |
| `eve-work/eve-read-eve-docs/references/*.md` | 17 distilled reference docs |
| `eve-work/eve-orchestration/SKILL.md` | Orchestration patterns |
| `eve-work/eve-job-lifecycle/SKILL.md` | Job lifecycle |
| `eve-work/eve-agent-memory/SKILL.md` | Agent memory |

---

## Appendix B — Sub-agent prompt template

Each sub-agent should receive a prompt structured like this:

```
You are authoring a documentation page for the Eve Horizon docs site (Docusaurus).

## Your assignment
- Page: {title}
- Path: website/docs/{path}.md
- Purpose: {purpose}

## Research phase (DO THIS FIRST)
Read these source files thoroughly before writing anything:
{list of source file paths}

Extract:
- Exact CLI command names and flags
- Exact YAML field names and types
- Real examples from the source
- Mermaid diagram data (state transitions, sequences, etc.)

## Writing phase
Write the page following these rules:
- Start with Docusaurus frontmatter (sidebar_position: {N}, title, description)
- Include CLI examples in ```bash blocks with realistic IDs
- Include manifest YAML examples where relevant
- Add Mermaid diagrams where specified
- Link to CLI Appendix for detailed command reference: [eve <cmd>](/docs/reference/cli-appendix#eve-{cmd}-{subcmd})
- Use Docusaurus admonitions (:::tip, :::warning, :::info, :::danger) sparingly
- Target length: {word count range}
- Do NOT fabricate CLI flags or YAML fields — only use what's in the source

## Output
Write the complete markdown file content.
```

---

## Appendix C — New CLI commands not in original outline

The following CLI commands were discovered during research and are NOT covered in the original 35-page content outline. They are included in the CLI Appendix (WU-0.1) and referenced from relevant guide/reference pages:

| Command | Coverage |
|---------|----------|
| `eve access` | Security guide (WU-5.4), Agentic App Design (WU-2.11) |
| `eve analytics` | Observability (WU-5.2) |
| `eve api` | OpenAPI Spec (WU-3.10), Fullstack guide (WU-2.10) |
| `eve docs` | Agent Memory section in Agentic guide (WU-2.11) |
| `eve fs` | Agentic guide memory section (WU-2.11) |
| `eve kv` | Agentic guide memory section (WU-2.11) |
| `eve local` | Local Development guide (WU-2.8) |
| `eve memory` | Agentic guide memory section (WU-2.11) |
| `eve migrate` | Skills guide (WU-2.5) |
| `eve ollama` | Harnesses reference (WU-3.9) |
| `eve resources` | Agent Integration: Skills System (WU-4.2) |
| `eve search` | Agentic guide memory section (WU-2.11) |
| `eve supervise` | Orchestration Patterns (WU-4.3) |

---

## Appendix D — Estimated totals

| Section | Pages | Est. words |
|---------|-------|-----------|
| CLI Appendix | 1 | 10,000 |
| Get Started | 5 | 5,000 |
| Guides | 11 | 22,000 |
| Reference | 10 | 30,000 |
| Agent Integration | 6 | 12,000 |
| Operations | 5 | 10,000 |
| **Total** | **38** | **~89,000** |

38 pages total (35 original + CLI Appendix + Fullstack App Design + Agentic App Design).
