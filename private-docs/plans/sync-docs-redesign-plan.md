# Sync-Docs Redesign: Plans as Primary Signal

**Status:** Proposed
**Date:** 2026-03-10
**Inspired by:** eve-skillpacks `sync-horizon` redesign

## Problem

The current sync-docs skill watches `docs/system/` diffs as its primary signal. But
platform features ship through **plans** and **code changes** — system docs often lag
behind by days or weeks. Over the last month, 12 major features shipped (agent runtime
parity, staged team dispatch, chat progress updates, inference simplification, etc.)
while `docs/system/` barely moved for most of them.

The sync catches file-level diffs but misses capability-level understanding. It doesn't
know that a plan marked "Implemented" with 5 `feat:` commits means a new capability
shipped — it only reacts if someone also updated the system doc.

## Design

### Signal model (old → new)

| Aspect | Old | New |
|--------|-----|-----|
| Primary signal | `docs/system/` file diffs | Shipped plans + feat commits |
| Discovery | File stat via Compare API | 4-dimension scan (commits, plans, code, system docs) |
| Understanding | "these files changed" | "these capabilities shipped" |
| Worker source | System doc patches | Plan bodies + code diffs + system docs |
| Cascade logic | Static sync-map lookup | Per-capability analysis |
| Removals | Incidental (file deleted) | First-class (plan closed, module removed) |

### Phase structure (5 → 7 phases)

```
Phase 1: Deep Discovery (orchestrator, lightweight)
Phase 2: Capability Synthesis (orchestrator, reasoning)
Phase 3: Cascade Analysis (orchestrator, planning)
Phase 4: Plan Work Items (orchestrator, dispatch prep)
Phase 5: Dispatch Workers (parallel execution)
Phase 6: Finalize (state update)
Phase 7: Report (summary)
```

---

## Phase 1: Deep Discovery

Orchestrator gathers **lightweight signals only** — never reads full plan bodies.

All source access via GitHub API (same zero-clone approach as today). Replace
`<LAST_SYNCED_COMMIT>` with SHA from `.sync-state.json`.

### 1a. Commit log

```
GET /repos/incept5/eve-horizon/compare/<LAST_COMMIT>...main
```

From the commits array, categorize each by conventional-commit prefix:
- `feat:` → new capabilities (count these)
- `fix:` → behavior changes (note affected areas)
- `docs:` → check if describing already-shipped features
- `chore:` / `refactor:` → note removals, renames, simplifications

Extract: total commits, feat count, fix count, commit messages list.

### 1b. Plan intelligence

From the Compare API `files` array, filter for `docs/plans/` changes.

For each changed plan file, fetch the **first 20 lines only** via Contents API
(or use patch if available and short enough):

```
GET /repos/incept5/eve-horizon/contents/docs/plans/<file>
```

Extract plan status from header. Ship-indicating statuses:
- `Implemented`, `Complete`, `Done`, `Shipped`, `Closed` → **primary signal**
- Skip: `Proposed`, `Draft`, `Ready to build`, `In progress`

Also note: plan title, affected area (from filename convention), status.

### 1c. Code signal

From the Compare API `files` array, check three code dimensions:
- **CLI commands**: files matching `packages/cli/src/commands/**`
  - New commands (status: `added`) → new capability
  - Changed commands → behavior change
  - Removed commands → deprecation
- **DB migrations**: files matching `packages/db/migrations/**`
  - New migrations → schema evolution
- **Core packages**: files matching `packages/*/src/**`
  - Note which packages changed (api, worker, gateway, shared, etc.)

### 1d. System doc changes

From the Compare API `files` array, filter for `docs/system/` and `AGENTS.md`.
Note which changed — these confirm capabilities but are not the primary signal.

### 1e. Ideas doc changes

From the Compare API `files` array, filter for `docs/ideas/`. Note significant
changes to forward-looking design docs.

**Output of Phase 1:** A structured discovery object:
```json
{
  "commits": { "total": N, "feat": N, "fix": N, "docs": N, "chore": N },
  "shipped_plans": [
    { "file": "docs/plans/X.md", "title": "...", "status": "Implemented" }
  ],
  "unshipped_plans": [
    { "file": "docs/plans/Y.md", "title": "...", "status": "In progress" }
  ],
  "code_signal": {
    "new_cli_commands": ["..."],
    "changed_cli_commands": ["..."],
    "removed_cli_commands": ["..."],
    "new_migrations": ["..."],
    "changed_packages": ["api", "worker", ...]
  },
  "system_doc_changes": ["docs/system/foo.md", ...],
  "ideas_doc_changes": ["docs/ideas/bar.md", ...]
}
```

