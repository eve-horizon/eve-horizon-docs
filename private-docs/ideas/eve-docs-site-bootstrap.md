# Bootstrap plan: first-class Eve Horizon docs site (Docusaurus + Mermaid)

## Purpose

Build a first-class docs site that serves:

- human-friendly onboarding and reference docs
- deep-dive technical docs for advanced users
- fast public search and agent-friendly access paths (`/api/search`, `llms.txt`) without pgvector/RAG in phase one
- a private update flow that manually refreshes docs from `eve-horizon` source with human approval gates
- explicit accessibility and usability standards from launch (keyboard-first flows, contrast, navigation clarity)

## Target outcomes

- polished, approachable docs for new users
- highly discoverable, fast paths for advanced users (search-first with keyboard shortcut)
- reliable, auditable updates from source with human review
- a lightweight public discovery API for agents and scripts
- accessible, performant, SEO-friendly static site

## Repo bootstrap structure

```
eve-horizon-docs/
├── private-docs/ideas/          # planning and architecture notes (git-ignored from website)
├── private-skills/update-eve-docs/  # manual sync skill
├── website/                     # Docusaurus app
│   ├── docs/                    # markdown/MDX content
│   ├── blog/                    # changelog and announcements
│   ├── src/
│   │   ├── pages/               # custom pages (homepage, search)
│   │   ├── components/          # shared React components
│   │   └── css/                 # custom styles (dark/light tuning)
│   ├── static/
│   │   ├── llms.txt             # build-generated agent discovery file
│   │   └── llms-full.txt        # build-generated full content for agents
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   └── package.json
└── .eve/manifest.yaml           # Eve deployment manifest
```

## Deployment target

Deployed as a single Eve service. The Dockerfile builds Docusaurus to static HTML, then serves it via a lightweight Node server (Express or Fastify) that also handles the `/api/search` endpoint. One container, one port, no separate infra for the search API.

Ingress is public.

```yaml
# .eve/manifest.yaml (sketch)
schema: eve/compose/v2
project: eve-horizon-docs

registry: "eve"
services:
  docs:
    build:
      context: ./website
    ports: [3000]
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 3s
      retries: 3
    x-eve:
      ingress:
        public: true
        port: 3000

environments:
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required

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

```

### Container architecture

```
Dockerfile (multi-stage):
  Stage 1 (build): pnpm build → static HTML in /app/build
  Stage 2 (serve): lightweight Node server
    - serves static files from /app/build
    - handles GET /api/search (reads search index JSON from build output)
    - handles GET /api/health (liveness check)
    - add a minimal built-in Node healthcheck script to avoid curl dependency in runtime image
```

## Information architecture

Audience split:
- **Primary**: new users — fastest path to understand, install, and ship.
- **Secondary**: advanced users — prominent search bar (Cmd+K), deep links into reference, troubleshooting.

Sidebar structure:

```
Get Started
├── What is Eve Horizon?
├── Quickstart
├── Core Concepts
└── Your First Deploy

Guides
├── Manifest Authoring
├── Pipelines & Workflows
├── Agent Teams
├── Local Dev Loop
└── Secrets & Auth

Reference
├── CLI Commands
├── Manifest Schema
├── API Reference
├── Jobs & Orchestration
└── Events & Webhooks

Agent Integration
├── Agent-Native Design
├── Private Skills
├── Memory & Storage
└── llms.txt Spec

Troubleshooting
├── Common Issues
├── Debug Playbooks
└── FAQ

Changelog
```

Navigation priorities:
- Homepage has two clear paths: "Get Started" (primary CTA) and search bar
- Every page has breadcrumbs and "Edit this page" link
- Reference pages have anchor links for every field/flag

## Mermaid conventions

Mermaid is enabled via `@docusaurus/theme-mermaid`. Strict readability rules:

- Max ~9 nodes per diagram (split complex flows into multiple diagrams)
- One concept per diagram
- Short explanatory text before and after each diagram
- Restrained palette: 3-4 colors max, consistent across dark/light modes
- Use `%%` comments in Mermaid source for maintainability

Include a **Diagram Style Guide** page under Reference that documents:
- Approved node shapes and color tokens
- Dark/light theme Mermaid config (via `mermaid` key in `docusaurus.config.ts`)
- Reusable diagram patterns (deploy flow, job lifecycle, pipeline steps)
- Anti-patterns to avoid (walls of nodes, unlabeled edges, mixed diagram types)

## Docusaurus setup

- Docusaurus 3.x with TypeScript config
- MDX pages for rich content (tabs, admonitions, code blocks with line highlighting)
- Built-in dark/light toggle with tuned color systems for both modes
- Mobile-first responsive layout
- Concise homepage: hero + two CTA paths + featured diagram
- `@docusaurus/theme-mermaid` for diagram rendering
- `@docusaurus/plugin-ideal-image` for optimized static assets
- Algolia DocSearch or `docusaurus-search-local` for client-side search (free, no backend)
- Prefer `@easyops-cn/docusaurus-search-local` for phase-one to avoid external service dependencies

