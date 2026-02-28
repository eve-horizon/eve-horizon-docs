# Sync Gap Analysis & Hardening Plan

> Date: 2026-02-28
> Status: Draft
> Scope: What the sync missed, why, and how to prevent it

---

## Executive Summary

The sync-docs skill ran successfully on Feb 27, processing 29 commits and updating 7
docs pages. But it silently skipped **3,211 lines of new/changed source material**
across 14 unmapped files — including two brand-new system docs added that same day.

The root cause is structural: the `.sync-map.json` is a static mapping created once
and never updated. When upstream adds new docs, they fall through the floor.

This plan covers:
1. **Immediate gap** — what content needs to be synced now
2. **Sync map update** — adding the 14 missing source-to-page mappings
3. **Stale entry fix** — `secrets-and-auth.md` split into two pages
4. **Skill hardening** — making the sync self-aware about coverage gaps

---

## Part 1: What We Missed

### Since Last Sync (c7a3c66, Feb 27 16:28 UTC)

These commits landed on eve-horizon main after our last sync:

| Commit | Date | Change |
|--------|------|--------|
| `5ad9167` | Feb 28 11:05 | `feat: auto-inject EVE_SSO_URL + rename @eve/app-auth → @eve/auth` |
| `e95a226` | Feb 28 11:11 | `docs: add SSO integration guide and update auth/deployment docs` |
| `7ecf171` | Feb 28 11:44 | `docs: add Eve Auth SDK system doc with migration guide` |

Files changed in `docs/system/`:
- **NEW:** `eve-auth-sdk.md` (373 lines) — Auth SDK packages, middleware, React hooks
- **NEW:** `app-sso-integration.md` (185 lines) — SSO integration quick-start
- **MODIFIED:** `auth.md` (+8 lines) — SSO references added
- **MODIFIED:** `deployment.md` (+18 lines) — EVE_SSO_URL auto-injection
- **MODIFIED:** `agent-app-api-access.md` (+2/-2 lines) — minor fixes

**Impact:** `auth.md` and `deployment.md` ARE in the sync map, so the next sync run
would catch those modifications. But `eve-auth-sdk.md` and `app-sso-integration.md`
are **new files with no mapping** — they'd be silently skipped forever.

### Silently Skipped During Last Sync (Feb 27)

The last sync's 29-commit window included these changes that were in `watch_paths`
but had no `page_mappings` entry:

| Source File | Lines | What Was Missed |
|-------------|-------|-----------------|
| `object-store-and-org-filesystem.md` | 785 | Entire new doc: unified storage, org filesystem, S3 API |
| `integrations.md` | 234 | Major rewrite: Slack identity resolution, membership lifecycle |
| `chat-gateway.md` | +77 | **Partial miss** — gateway page was updated, but `integrations.md` was not |

The gateway page got updated because `chat-gateway.md` is mapped. But the companion
`integrations.md` changes went into a void — the sync saw the diff, matched it against
`watch_paths`, found no `page_mappings` target, and reported "changes detected but no
page mappings affected" — then moved on.

---

## Part 2: Full Unmapped Source Inventory

27 files in `docs/system/` are not referenced by any `page_mappings` entry. Classified
by whether they contain content that should reach public docs:

### Tier 1 — Should Map to Existing or New Pages (14 files, 3,211 lines)

| Source | Lines | Recommended Target | Rationale |
|--------|-------|--------------------|-----------|
| `eve-auth-sdk.md` | 373 | `guides/authentication.md` | Auth SDK is core to the auth guide |
| `app-sso-integration.md` | 185 | `guides/authentication.md` | SSO integration quick-start |
| `object-store-and-org-filesystem.md` | 785 | **NEW:** `guides/storage.md` | Major new feature, needs its own page |
| `integrations.md` | 234 | `guides/chat.md` + `operations/security.md` | Slack/GitHub integration + identity mapping |
| `agent-app-api-access.md` | 230 | `agent-integration/agent-native-design.md` | Agent→app API calling patterns |
| `app-service-eve-api-access.md` | 142 | `guides/fullstack-app-design.md` | App→Eve API access for services |
| `worker-types.md` | 252 | `reference/harnesses-and-workers.md` | Worker type selection (Playwright etc.) |
| `job-git-controls.md` | 124 | `reference/job-api.md` | Git ref, branch, commit/push controls |
| `agent-runtime.md` | 28 | `guides/agents-and-teams.md` | Org-scoped agent runtime and warm pods |
| `agent-sandbox-security.md` | 131 | `operations/security.md` | Agent CLI sandboxing model |
| `agent-secret-isolation.md` | 186 | `operations/security.md` | Secret leak prevention |
| `inference-ollama.md` | 81 | `guides/agents-and-teams.md` | Managed inference routing |
| `pr-preview-environments.md` | 317 | `guides/environments.md` | PR preview env setup |
| `pricing-and-billing.md` | 143 | **NEW or defer** | Pricing page — may want dedicated page |

### Tier 2 — Internal/Meta (not for public docs, 6 files)

