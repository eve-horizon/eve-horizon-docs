# Docs Suggestion Admin — Design

> Incept5 team members suggest documentation improvements via an admin page.
> Each suggestion becomes an Eve job in `ready` state, picked up by an agent
> that implements the change and pushes to `main` — triggering auto-deploy.

---

## The Loop

```
Incept5 member → Admin UI → POST /api/suggest → Eve Job (ready)
    → Agent claims job → edits docs → commits to main
    → GitHub webhook → deploy pipeline → staging updated
```

One sentence in the admin page, one deployed improvement minutes later.

---

## 1. Authentication

### Why Eve SSO

The docs site is public (`ingress.public: true`), but the admin page must be
restricted to Incept5 org members only. Eve provides a dedicated SSO service
and RS256 JWTs with org membership claims — we lean on that entirely.

Reference implementation: `sentinel-mgr` (same pattern, proven in production).

### Flow

```
Browser                    Eve SSO                  Docs Server
  │                            │                       │
  ├─ GET /admin ──────────────►│                       │
  │  (no token in session)     │                       │
  │  show "Sign in" button     │                       │
  │                            │                       │
  ├─ redirect ────────────────►│                       │
  │  sso.eh1.incept5.dev/login │                       │
  │  ?redirect_to=/admin       │                       │
  │                            │                       │
  │  (user authenticates)      │                       │
  │                            │                       │
  │◄── redirect + eve_sso cookie                       │
  │                            │                       │
  ├─ GET sso/session ─────────►│                       │
  │  (credentials: include)    │                       │
  │◄── { access_token } ──────┤                       │
  │                            │                       │
  │  store token in                                    │
  │  sessionStorage                                    │
  │                            │                       │
  ├─ POST /api/suggest ────────┼──────────────────────►│
  │  (Authorization: Bearer…)  │                       │
  │                            │       JWKS verify     │
  │                            │       (jose, cached)  │
  │                            │       check orgs[]    │
  │                            │       for org_Incept5 │
  │◄── 201 Created ───────────┼──────────────────────┤
```

### Token Handling

- **SSO redirect**: `/admin` checks `sessionStorage` for a cached token. If
  absent, checks for an `eve_sso` cookie (set by prior SSO login). If neither,
  shows "Sign in with Eve SSO" button that redirects to Eve SSO.
- **SSO URL discovery**: `GET /api/auth-config` returns `{ sso_url }`, derived
  from `EVE_PUBLIC_API_URL` by replacing `api.` with `sso.` (convention).
- **Session exchange**: After SSO redirect-back, the `eve_sso` cookie is present.
  Frontend calls `${ssoUrl}/session` with `credentials: 'include'` to exchange
  the cookie for an `access_token` (RS256 Eve JWT).
- **Verification**: On every API call, the docs server validates the JWT locally
  using `jose` + `createRemoteJWKSet` against Eve's JWKS endpoint. The `orgs`
  claim in the JWT contains org membership — check for `org_Incept5`. **No
  per-request call to Eve's API.** JWKS keys are cached by `jose` automatically.
- **No session state**: Stateless JWT verification. The docs server stores
  nothing. Tokens expire per Eve's standard TTL.
- **Token storage**: `sessionStorage` (cleared on tab close). Not localStorage.

### Implementation Notes

- Eve SSO lives at `sso.{cluster-domain}` (e.g., `sso.eh1.incept5.dev`).
  Endpoints: `/login?redirect_to=<url>` (redirect), `/session` (token exchange).
- The JWKS URL is derived from `EVE_API_URL`: `${EVE_API_URL}/.well-known/jwks.json`.
  Both `EVE_API_URL` and `EVE_PUBLIC_API_URL` are auto-injected by the platform.
- Use the `jose` npm package for JWKS verification (`createRemoteJWKSet` +
  `jwtVerify`). This is the same pattern used by sentinel-mgr.
- Role mapping: Eve `owner`/`admin` → app `admin`; others → `viewer`.
- Token-paste fallback: also accept a manually pasted Eve JWT (`eve auth token`)
  for cases where SSO redirect doesn't work (dev, headless).

---

## 2. Admin Page

### Route: `/admin`

A single-page React app served by Docusaurus as a standalone page (using
`@docusaurus/plugin-content-pages` or a custom page in `website/src/pages/admin.tsx`).

### UI

