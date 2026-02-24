# Comprehensive Documentation Fix Plan

**Date:** 2026-02-24
**Inputs:** `docs-accuracy-audit.md` (reference-vs-published), `website-docs-vs-codebase-audit.md` (CLI source-vs-published), updated `eve-quickstart` repo, `sentinel-mgr` migration pattern
**Goal:** Fix all known documentation errors, add missing content, and bring published docs in line with source of truth

---

## Batch 0: New Content — Database Migrations (Eve-native)

The current `guides/services-and-databases.md` uses a **Flyway example** for migrations. Eve has its own first-class migration tool (`public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest`) with a working reference implementation in `sentinel-mgr`. This should be the primary documented approach.

### 0.1 Add "Database Migrations" section to `guides/services-and-databases.md`

**After** the existing Job role section (~line 213), add a dedicated subsection covering:

1. **Eve Migrate tool overview** — purpose-built, ships as a public ECR image
2. **Manifest wiring** — service with `role: job`, `x-eve.files` mount, `${managed.db.url}` interpolation:
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
3. **Pipeline integration** — migrate step runs after deploy, before smoke tests:
   ```yaml
   pipelines:
     deploy:
       steps:
         - name: build
           action: { type: build }
         - name: release
           depends_on: [build]
           action: { type: release }
         - name: deploy
           depends_on: [release]
           action: { type: deploy, env_name: staging }
         - name: migrate
           depends_on: [deploy]
           action: { type: job, service: migrate }
         - name: smoke-test
           depends_on: [migrate]
           action: { type: run, service: api, command: "npm test" }
   ```
4. **Migration file conventions:**
   - Location: `db/migrations/`
   - Naming: `YYYYMMDDHHmmss_description.sql` (14-digit timestamp + snake_case)
   - Regex enforced: `/^(\d{14})_([a-z0-9_]+)\.sql$/`
   - One file = one logical migration (can contain multiple SQL statements)
5. **How it works:**
   - Creates `schema_migrations` tracking table (name, checksum, applied_at)
   - SHA256 checksum prevents accidental modification of applied migrations
   - Each migration runs in its own transaction (ROLLBACK on failure)
   - Auto-creates `pgcrypto` and `uuid-ossp` extensions
   - Auto-baseline: if no migrations tracked and SQL fails with "already exists", records as applied
6. **Local development:**
   ```bash
   # docker-compose.yml
   migrate:
     image: public.ecr.aws/w7c4v0w3/eve-horizon/migrate:latest
     environment:
       DATABASE_URL: postgres://app:app@db:5432/myapp
     volumes:
       - ./db/migrations:/migrations:ro
     depends_on:
       db: { condition: service_healthy }
   ```
   ```bash
   docker compose run --rm migrate        # Apply migrations
   docker compose down -v && docker compose up -d db && docker compose run --rm migrate  # Reset
   ```
7. **Replace the Flyway example** (lines 198-213) with the Eve Migrate example. Keep Flyway as a brief "BYO migration tool" alternative note.

### 0.2 Update `reference/manifest-schema.md` — document `files` mount for migrations

Add the `x-eve.files` field documentation (source/target mount for job containers).

---

## Batch 1: Critical Fixes

### 1.1 Fix quickstart pipeline claim (C1)

**File:** `get-started/quickstart.md:198`

**Current:** "Because the sandbox environment has a pipeline configured in the manifest, it automatically triggers the full build → release → deploy flow."

**Reality:** The `deploy-sandbox` pipeline is defined in the manifest but NOT linked to the sandbox environment via a `pipeline:` field. `eve env deploy sandbox` runs a direct deploy by default; the pipeline must be run explicitly with `eve pipeline run deploy-sandbox`.

**Fix:** Rewrite line 198 to:
> `eve env deploy` builds, releases, and deploys your code. It resolves the Git ref, creates a build, packages a release, and deploys it to the target environment.

Also update the manifest example to match the **current** eve-quickstart manifest, which now includes:
- `ci-cd-main` pipeline with GitHub push trigger
- `remediation` pipeline with system trigger
- `deploy-sandbox` pipeline (manual)
- `log-audit` workflow with cron trigger

