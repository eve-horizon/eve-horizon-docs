---
name: sync-docs
description: Synchronize eve-horizon-docs with the eve-horizon platform source using the GitHub API. Fetches plans, feat commits, and system doc changes, then cascades updates to published documentation pages.
---

# Sync Docs

Synchronize eve-horizon-docs with the eve-horizon platform source using the
GitHub API. No clone needed — all source access via HTTP.

**Signal model:** Plans and feat commits are the primary signal. System doc
changes are secondary. The skill synthesizes *capabilities* (what shipped),
not just file diffs.

## Prerequisites

- `GITHUB_TOKEN` env var (fine-grained PAT with `contents:read` on `incept5/eve-horizon`)
- Node.js available in PATH (for `fetch()` API calls)
- `.sync-state.json` and `.sync-map.json` in the repo root

## GitHub API Access

The worker may not have `gh`, `curl`, or `jq`. Use Node.js `fetch()` for all
GitHub API calls. Helper pattern:

```javascript
// Use this pattern for ALL GitHub API calls in this skill
node -e "
  const token = process.env.GITHUB_TOKEN;
  if (!token) { console.error('GITHUB_TOKEN not set'); process.exit(1); }
  fetch('https://api.github.com/repos/incept5/eve-horizon/<endpoint>', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'eve-sync-docs'
    }
  })
  .then(async r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + await r.text());
    return r.json();
  })
  .then(data => console.log(JSON.stringify(data)))
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

For file contents that are base64-encoded, decode with:
```javascript
Buffer.from(jsonResponse.content, 'base64').toString('utf-8')
```

## Execution

Run all seven phases in order. Stop early when indicated.

---

### Phase 1: Deep Discovery

Gather **lightweight signals only** — never read full plan bodies in this phase.

#### 1.0 Setup

Verify GitHub API access using Node:

```bash
node -e "
  const token = process.env.GITHUB_TOKEN;
  if (!token) { console.error('GITHUB_TOKEN not set'); process.exit(1); }
  fetch('https://api.github.com/repos/incept5/eve-horizon', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'eve-sync-docs'
    }
  })
  .then(async r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + await r.text());
    return r.json();
  })
  .then(d => console.log('OK: ' + d.full_name))
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

If this fails, stop and report the error. Do not proceed without authenticated
GitHub API access.

Read `.sync-state.json` from the repo root:
- Extract `last_synced_commit`
- Extract `eve_horizon_repo` (should be `incept5/eve-horizon`)

If `.sync-state.json` is missing or unreadable, create it with `last_synced_commit: null`.

Read `.sync-map.json` and validate `page_mappings` targets:

```
For each page in page_mappings:
  Check if website/docs/<page> exists on disk
  If not: warn "Stale mapping: <page> no longer exists — remove or update"
```

If any stale mappings are found, list them all and then **stop**. Stale mappings
must be fixed before syncing.

If `last_synced_commit` is null:
1. Fetch the current eve-horizon HEAD SHA via API
2. Write a baseline `.sync-state.json` with that SHA and current timestamp
3. Report: "Baseline sync state initialized — no incremental sync needed on first run"
4. **Stop here.**

#### 1.1 Compare API

Make a single Compare API call:

