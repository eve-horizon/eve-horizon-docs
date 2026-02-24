# Automated Docs Sync Plan

> Keep eve-horizon-docs continuously synchronized with the eve-horizon platform
> source, running as an Eve cron workflow that fetches, distills, commits, and
> redeploys automatically.

## Problem

The docs site content is authored by humans and agents against snapshot knowledge
of the eve-horizon platform. When the platform evolves (new CLI commands, manifest
schema changes, pipeline features, API additions), the published docs drift. Today
the only sync mechanism is the skillpacks repo's `sync-horizon` skill, which
updates agent-facing reference docs — not the public docs site.

## Goals

1. **Automated sync** — a cron-triggered Eve workflow detects platform changes and
   updates docs content without human intervention.
2. **Zero-clone** — use the GitHub API (`gh api`) to read source changes remotely.
   No git clone, no disk usage, no shallow-depth concerns.
3. **Sync state tracking** — persistent `.sync-state.json` tracks the last synced
   commit, avoiding redundant work.
4. **Auto-redeploy** — the existing `deploy` pipeline (push-to-main trigger)
   handles deployment after sync commits land on main.
5. **GitHub token auth** — `GITHUB_TOKEN` secret enables API access to the private
   `incept5/eve-horizon` repo.

## Eve Job Execution Environment

When Eve runs a workflow job:

```
/opt/eve/workspaces/
  {attemptId}/                    # unique per attempt, writable
    repo/                         # ← cwd: fresh clone of evdocs (the project repo)
      .eve/manifest.yaml
      .sync-state.json
      .sync-map.json
      website/docs/...
      private-skills/sync-docs/
```

Key facts:
- **cwd** = `{attemptId}/repo` (fresh clone of this project per attempt)
- **Git controls** (`commit: auto`, `push: on_success`) operate on the project
  repo (`repo/`) — auto-commit after execution, push if changes were made
- **GITHUB_TOKEN** is injected as an env var from Eve secrets
- **No source-repo clone dependency** — this workflow should not assume access to a local checkout of
  `incept5/eve-horizon` (`../../incept5/eve-horizon` is a local-only convention).
  Resolve source location from config/env when available.

### Why no clone?

The skillpacks `sync-horizon` workflow clones eve-horizon to `../eve-horizon` as
a sibling in the workspace. This works but is wasteful — a shallow clone of
eve-horizon is ~100MB and takes time.

Instead, this workflow uses the **GitHub Compare API** via `gh` to read all source
changes remotely. Zero disk usage, faster startup, and the API gives us exactly
what we need: commit list, changed files, patches, and full file contents.

```bash
# Authenticate gh with the injected token
echo "${GITHUB_TOKEN}" | gh auth login --with-token

# Compare two commits (returns commits, files, patches in one call)
gh api repos/incept5/eve-horizon/compare/<last_commit>...main

# Read a specific file at HEAD
gh api repos/incept5/eve-horizon/contents/docs/system/manifest.md \
  --jq '.content' | base64 -d
```

### API Limits

The Compare API has limits that are fine for daily syncs:
- **250 commits** max per compare (daily syncs will see 5-20)
- **300 files** max per compare (we watch ~70 source files)
- **3000 lines** max diff before truncation (workers can fall back to reading
  full file contents via the Contents API for large changes)
