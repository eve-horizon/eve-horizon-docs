# Documentation Accuracy Audit

**Date:** 2026-02-24
**Source of truth:** `.agents/skills/eve-read-eve-docs/references/` (18 distilled docs) + `eve-quickstart` repo
**Scope:** All 38 published docs in `website/docs/` compared against source references

---

## Summary

| Severity | Count |
|----------|-------|
| Critical (factual errors that break user workflows) | 6 |
| High (significant omissions or misleading info) | 18 |
| Medium (missing features/commands, inconsistencies) | 28 |
| Low (minor omissions, style improvements) | 22 |
| **Total** | **74** |

---

## Critical Errors

### C1. Quickstart claims sandbox has pipeline-linked deploy -- it does not

- **File:** `get-started/quickstart.md:198`
- **Claim:** "Because the sandbox environment has a pipeline configured in the manifest, it automatically triggers the full build -> release -> deploy flow."
- **Reality:** The `eve-quickstart/.eve/manifest.yaml` sandbox environment has `type: persistent` with **no** `pipeline` field. The `deploy-sandbox` pipeline exists but is NOT linked to the environment. `eve env deploy sandbox` performs a direct deploy, not a pipeline-triggered flow.
- **Fix:** Either update the quickstart manifest to link the pipeline (`pipeline: deploy-sandbox`), or rewrite the explanation to describe direct deploy behavior.

### C2. Workspace mode documented as functional -- source says NOT IMPLEMENTED

- **File:** `reference/job-api.md:267-271`
- **Claim:** Documents `workspace.mode: job | session | isolated` and `workspace.key` as working configuration.
- **Reality:** Source reference (`jobs.md:414-417`) explicitly states: "Not Yet Implemented: Workspace reuse. Today every attempt gets a fresh workspace."
- **Fix:** Add a clear "not yet implemented" caveat, or remove the section until the feature ships.

### C3. `.agent/` (singular) vs `.agents/` (plural) in workspace paths

- **File:** `reference/harnesses-and-workers.md:147-148`
- **Claim:** Shows `.agent/skills/` and `.agent/harnesses/<harness>/` (singular)
- **Reality:** Every other reference across all source and published docs uses `.agents/` (plural). The actual `eve-quickstart` repo uses `.agents/`.
- **Fix:** Change to `.agents/` (plural).

### C4. Managed DB placeholder: `connection_url` vs `url`

- **File:** `reference/manifest-schema.md:602`
- **Claim:** Shows `${managed.db.connection_url}`
- **Reality:** Every other document (source and published) uses `${managed.db.url}`. The `manifest-authoring.md:471` and `services-and-databases.md:273` both correctly use `url`.
- **Fix:** Change `connection_url` to `url` in manifest-schema.md.

### C5. `eve event emit` flag names differ from source

- **File:** `reference/cli-appendix.md:1316-1322`
- **Claim:** Uses `--sha <sha>`, `--branch <branch>` (no prefix)
- **Reality:** Source reference uses `--ref-sha <sha>`, `--ref-branch main`. Three additional flags missing: `--actor-type`, `--actor-id`, `--dedupe-key`.
- **Fix:** Verify actual CLI flags and update accordingly.

### C6. Profile storage filename wrong in source references

