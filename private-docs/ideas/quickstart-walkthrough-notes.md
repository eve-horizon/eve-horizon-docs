# Quickstart Walkthrough Notes

> Captured from live testing on 2026-02-23. Alex Chen = fictional new user with a fresh SSH key, no GitHub account, no prior Eve access.

## What we're building

A quickstart that takes a new user from zero to a deployed fullstack app (React frontend + NestJS backend, managed DB, Eve registry). The user has an AI coding agent (Claude Code, Codex, etc.) doing the heavy lifting — our instructions are for the human.

## Tested flow

### 1. Install the CLI

```bash
npm install -g @eve-horizon/cli
eve --version
```

Works cleanly. Prerequisites are just Node.js 22+ and Git.

### 2. Get access (new user)

> **No profile needed yet.** The CLI defaults to the staging API. Profile creation only matters later when setting org/project defaults.

Two paths available:

**Path A: Admin invites you (push model)**

Admin runs:
```bash
eve admin invite --email you@example.com --github your-github-username
eve admin invite --email you@example.com --ssh-key ~/.ssh/id_ed25519.pub --org org_xxx
```

Supports `--github` (auto-discovers keys), `--ssh-key` (raw pubkey file), or `--web` (email invite).

**Path B: Self-service request (pull model)**

User runs:
```bash
eve auth request-access --org "Org Name" --ssh-key ~/.ssh/id_ed25519.pub --email you@example.com --wait
```

This submits a request and polls until approved. Admin approves with:
```bash
eve admin access-requests approve <request_id>
```

**Tested:** Path B worked — request submitted, admin approved, user confirmed approved via `--status`.

### 3. Log in

```bash
eve auth login --email you@example.com --ssh-key ~/.ssh/id_ed25519
```

Note: `--ssh-key` points to the **private** key (not .pub). The `--email` flag is required.

Works after access is approved.

### 4. Create an org

```bash
eve org ensure "My Company" --slug myco
```

Works. Returns org ID like `org_MyCompany`.

**Former bug (FIXED v0.1.143):** Org creator was getting `member` role instead of `owner`. Now fixed — permissions resolve correctly via per-org memberships (34 perms including all write/admin). Note: `whoami` display still shows `Role: member` but actual permissions are correct.

### 5. Create a project

```bash
eve project ensure --name "My App" --slug myapp
```

Works. Returns project ID.

### 6. Initialize the repo (from template)

```bash
eve init my-project
```

Works well. Downloads starter template, strips git history, inits fresh repo, installs all 24 skills across 39 agent configurations.

**Important:** The generated `.eve/manifest.yaml` has `project: eve-starter` — must be changed to match the actual project slug before syncing.

### 7. Set profile defaults

Run from inside the project directory:
```bash
eve profile create staging --api-url https://api.eh1.incept5.dev
eve profile use staging
eve profile set --org org_xxx --project proj_xxx
```

**Key learning:** The CLI reads `.eve/profile.yaml` relative to cwd. Must create profile in the project directory, not elsewhere. Running from wrong directory causes 401 errors.

### 8. Update manifest project slug

Edit `.eve/manifest.yaml` and change `project: eve-starter` to your actual slug (e.g. `project: myapp`).

### 9. Sync manifest to platform

```bash
eve project sync
```

**Works:**
```
✓ Manifest synced to proj_xxx
  Hash: e8cc7d593d0c...
  Git SHA: 42fb6b42
  Branch: main
```

### 10. Deploy to sandbox

```bash
eve env deploy sandbox --ref main
```

**Partially works:** The command resolves the ref, uses the manifest, creates a release — but the pod fails readiness check because the project has no `repo_url` set. The platform can't clone the code to build.

```
HTTP 503: Deployment failed readiness check for release rel_xxx (0/1 replicas ready)
```

**Missing step:** Need to push to GitHub and link the repo:
```bash
# Push to GitHub first, then:
eve project update proj_xxx --repo-url https://github.com/you/my-app
```

Or set repo-url at project creation time:
```bash
eve project ensure --name "My App" --slug myapp --repo-url https://github.com/you/my-app
```

### 9. Push to GitHub and link repo

```bash
gh repo create eve-horizon/eve-quickstart --public --source . --push
eve project update proj_xxx --repo-url https://github.com/eve-horizon/eve-quickstart
```