## Search and agent discoverability (phase one)

### Client-side search
Use Docusaurus local search plugin (offline index, no external service). Cmd+K keyboard shortcut for humans.

### API search endpoint
The same Node server that serves static docs also handles `/api/search`. At startup, it loads the search index JSON generated by the Docusaurus build. No separate service or external infra needed.

- `GET /api/search?q=<query>&limit=10`
- Validation:
  - `q` is required and must be at least 2 characters
  - `limit` defaults to `10` and hard-caps at `25`
- Response: `{ results: [{ title, snippet, path, section, tags }] }`
- Query and snippet fields are treated as untrusted input/output and escaped before return
- Curl-friendly: `curl https://docs.eve-horizon.dev/api/search?q=manifest`

The search index is built at Docusaurus build time and bundled into the container image. Searches are fast in-memory lookups — no database, no external service.

### `llms.txt` and `llms-full.txt`
Generated at **build time** via a Docusaurus plugin or post-build script that:
- Walks all `docs/` markdown files
- Produces `llms.txt` (title + one-line summary + URL per page)
- Produces `llms-full.txt` (full rendered text, stripped of HTML)
- Output to `build/` so they're served as static files by the same container
- Generation is deterministic (`sorted path order + normalized spacing`) to keep reviews clean

## Local development

All development and verification happens locally via pnpm. No Eve deploy needed to iterate.

```bash
cd website
pnpm install              # install dependencies
pnpm start                # dev server with hot reload (localhost:3000)
pnpm build                # production build (catches broken links, bad imports)
pnpm lint                 # docs + TS lint + markdown style checks
pnpm serve                # preview production build locally
```

- `pnpm start` is the primary dev loop — hot reload, fast feedback
- `pnpm build` is the verification gate — run before committing to catch broken links and build errors
- `pnpm lint` is required after content updates and before commit
- `pnpm serve` previews the production build locally (useful for testing search index, `llms.txt`, dark/light modes)

Eve deployment is only for staging/production — not part of the dev loop.

## Content standards

Before authoring docs, establish:
- **Style guide**: voice (direct, second-person), tense (present), max heading depth (h3 in most pages)
- **Page template**: every doc page has frontmatter (`title`, `description`, `sidebar_position`), an intro paragraph, and a "What's next?" footer link
- **Code examples**: runnable where possible, with copy button, syntax highlighting, and file path annotations
- **Admonition usage**: `tip` for best practices, `warning` for breaking changes, `info` for context, `danger` for irreversible operations

## Private sync skill and human review gate

Create a manual private skill (`private-skills/update-eve-docs/`) with no cron/scheduler:

Steps:
1. `crawl_source`: Pull latest content from eve-horizon source repo.
   - Source path is **configurable** (default: `../eve-horizon`, branch `main`). Do not hardcode.
   - Read from skill config or env var `EVE_SOURCE_REPO`.
2. `transform`: Normalize headings, links, Mermaid notation to match docs site conventions.
3. `build_preview`: Run `pnpm install && pnpm lint && pnpm build` in `website/` to verify no broken links or build errors.
4. `diff_audit`: Classify changes as structural (new pages, removed pages, nav changes) vs. copy (wording, typos, examples).
5. `artifact_check`: Confirm generated `build/llms.txt`, `build/llms-full.txt`, and search index files are present and deterministic across repeated runs.
6. `open_pr`: Create PR with:
   - Structured review summary (structural changes highlighted separately)
   - Suggested commit message
   - Link to preview deployment

Human review behavior:
- Skill proposes updates and asks for approval
- Approver may accept, modify, or defer changes before merge
- Structural changes require explicit signoff; copy changes can be fast-tracked

## Test plan

### CI checks

1. **Build/quality pipeline (must pass for every PR)**
   - `pnpm install`
   - `pnpm lint`
   - `pnpm build`
   - Required checks:
     - no link/build errors
     - no lint failures in docs + site code
     - generated artifacts exist: search index, `llms.txt`, `llms-full.txt`

2. **Search API contract**
   - Manual probes against running service:
     - `curl 'https://docs.eve-horizon.dev/api/search?q=manifest&limit=5'`
     - `curl 'https://docs.eve-horizon.dev/api/search?q=m&limit=5'` → `400`
     - `curl 'https://docs.eve-horizon.dev/api/search?q=manifest&limit=999'` → `limit` capped at `25`
   - Required checks:
     - JSON has `results` array and deterministic key order
     - snippet/title strings are plain text only
     - response time acceptable for p95 on staging budget (documented in release notes)