```
┌──────────────────────────────────────────────────────┐
│  Eve Horizon Docs                        [User ▼]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Suggest a Docs Improvement                          │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Page (dropdown / autocomplete)                 │  │
│  │ e.g. /docs/guides/pipelines                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ What should change?                            │  │
│  │                                                │  │
│  │ Free-form text area. Describe what's wrong,    │  │
│  │ what's missing, or what would be better.       │  │
│  │                                                │  │
│  │ Supports markdown.                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Priority:  ○ Low  ● Normal  ○ High             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [ Submit Suggestion ]                               │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Recent Suggestions                    [Refresh]     │
│                                                      │
│  ┌─────────┬──────────────────────┬────────┬──────┐  │
│  │ Status  │ Page                 │ By     │ When │  │
│  ├─────────┼──────────────────────┼────────┼──────┤  │
│  │ ● done  │ /docs/guides/agents  │ adam   │ 2m   │  │
│  │ ◐ active│ /docs/quickstart     │ jane   │ 5m   │  │
│  │ ○ ready │ /docs/cli-reference  │ adam   │ 8m   │  │
│  └─────────┴──────────────────────┴────────┴──────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Key Elements

- **Page selector**: Populated from the Docusaurus route manifest (generated at
  build time as a JSON file — e.g., `routes-manifest.json`). Autocomplete with
  fuzzy matching.
- **Description**: Markdown-enabled textarea. No length limit but guide toward
  being specific ("Add an example of…", "The CLI flag --foo is missing from…").
- **Priority**: Maps to Eve job priority (Low=3, Normal=2, High=1).
- **Recent suggestions**: Fetched from Eve's job list API, filtered to
  suggestion-type jobs for this project. Shows live status.

---

## 3. API Endpoint

### `POST /api/suggest`

Added to `server.mjs`. Accepts the suggestion, creates an Eve job.

```
Request:
  Authorization: Bearer <eve-jwt>
  Content-Type: application/json

  {
    "page": "/docs/guides/pipelines",
    "description": "Add an example showing parallel pipeline steps",
    "priority": 2
  }

Response:
  201 Created
  {
    "job_id": "evdocs-a3f2dd12",
    "status": "ready",
    "url": "https://api.eh1.incept5.dev/jobs/evdocs-a3f2dd12"
  }
```

### Server-Side Logic

```
1. Validate JWT locally → jose.jwtVerify(token, jwks)
   - JWKS from EVE_API_URL/.well-known/jwks.json (cached by jose)
   - Check type === 'user', verify orgs[] includes EVE_ORG_ID
2. Build job payload:
   - title: "Docs suggestion: {page}"
   - description: user's markdown description
   - phase: ready (default)
   - priority: from request
   - labels: ["docs-suggestion", page-slug]
   - metadata: { suggested_by, page, timestamp }
3. Create workflow job → POST /projects/{project_id}/workflows/docs-suggestion/invoke
   with `{ "input": { "page": "...", "description": "...", "priority": 2 } }`
   and the EVE_API_TOKEN bearer token.
4. Return job ID + status
```

### Service Token

The docs server needs a long-lived Eve token to invoke workflows and list jobs.
Use `eve auth mint` (same pattern as sentinel-mgr):

```bash
# Mint a long-lived token scoped to the project
eve auth mint \
  --email docs-bot@evdocs.eve \
  --project proj_01khygftvpf24t3yyetbkk9nyn \
  --role admin \
  --ttl 90
```

The resulting token is stored as an Eve secret:

```bash
eve secrets set EVE_API_TOKEN <token> --project proj_01khygftvpf24t3yyetbkk9nyn
```

And interpolated in the manifest:

```yaml
x-eve:
  requires:
    secrets: [EVE_API_TOKEN]

services:
  docs:
    environment:
      # EVE_API_URL, EVE_PUBLIC_API_URL, EVE_PROJECT_ID, EVE_ORG_ID
      # are auto-injected by the platform.
      EVE_API_TOKEN: ${secret.EVE_API_TOKEN}
```

### `GET /api/suggestions`

Returns recent suggestion jobs for the admin dashboard.

```
Request:
  Authorization: Bearer <eve-jwt>

Response:
  {
    "suggestions": [
      {
        "job_id": "evdocs-a3f2dd12",
        "page": "/docs/guides/pipelines",
        "description": "Add parallel steps example",
        "status": "done",
        "suggested_by": "adam",
        "created_at": "2026-02-27T10:30:00Z"
      }
    ]
  }
```

Fetched via `GET /projects/{project_id}/jobs` using `EVE_API_TOKEN`,
filtered by workflow label convention.

---

## 4. Job Design

### What the Agent Receives

When the orchestrator claims the job, the agent gets:

```yaml
Title: "Docs suggestion: /docs/guides/pipelines"
Description: |
  ## Suggestion
  Add an example showing parallel pipeline steps.

  ## Context
  - Page: /docs/guides/pipelines
  - Source file: website/docs/guides/pipelines.md
  - Suggested by: adam (Incept5)
  - Priority: Normal

  ## Instructions
  1. Read the target page and understand its current content
  2. Implement the suggested improvement
  3. Keep the existing style, tone, and structure
  4. Follow the design system in private-docs/ideas/design-refactor-plan.md
  5. If the suggestion is unclear or would harm the docs, add a comment
     explaining why and move the job to review instead of done