Works. Project now has `repo_url` set so the platform can clone and build.

### 10. Deploy

```bash
eve env deploy sandbox --ref main
```

**Works perfectly.** `eve env deploy` is the single deploy command — when the environment has a pipeline configured in the manifest, it automatically triggers the full build → release → deploy flow:

```
Resolved ref 'main' → 3666f989...
Deploying commit 3666f989 to sandbox...
Using manifest e8cc7d59...

Deployment submitted.
  Release ID:  rel_xxx
  Environment: sandbox
  Status:      ready (1/1 ready)
```

The app is live at the environment URL.

**Correction:** Earlier testing with `eve env deploy` failed because the project had no `repo_url` set — not because it lacked a pipeline. Once `repo_url` was linked, `eve env deploy` works correctly and triggers the pipeline automatically. The `--direct` flag bypasses the pipeline for debugging. `eve pipeline run` exists for ad-hoc pipeline execution but is not the primary deploy path.

### 11. Verify the deployed app

```bash
curl https://api.alexdev-evqs-sandbox.eh1.incept5.dev/health
# {"status":"ok"}

curl https://api.alexdev-evqs-sandbox.eh1.incept5.dev/todos
# []

curl -X POST .../todos -H "Content-Type: application/json" -d '{"title":"Hello from Eve"}'
# {"id":1,"title":"Hello from Eve","completed":false,...}
```

Frontend HTML also served at root `/`. Full stack working.

### Steps not yet tested

- `eve agents sync` to push agent config
- Running a job against the project
- Adding frontend service, managed DB to manifest

## Starter template observations

The `eve init` template includes:
- `apps/api/` — A complete todos API (Node.js, raw http, in-memory store) with OpenAPI spec, health check, static file serving
- `apps/api/public/` — Simple HTML frontend
- `agents/` — Agent definitions (agents.yaml, teams.yaml, chat.yaml)
- `skills/` — 24 skills installed across 39 agent configs
- `.eve/manifest.yaml` — Single `api` service, sandbox + staging envs, CI/CD pipeline, remediation pipeline
- `.claude/`, `.cursor/`, `.windsurf/`, etc. — Universal agent support dirs
- `scripts/` — Helper scripts
- `docker-compose.yml` — Local dev

## Revised quickstart flow (for docs)

The natural order for a human is:

1. **Install CLI** — `npm install -g @eve-horizon/cli`
2. **Get access** — admin invite or self-service `request-access --wait`
3. **Log in** — `eve auth login --email`
4. **Create org** — `eve org ensure "My Org" --slug myorg`
5. **Create project** — `eve project ensure --name "My App" --slug myapp`
6. **Scaffold** — `eve init my-app` (run from parent dir)
7. **Configure** — update manifest project slug, set profile defaults in project dir
8. **Push to GitHub** — init remote, push
9. **Link repo** — `eve project update --repo-url`
10. **Sync** — `eve project sync`
11. **Deploy** — `eve env deploy sandbox --ref main` (auto-triggers pipeline if configured)
12. **Verify** — visit the app URL

Steps 7-8 could potentially be simplified by having `eve init` handle more of this (prompt for slug, create remote, etc).

## What the quickstart should NOT cover

- Profile creation details — CLI defaults to staging
- Detailed agent/team/chat configuration — that's a guide
- OAuth token syncing — that's advanced setup
- Troubleshooting auth edge cases — that's reference
- Editing the app code — agent does this

## What the quickstart SHOULD cover

- The happy path from zero to deployed app
- Minimal commands, maximum outcome
- Clear handoff points: "now let your agent take over"
- What the user does vs what the agent does

## UX friction points discovered

1. `eve auth login` requires `--email` — no way to discover user from SSH key alone
2. `eve init` doesn't prompt to update the project slug in manifest
3. Profile is per-directory (`.eve/profile.yaml`) — running commands from wrong dir causes confusing 401 errors
4. `eve project sync` uses project slug from manifest file, not from profile — confusing when they mismatch
5. `eve project ensure` doesn't set `repo_url` by default — deploy fails silently with readiness check error instead of a clear "no repo linked" message
6. The starter template has many agent directories (.cursor, .windsurf, .cline, etc.) which may overwhelm new users — though this is the universal agent support feature
7. Steps 5-10 (create project → deploy) involve too many manual steps — could `eve init` handle more of this flow?