- **5000 requests/hour** with authenticated token (we'll use ~10-30 per sync)

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Eve Workflow: sync-docs (cron: 0 9 * * *)               │
│  git: { ref: main, commit: auto, push: on_success }      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. gh auth login with GITHUB_TOKEN                      │
│     └─ no clone — pure API access                        │
│                                                          │
│  2. Read .sync-state.json → last_synced_commit           │
│     └─ gh api repos/.../compare/<last>...main            │
│     └─ returns: commits, changed files, patches          │
│                                                          │
│  3. Cross-reference .sync-map.json                       │
│     └─ filter changed files to watched paths             │
│     └─ map to affected docs pages                        │
│                                                          │
│  4. Dispatch parallel workers                            │
│     └─ each worker: gets patch + full file via API       │
│     └─ updates one docs page in the local workspace      │
│                                                          │
│  5. Update .sync-state.json                              │
│     └─ new commit hash + sync log entry                  │
│                                                          │
│  6. Eve git controls auto-commit + push to main          │
│                                                          │
└───────────────────────┬──────────────────────────────────┘
                        │ push to main detected
                        ▼
┌──────────────────────────────────────────────────────────┐
│  Existing Pipeline: deploy (trigger: push main)          │
│  build → release → deploy                                │
└──────────────────────────────────────────────────────────┘
```

This mirrors the skillpacks `sync-horizon` pattern but replaces `git clone` +
local git commands with GitHub API calls. The Eve git controls (`commit: auto`,
`push: on_success`) handle committing changes to the evdocs project repo and
pushing to main, which triggers the existing deploy pipeline.

## GitHub Token Strategy

The eve-horizon repo (`incept5/eve-horizon`) is private. The sync workflow needs
read access via the GitHub API.

### Fine-Grained Personal Access Token

Create a GitHub fine-grained PAT scoped to:
- **Repository**: `incept5/eve-horizon` (read-only)
- **Permissions**: `contents:read`
- **Expiry**: 1 year (with rotation reminder)

Store as an Eve secret:
```bash
eve secret set GITHUB_TOKEN --value "github_pat_..." --env staging
```

The workflow agent authenticates `gh` with it:
```bash
echo "${GITHUB_TOKEN}" | gh auth login --with-token
```

Then all `gh api` calls are authenticated. No clone URL needed.

## Sync State

### `.sync-state.json` (repo root)

```json
{
  "eve_horizon_repo": "incept5/eve-horizon",
  "last_synced_commit": null,
  "last_synced_at": null,
  "sync_log": []
}
```

After each sync:
```json
{
  "eve_horizon_repo": "incept5/eve-horizon",
  "last_synced_commit": "790a9e1b662efa270a44046c2c3b5271ae2afd52",
  "last_synced_at": "2026-02-24T18:00:00Z",
  "sync_log": [
    {
      "commit": "790a9e1b662efa270a44046c2c3b5271ae2afd52",
      "commit_short": "790a9e1",
      "synced_at": "2026-02-24T18:00:00Z",
      "type": "incremental",
      "commits_synced": 12,
      "docs_updated": ["reference/cli-commands.md", "guides/pipelines.md"],
      "summary": "12-commit sync — new CLI commands for local stack, pipeline retry support"
    }
  ]
}
```

Keep last 20 entries in `sync_log`.

### `.sync-map.json` (repo root)

Maps eve-horizon source paths to docs site pages. This is the core routing table
that determines which docs pages need updating when platform files change.

```json
{
  "docs_root": "website/docs",
  "source_repo": "incept5/eve-horizon",
  "watch_paths": [
    "docs/system/",
    "docs/ideas/agent-native-design.md",
    "docs/ideas/platform-primitives-for-agentic-apps.md",
    "packages/cli/src/commands/",
    "AGENTS.md"
  ],
  "page_mappings": {
    "get-started/core-concepts.md": {
      "sources": ["AGENTS.md", "docs/system/manifest.md"],
      "description": "Platform overview and key abstractions"
    },
    "get-started/what-is-eve-horizon.md": {
      "sources": ["docs/system/system-overview.md", "AGENTS.md"],
      "description": "Platform introduction and value proposition"
    },
    "get-started/install.md": {
      "sources": ["docs/system/cli-tools-and-credentials.md"],
      "description": "CLI installation instructions"
    },
    "get-started/quickstart.md": {
      "sources": ["docs/system/manifest.md", "docs/system/deployment.md"],
      "description": "First project setup walkthrough"
    },
    "get-started/first-deploy.md": {
      "sources": ["docs/system/deployment.md", "docs/system/builds.md"],
      "description": "Deploy to staging guide"
    },
    "guides/manifest-authoring.md": {
      "sources": ["docs/system/manifest.md"],
      "description": "Manifest file authoring guide"
    },
    "guides/services-and-databases.md": {
      "sources": ["docs/system/manifest.md", "docs/system/deployment.md"],
      "description": "Service and database configuration"
    },
    "guides/pipelines.md": {
      "sources": ["docs/system/pipelines.md", "docs/system/workflows.md"],
      "description": "Pipeline and workflow setup"
    },
    "guides/environments.md": {
      "sources": ["docs/system/deployment.md", "docs/system/deploy-polling.md"],
      "description": "Environment management"
    },
    "guides/skills.md": {
      "sources": ["docs/system/skills.md", "docs/system/skillpacks.md", "docs/system/skills-manifest.md"],
      "description": "Skills authoring and management"
    },
    "guides/agents-and-teams.md": {
      "sources": ["docs/system/agents.md", "AGENTS.md"],
      "description": "Agent and team configuration"
    },
    "guides/chat.md": {
      "sources": ["docs/system/chat-routing.md", "docs/system/chat-gateway.md"],
      "description": "Chat routing and gateway"
    },
    "guides/local-development.md": {
      "sources": ["docs/system/cli-debugging.md", "docs/system/k8s-local-stack.md"],
      "description": "Local dev loop"
    },
    "guides/agentic-app-design.md": {
      "sources": ["docs/ideas/agent-native-design.md", "docs/ideas/platform-primitives-for-agentic-apps.md"],
      "description": "Designing agentic applications"
    },
    "guides/fullstack-app-design.md": {
      "sources": ["docs/system/manifest.md", "docs/system/deployment.md", "docs/system/unified-architecture.md"],
      "description": "Full-stack application architecture"
    },
    "guides/secrets-and-auth.md": {
      "sources": ["docs/system/secrets.md", "docs/system/auth.md", "docs/system/identity-providers.md"],
      "description": "Secrets and authentication"
    },
    "reference/cli-commands.md": {
      "sources": ["packages/cli/src/commands/"],
      "description": "CLI command reference"
    },
    "reference/cli-appendix.md": {
      "sources": ["packages/cli/src/commands/"],
      "description": "CLI detailed appendix"
    },
    "reference/manifest-schema.md": {
      "sources": ["docs/system/manifest.md"],
      "description": "Manifest schema reference"
    },
    "reference/job-api.md": {
      "sources": ["docs/system/job-api.md", "docs/system/job-context.md", "docs/system/job-control-signals.md"],
      "description": "Job API reference"
    },
    "reference/events-and-webhooks.md": {
      "sources": ["docs/system/events.md", "docs/system/webhooks.md"],
      "description": "Events and webhooks reference"
    },
    "reference/builds-and-releases.md": {
      "sources": ["docs/system/builds.md", "docs/system/container-registry.md"],
      "description": "Build system reference"
    },
    "reference/pipelines.md": {
      "sources": ["docs/system/pipelines.md"],
      "description": "Pipeline reference"
    },
    "reference/workflows.md": {
      "sources": ["docs/system/workflows.md", "docs/system/workflow-invocation.md"],
      "description": "Workflow reference"
    },
    "reference/environment-gating.md": {
      "sources": ["docs/system/environment-gating.md", "docs/system/deployment.md"],
      "description": "Environment gating reference"
    },
    "reference/harnesses-and-workers.md": {
      "sources": ["docs/system/harness-execution.md", "docs/system/harness-adapters.md", "docs/system/harness-policy.md"],
      "description": "Harness and worker reference"
    },
    "reference/openapi.md": {
      "sources": [],
      "description": "OpenAPI spec (generated, not synced)"
    },
    "agent-integration/agent-native-design.md": {
      "sources": ["docs/ideas/agent-native-design.md", "docs/ideas/platform-primitives-for-agentic-apps.md"],
      "description": "Agent-native design philosophy"
    },
    "agent-integration/skills-system.md": {
      "sources": ["docs/system/skills.md", "docs/system/skillpacks.md", "docs/system/skills-workflows.md"],
      "description": "Skills system deep dive"
    },
    "agent-integration/orchestration.md": {
      "sources": ["docs/system/orchestrator.md", "docs/system/orchestration-skill.md", "docs/system/job-cli.md"],
      "description": "Job orchestration patterns"
    },
    "agent-integration/chat-gateway.md": {
      "sources": ["docs/system/chat-gateway.md"],
      "description": "Chat gateway integration"
    },
    "agent-integration/threads.md": {
      "sources": ["docs/system/threads.md", "docs/system/agents.md"],
      "description": "Thread management"
    },
    "agent-integration/llms-txt.md": {
      "sources": [],
      "description": "llms.txt agent discovery (local to docs, not synced)"
    },
    "operations/deployment.md": {
      "sources": ["docs/system/deployment.md", "docs/system/deploy-polling.md"],
      "description": "Deployment operations"
    },
    "operations/observability.md": {
      "sources": ["docs/system/observability.md", "docs/system/cli-debugging.md"],
      "description": "Observability and logging"
    },
    "operations/database.md": {
      "sources": ["docs/system/db.md", "docs/system/manifest.md"],
      "description": "Database operations"
    },
    "operations/security.md": {
      "sources": ["docs/system/auth.md", "docs/system/identity-providers.md"],
      "description": "Security operations"
    },
    "operations/troubleshooting.md": {
      "sources": ["docs/system/cli-debugging.md"],
      "description": "Troubleshooting guide"
    }
  }
}
```

## Sync Skill Design

### Location

`private-skills/sync-docs/SKILL.md` — a docs-specific sync skill that follows
the same orchestrator + parallel workers pattern as the skillpacks sync-horizon
skill, but adapted for docs site content.

### Key Differences from Skillpacks Sync

| Aspect | Skillpacks sync-horizon | Docs sync-docs |
|--------|------------------------|----------------|
| **Target** | Agent reference docs + skills | Public docs site (Docusaurus MDX) |
| **Source access** | `git clone` to `../eve-horizon` | `gh api` — no clone needed |
| **Output** | Distilled agent reference | Human-readable documentation |
| **Commit strategy** | Direct to main (git controls) | Same — direct to main |
| **Voice** | Imperative (agent instructions) | Tutorial/reference (human docs) |
| **Source-to-docs policy** | Strip all roadmap mentions | Keep "coming soon" where docs scope allows |
| **Post-sync** | Push to main via git controls | Same — deploy pipeline fires |
| **Diff access** | `git diff` on local clone | `gh api repos/.../compare` API |
| **File access** | `cat ../eve-horizon/<file>` | `gh api repos/.../contents/<file>` |

### Orchestrator Workflow

```
Phase 1: Setup
  - Authenticate: echo "${GITHUB_TOKEN}" | gh auth login --with-token
  - Read .sync-state.json for last_synced_commit
  - If state file is missing, unreadable, or `last_synced_commit` is null:
    - fetch current eve-horizon HEAD
    - write a baseline `.sync-state.json` entry
    - exit, or perform a one-time baseline audit if desired

Phase 2: Discover (single API call)
  - gh api repos/incept5/eve-horizon/compare/<last_commit>...main
  - Extract from response:
    - .commits[]           → commit list + count
    - .files[].filename    → changed file paths
    - .files[].patch       → diffs (for workers)
    - .ahead_by            → number of commits ahead
    - .status             → identical / behind / ahead / diverged
  - Handle `compare.status`:
    - `identical`: no changes to process
    - `ahead`: normal incremental run
    - `behind`: checkpoint is newer than upstream; refresh checkpoint to HEAD and exit
    - `diverged`: fallback strategy (full-file reconcile for watched sources)
  - Filter changed files against watch_paths from .sync-map.json
  - If no watched files changed, exit early ("docs are up to date")

Phase 3: Plan
  - Read .sync-map.json
  - Cross-reference changed source files with page_mappings
  - Create work items for each affected docs page
  - Add final work item: "Update sync state and produce report"

Phase 4: Dispatch Workers (parallel)
  - Each worker gets:
    - The patch text for its source files (from compare response)
    - gh api command to read full file contents if patch is truncated:
      gh api repos/incept5/eve-horizon/contents/<path> --jq '.content' | base64 -d
    - The target docs page path to update
  - Workers edit docs pages incrementally (preserve existing structure)
  - Workers follow docs voice conventions (not agent voice)

Phase 5: Finalize
  - Get HEAD SHA: gh api repos/incept5/eve-horizon/commits/main --jq '.sha'
  - Update .sync-state.json with new commit hash + sync log entry
  - Report: summary of changes, pages updated, commit count
  - (Eve git controls handle commit + push automatically)
```

### Worker Instructions (Docs-Specific)

```
You are updating a public documentation page for Eve Horizon.

## Source Access
- Your patch text is provided inline below (from the GitHub Compare API)
- If you need the full file content (patch was truncated), run:
  gh api repos/incept5/eve-horizon/contents/<path> --jq '.content' | base64 -d

## Rules
- Write for human developers, not agents
- Use tutorial voice for guides, reference voice for reference pages
- Preserve existing page structure (frontmatter, headings, admonitions)
- Update only sections affected by the platform changes
- Keep code examples working and accurate
- Do NOT add "coming soon" or placeholder sections
- If a feature was removed, remove the corresponding docs section
- Preserve Docusaurus-specific syntax (:::tip, :::warning, tabs, etc.)
```

## Manifest Changes

Add `x-eve` defaults and the `sync-docs` workflow to `.eve/manifest.yaml`.

### Manifest (full):

```yaml
schema: eve/compose/v2
project: evdocs

registry: "eve"

x-eve:
  defaults:
    hints:
      permission_policy: auto_edit

services:
  docs:
    build:
      context: ./website
    ports: [3000]
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 10s
      timeout: 3s
      retries: 3
    x-eve:
      ingress:
        public: true
        port: 3000
        alias: docs

environments:
  staging:
    pipeline: deploy

pipelines:
  deploy:
    trigger:
      github:
        event: push
        branch: main
    steps:
      - name: build
        action: { type: build }
      - name: release
        depends_on: [build]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }

workflows:
  sync-docs:
    trigger:
      cron:
        schedule: "0 9 * * *"    # daily at 09:00 UTC
    hints:
      permission_policy: auto_edit
    git:
      ref: main
      commit: auto
      push: on_success
    steps:
      - agent:
          prompt: |
            You are the eve-horizon-docs auto-sync agent.

            ## Workspace
            You are running in an Eve job. Your cwd is the evdocs project repo.
            Source access is via the GitHub API — no clone needed.

            ## Setup
            1. Authenticate gh with the injected token:
               ```bash
               echo "${GITHUB_TOKEN}" | gh auth login --with-token
               ```
            2. Load the sync-docs skill from private-skills/sync-docs/

            ## Execute
            3. Run the full sync workflow defined in the skill
            4. The skill will:
               - Read .sync-state.json to find the last synced commit
               - Call gh api repos/incept5/eve-horizon/compare/<last>...main
                 to discover what changed (commits, files, patches)
               - Update affected docs pages (human-readable documentation)
               - Read full source files via gh api when patches are truncated
               - Update .sync-state.json with the new commit hash
            5. If there are no changes, report that docs are up to date
            6. If there are changes, they will be committed and pushed
               automatically by the job's git controls (commit: auto,
               push: on_success)
```

## Secrets Required

```bash
# Fine-grained PAT with contents:read on incept5/eve-horizon
eve secret set GITHUB_TOKEN --value "github_pat_..." --env staging
```

The `GITHUB_TOKEN` is already a common convention in Eve workers for git
operations. The workflow agent will have it available as an environment variable.

## File Deliverables

| File | Purpose |
|------|---------|
| `private-skills/sync-docs/SKILL.md` | Orchestrator + worker skill definition |
| `.sync-state.json` | Sync state tracking (last commit, log) |
| `.sync-map.json` | Source-to-docs page routing table |
| `.eve/manifest.yaml` | Updated with `sync-docs` workflow |

## Implementation Steps

### Step 1: Create sync state and map files

Create `.sync-state.json` with `last_synced_commit: null` (first run will do a
baseline audit rather than a full rewrite).

Create `.sync-map.json` with the page mappings defined above.

### Step 2: Write the sync-docs skill

Create `private-skills/sync-docs/SKILL.md` following the orchestrator pattern.
Key adaptations from the skillpacks version:

- GitHub API via `gh` for all source access (no clone)
- Compare API for discovery, Contents API for full files
- Target Docusaurus MDX pages (not agent reference docs)
- Human docs voice (not agent instructions)
- Direct to main via Eve git controls
- Include `.sync-map.json` page routing

### Step 3: Update manifest

Add the `sync-docs` workflow block to `.eve/manifest.yaml`.

### Step 4: Set the GITHUB_TOKEN secret

```bash
eve secret set GITHUB_TOKEN --value "github_pat_..." --env staging
```

### Step 5: Seed the baseline sync state

For the first run, we need a reasonable baseline. Options:

**Option A (recommended):** Set `last_synced_commit` to the current eve-horizon
HEAD using GitHub API (automation-safe). This means the first cron run will only pick
up *new* changes going forward. Existing content was already manually authored.

```bash
sha=$(gh api repos/incept5/eve-horizon/commits/main --jq '.sha')
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > .sync-state.json <<EOF
{
  "eve_horizon_repo": "incept5/eve-horizon",
  "last_synced_commit": "$sha",
  "last_synced_at": "$timestamp",
  "sync_log": []
}
EOF
```

Optional local-only baseline command (only for manual operations):
```bash
cd /path/to/incept5/eve-horizon && git rev-parse HEAD
```

**Option B:** Set to null and let the first run do a full audit. This would
generate a large commit reviewing all pages against current source. Useful but
potentially noisy.

### Step 6: Test manually

Before relying on the cron, test the workflow manually:

```bash
eve workflow run sync-docs --wait
```

Verify:
- [ ] `gh auth login` succeeded with GITHUB_TOKEN
- [ ] Compare API returned changes since last sync
- [ ] Changed files filtered correctly against watch_paths
- [ ] Doc pages updated with accurate content
- [ ] `.sync-state.json` updated with new commit hash
- [ ] Git controls committed and pushed to main
- [ ] Deploy pipeline triggered automatically by the push

### Step 7: Deploy manifest + enable cron

Push the updated manifest to main. The cron trigger activates once the manifest
is deployed:

```bash
eve env deploy staging --ref main --repo-dir .
```

The workflow will then run daily at 09:00 UTC automatically.

## Edge Cases

### No changes since last sync
The skill detects this in Phase 2 when `compare.status == "identical"` and there are no
watched path changes. Exit early with a "docs are up to date" message. No PR created, no
state change.

### Checkpoint is ahead/behind
If `compare.status == "behind"`, the stored checkpoint commit is ahead of `main`
and likely stale due upstream history changes. Refresh `.sync-state.json` to current
`main` HEAD, record a warning entry, and exit to prevent incorrect diffs.

### First run with null baseline
If `last_synced_commit` is null, the skill should set it to the current
eve-horizon HEAD and create a single "baseline audit" work item that spot-checks
a few key pages rather than trying to diff the entire history.

### Concurrent runs
Eve's gating system prevents concurrent workflow executions. If a sync is still
running when the next cron fires, it will be queued or skipped. Additionally,
the skill should check if `.sync-state.json` was updated since the job started
(another sync pushed first) and bail gracefully.

### Token expiration
If the `gh auth login` or API calls fail due to auth, the workflow will fail.
Eve job failure events can be routed to Slack notification. The token should be
rotated before expiry (set a calendar reminder when creating the PAT).

### Large diffs
If a platform release touches many watched files, the skill may generate a large
commit. The orchestrator pattern keeps this manageable by dispatching parallel
workers that each handle one page — no single worker sees the full diff set.

### Truncated patches
The Compare API truncates patches for large file changes. Workers detect this
(patch is null or truncated) and fall back to reading the full file via the
Contents API: `gh api repos/.../contents/<path> --jq '.content' | base64 -d`

### Compare API commit limit (250)
If more than 250 commits accumulate between syncs (unlikely with daily runs),
the Compare API returns `"status": "diverged"`. The skill should detect this
and fall back to a full-file comparison for affected watched paths.

### Compare API file list truncation
If `.files` is truncated because more than 300 changed files are returned, the
skill should reconcile by fetching `repos/incept5/eve-horizon/contents/<file>` for
each watched source path and proceed with a conservative full-compare flow.

### Missing source checkout assumptions
Avoid hardcoding `../../incept5/eve-horizon` in skill logic. If a local source
path is needed, read it from config/env and only use it as an optional
non-default fallback.

## Open Questions

1. **Cron frequency** — Daily at 09:00 UTC seems reasonable. Could also do every
   12 hours (`0 */12 * * *`) if faster sync is desired. Every 6 hours like
   skillpacks seems excessive for public docs.

2. **Harness choice** — The skillpacks workflow uses `zai` with `glm-4.7`. The
   docs sync writes human-facing prose so may benefit from Claude for better
   writing quality. Trade-off: cost vs quality.

3. **Build validation** — The sync could run `pnpm build` after updating docs
   to verify no MDX syntax errors before committing. This could be a final step
   in the skill, or a separate pipeline step. Worth adding as a safety net.

4. **GITHUB_TOKEN scope** — The token needs `contents:read` on
   `incept5/eve-horizon` for the API calls. The worker's built-in auth handles
   pushing to the evdocs project repo — no additional token scope needed.