```bash
node -e "
  const token = process.env.GITHUB_TOKEN;
  const lastCommit = '<LAST_SYNCED_COMMIT>';
  fetch('https://api.github.com/repos/incept5/eve-horizon/compare/' + lastCommit + '...main', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'eve-sync-docs'
    }
  })
  .then(async r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + await r.text());
    return r.json();
  })
  .then(data => {
    const result = {
      status: data.status,
      ahead_by: data.ahead_by,
      commits: (data.commits || []).map(c => ({sha: c.sha, message: c.commit.message})),
      files: (data.files || []).map(f => ({filename: f.filename, status: f.status, patch: f.patch, additions: f.additions, deletions: f.deletions, changes: f.changes}))
    };
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

Replace `<LAST_SYNCED_COMMIT>` with the actual SHA from `.sync-state.json`.

Handle the `status` field:

- **`identical`**: No changes since last sync. Report "docs are up to date" and **stop**.
- **`ahead`**: Normal incremental run. Continue.
- **`behind`**: Checkpoint is newer than upstream. Refresh `.sync-state.json`
  to current main HEAD, log a warning entry, and **stop**.
- **`diverged`**: Too many commits or history rewrite. Fall back to full-file
  reconcile for watched sources (read each watched file via Contents API).

**Early exit:** If zero `feat:` commits AND zero shipped plans AND zero system
doc changes → report "no substantive changes" and **stop**.

#### 1.2 Commit log analysis

From the commits array, categorize each by conventional-commit prefix:
- `feat:` → new capabilities (count these)
- `fix:` → behavior changes (note affected areas)
- `docs:` → check if describing already-shipped features
- `chore:` / `refactor:` → note removals, renames, simplifications

Extract: total commits, feat count, fix count, commit messages list.

#### 1.3 Plan intelligence

From the Compare API `files` array, filter for `docs/plans/` changes.

For each changed plan file, fetch the **first 20 lines only** via Contents API:

```bash
node -e "
  const token = process.env.GITHUB_TOKEN;
  fetch('https://api.github.com/repos/incept5/eve-horizon/contents/<plan_path>', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'eve-sync-docs'
    }
  })
  .then(r => r.json())
  .then(d => {
    const text = Buffer.from(d.content, 'base64').toString('utf-8');
    const lines = text.split('\n').slice(0, 20);
    console.log(lines.join('\n'));
  })
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

Extract plan status from header. Plans use blockquote metadata format:
```
> **Status**: Implemented
> **Date**: 2026-03-10
```

Two formats exist in the wild — try both:
- `/\*\*Status\*\*:\s*(.+)/i` — colon outside bold: `**Status**: Implemented`
- `/\*\*Status:\*\*\s*(.+)/i` — colon inside bold: `**Status:** Implemented`

Ship-indicating statuses:
- `Implemented`, `Complete`, `Done`, `Shipped`, `Closed` → **primary signal**
- Skip: `Proposed`, `Draft`, `Ready to build`, `In progress`, `Plan`

**Important:** Many plans lack updated status even after the feature ships. Plans
marked "Proposed" may still be shipped — Phase 2 cross-references feat commits
to find these. Don't rely solely on plan status.

Also note: plan title, affected area (from filename convention), status.

#### 1.4 Code signal

From the Compare API `files` array, check three code dimensions:
- **CLI commands**: files matching `packages/cli/src/commands/**`
  - New commands (status: `added`) → new capability
  - Changed commands → behavior change
  - Removed commands → deprecation
- **DB migrations**: files matching `packages/db/migrations/**`
  - New migrations → schema evolution
- **Core packages**: files matching `packages/*/src/**`
  - Note which packages changed (api, worker, gateway, shared, etc.)

#### 1.5 System doc changes

From the Compare API `files` array, filter for `docs/system/` and `AGENTS.md`.
Note which changed — these confirm capabilities but are not the primary signal.

#### 1.6 Ideas doc changes

From the Compare API `files` array, filter for `docs/ideas/`. Note significant
changes to forward-looking design docs.

**Output of Phase 1:** A structured discovery object:
```json
{
  "commits": { "total": 0, "feat": 0, "fix": 0, "docs": 0, "chore": 0 },
  "shipped_plans": [
    { "file": "docs/plans/X.md", "title": "...", "status": "Implemented" }
  ],
  "unshipped_plans": [
    { "file": "docs/plans/Y.md", "title": "...", "status": "In progress" }
  ],
  "code_signal": {
    "new_cli_commands": [],
    "changed_cli_commands": [],
    "removed_cli_commands": [],
    "new_migrations": [],
    "changed_packages": []
  },
  "system_doc_changes": [],
  "ideas_doc_changes": []
}
```

---

### Phase 2: Capability Synthesis

**STOP and think.** Cross-reference all signals to build a capability map.

For each **shipped plan** (Implemented/Complete/Done):
- Match with `feat:` commits (by keyword/area overlap)
- Check for corresponding code signal (new CLI commands, migrations)
- Check for corresponding system doc changes
- Synthesize a one-line summary of what shipped