### 1.2 Add workspace mode "not implemented" caveat (C2)

**File:** `reference/job-api.md:267-271`

**Fix:** Add admonition:
```
:::warning Not Yet Implemented
Workspace reuse is not yet implemented. Today every attempt gets a fresh workspace.
The `mode` and `key` fields are reserved for future use.
:::
```

### 1.3 Fix `.agent/` → `.agents/` typo (C3)

**File:** `reference/harnesses-and-workers.md:147-148, 342-344, 353`

**Fix:** Replace all instances of `.agent/` with `.agents/` (plural). Three occurrences confirmed.

### 1.4 Fix `connection_url` → `url` (C4)

**File:** `reference/manifest-schema.md:602`

**Fix:** Change `${managed.db.connection_url}` to `${managed.db.url}`.

### 1.5 Verify and fix event emit flags (C5)

**File:** `reference/cli-appendix.md:1310-1330`

**Current:** Uses `--branch <name>` (no prefix), missing `--ref-sha`, `--ref-branch`, `--actor-type`, `--actor-id`, `--dedupe-key`.

**Fix:** Update flag names to match source (`--ref-sha`, `--ref-branch`) and add the three missing flags.

### 1.6 Fix openapi.md legacy command names (from codebase audit)

**File:** `reference/openapi.md:52, 54, 206, 379-382, 391-394`

**Fixes:**
- Line 52: `eve login` → `eve auth login`
- Lines 54, 206: "service principal" → describe under `eve auth` namespace (`eve auth create-service-account`, etc.)
- Lines 379-382: `eve service-principal create` → `eve auth create-service-account`, `eve service-principal mint-token` → `eve auth mint`
- Lines 391-394: Verify `eve api health` / `eve api version` against actual CLI

---

## Batch 2: High-Impact Content Gaps

### 2.1 Add pipeline trigger documentation (H1)

**Files:** `reference/manifest-schema.md`, `guides/manifest-authoring.md`

**Add:** Pipeline and workflow `trigger` blocks — source ref `pipelines-workflows.md:227-291` covers:
- GitHub push triggers (branch patterns)
- GitHub PR triggers
- Slack triggers
- System triggers (job.failed, pipeline.failed)
- Cron triggers
- Manual triggers

Use the **updated eve-quickstart manifest** as a working example (it now has `ci-cd-main` with GitHub push trigger, `remediation` with system trigger, and `log-audit` workflow with cron trigger).

### 2.2 Add missing pipeline action types (H2)

**File:** `reference/manifest-schema.md:334-341`

**Add:** `notify`, `env-ensure`, `env-delete` action types (critical for PR preview environments).

### 2.3 Add environment `type`/`kind`/`labels` fields (H3)

**Files:** `reference/manifest-schema.md:238-245`, `guides/environments.md:29-35`

**Add:** `type` (persistent/temporary), `kind` (standard/preview), `labels` (metadata for PR envs).

### 2.4 Add auth access-request and service account commands (H4)

**File:** `reference/cli-appendix.md`

**Add:** `eve auth request-access`, `eve auth create-service-account`, `eve auth list-service-accounts`, `eve auth revoke-service-account`.

### 2.5 Add admin command subsystem docs (H5)

**File:** `reference/cli-appendix.md`

**Add:** `eve admin access-requests list/approve/reject`, `eve admin balance`, `eve admin usage`, `eve admin pricing`, `eve admin receipts`, `eve admin models`.

### 2.6 Add env lifecycle commands (H6)

**Files:** `reference/cli-appendix.md`, `operations/deployment.md`, `operations/troubleshooting.md`

**Add:** `eve env suspend`, `eve env resume`, `eve env health`, `eve env recover`, `eve env rollback`, `eve env reset`.

### 2.7 Fix job submit flags (H7)

**File:** `reference/cli-appendix.md:1773-1774`

**Add:** `--status succeeded|failed` and `--result-json '{}'` flags.

### 2.8 Add ingress URL pattern (H13)