**Early exit:** If `status` is `identical` → stop. If zero feat commits AND zero
shipped plans AND zero system doc changes → stop ("no substantive changes").

---

## Phase 2: Capability Synthesis

**STOP and think.** Cross-reference all signals to build a capability map.

For each **shipped plan** (Implemented/Complete/Done):
- Match with `feat:` commits (by keyword/area overlap)
- Check for corresponding code signal (new CLI commands, migrations)
- Check for corresponding system doc changes
- Synthesize a one-line summary of what shipped

```json
{
  "capabilities": [
    {
      "name": "Staged Team Dispatch",
      "plan": "docs/plans/staged-team-dispatch-plan.md",
      "status": "Implemented",
      "feat_commits": ["abc1234", "def5678"],
      "code_signal": ["new CLI: eve team dispatch"],
      "system_docs": ["docs/system/agents.md (changed)"],
      "scope": ["agents", "orchestration", "chat"],
      "summary": "Multi-agent staged dispatch pattern (prepare → fan out → synthesize)"
    }
  ],
  "standalone_features": [
    {
      "name": "ECR public auto-auth",
      "commits": ["ghi9012"],
      "scope": ["builds"],
      "summary": "Auto-authenticate with ECR public repos"
    }
  ],
  "removals": [
    {
      "name": "Inference abstraction layer",
      "plan": "docs/plans/inference-simplification-plan.md",
      "scope": ["agents", "inference"],
      "summary": "Removed managed inference; BYOK model replaces it"
    }
  ],
  "system_doc_only": [
    {
      "file": "docs/system/cli-debugging.md",
      "summary": "Updated CLI debugging docs (no plan, likely incremental)"
    }
  ]
}
```

Capabilities without a plan (evidenced only by feat commits) go in `standalone_features`.
System doc changes without a corresponding plan or feat commit go in `system_doc_only`
— these still flow to workers via the existing sync-map routing.

---

## Phase 3: Cascade Analysis

For each capability/feature/removal, determine which docs pages need updating.

### 3a. Primary cascade (from capability → pages)