Labels: [docs-suggestion, guides-pipelines]
Phase: ready
```

### Page-to-File Mapping

The job description includes the source file path. This mapping is deterministic:

```
/docs/guides/pipelines  →  website/docs/guides/pipelines.md
/docs/quickstart        →  website/docs/get-started/quickstart.md
/docs/reference/cli     →  website/docs/reference/cli.md
```

Generated from the Docusaurus sidebar config at suggestion time and embedded in
the job description so the agent doesn't have to figure it out.

### Git Controls

The job uses the same git automation as `sync-docs`:

```yaml
git:
  ref: main
  commit: auto
  push: on_success
```

Agent edits the file, Eve Worker commits and pushes. Push to `main` triggers the
deploy pipeline. Staging updates automatically.

### Guardrails

- **Scope**: The agent should only modify the target page file. If the suggestion
  requires changes to multiple files, it should create child jobs.
- **Review escape hatch**: If the suggestion is ambiguous, the agent moves the
  job to `review` instead of `done`, adding a comment with its interpretation.
- **No destructive changes**: The agent prompt explicitly forbids deleting pages
  or removing existing content unless the suggestion clearly calls for it.

---

## 5. Workflow Definition

Add a new workflow to the manifest for processing suggestions:

```yaml
workflows:
  docs-suggestion:
    trigger:
      manual: true
    hints:
      permission_policy: auto_edit
    git:
      ref: main
      commit: auto
      push: on_success
    steps:
      - agent:
          prompt: |
            You are the eve-horizon-docs improvement agent.

            ## Job Context
            Read your job description for the suggestion details including
            the target page path and the requested change.

            ## Instructions
            1. Read the target markdown file
            2. Read private-docs/ideas/design-refactor-plan.md for style guidance
            3. Implement the suggested improvement
            4. Keep changes minimal and focused on the suggestion
            5. Preserve existing content, tone, and formatting
            6. If the suggestion is unclear or would degrade the docs,
               add a job comment explaining your concern and set phase to review
```

This workflow is `manual: true` — it is only invoked programmatically from
`/api/suggest` via `POST /projects/{project_id}/workflows/docs-suggestion/invoke`.
The orchestrator creates a workflow job with that workflow metadata and claims it
normally.

---

## 6. Manifest Changes

```yaml
x-eve:
  requires:
    secrets: [EVE_API_TOKEN]

services:
  docs:
    build:
      context: ./website
    ports: [3000]
    environment:
      NODE_ENV: production
      # EVE_API_URL, EVE_PUBLIC_API_URL, EVE_PROJECT_ID, EVE_ORG_ID
      # are auto-injected by the platform — no need to declare them.
      EVE_API_TOKEN: ${secret.EVE_API_TOKEN}
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

workflows:
  sync-docs:
    # ... existing ...

  docs-suggestion:
    trigger:
      manual: true
    hints:
      permission_policy: auto_edit
    git:
      ref: main
      commit: auto
      push: on_success
    steps:
      - agent:
          prompt: |
            # ... as above ...