3. **Sync workflow smoke checks**
   - Execute private skill on a fixture branch with one doc move, one deletion, one content-only change
   - Validate that `diff_audit` marks each change class correctly
   - Verify PR body always includes:
     - a structural summary
     - generated preview link
     - generated artifact summary
   - Require explicit approval for structural class before merge

4. **Usability/accessibility checks**
   - Cmd+K keyboard flow reaches search and returns results without mouse input
   - Breadcrumb + TOC navigation works with tab/shift-tab on representative pages
   - Run one accessibility smoke test in CI (axe/Playwright) on homepage and a reference page
   - Validate Mermaid/diagram contrast in both light and dark themes

## Verification and CI/CD

**Local verification** (primary):
- `pnpm build` before committing — catches broken links, bad imports, build errors
- `pnpm serve` to preview production output locally
- Visual check of diagrams in both dark and light modes

**Eve deployment** (when ready for staging/production):
- Push to `main` triggers the `deploy` pipeline (build → release → deploy to staging)
- Production deploy requires manual approval (via manifest `approval: required`)
- PR preview environments can be added later if needed

## SEO and discoverability

- Generate `sitemap.xml` via `@docusaurus/plugin-sitemap`
- Add OpenGraph and Twitter meta tags per page (via frontmatter `description` + `image`)
- Set canonical URLs
- Structured data (JSON-LD) for documentation pages
- `robots.txt` allowing full crawl

## Accessibility

- Semantic HTML (Docusaurus provides this by default)
- Alt text on all images and diagrams
- Mermaid diagrams include `accDescription` attribute for screen readers
- Color contrast meets WCAG 2.1 AA in both light and dark modes
- Keyboard-navigable (Cmd+K search, Tab through nav)

## Bootstrap execution phases

### Phase 0 — Foundation
- Create repo layout (`website/`, `private-skills/`, `private-docs/`)
- Scaffold Docusaurus app with TypeScript config
- Configure Mermaid theme, dark/light modes, typography
- Wire `.eve/manifest.yaml` for Eve deployment (used later, not part of dev loop)
- Add `.gitignore` entries for `node_modules/`, `build/`, `.docusaurus/`
- **Done when**: `pnpm build` succeeds and `pnpm start` serves the site locally with placeholder content

### Phase 1 — Public docs release
- Author "Get Started" track (Quickstart through First Deploy)
- Author core Reference pages (CLI, Manifest Schema, Jobs)
- Write homepage with hero, CTA paths, and one featured diagram
- Integrate Mermaid conventions and build the Diagram Style Guide page
- Generate `llms.txt` / `llms-full.txt` at build time
- Add client-side search (local plugin)
- Set up SEO (sitemap, meta tags, robots.txt)
- **Done when**: a new user can go from homepage to deployed app following docs alone

### Phase 2 — Search API + private update workflow
- Implement `/api/search` endpoint in the docs server (in-memory search index)
- Implement private sync skill with configurable source path
- Add PR templates/checklist for structure-critical doc changes
- Add accessibility checks to CI
- **Done when**: agents can discover and search docs via API; sync skill produces a reviewable PR

### Phase 3 — Polish and scale
- Evaluate pgvector if free-text search proves insufficient for semantic queries
- Add versioned docs if Eve Horizon ships breaking changes across releases
- Add analytics (privacy-respecting: Plausible or self-hosted) to understand search patterns and drop-off
- Consider Algolia DocSearch upgrade if search volume warrants it
- **Done when**: search quality is validated against real user queries; docs track at least two versions if needed

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| No scheduled sync — docs drift from source | Users see stale content | Sync skill is fast to run manually; add drift detection (compare source timestamps) |
| Search endpoint misuse/abuse | Elevated load or noisy traffic | Add query/limit validation, response caps, and request rate-limiting |
| No pgvector — semantic recall gaps | Agents miss relevant pages | `llms-full.txt` provides full-text fallback; structured sidebar compensates |
| Search index grows large | Slow startup or memory pressure | Paginate index, lazy-load sections, monitor container memory |
| Mermaid diagrams unreadable in one theme | Bad experience in dark/light mode | Test every diagram in both modes during PR review |
| Source repo path hardcoded | Breaks if repo layout changes | Make configurable via env var or skill config |

## Bootstrap interview results (applied)

1. Sync mode: manual, ad hoc, run by a human.
2. Source repo: configurable path (default `../eve-horizon`), branch `main`.
3. Audience: new users are primary; advanced users get search-first (Cmd+K) and deep links.
4. RAG: deferred; free-text search + `llms.txt` first.
5. Public search only, with curl-friendly `/api/search` and `llms.txt`.
6. Approval: skill suggests updates, human approves/adapts before merge.

## Resolved decisions

- **API route**: `/api/search` (avoids collision with client-side `/search` page, standard REST convention)
- **Advanced user landing**: search-first with Cmd+K shortcut and prominent search bar on homepage
- **`/api/suggest`**: deferred to phase 3 — not MVP, adds complexity without clear user signal