**Files:** `operations/deployment.md`, `guides/environments.md`

**Add:** `{service}.{orgSlug}-{projectSlug}-{env}.{domain}` with domain resolution order explanation.

### 2.9 Fix secret scope diagram direction (H14)

**File:** `guides/secrets-and-auth.md:16-21`

**Current:** Mermaid flows System → Org → User → Project → Worker (implies cascade down).

**Fix:** Reverse direction or add annotations to make clear that resolution priority is Project > User > Org > System (most specific wins). The text at line 23 is correct — the diagram should match.

### 2.10 Remove `single` dispatch mode (H10)

**File:** `guides/chat.md`

**Fix:** Remove `single` from any dispatch mode lists. Only three modes exist: `fanout`, `council`, `relay`.

### 2.11 Fix thread follow transport (H9)

**File:** `guides/chat.md:293-296`

**Current:** "polls every ~3 seconds using `?since=`"
**Source:** "GET /threads/{id}/follow — stream thread messages (SSE)"

**Fix:** Verify against actual implementation. If SSE, update to reflect streaming. If polling, update source ref.

---

## Batch 3: Reference Completeness

### 3.1 Reconcile worker types (H8)

**File:** `reference/harnesses-and-workers.md:98-106`

**Current published:** `base`, `python`, `rust`, `java`, `kotlin`, `full`
**Source (harnesses.md):** `base`, `python`, `rust`, `node`

**Fix:** Verify against actual platform. Add `node` if real. Mark `java`, `kotlin`, `full` if they exist or remove them.

### 3.2 Reconcile AgentPacks format (H11)

**File:** `guides/skills.md:136-145` vs `agent-integration/skills-system.md:131-133`

**Fix:** Show both `ref`-based and `packs`-based formats with explanation of their relationship.

### 3.3 Update architecture diagrams (H12)

**Files:** `get-started/what-is-eve-horizon.md:92-141`, `guides/local-development.md:96-110`

**Current:** Only shows API, Orchestrator, Worker, Postgres.
**Source:** 6 services: API, Orchestrator, Worker, Gateway, Agent Runtime, SSO.

**Fix:** Update diagrams to include all 6 services.

### 3.4 Add warm pods / Agent Runtime documentation (H15)

**Files:** `guides/agents-and-teams.md`, `agent-integration/orchestration.md`

**Add:** Pre-provisioned org-scoped containers for low-latency chat, `eve agents runtime-status`, `EVE_AGENT_RUNTIME_EXECUTION_MODE` (inline vs runner).

### 3.5 Fix build diagnose log count (H16)

**File:** `reference/builds-and-releases.md:340, 358`

**Fix:** Reconcile "last 50 entries" vs "last 30 lines" — use whichever is correct consistently.

### 3.6 Add missing job commands (H17)

**File:** `reference/job-api.md`

**Add:** `eve job batch`, `eve job batch-validate`, `eve job diagnose`, `eve job watch`, `eve job runner-logs`.

### 3.7 Add harness credential keys (H18)

**Files:** `guides/secrets-and-auth.md`, `operations/security.md`

**Add table:**
| Harness | Required Secret |
|---------|----------------|
| mclaude / claude / zai | `ANTHROPIC_API_KEY` |
| code / coder | `OPENAI_API_KEY` + `CODEX_AUTH_JSON_B64` |
| gemini | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |
| zai | `Z_AI_API_KEY` |

Reference: `eve-quickstart/secrets.env.example` now documents all of these.

---

## Batch 4: Missing CLI Commands & Flags

### 4.1 Add missing top-level command groups

**Files:** `reference/cli-commands.md`, `reference/cli-appendix.md`

From codebase audit:
- **`eve providers`** — `list`, `show`, `models`
- **`eve models`** — `list`
- **`eve teams`** — `list`

### 4.2 Add missing subcommands

**File:** `reference/cli-appendix.md`