```

---

## 7. Implementation Plan

### Phase A: Backend (server + API)

1. **Service token**: `eve auth mint` for `docs-bot@evdocs.eve`, store as
   `EVE_API_TOKEN` secret
2. **Auth module**: Add to `server.mjs` — JWKS verification via `jose` +
   org membership check from JWT `orgs` claim. Copy pattern from sentinel-mgr.
3. **`GET /api/auth-config`**: Return `{ sso_url }` (derived from
   `EVE_PUBLIC_API_URL` by replacing `api.` → `sso.`).
4. **`POST /api/suggest`**: Validate auth, build job payload, invoke workflow endpoint
5. **`GET /api/suggestions`**: List recent suggestion jobs
6. **Route manifest**: Generate `routes-manifest.json` during `pnpm build` (a
   Docusaurus plugin or postbuild script that lists all doc paths)

### Phase B: Admin UI

7. **`/admin` page**: `website/src/pages/admin.tsx` — SSO login, suggestion
   form, recent suggestions table
8. **Auth flow**: Eve SSO redirect → `eve_sso` cookie → `/session` exchange →
   `sessionStorage`. Token-paste fallback for dev. Copy `useAuth` pattern from
   sentinel-mgr.
9. **Page autocomplete**: Load `routes-manifest.json`, fuzzy search
10. **Status polling**: Refresh suggestion list on interval or after submit

### Phase C: Agent Workflow

11. **Workflow definition**: Add `docs-suggestion` to manifest
12. **Agent prompt**: Tuned for single-page edits with style guide reference
13. **Manifest sync**: `eve project sync` to register the workflow
14. **Test end-to-end**: Submit suggestion → job created → agent picks up →
    commits → deploys → verify on staging

### Phase D: Polish

15. **Rate limiting**: Max 10 suggestions per user per hour
16. **Notification**: Slack/email when a suggestion is implemented (via Eve events)
17. **Cancel/edit**: Allow the submitter to cancel their own pending suggestion
18. **Bulk view**: Admin dashboard showing all suggestion jobs with filtering

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Unauthorized access | JWKS JWT verification (local, no API call) + Incept5 org membership from `orgs` claim |
| Prompt injection via suggestion text | Agent operates in a sandboxed Eve Worker with scoped permissions. Suggestion text is treated as data in the job description, not executable instructions. The agent prompt is fixed. |
| Token leakage | Service token stored as Eve secret, never in client code. User JWTs are short-lived. `sessionStorage` only (cleared on tab close) — never `localStorage`. |
| Spam/abuse | Rate limiting + org-member-only access (small trusted group) |
| Agent going rogue | `auto_edit` policy means the agent can only edit files, not run arbitrary commands. Git controls ensure only `main` branch, auto-commit. Review escape hatch for ambiguous suggestions. |
| Scope creep | Agent prompt restricts changes to the target file. Child jobs for multi-file changes. |

---

## 9. Why This Architecture

**Eve-native**: Rather than building a custom backend with a database for
suggestions, we use Eve jobs as the persistence and orchestration layer. Every
suggestion is a first-class job with full lifecycle tracking, agent execution,
and git automation. No new infrastructure.

**Proven pattern**: The auth flow (Eve SSO + JWKS + org check) is lifted
directly from sentinel-mgr, which runs this in production. The docs site
adapts the same `useAuth` hook, auth-config endpoint, and JWKS verification.

**Minimal server changes**: The docs server gains three endpoints
(`/api/auth-config`, `/api/suggest`, `/api/suggestions`) and a JWKS
verification module (~50 lines with `jose`). It remains a thin proxy — all
state lives in Eve.

**Closed loop**: Suggest → implement → deploy is fully automated. An Incept5
member types a sentence, and minutes later the improvement is live on staging.
No PRs, no manual review (unless the agent flags uncertainty), no context
switching.

**Dogfooding**: This is Eve's job system doing what it was built for — humans
describe intent, agents execute. The docs site becomes a showcase for the
platform it documents.

---

## 10. Platform Simplification Opportunities

Building this feature surfaced repeated boilerplate that every Eve web app has
to implement. Potential platform improvements:

### `@eve/auth` npm package

Extract the JWKS verification + org check into a shared package. Every Eve web
app reimplements the same ~250 lines (sentinel-mgr `auth.service.ts` is the
canonical example). A package could provide:

```typescript
import { createEveAuth } from '@eve/auth';

// Express middleware — validates JWT, checks org, populates req.user
const auth = createEveAuth({
  // Defaults to EVE_API_URL/.well-known/jwks.json (auto-derived)
  // Defaults to EVE_ORG_ID from env (auto-injected by platform)
});

app.use('/api', auth.middleware());     // optional auth (populates req.user)
app.post('/api/suggest', auth.required(), handleSuggest);  // required auth
```

Includes: JWKS caching, org membership check, role mapping, token-from-header
and token-from-query (for SSE), AuthUser type.

### `@eve/auth-react` package

Extract the `useAuth` hook and `LoginForm` component:

```tsx
import { useEveAuth, EveLoginForm } from '@eve/auth-react';

function AdminPage() {
  const { user, loading, startSsoLogin, logout } = useEveAuth();

  if (!user) return <EveLoginForm />;
  return <Dashboard user={user} />;
}
```

Includes: SSO redirect, `eve_sso` cookie detection, `/session` exchange,
`sessionStorage` token management, token-paste fallback.

### Auto-inject `EVE_SSO_URL`

The `api.` → `sso.` URL derivation is a convention that could break. Auto-inject
`EVE_SSO_URL` alongside the other platform vars (`EVE_API_URL`, `EVE_PUBLIC_API_URL`,
etc.) so apps don't have to derive it.

### Document Eve SSO

The SSO service (`sso.{domain}`) and its endpoints (`/login?redirect_to=`,
`/session`) aren't documented in the platform reference. Adding docs would
eliminate the need to reverse-engineer the flow from sentinel-mgr source code.