| Source | Why Skip |
|--------|----------|
| `README.md` | Index file for the system docs directory |
| `template.md` | Doc template for internal authors |
| `ARCHITECTURE.md` | Internal architecture overview |
| `testing-strategy.md` | Internal QA strategy |
| `configuration-model-refactor.md` | Internal refactor notes |
| `openapi.md` | OpenAPI spec metadata (actual spec is openapi.yaml) |

### Tier 3 — Borderline (worth adding to watch_paths, decide later, 7 files)

| Source | Lines | Notes |
|--------|-------|-------|
| `ci-cd.md` | 74 | GitHub Actions workflows — could feed operations docs |
| `analytics.md` | 84 | Org analytics — no current public page for this |
| `api-philosophy.md` | 185 | Style guide for API design — reference candidate |
| `extension-points.md` | 108 | Plugin/extension points — future agent-integration page |
| `ollama-api-key-auth.md` | — | Ollama-specific auth detail |
| `agent-harness-design.md` | — | Harness design internals |
| `unified-architecture.md` | — | Already mapped via `fullstack-app-design.md` sources |

Wait — `unified-architecture.md` IS referenced in the sync map (as a source for
`guides/fullstack-app-design.md`). Not actually unmapped. The grep check was
over-counting because `unified-architecture.md` doesn't appear as a substring of
the full path. **Correction: 26 unmapped, not 27.**

---

## Part 3: Stale Sync Map Entry

The sync map contains:
```json
"guides/secrets-and-auth.md": {
  "sources": ["docs/system/secrets.md", "docs/system/auth.md", "docs/system/identity-providers.md"]
}
```

But this page was split (per commit `1dc4718`, Feb 27) into:
- `guides/secrets.md`
- `guides/authentication.md`

The old entry points to a file that no longer exists. Any changes to `secrets.md`,
`auth.md`, or `identity-providers.md` would generate a work item targeting a missing
file — the worker would fail or silently produce nothing.

**Fix:** Replace the single entry with two:
```json
"guides/secrets.md": {
  "sources": ["docs/system/secrets.md"],
  "description": "Secrets management"
},
"guides/authentication.md": {
  "sources": [
    "docs/system/auth.md",
    "docs/system/identity-providers.md",
    "docs/system/eve-auth-sdk.md",
    "docs/system/app-sso-integration.md"
  ],
  "description": "Authentication, SSO, and identity providers"
}
```

---

## Part 4: Sync Map Updates

### New Page Mappings to Add

```json
"guides/storage.md": {
  "sources": ["docs/system/object-store-and-org-filesystem.md"],
  "description": "Object store, org filesystem, and storage access"
}
```

### Existing Mappings to Expand

| Page | Add Source(s) |
|------|--------------|
| `guides/authentication.md` | `docs/system/eve-auth-sdk.md`, `docs/system/app-sso-integration.md` |
| `guides/chat.md` | `docs/system/integrations.md` |
| `guides/agents-and-teams.md` | `docs/system/agent-runtime.md`, `docs/system/inference-ollama.md` |
| `guides/environments.md` | `docs/system/pr-preview-environments.md` |
| `guides/fullstack-app-design.md` | `docs/system/app-service-eve-api-access.md` |
| `agent-integration/agent-native-design.md` | `docs/system/agent-app-api-access.md` |
| `reference/harnesses-and-workers.md` | `docs/system/worker-types.md` |
| `reference/job-api.md` | `docs/system/job-git-controls.md` |
| `operations/security.md` | `docs/system/agent-sandbox-security.md`, `docs/system/agent-secret-isolation.md` |

### Watch Paths to Expand

Current `watch_paths` already covers `docs/system/` as a directory prefix, so new
files there are automatically caught. No change needed to `watch_paths`.

The issue is purely in `page_mappings` — files are watched but have nowhere to go.

---

## Part 5: Skill Hardening

### Problem Analysis

The sync-docs SKILL.md has a structural blind spot at **Phase 3 (Plan)**:

```
If the work list is empty (changed files were in watch_paths but don't map to
any page): report "changes detected but no page mappings affected" and **stop**.
```

This is the silent failure mode. The skill correctly identifies changed files in
watched paths, but when they don't map to any page, it shrugs and moves on. There's
no alarm, no escalation, no record of what was dropped.

### Proposed Changes to SKILL.md

#### Change 1: Coverage Gap Report (Phase 3)

Replace the silent "stop" with a coverage gap report. After building the work list,
also build a **gap list** of changed source files that matched `watch_paths` but
don't appear in any `page_mappings.sources` entry.