Build a capability map:

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

### Phase 3: Cascade Analysis

For each capability/feature/removal, determine which docs pages need updating.

#### 3a. Primary cascade (from capability → pages)

For each capability, reason about which docs pages are affected:
- Which **guide** covers this area? (e.g., agents → `guides/agents-and-teams.md`)
- Which **reference** page covers this? (e.g., new CLI command → `reference/cli-commands.md`)
- Does this need a **new page**? (only if it's a genuinely new primitive)
- Does this affect **operations** docs? (e.g., new deployment behavior)
- Does this affect **agent-integration** docs? (e.g., new orchestration pattern)
- Something **removed**? → identify pages with stale content to clean

Cross-reference with `.sync-map.json`:
- Check `plan_mappings` first — if the plan has an explicit mapping, use it
- Fall back to `page_mappings` — match by source overlap
- Don't be limited by the sync map. If a capability clearly affects a page not
  in its current mapping, include it anyway and flag the sync-map gap.

#### 3b. System-doc cascade (existing behavior)

For `system_doc_only` changes (no plan, no feat commit), fall back to the current
sync-map routing: look up which pages have that system doc as a source in
`page_mappings`.

#### 3c. Removal cascade

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
    "docs/plans/X.md has no plan_mappings entry"
  ]
}
```

---

### Phase 4: Plan Work Items

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
  "patches_from_compare": {},
  "worker_instructions": "expand"
}
```

#### Materiality check (for changelog)

Before dispatching workers, classify whether this run is significant enough to
record in the public changelog page:

- `reportable` = true when either:
  - `commits_synced >= 4`, OR
  - more than one mapped page is updated, OR
  - any mapped page is outside:
    - `reference/cli-commands.md`
    - `reference/cli-appendix.md`
- `reportable` = false when only one page changed and it is a CLI reference page
  and the run appears to be a minor docs cleanup.

Minor docs cleanup is when the update appears to be wording, formatting, or
housekeeping changes only. Use judgment — these should stay out of the public
changelog.

---

### Phase 5: Dispatch Workers

Spawn one worker per work item. Each worker prompt includes:

1. **Capability context** — what shipped and why (from Phase 2 synthesis)
2. **Plan path(s)** — the primary source to read for understanding the feature
3. **Code/system doc paths** — secondary sources for accuracy
4. **Patches** — inline diffs from Compare API (when available)
5. **Target page** — what to update
6. **Update type** — expand, remove_stale_content, or new_page

#### Worker instruction templates

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

Same as legacy behavior — patch-based update using existing sync-map routing.

```
You are updating a public documentation page for Eve Horizon.

Source access:
- Patch text is provided inline (from the Compare API response)
- If you need the full file content (patch is null or truncated), fetch it via
  Contents API

Rules:
- Write for human developers, not agents
- Use tutorial voice for guide pages, reference voice for reference pages
- Preserve existing page structure: frontmatter, heading hierarchy, admonitions
- Update only sections affected by the platform changes
- Keep code examples working and accurate
- Do NOT add "coming soon" or placeholder sections
- If a feature was removed upstream, remove the corresponding docs section
- Preserve Docusaurus-specific syntax (:::tip, :::warning, tabs, code blocks)
- Do not change the page's sidebar position or slug unless the upstream change warrants it
```

#### Source access

All via GitHub API with `GITHUB_TOKEN`:
- Contents API for full files (with base64 decode)
- Raw media type for files > 1MB
- Patches inline from Compare API response