For each capability, reason about which docs pages are affected:
- Which **guide** covers this area? (e.g., agents → `guides/agents-and-teams.md`)
- Which **reference** page covers this? (e.g., new CLI command → `reference/cli-commands.md`)
- Does this need a **new page**? (only if it's a genuinely new primitive)
- Does this affect **operations** docs? (e.g., new deployment behavior)
- Does this affect **agent-integration** docs? (e.g., new orchestration pattern)
- Something **removed**? → identify pages with stale content to clean

Cross-reference with `.sync-map.json` `page_mappings` to validate — but don't be
limited by the sync map. If a capability clearly affects a page not in its current
mapping, include it anyway and flag the sync-map gap.

### 3b. System-doc cascade (existing behavior)

For `system_doc_only` changes (no plan, no feat commit), fall back to the current
sync-map routing: look up which pages have that system doc as a source.

### 3c. Removal cascade

For each removal:
- Which pages reference the removed capability?
- What content needs to be deleted or updated?
- Are there cross-references from other pages?

**Output of Phase 3:** A cascade map:
```json
{
  "page_updates": [
    {
      "target": "guides/agents-and-teams.md",
      "reason": "Staged team dispatch capability shipped",
      "capabilities": ["Staged Team Dispatch"],
      "sources_to_read": [
        "docs/plans/staged-team-dispatch-plan.md",
        "docs/system/agents.md"
      ],
      "update_type": "expand"
    },
    {
      "target": "reference/cli-commands.md",
      "reason": "New CLI commands from team dispatch + runtime parity",
      "capabilities": ["Staged Team Dispatch", "Agent Runtime Parity"],
      "sources_to_read": ["packages/cli/src/commands/"],
      "update_type": "expand"
    }
  ],
  "removals": [
    {
      "target": "guides/agents-and-teams.md",
      "reason": "Inference abstraction removed",
      "capability": "Inference Simplification",
      "sources_to_read": ["docs/plans/inference-simplification-plan.md"],
      "update_type": "remove_stale_content",
      "content_to_remove": "Managed inference, ollama, model routing sections"
    }
  ],
  "new_pages": [],
  "sync_map_gaps": [
    "docs/plans/staged-team-dispatch-plan.md has no page_mappings entry"
  ]
}
```

---

## Phase 4: Plan Work Items

Convert the cascade map into concrete work items for parallel dispatch.

Each work item is self-contained:
```json
{
  "id": "update-agents-guide",
  "target": "website/docs/guides/agents-and-teams.md",
  "update_type": "expand",
  "capabilities": [
    {
      "name": "Staged Team Dispatch",
      "summary": "Multi-agent staged dispatch...",
      "plan": "docs/plans/staged-team-dispatch-plan.md"
    }
  ],
  "source_files": [
    "docs/plans/staged-team-dispatch-plan.md",
    "docs/system/agents.md"
  ],
  "patches_from_compare": { ... },
  "worker_instructions": "expand | removal | new_page"
}
```

### Materiality check (unchanged from current)

- `reportable` = true when:
  - `commits_synced >= 4`, OR
  - more than one page updated, OR
  - any page outside CLI reference
- Minor CLI-only changes with < 4 commits = not reportable

---

## Phase 5: Dispatch Workers

Spawn one worker per work item. Each worker prompt includes:

1. **Capability context** — what shipped and why (from Phase 2 synthesis)
2. **Plan path(s)** — the primary source to read for understanding the feature
3. **Code/system doc paths** — secondary sources for accuracy
4. **Patches** — inline diffs from Compare API (when available)
5. **Target page** — what to update
6. **Update type** — expand, remove_stale_content, or new_page

### Worker instruction templates

**Expand (shipped capability):**
```
You are updating a public documentation page for Eve Horizon.

A new capability shipped: <capability_name>
Summary: <one-line summary>

Primary source: Read the plan at <plan_path> via GitHub API — it describes
what was built, why, and how it works.

Secondary sources:
- System doc: <system_doc_path> (if changed)
- Code: <code_paths> (if relevant CLI commands or APIs)
- Patches: <inline patches from Compare API>

If a patch is truncated or null, fetch the full file via Contents API.

Target page: website/docs/<target>

Rules:
- Read the plan FIRST to understand the capability
- Read the existing docs page
- Add or update sections for the new capability
- Write for human developers (tutorial voice for guides, reference voice for reference)
- Preserve page structure, frontmatter, Docusaurus syntax
- Only document SHIPPED behavior — nothing from plans still in progress
- Keep code examples working and accurate
- Do NOT add "coming soon" or placeholder sections
```

**Remove stale content:**
```
A capability was removed: <capability_name>
Summary: <one-line summary>

Read the plan at <plan_path> to understand what was removed and why.

Target page: website/docs/<target>

Rules:
- Read the plan to understand the removal rationale
- Read the existing docs page
- Remove sections that reference the removed capability
- Update any cross-references
- Do not leave orphaned headings or "coming soon" notes
- If the removal simplifies the user model, update surrounding text to reflect that
```

**System-doc cascade (no plan):**
Same as current Phase 4 worker instructions — patch-based update using existing
sync-map routing. This handles incremental system doc updates that don't correspond
to a shipped plan.

### Source access

Unchanged from current skill — all via GitHub API with `GITHUB_TOKEN`:
- Contents API for full files (with base64 decode)
- Raw media type for files > 1MB
- Patches inline from Compare API response

---

## Phase 6: Finalize

After all workers complete:

1. Fetch current eve-horizon main HEAD SHA
2. Update `.sync-state.json`:
   - `last_synced_commit` = new HEAD
   - `last_synced_at` = UTC timestamp
   - New `sync_log` entry:
     ```json
     {
       "commit": "<full SHA>",
       "commit_short": "<7 chars>",
       "synced_at": "<ISO>",
       "type": "incremental",
       "commits_synced": N,
       "capabilities_synced": ["Staged Team Dispatch", ...],
       "docs_updated": ["guides/agents-and-teams.md", ...],
       "removals": ["Inference abstraction removed from agents guide"],
       "unmapped_sources": [...],
       "sync_map_gaps": [...],
       "summary": "<capability-centric one-liner>",
       "changelog_noted": true|false
     }
     ```
   - Keep last 20 entries
3. Update changelog (if reportable):
   - Same as current: add row to `website/docs/operations/sync-docs-changelog.md`
   - Summary text now leads with capability names, not file names

---

## Phase 7: Report

```
## Sync Report: <old_commit>..<new_commit>

### Commits
- N commits synced (X features, Y fixes)

### Shipped Capabilities
- <capability>: <one-line summary> (plan: <file>, status: Implemented)

### Capability Cascade
- <capability> → updated <page>, because <reason>

### Removals
- <what was removed> → cleaned from <page>

### System Doc Updates (no plan)
- <file> → routed to <page> via sync-map

### Updated Pages
- <page>: <what changed>

### Sync Map Gaps
- <plan/source with no page mapping>

### Coverage Gaps
- <shipped capability with no docs page>
- <new CLI commands with no documentation>

### Next Steps
- <manual follow-up needed>
```

---

## Changes to `.sync-map.json`

The sync map evolves to support the new model:

### New: `plan_mappings`

Maps plan files to the docs pages they affect. This supplements (not replaces)
`page_mappings` — it's a reverse index from plans to pages.

```json
"plan_mappings": {
  "docs/plans/staged-team-dispatch-plan.md": {
    "pages": ["guides/agents-and-teams.md", "agent-integration/orchestration.md"],
    "scope": ["agents", "orchestration"]
  },
  "docs/plans/inference-simplification-plan.md": {
    "pages": ["guides/agents-and-teams.md"],
    "scope": ["agents", "inference"],
    "removal": true
  }
}
```

This is **advisory, not exhaustive**. Phase 3 cascade analysis can identify affected
pages beyond what's in `plan_mappings`. But having explicit mappings speeds up the
common case and makes the routing auditable.

### Existing: `page_mappings` (unchanged)

Still used for system-doc-only changes that don't correspond to a plan. This is the
fallback routing when Phase 2 produces `system_doc_only` entries.

### Existing: `watch_paths` (expanded)

Add plan directories if not already present:
```json
"watch_paths": [
  "docs/system/",
  "docs/plans/",
  "docs/ideas/agent-native-design.md",
  "docs/ideas/platform-primitives-for-agentic-apps.md",
  "packages/cli/src/commands/",
  "packages/db/migrations/",
  "AGENTS.md"
]
```

`docs/plans/` is already watched. Add `packages/db/migrations/` as a code signal
source.

---

## Changes to `.sync-state.json`

Log entries gain new fields:
- `capabilities_synced`: list of capability names (from shipped plans)
- `removals`: list of removal descriptions
- `sync_map_gaps`: plan/source files with no page mapping

This gives humans (and future automation) visibility into what the sync understood,
not just what files it touched.

---

## Migration path

### Step 1: Update SKILL.md

Rewrite `private-skills/sync-docs/SKILL.md` with the 7-phase structure. The skill
remains zero-clone, GitHub-API-only.

### Step 2: Add `plan_mappings` to `.sync-map.json`

Seed with current shipped plans that have known page impacts. This is advisory —
the cascade analysis will catch unmapped plans.

### Step 3: Add `packages/db/migrations/` to `watch_paths`

Minor change to `.sync-map.json`.

### Step 4: Test incrementally

Run the skill manually against the current commit range (cea48e6..HEAD) which has
~20+ commits including agent runtime parity, staged team dispatch, chat progress,
and inference simplification. This is a perfect test case — the old sync would miss
most of these, the new sync should catch all of them.

### Step 5: Update manifest workflow

No changes needed — the Eve workflow trigger (`cron: 0 9 * * *`) and git controls
(`commit: auto`, `push: on_success`) remain the same.

---

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Plan headers don't follow consistent format | Read first 20 lines, look for status keywords flexibly. Log plans with unparseable status. |
| Too many plans changed → expensive API calls | Only fetch headers (20 lines) in Phase 1. Workers read full plans in Phase 5. |
| False positives (plan "Implemented" but not relevant to user docs) | Phase 3 cascade analysis filters by scope. Plans about internal tooling won't cascade to user-facing docs. |
| Compare API limits (250 commits) | Same mitigation as today: `diverged` status triggers full-file reconcile. |
| Capability synthesis is subjective | Orchestrator reasoning in Phase 2 is best-effort. Workers validate against actual plan content. |

---

## What stays the same

- Zero-clone architecture (GitHub API only)
- `GITHUB_TOKEN` authentication
- Node.js `fetch()` for all API calls
- Eve workflow trigger and git controls
- Public changelog at `website/docs/operations/sync-docs-changelog.md`
- Docusaurus page conventions (frontmatter, admonitions, tabs)
- Worker rules for writing voice and structure preservation
- Edge case handling (truncated patches, large files, concurrent runs)
