# Sync Docs

Synchronize eve-horizon-docs with the eve-horizon platform source using the
GitHub API. No clone needed — all source access via HTTP.

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

Run all five phases in order. Stop early when indicated.

---

### Phase 1: Setup

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
must be fixed before syncing — otherwise the worker would try to update a file
that doesn't exist.

If `last_synced_commit` is null:
1. Fetch the current eve-horizon HEAD SHA via API:
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
2. Write a baseline `.sync-state.json` with that SHA and current timestamp
3. Report: "Baseline sync state initialized — no incremental sync needed on first run"
4. **Stop here.** The next run will pick up changes from this baseline.

---

### Phase 2: Discover

Make a single Compare API call using Node:

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
      files: (data.files || []).map(f => ({filename: f.filename, status: f.status, patch: f.patch}))
    };
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

Replace `<LAST_SYNCED_COMMIT>` with the actual SHA from `.sync-state.json`.

Handle the `status` field:

- **`identical`**: No changes since last sync. Report "docs are up to date" and **stop**.
- **`ahead`**: Normal incremental run. Continue to Phase 3.
- **`behind`**: Checkpoint is newer than upstream (stale). Refresh `.sync-state.json`
  to current main HEAD, log a warning entry, and **stop**.
- **`diverged`**: Too many commits or history rewrite. Fall back to full-file
  reconcile for watched sources (read each watched file via Contents API).

Read `.sync-map.json` and extract `watch_paths`.

Filter the changed files list against `watch_paths`:
- A file matches if its path starts with any entry in `watch_paths`
- Keep only matching files

After filtering, classify the matched files by their `status` from the Compare response:
- If any file has `status: "added"`, flag it as a new source file requiring a mapping decision
- Report: "N new source files detected — check if page_mappings need updating"
- List each new file with its path

This does not block the sync — it's an early warning that the sync map may need
new entries added.

If no watched files changed: report "no relevant changes" and **stop**.

---

### Phase 3: Plan

Read `.sync-map.json` fully — load the `page_mappings` object.

Cross-reference the changed source files with `page_mappings`:
- For each page mapping, check if any of its `sources` appear in the changed files list
- A source matches if the changed file path matches the source exactly, OR
  if the source is a directory prefix (ends with `/`) and the changed file starts with it

Build a work list of affected docs pages. Each work item contains:
- `target_page`: the docs page path (relative to `website/docs/`)
- `sources`: the source files that changed for this page
- `patches`: the patch text for each changed source (from the Compare response)
- `description`: the page description from the sync map

Report the plan: "N pages need updating based on M changed source files"

After building the work list, also build a **gap list**: changed source files that
matched `watch_paths` but don't appear in any `page_mappings.sources` entry.

If the gap list is non-empty:
1. Log each unmapped file with its change type (added/modified/removed) and line count
   (use `changes` or `additions + deletions` from the Compare response)
2. Report: "N source files changed but have no page mapping — content will not be synced"
3. Continue with the work list — unmapped files do not block the sync

If the work list is empty but the gap list is non-empty: report the gap list and
**stop**. There's nothing to sync, but the gaps are now visible for humans to act on.

If both the work list and gap list are empty (changed files were in watch_paths but
don't map to any page and no gaps detected): report "changes detected but no page
mappings affected" and **stop**.

### Materiality check (for changelog)

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
housekeeping changes only (for example: spelling, examples, whitespace, minor
clarifications). Use judgment here — these should stay out of the public changelog.

---

### Phase 4: Dispatch Workers

For each work item, update the target docs page.

**Worker instructions for each page:**

You are updating a public documentation page for Eve Horizon.

**Source access:**
- Patch text is provided inline (from the Compare API response)
- If you need the full file content (patch is null or truncated), fetch it:
  ```bash
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
  Replace `<path>` with the source file path.

**Rules:**
- Write for human developers, not agents
- Use tutorial voice for guide pages, reference voice for reference pages
- Preserve existing page structure: frontmatter, heading hierarchy, admonitions
- Update only sections affected by the platform changes
- Keep code examples working and accurate
- Do NOT add "coming soon" or placeholder sections
- If a feature was removed upstream, remove the corresponding docs section
- Preserve Docusaurus-specific syntax (`:::tip`, `:::warning`, tabs, code blocks)
- Do not change the page's sidebar position or slug unless the upstream change warrants it

**Page location:** `website/docs/<target_page>`

Read the existing page first, then apply the changes from the patches.

---

### Phase 5: Finalize

After all pages are updated:

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
       "commits_synced": <number of commits in compare>,
       "docs_updated": ["<list of updated page paths>"],
       "unmapped_sources": [
         "<source path> (<change type>, <line count> lines)"
       ],
       "summary": "<one-line summary of what changed>",
       "changelog_noted": <true|false>
     }
     ```
   - `unmapped_sources` contains the gap list from Phase 3 (changed files that
     matched `watch_paths` but had no `page_mappings` entry). If the gap list
     was empty, set `unmapped_sources` to an empty array `[]`.
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
       - one-line `summary` text
     - Keep the table in reverse chronological order and preserve the page structure.
     - Limit to 60 rows for readability (delete oldest rows if needed).
     - Set `changelog_noted` in the log entry to `true`.
   - If changelog updates fail (file missing or malformed), log the failure and
     continue; do not fail the sync unless docs page updates also failed.
   - If `reportable` is false, set `changelog_noted` in the log entry to `false`.

6. Report a summary:
   - Number of commits synced
   - Pages updated (list them)
   - One-line summary of the platform changes

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