| Command Group | Missing Subcommands |
|---------------|---------------------|
| `eve access` | `roles`, `bind`, `unbind`, `bindings` |
| `eve admin` | `pricing`, `receipts`, `balance`, `usage`, `access-requests` |
| `eve auth` | `request-access`, `create-service-account`, `list-service-accounts`, `revoke-service-account` |
| `eve db` | `new`, `status`, `rotate-credentials`, `scale`, `destroy`, `reset`, `wipe` |
| `eve env` | `suspend`, `resume`, `logs` |
| `eve job` | `attach`, `attachments`, `attachment`, `batch`, `batch-validate`, `diagnose`, `watch`, `runner-logs` |
| `eve org` | `spend` |
| `eve project` | `spend`, `bootstrap` |

### 4.3 Add missing command flags

**File:** `reference/cli-appendix.md`

| Command | Missing Flags |
|---------|--------------|
| `eve org update` | `--default-agent`, `--billing-config` |
| `eve job create` | `--resource-refs`, `--with-apis`, `--max-tokens`, `--max-cost` |
| `eve job submit` | `--status`, `--result-json` |
| `eve fs sync init` | `--include`, `--exclude`, `--remote-path`, `--device-name` |
| `eve env deploy` | `--watch`, `--timeout`, `--skip-preflight`, `--image-tag`, `--release-tag` |
| `eve build logs` | `--follow` |

### 4.4 Add missing database commands with `--url` direct connection mode

**File:** `operations/database.md`

**Add:** All db commands accept `--url <postgres-url>` for direct connection (bypassing API). Also add `db reset` (drop+recreate), `db wipe` (reset without migrations), `rls init --with-groups`.

### 4.5 Add `eve env logs` command

**Files:** `operations/deployment.md`, `operations/troubleshooting.md`

**Add:** `eve env logs` with flags: `--since`, `--tail`, `--grep`, `--pod`, `--container`, `--previous`, `--all-pods`.

---

## Batch 5: Manifest Schema Alignment (from codebase audit)

### 5.1 Reconcile `x-eve.defaults` keys

**File:** `reference/manifest-schema.md:400-428`

**Current published:** `harness`, `harness_profile`, `harness_options`, `hints`
**Code schema (ManifestDefaultsSchema):** `harness_preference`, `git`, `workspace`
**Eve-quickstart manifest:** Uses `hints.harness` under `x-eve.defaults`

**Fix:** Align documented keys with the actual schema. Add deprecation notes for any legacy keys.

### 5.2 Add `${ORG_SLUG}` interpolation variable (M1)

**Files:** `reference/manifest-schema.md:579-584`, `guides/manifest-authoring.md:270-276`

### 5.3 Add deploy action `env_name` parameter (M2)

**File:** `reference/manifest-schema.md:334-341`

### 5.4 Add workflow `hints` block documentation (M3)

**File:** `reference/manifest-schema.md:348-363`

### 5.5 Add pack overlay `_remove` syntax (M4)

**Source:** `manifest.md:579-591` documents deep merge and `_remove: true` for pack-provided agents.

---

## Batch 6: Medium-Severity Content Fixes

### 6.1 Fix event sources (M5)

**File:** `get-started/core-concepts.md:219-224`

**Add:** `cron`, `app`, `chat` sources.

### 6.2 Fix "six phases" count (M6)

**File:** `get-started/core-concepts.md:31`

**Fix:** Change "six phases" to "six phases (plus cancelled)" or "seven states".

### 6.3 Fix `eve providers` command name (M9)

**File:** `operations/observability.md:241-252`

**Fix:** Verify `eve providers models` vs `eve providers discover` — use correct name.

### 6.4 Add missing local dev commands (M10)

**File:** `guides/local-development.md:61-71`

**Add:** `eve local reset`, `eve local logs`.

### 6.5 Add missing k3d local URLs (M11)

**File:** `guides/local-development.md:110`

**Add:** `auth.eve.lvh.me`, `mail.eve.lvh.me`, `sso.eve.lvh.me`.

### 6.6 Fix doc event payloads (M23)

**File:** `reference/events-and-webhooks.md:101-106`

**Add:** `mutation_id`, `request_id`, `metadata` on doc events; `resources[]` array on hydration events.