- **File:** Source refs `cli.md:69` and `cli-auth.md:37`
- **Claim:** "Profiles persist to `.eve/profiles.json`"
- **Reality:** Actual file is `.eve/profile.yaml` (confirmed in `eve-quickstart` repo). Published docs correctly say `.eve/profile.yaml`.
- **Fix:** Update source reference files (not published docs -- they're correct here).

---

## High-Severity Findings

### H1. Missing pipeline trigger documentation (entire feature undocumented)

- **Files:** `reference/manifest-schema.md`, `guides/manifest-authoring.md`
- **Missing:** Pipeline and workflow `trigger` blocks -- GitHub push/PR triggers, branch patterns, cron, Slack, manual triggers. Source ref `pipelines-workflows.md:227-291` has extensive docs.
- **Impact:** Event-driven CI/CD (the core automation story) has no published documentation.

### H2. Missing pipeline action types: `notify`, `env-ensure`, `env-delete`

- **File:** `reference/manifest-schema.md:334-341`
- **Published:** Lists `build`, `release`, `deploy`, `run`, `job`, `create-pr`
- **Missing:** `notify`, `env-ensure`, `env-delete` -- critical for PR preview environments.

### H3. Missing environment fields: `type`, `kind`, `labels`

- **Files:** `reference/manifest-schema.md:238-245`, `guides/environments.md:29-35`
- **Missing:** `type` (persistent/temporary), `kind` (standard/preview), `labels` (metadata for PR envs).
- **Impact:** Users cannot discover PR preview environment patterns.

### H4. Missing `eve auth request-access` and service account commands

- **File:** `reference/cli-appendix.md:517`
- **Missing commands:** `request-access`, `create-service-account`, `list-service-accounts`, `revoke-service-account`
- **Impact:** Self-service onboarding and machine identity management undocumented.

### H5. Missing `eve admin` billing/usage/access-request commands

- **File:** `reference/cli-appendix.md`
- **Missing:** `access-requests list/approve/reject`, `balance`, `usage`, `pricing`, `receipts`, `models`
- **Impact:** Entire admin subsystem beyond `invite` and `ingress-aliases` is undocumented.

### H6. Missing `eve env suspend/resume/health/recover/rollback/reset`

- **Files:** `reference/cli-appendix.md`, `operations/deployment.md`, `operations/troubleshooting.md`
- **Missing:** Six environment lifecycle commands documented in source but absent from published docs.

### H7. `eve job submit` missing critical flags

- **File:** `reference/cli-appendix.md:1773-1774`
- **Missing:** `--status succeeded|failed` and `--result-json '{}'`
- **Impact:** Agents cannot properly report job outcomes using published docs.

### H8. Worker type lists don't match between source and published

- **File:** `reference/harnesses-and-workers.md:98-106`
- **Published:** `base`, `python`, `rust`, `java`, `kotlin`, `full`
- **Source:** `base`, `python`, `rust`, `node`
- **Missing from published:** `node`. Missing from source: `java`, `kotlin`, `full`.
- **Fix:** Verify against actual platform and reconcile.

### H9. `thread follow` transport contradiction: SSE vs polling

- **Published (`guides/chat.md:296`):** "polls every ~3 seconds using `?since=`"
- **Source (`agents-teams.md:264`):** "GET /threads/{id}/follow -- stream thread messages (SSE)"
- **Fix:** Verify against implementation and standardize.

### H10. Non-existent `single` dispatch mode listed

- **File:** `guides/chat.md:187`
- **Claim:** Lists `single` as a dispatch mode alongside `fanout`, `council`, `relay`
- **Reality:** No other source or published doc mentions `single`. Only three modes exist.
- **Fix:** Remove `single` from the dispatch mode list.

### H11. AgentPacks YAML format inconsistency across published docs

- **File:** `guides/skills.md:136-145` shows `ref`-based format; `agent-integration/skills-system.md:131-133` shows `packs`-based format
- **Fix:** Show both formats and explain their relationship.

### H12. Architecture diagrams omit Agent Runtime and SSO services

- **Files:** `get-started/what-is-eve-horizon.md:92-141`, `guides/local-development.md:96-110`
- **Source says 6 services:** API, Orchestrator, Worker, Gateway, Agent Runtime, SSO
- **Published shows:** Only API, Orchestrator, Worker, Postgres.

### H13. Missing ingress URL pattern

- **Published:** None of the docs show the URL construction pattern
- **Source:** `{service}.{orgSlug}-{projectSlug}-{env}.{domain}` with domain resolution order
- **Impact:** Users cannot predict their service URLs after deployment.

### H14. Secret scope Mermaid diagram flows in wrong direction

- **File:** `guides/secrets-and-auth.md:16-21`
- **Diagram:** Flows System -> Organization -> User -> Project -> Worker (implies cascade)
- **Reality:** Resolution priority is Project > User > Org > System (most specific wins)
- **Fix:** Reverse diagram direction or restructure to show override priority.

### H15. Warm pods / Agent Runtime feature completely undocumented

- **Files:** `guides/agents-and-teams.md`, `agent-integration/orchestration.md`
- **Missing:** Pre-provisioned org-scoped containers for low-latency chat, `eve agents runtime-status`, `EVE_AGENT_RUNTIME_EXECUTION_MODE` (inline vs runner).

### H16. Build diagnose log count: 50 vs 30

- **File:** `reference/builds-and-releases.md:340`
- **Claim:** "Recent logs (last 50 entries)"
- **Source says:** "last 30 lines" -- and the same published file says "last 30 lines" on line 358, contradicting itself.

### H17. Missing `eve job` commands: batch, diagnose, watch, runner-logs

- **File:** `reference/job-api.md`
- **Missing:** `eve job batch`, `eve job batch-validate`, `eve job diagnose`, `eve job watch`, `eve job runner-logs`

### H18. Missing harness credential key names

- **Files:** `guides/secrets-and-auth.md`, `operations/security.md`
- **Missing:** `ANTHROPIC_API_KEY` (Claude/mclaude/zai), `OPENAI_API_KEY`/`CODEX_AUTH_JSON_B64` (Codex/Code), `GEMINI_API_KEY`/`GOOGLE_API_KEY` (Gemini), `Z_AI_API_KEY` (Z.ai)
- **Impact:** Users configuring agent jobs need to know which secret keys each harness expects.

---

## Medium-Severity Findings

### M1. Missing `${ORG_SLUG}` interpolation variable

- **Files:** `reference/manifest-schema.md:579-584`, `guides/manifest-authoring.md:270-276`
- **Published table lists:** `${ENV_NAME}`, `${PROJECT_ID}`, `${ORG_ID}`, `${COMPONENT_NAME}`
- **Missing:** `${ORG_SLUG}` (important for ingress URL construction)

### M2. Missing deploy action `env_name` parameter

- **File:** `reference/manifest-schema.md:334-341`
- **Missing:** `action: { type: deploy, env_name: staging }` -- without this users can't target environments from pipeline steps.

### M3. Missing workflow `hints` block documentation

- **Files:** `reference/manifest-schema.md:348-363`
- **Missing:** `hints.gates` for remediation gates, timeouts, harness preferences.

### M4. Missing pack overlay customization (`_remove` syntax)

- **Published docs:** No mention of overlay customization
- **Source:** `manifest.md:579-591` documents deep merge and `_remove: true` for pack-provided agents.

### M5. Event sources incomplete in core-concepts

- **File:** `get-started/core-concepts.md:219-224`
- **Published:** GitHub, Slack, System, Manual, Runner
- **Missing:** `cron`, `app`, `chat`

### M6. "Six phases" count incorrect

- **File:** `get-started/core-concepts.md:31`
- **Says "six phases"** but the diagram shows 7 states (including cancelled).

### M7. Missing `eve db` commands: reset, wipe, rls init --with-groups

- **File:** `operations/database.md`
- **Missing:** `db reset` (drop+recreate), `db wipe` (reset without migrations), `rls init --with-groups` (scaffold group-aware RLS).

### M8. Missing `--url` direct connection mode for db commands

- **File:** `operations/database.md`
- **Missing:** All db commands accept `--url <postgres-url>` for direct connection (bypassing API).

### M9. `eve providers models` possibly incorrect command name

- **File:** `operations/observability.md:241-252`
- **Published:** `eve providers models <name>`
- **Source:** `eve providers discover <provider>`
- **Fix:** Verify which is correct.

### M10. Missing `eve local reset` and `eve local logs` commands

- **File:** `guides/local-development.md:61-71`

### M11. k3d local URLs incomplete

- **File:** `guides/local-development.md:110`
- **Published:** Only `api.eve.lvh.me`
- **Missing:** `auth.eve.lvh.me`, `mail.eve.lvh.me`, `sso.eve.lvh.me`

### M12. Missing `eve teams list` command (entire group absent)

- **Files:** `reference/cli-commands.md`, `reference/cli-appendix.md`

### M13. Missing `eve models list` command

- **Files:** `reference/cli-commands.md`, `reference/cli-appendix.md`

### M14. Missing `eve providers list/discover` commands

- **Files:** `reference/cli-commands.md`, `reference/cli-appendix.md`

### M15. Missing `eve org update` flags: `--default-agent`, `--billing-config`

- **File:** `reference/cli-appendix.md:2342`

### M16. Missing `eve org spend` and `eve project spend` commands

- **File:** `reference/cli-appendix.md`

### M17. Missing `eve project bootstrap` command

- **File:** `reference/cli-appendix.md`
- **Source:** `cli-org-project.md:77-79` -- convenience command for project + environments in one call.

### M18. Missing `eve job create` flags: `--resource-refs`, `--with-apis`, `--max-tokens`, `--max-cost`

- **File:** `reference/cli-appendix.md`

### M19. Missing `eve fs sync init` flags: `--include`, `--exclude`, `--remote-path`, `--device-name`

- **File:** `reference/cli-appendix.md:1352`

### M20. Missing `eve env deploy` flags: `--watch`, `--timeout`, `--skip-preflight`, `--image-tag`, `--release-tag`

- **Files:** `reference/cli-appendix.md`, `operations/deployment.md:100-103`

### M21. Missing `eve env logs` command

- **Files:** `operations/deployment.md`, `operations/troubleshooting.md`
- **Source:** `cli-deploy-debug.md:41-44` -- with `--since`, `--tail`, `--grep`, `--pod`, `--container`, `--previous`, `--all-pods`.

### M22. Missing gateway and agent-runtime services from deployment architecture

- **File:** `operations/deployment.md:28-36`
- **Claims "three core deployments"** but platform has 6+ services.

### M23. Doc event payloads missing fields

- **File:** `reference/events-and-webhooks.md:101-106`
- **Missing:** `mutation_id`, `request_id`, `metadata` on doc events; `resources[]` array on hydration events.

### M24. Slack triggers missing from events doc

- **File:** `reference/events-and-webhooks.md`
- **Note:** Pipelines doc covers Slack triggers, events source ref covers them, but events doc omits them.

### M25. Missing `--follow` flag on `eve build logs`

- **File:** `reference/builds-and-releases.md:386`

### M26. Credential file search order missing from harness docs

- **File:** `reference/harnesses-and-workers.md:319-321`
- **Published:** Only mentions `~/.claude/.credentials.json`
- **Source:** 5-path search order including legacy paths, XDG, and cc-mirror paths.

### M27. Missing host env files documentation (`.env`, `system-secrets.env.local`)

- **File:** `guides/secrets-and-auth.md`

### M28. Missing identity management API (POST /auth/identities)

- **Files:** `guides/secrets-and-auth.md`, `operations/security.md`

---

## Low-Severity Findings

### L1. Missing environment variables from CLI overview

- **File:** `reference/cli-commands.md:183-196`
- **Missing:** `EVE_MANAGED_OLLAMA_URL`, `EVE_DB_URL`, `EVE_ENV_NAME`

### L2. `eve admin` description understates scope

- **File:** `reference/cli-commands.md:96`
- **Says:** "invite users, manage ingress aliases"
- **Actually covers:** access-requests, billing, usage, pricing, receipts, models

### L3. JSON data envelope note missing

- **Source:** "All list endpoints return `{ "data": [...] }` in JSON mode" -- not mentioned in published docs.

### L4. `eve ollama target wake` missing from appendix

- **File:** `reference/cli-appendix.md:2187`

### L5. Missing storage `name` field in manifest schema

- **File:** `reference/manifest-schema.md:186-192`

### L6. Missing API spec `spec_path` field

- **File:** `reference/manifest-schema.md:162-172`

### L7. Missing `x-eve.ingress.domain` field

- **File:** `reference/manifest-schema.md:137-151`

### L8. Missing pack lock file schema documentation

- **Files:** `reference/manifest-schema.md:504`, `guides/manifest-authoring.md:400`

### L9. Inconsistent `image` field descriptions across published docs

- **Files:** `reference/manifest-schema.md:95` vs `guides/manifest-authoring.md:125` vs `guides/services-and-databases.md:26`

### L10. Missing `command` and `volumes` from services guide summary table

- **File:** `guides/services-and-databases.md:122-131`

### L11. PR preview `env_name` template expression differs from source

- **File:** `reference/pipelines.md:534-556`
- **Published:** `pr-${{ github.pull_request.number }}`
- **Source:** `${{ env.pr_${{ github.pull_request.number }} }}` (nested syntax)

### L12. Unverified `check_suite`/`release` GitHub trigger events

- **File:** `reference/workflows.md:158`
- **Source reference only lists:** `push` and `pull_request`

### L13. Thread REST endpoints missing from job-api formal section

- **File:** `reference/job-api.md` -- thread coordination described narratively but `GET/POST /threads/{id}/messages` not in API table.

### L14. `eve env diagnose` signature varies across docs

- **Files:** `guides/environments.md:316` (no project arg), `guides/fullstack-app-design.md:345` (with project arg)

### L15. `eve auth mint` example uses `--project` instead of `--org`

- **File:** `guides/agentic-app-design.md:395`

### L16. Missing `--github` as alternative admin invite method in quickstart

- **File:** `get-started/quickstart.md:27`

### L17. Missing `--repo-dir` behavior explanation

- **File:** `get-started/quickstart.md:193-196`

### L18. Explicit `eve env create` may be unnecessary (auto-created from manifest)

- **File:** `get-started/first-deploy.md:188-200`

### L19. Missing `--validate-secrets` flag mention

- **File:** `get-started/first-deploy.md:132-140`

### L20. `eve auth status` vs `eve auth whoami` alias not clarified

- **Files:** `guides/secrets-and-auth.md:409`, `operations/troubleshooting.md:18`

### L21. Analytics window parameter: `24h` valid but undocumented

- **File:** `operations/observability.md:137`

### L22. Missing `eve local up` namespace annotation behavior

- **Files:** `operations/deployment.md`, `operations/troubleshooting.md`
- **Source:** CLI writes `eve-managed-by=cli` annotation and refuses to overwrite stacks managed by other tooling.

---

## Recommended Fix Batches

### Batch 1: Critical Fixes (do first)

1. Fix quickstart pipeline claim (C1)
2. Add workspace mode "not implemented" caveat (C2)
3. Fix `.agent/` -> `.agents/` typo (C3)
4. Fix `connection_url` -> `url` (C4)
5. Verify and fix event emit flags (C5)
6. Fix source reference profile filename (C6)

### Batch 2: High-Impact Content Gaps

7. Add pipeline trigger documentation (H1)
8. Add missing pipeline action types (H2)
9. Add environment `type`/`kind`/`labels` fields (H3)
10. Add auth request-access and service account commands (H4)
11. Add admin command subsystem docs (H5)
12. Add env lifecycle commands (H6)
13. Fix job submit flags (H7)
14. Add ingress URL pattern (H13)
15. Fix secret scope diagram direction (H14)

### Batch 3: Reference Completeness

16. Reconcile worker types (H8)
17. Resolve thread follow transport (H9)
18. Remove `single` dispatch mode (H10)
19. Reconcile AgentPacks format (H11)
20. Update architecture diagrams (H12)
21. Add warm pods documentation (H15)
22. Fix build diagnose log count (H16)
23. Add missing job commands (H17)
24. Add harness credential keys (H18)

### Batch 4: CLI Appendix Sweep

25. All missing commands (M12-M17)
26. All missing flags (M15, M18-M20)
27. Missing environment variables (L1)
28. Missing database commands (M7-M8)

### Batch 5: Polish Pass

29. All medium event/webhook fixes (M23-M25)
30. All low-severity items (L1-L22)
