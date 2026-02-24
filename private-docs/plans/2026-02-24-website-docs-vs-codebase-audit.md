# Website docs vs codebase audit

Date: 2026-02-24
Scope: `website/docs/` (documentation) compared against CLI/runtime behavior in `../../incept5/eve-horizon`
Reviewer: Codex

## Executive summary
- The CLI reference docs are missing several real command groups and subcommands that exist in code.
- Two high-impact command surfaces (`eve providers`, `eve models`) are effectively undocumented.
- Multiple auth/service identity examples still describe legacy command names that no longer exist.
- Manifest schema documentation appears to be stale relative to current schema fields.
- Non-CLI docs (`reference/openapi.md`) contain examples that do not match current command/API usage, creating onboarding and troubleshooting errors.

## Audit basis
- CLI source: `../../incept5/eve-horizon/packages/cli/src/`
- Primary CLI command registry: `../../incept5/eve-horizon/packages/cli/src/index.ts`
- Code-level command definitions checked in `../../incept5/eve-horizon/packages/cli/src/commands/`
- Docs reviewed under `website/docs/reference/` and related guide files

## Critical findings (docs must be fixed)

### 1) Missing top-level command docs
#### `eve providers`
- Code supports command group at top level but no top-level section in reference docs.
- Missing: `eve providers list`, `eve providers show`, `eve providers models`.
- Files impacted:
  - `website/docs/reference/cli-commands.md`
  - `website/docs/reference/cli-appendix.md`

#### `eve models`
- Code supports command group and list behavior at top level but docs have no `eve models` section.
- Files impacted:
  - `website/docs/reference/cli-commands.md`
  - `website/docs/reference/cli-appendix.md`

### 2) Missing top-level command subcommands (complete list)

#### `eve access`
- Documented but incomplete.
- Missing subcommands: `roles`, `bind`, `unbind`, `bindings`.
- Documented currently: `can`, `explain`, `groups`, `memberships`, `validate`, `plan`, `sync`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve admin`
- Missing documented coverage for significant command groups.
- Missing: `pricing`, `receipts`, `balance`, `usage`, `access-requests`.
- Documented currently: `invite`, `ingress-aliases`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve auth`
- Missing identity/service-account workflow commands.
- Missing: `request-access`, `create-service-account`, `list-service-accounts`, `revoke-service-account`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve db`
- Missing advanced operations.
- Missing: `new`, `status`, `rotate-credentials`, `scale`, `destroy`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve env`
- Missing lifecycle operations.
- Missing: `suspend`, `resume`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve job`
- Missing attachment workflow variants and batch variants beyond existing documented coverage.
- Missing: `attach`, `attachments`, `attachment`, `batch` (if not documented in your current section state; docs should explicitly confirm every implemented branch).
- Documented only partial command list in appendix as observed.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve org`
- Missing: `spend`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

#### `eve project`
- Missing: `spend`, `bootstrap`.
- Files impacted:
  - `website/docs/reference/cli-appendix.md`

### 3) Reference overview mismatches
- `website/docs/reference/cli-commands.md` does not surface complete command discovery surface for `providers` and `models`.
- The appendix already uses per-command links and should include the missing top-level entries consistently.

## OpenAPI and identity/reference mismatch findings

### 4) Stale command examples and invalid CLI names in `openapi`
- `website/docs/reference/openapi.md` documents SSH challenge example using `eve login`.
- Current CLI surface is `eve auth login` (within auth namespace).
- This causes incorrect copy/paste failures and confusion.

- `website/docs/reference/openapi.md` documents service principal operations using command names not in current CLI:
  - `eve service-principal create`
  - `eve service-principal mint-token`
- Current CLI equivalents are under `eve auth`:
  - `eve auth create-service-account`
  - `eve auth list-service-accounts`
  - `eve auth revoke-service-account`
- API path references in the same doc currently mix legacy assumptions; this should be aligned to current API route names and current CLI wording.

- `website/docs/reference/openapi.md` includes `eve api health` and `eve api version` examples in places where command availability does not reflect the same names in code discovery.
- Update guidance to use actual API endpoint invocation patterns and CLI behavior.

### 5) Manifest schema mismatch
- `website/docs/reference/manifest-schema.md` documents `x-eve.defaults` keys that do not match the current schema.
- Code schema in `../../incept5/eve-horizon/packages/shared/src/schemas/manifest.ts` defines `ManifestDefaultsSchema` with:
  - `harness_preference`
  - `git`
  - `workspace`
- Docs currently describe additional/legacy keys (for example, `harness`, `harness_profile`, `harness_options`, `hints`) in `x-eve.defaults`.
- This is a correctness issue for teams relying on generated config and IDE hints.

## Additional observations
- CLI docs around `eve fs sync` show partial action coverage in single-row format and omit detailed per-subcommand structure consistency with other command families.
- Not a functional bug by itself, but it makes discoverability and troubleshooting uneven versus the rest of `cli-appendix`.

## Recommended fixes by priority

### Priority 1 (user-facing breakage risk)
1. Add missing command families and subcommands in:
   - `website/docs/reference/cli-appendix.md`
   - `website/docs/reference/cli-commands.md`
2. Correct all invalid examples in:
   - `website/docs/reference/openapi.md`

### Priority 2 (data-quality correctness)
1. Align `website/docs/reference/manifest-schema.md` with `ManifestDefaultsSchema` and nested structures currently supported by code.
2. Add deprecation note and migration mapping for older service-principal terminology where API docs mention legacy command names.

### Priority 3 (documentation quality/consistency)
1. Normalize subcommand matrix formatting so each top-level command has explicit subcommand sections consistently.
2. Add explicit examples using current syntax for each newly documented command group.

## Suggested implementation sequence
1. Patch CLI docs first: `cli-commands` + `cli-appendix`.
2. Correct `openapi` and identity examples.
3. Reconcile manifest schema docs and add regression note.
4. Add CI or lint check that fails when command surface in docs diverges from CLI index/subcommand list.

## Verification checklist for post-edit review
- `cli-commands` and `cli-appendix` list every top-level command present in code registry.
- Each top-level command includes documented subcommands matching CLI switch handling.
- No command examples in docs reference removed/legacy names.
- `manifest-schema` keys in docs reflect current schema exactly or include explicit compatibility notes.

## Suggested follow-up
- If you want, I can produce a companion PR patch set that updates all affected docs files from this plan with concrete copy-ready section templates.