### 6.7 Add Slack triggers to events doc (M24)

**File:** `reference/events-and-webhooks.md`

### 6.8 Add `--follow` flag to `eve build logs` (M25)

**File:** `reference/builds-and-releases.md:386`

### 6.9 Add credential file search order (M26)

**File:** `reference/harnesses-and-workers.md:319-321`

**Add:** 5-path search order including legacy paths, XDG, and cc-mirror paths.

### 6.10 Add host env files documentation (M27)

**File:** `guides/secrets-and-auth.md`

**Add:** `.env` and `system-secrets.env.local` documentation.

### 6.11 Add identity management API (M28)

**Files:** `guides/secrets-and-auth.md`, `operations/security.md`

---

## Batch 7: Low-Severity Polish

### 7.1 Missing environment variables from CLI overview (L1)

**File:** `reference/cli-commands.md:183-196`

**Add:** `EVE_MANAGED_OLLAMA_URL`, `EVE_DB_URL`, `EVE_ENV_NAME`.

### 7.2 Expand `eve admin` description (L2)

**File:** `reference/cli-commands.md:96`

### 7.3 Add JSON data envelope note (L3)

All list endpoints return `{ "data": [...] }` in JSON mode.

### 7.4 Add `eve ollama target wake` (L4)

**File:** `reference/cli-appendix.md:2187`

### 7.5 Add storage `name` field (L5)

**File:** `reference/manifest-schema.md:186-192`

### 7.6 Add API spec `spec_path` field (L6)

**File:** `reference/manifest-schema.md:162-172`

### 7.7 Add `x-eve.ingress.domain` field (L7)

**File:** `reference/manifest-schema.md:137-151`

### 7.8 Add pack lock file schema (L8)

**Files:** `reference/manifest-schema.md:504`, `guides/manifest-authoring.md:400`

### 7.9 Standardize `image` field descriptions (L9)

**Files:** `reference/manifest-schema.md:95`, `guides/manifest-authoring.md:125`, `guides/services-and-databases.md:26`

### 7.10 Add `command` and `volumes` to services guide summary table (L10)

**File:** `guides/services-and-databases.md:122-131`

### 7.11 Fix PR preview `env_name` template expression (L11)

**File:** `reference/pipelines.md:534-556`

### 7.12 Remove unverified `check_suite`/`release` trigger events (L12)

**File:** `reference/workflows.md:158`

### 7.13 Add thread REST endpoints to job-api formal section (L13)

**File:** `reference/job-api.md`

### 7.14 Standardize `eve env diagnose` signature (L14)

**Files:** `guides/environments.md:316`, `guides/fullstack-app-design.md:345`

### 7.15 Fix `eve auth mint` example project arg (L15)

**File:** `guides/agentic-app-design.md:395`

### 7.16 Add `--github` admin invite method (L16)

**File:** `get-started/quickstart.md:27`

### 7.17 Add `--repo-dir` behavior explanation (L17)

**File:** `get-started/quickstart.md:193-196`

### 7.18 Clarify `eve env create` vs auto-creation (L18)

**File:** `get-started/first-deploy.md:188-200`

### 7.19 Add `--validate-secrets` flag (L19)

**File:** `get-started/first-deploy.md:132-140`

### 7.20 Clarify `eve auth status` vs `eve auth whoami` alias (L20)

**Files:** `guides/secrets-and-auth.md:409`, `operations/troubleshooting.md:18`

### 7.21 Document analytics `24h` window parameter (L21)

**File:** `operations/observability.md:137`

### 7.22 Add `eve local up` namespace annotation behavior (L22)

**Files:** `operations/deployment.md`, `operations/troubleshooting.md`

---

## Batch 8: Quickstart Alignment with Updated eve-quickstart

The eve-quickstart repo has been significantly updated. The published quickstart should reflect the **current** repo state.

### 8.1 Update manifest example in quickstart

**File:** `get-started/quickstart.md:94-131`