```bash
# Full file via Contents API
node -e "
  const token = process.env.GITHUB_TOKEN;
  fetch('https://api.github.com/repos/incept5/eve-horizon/contents/<path>', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'eve-sync-docs'
    }
  })
  .then(r => r.json())
  .then(d => console.log(Buffer.from(d.content, 'base64').toString('utf-8')))
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

---

### Phase 6: Finalize

After all workers complete:

1. Get the current eve-horizon main HEAD SHA:
   ```bash
   node -e "
     const token = process.env.GITHUB_TOKEN;
     fetch('https://api.github.com/repos/incept5/eve-horizon/commits/main', {
       headers: {
         'Authorization': 'Bearer ' + token,
         'Accept': 'application/vnd.github+json',
         'User-Agent': 'eve-sync-docs'
       }
     })
     .then(r => r.json())
     .then(d => console.log(d.sha))
     .catch(e => { console.error(e.message); process.exit(1); });
   "
   ```

2. Read the current `.sync-state.json`

3. Update `.sync-state.json`:
   - Set `last_synced_commit` to the new HEAD SHA
   - Set `last_synced_at` to current UTC timestamp
   - Prepend a new entry to `sync_log`:
     ```json
     {
       "commit": "<full SHA>",
       "commit_short": "<first 7 chars>",
       "synced_at": "<ISO timestamp>",
       "type": "incremental",
       "commits_synced": 0,
       "capabilities_synced": ["Staged Team Dispatch"],
       "docs_updated": ["guides/agents-and-teams.md"],
       "removals": ["Inference abstraction removed from agents guide"],
       "unmapped_sources": [],
       "sync_map_gaps": ["docs/plans/X.md has no plan_mappings entry"],
       "summary": "<capability-centric one-liner>",
       "changelog_noted": true
     }
     ```
   - `capabilities_synced`: list of capability names (from shipped plans)
   - `removals`: list of removal descriptions
   - `sync_map_gaps`: plan/source files with no page mapping
   - `unmapped_sources`: changed files that matched `watch_paths` but had no
     `page_mappings` entry. If empty, set to `[]`.
   - Keep only the last 20 entries in `sync_log`

4. Write the updated `.sync-state.json`

5. Update changelog page:
   - If `reportable` is false, report: "Change set is minor; skipping public changelog entry."
   - If `reportable` is true:
     - Read `website/docs/operations/sync-docs-changelog.md`
     - Add a new row under the `## Entries` table with:
       - UTC date from `synced_at`
       - full commit link (`https://github.com/incept5/eve-horizon/commit/<full SHA>`)
       - `commits_synced`
       - comma-separated `docs_updated`
       - one-line `summary` text (lead with capability names, not file names)
     - Keep the table in reverse chronological order and preserve the page structure.
     - Limit to 60 rows for readability (delete oldest rows if needed).
     - Set `changelog_noted` in the log entry to `true`.
   - If changelog updates fail (file missing or malformed), log the failure and
     continue; do not fail the sync.
   - If `reportable` is false, set `changelog_noted` to `false`.

---

### Phase 7: Report

Print a structured sync report:

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

Eve's git controls (`commit: auto`, `push: on_success`) will handle committing
the changes and pushing to main. The push triggers the existing deploy pipeline.

---

## Edge Cases

- **Truncated patches**: If a file's `patch` field is null or missing in the
  Compare response, the diff was too large. Read the full file via Contents API.
- **Compare API limits**: Max 250 commits, 300 files. If `status` is `diverged`,
  fall back to reading full files for all watched sources.
- **Large file via Contents API**: Files over 1MB need the raw media type:
  ```bash
  node -e "
    const token = process.env.GITHUB_TOKEN;
    fetch('https://api.github.com/repos/incept5/eve-horizon/contents/<path>', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.raw+json',
        'User-Agent': 'eve-sync-docs'
      }
    })
    .then(r => r.text())
    .then(t => console.log(t))
    .catch(e => { console.error(e.message); process.exit(1); });
  "
  ```
- **Concurrent runs**: Check if `.sync-state.json` was updated since the job
  started (another sync pushed first). If so, bail gracefully.
- **Token expiration**: If API calls fail with 401, report the error clearly —
  the PAT needs rotation.
- **Plan headers don't follow consistent format**: Read first 20 lines, look for
  status keywords flexibly. Log plans with unparseable status.
- **Too many plans changed**: Only fetch headers (20 lines) in Phase 1. Workers
  read full plans in Phase 5.
- **False positives**: Phase 3 cascade analysis filters by scope. Plans about
  internal tooling won't cascade to user-facing docs.
- **Capability synthesis is subjective**: Orchestrator reasoning in Phase 2 is
  best-effort. Workers validate against actual plan content.