If the gap list is non-empty:
1. Log each unmapped file with its change type (added/modified/removed) and line count
2. Append to `.sync-state.json` under a new `unmapped_changes` array in the sync log entry
3. Continue with the work list (don't stop just because some files are unmapped)

The sync should still succeed for mapped files — but the gap becomes visible in
the sync log for humans to act on.

New sync log entry shape:
```json
{
  "commit": "...",
  "synced_at": "...",
  "type": "incremental",
  "commits_synced": 5,
  "docs_updated": ["guides/authentication.md"],
  "unmapped_sources": [
    "docs/system/eve-auth-sdk.md (added, 373 lines)",
    "docs/system/app-sso-integration.md (added, 185 lines)"
  ],
  "summary": "..."
}
```

#### Change 2: New File Detection (Phase 2)

After filtering changed files against `watch_paths`, classify each matched file:
- If the file's `status` is `added` → flag it as requiring a mapping decision
- Report: "N new source files detected — check if page_mappings need updating"

This catches the most dangerous case: entirely new docs that nobody thought to map.

#### Change 3: Stale Entry Validation (Phase 1)

During setup, after reading `.sync-map.json`, validate that every `page_mappings`
target file actually exists on disk:

```
For each page in page_mappings:
  Check if website/docs/<page> exists
  If not: warn "Stale mapping: <page> no longer exists — remove or update"
```

This would have caught the `secrets-and-auth.md` → `secrets.md` + `authentication.md`
split immediately.

#### Change 4: Source Existence Check (Phase 1)

Also validate that each `sources` entry in the sync map is reachable via the
GitHub API. This is heavier (one API call per unique source), so make it optional —
only run on the first sync after a `.sync-map.json` change, or when explicitly
requested.

Actually, simpler: when the Compare response comes back, check if any `page_mappings`
source files appear in the full docs/system/ tree (via a single tree API call) but
aren't in the Compare response's changed files. This gives us a cheap way to know if
there are sources the map references that haven't been touched. Not a full validation,
but catches renamed/deleted source files when other files in the same directory change.

**On reflection, Change 4 adds complexity for marginal value. Skip it. Changes 1-3
are sufficient.**

---

## Part 6: New Page — `guides/storage.md`

The `object-store-and-org-filesystem.md` source (785 lines) covers a significant new
feature that doesn't fit naturally into any existing page. It needs its own guide.

### Page Outline

```
---
sidebar_position: 11
title: Storage & Filesystem
description: Object store, org filesystem, and file sharing in Eve Horizon
---

# Storage & Filesystem

## Overview
- Unified storage model: object store + org filesystem
- When to use which

## Object Store
- S3-compatible API
- Per-project buckets
- Access from services and agents

## Org Filesystem
- Shared filesystem across org
- Path conventions
- Access controls

## File Sharing
- Public URLs
- Scoped sharing between projects

## CLI Commands
- eve fs ls, cp, rm, share
```

Create this page as part of the immediate sync work.

---

## Part 7: Execution Order

### Phase A — Fix Sync Map (30 min)

1. Remove stale `guides/secrets-and-auth.md` entry
2. Add `guides/secrets.md` and `guides/authentication.md` entries
3. Add `guides/storage.md` entry
4. Expand 9 existing page mappings per Part 4 table
5. Validate: every target page exists, every source path looks correct

### Phase B — Sync Missed Content (2-3 hours)

Run the sync manually (or trigger the skill) to catch:
1. Auth SDK + SSO integration → `guides/authentication.md`
2. Object store → NEW `guides/storage.md`
3. Integrations → `guides/chat.md`
4. Agent API access → `agent-integration/agent-native-design.md`
5. Worker types → `reference/harnesses-and-workers.md`
6. Job git controls → `reference/job-api.md`
7. Security docs → `operations/security.md`
8. PR preview envs → `guides/environments.md`
9. App→Eve API → `guides/fullstack-app-design.md`
10. Agent runtime + inference → `guides/agents-and-teams.md`

For content that was added before our last sync (object-store, integrations), we
can't rely on the incremental diff — we need to read the full source files and
integrate them. The skill handles this via "full-file reconcile" mode, or we do it
manually.

### Phase C — Harden SKILL.md (1 hour)

1. Add stale entry validation (Change 3) to Phase 1
2. Add new file detection (Change 2) to Phase 2
3. Replace silent stop with coverage gap report (Change 1) in Phase 3
4. Update sync log schema to include `unmapped_sources`

### Phase D — Verify

1. Run `pnpm build` to verify all new/modified pages compile
2. Check sidebar navigation includes the new storage page
3. Run sync again to confirm it reports "up to date" with no gaps

---

## Appendix: Why Static Mapping Tables Drift

The sync map is effectively a denormalized join table between two independently
evolving systems (eve-horizon source docs and eve-horizon-docs pages). It was
authored once when the docs site was bootstrapped and assumes a stable corpus.

In practice:
- Eve-horizon adds ~2-3 new system docs per week
- The docs site adds/renames pages during content sprints
- Nobody updates the sync map because the sync succeeds (it just syncs less)

The hardening in Phase C makes the drift visible but doesn't eliminate it. The
ultimate fix would be convention-based mapping (e.g., frontmatter in source docs
declaring which public page they feed) — but that requires changes to the eve-horizon
repo, which is out of scope here.

For now, **visibility is the lever**: if every sync run reports "2 unmapped sources
detected," someone will add the mapping within a day. The current silent skip means
gaps accumulate for weeks.