The current quickstart manifest is simplified. The actual eve-quickstart manifest now includes:
- `ci-cd-main` pipeline with GitHub push trigger (push to main → tests → build → release → deploy staging)
- `remediation` pipeline (system trigger on job.failed → analyze → create-pr)
- `deploy-sandbox` pipeline (manual: build → release → deploy sandbox)
- `log-audit` workflow (cron hourly)
- `x-eve.defaults` with `hints.harness: mclaude`
- `x-eve.requires.secrets: [GITHUB_TOKEN]`
- `x-eve.agents` configuration pointing to `agents/` directory
- `x-eve.chat` configuration

Decide whether the quickstart should show the full manifest or keep the simplified version. Recommendation: keep simplified for the quickstart, but add a note pointing to the eve-quickstart repo for the full version.

### 8.2 Update quickstart to reference correct deploy behavior

**File:** `get-started/quickstart.md:189-209`

Remove the false claim about automatic pipeline triggering. Show `eve env deploy` as a direct deploy command.

### 8.3 Update secrets.env.example reference

The eve-quickstart now ships `secrets.env.example` showing all harness credential keys. Reference this in the secrets documentation.

---

## Execution Priority

| Priority | Batches | Rationale |
|----------|---------|-----------|
| **P0** | 0 (migrations), 1 (critical fixes) | Factual errors that break user workflows + missing core feature docs |
| **P1** | 2 (high-impact gaps), 8 (quickstart alignment) | Significant omissions and stale quickstart |
| **P2** | 3 (reference completeness), 4 (CLI commands), 5 (manifest schema) | Completeness and accuracy |
| **P3** | 6 (medium fixes), 7 (polish) | Quality and consistency |

---

## Files Touched (Summary)

| File | Batches |
|------|---------|
| `get-started/quickstart.md` | 1.1, 7.16, 7.17, 8.1, 8.2 |
| `get-started/core-concepts.md` | 6.1, 6.2 |
| `get-started/first-deploy.md` | 7.18, 7.19 |
| `get-started/what-is-eve-horizon.md` | 3.3 |
| `guides/services-and-databases.md` | 0.1, 7.9, 7.10 |
| `guides/manifest-authoring.md` | 2.1, 5.2, 5.5, 7.8 |
| `guides/environments.md` | 2.3, 2.8, 7.14 |
| `guides/secrets-and-auth.md` | 2.9, 3.7, 6.10, 6.11, 7.20 |
| `guides/chat.md` | 2.10, 2.11 |
| `guides/skills.md` | 3.2 |
| `guides/agents-and-teams.md` | 3.4 |
| `guides/local-development.md` | 3.3, 6.4, 6.5 |
| `guides/agentic-app-design.md` | 7.15 |
| `guides/fullstack-app-design.md` | 7.14 |
| `reference/manifest-schema.md` | 0.2, 1.4, 2.1, 2.2, 2.3, 5.1-5.5, 7.5-7.8 |
| `reference/cli-commands.md` | 4.1, 7.1, 7.2 |
| `reference/cli-appendix.md` | 1.5, 2.4, 2.5, 2.6, 2.7, 4.1-4.3, 7.4 |
| `reference/job-api.md` | 1.2, 3.6, 7.13 |
| `reference/harnesses-and-workers.md` | 1.3, 3.1, 6.9 |
| `reference/openapi.md` | 1.6 |
| `reference/events-and-webhooks.md` | 6.6, 6.7 |
| `reference/builds-and-releases.md` | 3.5, 6.8 |
| `reference/pipelines.md` | 7.11 |
| `reference/workflows.md` | 7.12 |
| `operations/deployment.md` | 2.6, 2.8, 4.5, 7.22 |
| `operations/database.md` | 4.4 |
| `operations/observability.md` | 6.3, 7.21 |
| `operations/security.md` | 3.7, 6.11 |
| `operations/troubleshooting.md` | 2.6, 4.5, 7.20, 7.22 |
| `agent-integration/skills-system.md` | 3.2 |
| `agent-integration/orchestration.md` | 3.4 |

**Total: 31 files across 8 batches, ~100 discrete fixes**
