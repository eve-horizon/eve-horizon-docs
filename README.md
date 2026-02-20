# Eve Horizon Docs

Documentation site for [Eve Horizon](https://github.com/incept5/eve-horizon) — the platform for running AI-powered software engineering workflows against your codebase.

## What's here

- `website/` — Docusaurus application (public docs site)
- `private-docs/` — planning notes and internal design docs
- `private-skills/` — private update workflow definitions
- `.eve/manifest.yaml` — deployment configuration

## Local development

```bash
pnpm install
pnpm start      # dev server with hot reload
pnpm build      # production build
pnpm serve      # serve production build locally
```

## Design system

The site follows a custom design system documented in:

- **[Design Refactor Plan](private-docs/ideas/design-refactor-plan.md)** — color system, typography (Outfit / Geist / JetBrains Mono), component styling, Mermaid diagram conventions, and implementation details.

Key choices: dark-first with sky-blue accent, frosted-glass navbar, styled Mermaid diagrams, animated homepage hero with terminal mockup.

## Mermaid diagrams

Diagrams are styled globally via CSS — no per-diagram inline styles needed. When writing docs:

- Use `graph LR` for flows/pipelines, `graph TD` for hierarchies
- Keep node labels to 2-3 words
- Use subgraphs for grouping related nodes
- Always introduce a diagram with text before the code fence

See the Mermaid section of the design plan for full conventions.

## Source repo reference

The Eve Horizon source repository is normally expected at:

`../../incept5/eve-horizon`

If your checkout differs, update the skill config or environment overrides used by
`private-skills/update-eve-docs`.

## Deployment

Deployed via Eve Horizon under the **Incept5** org, project slug `evdocs`.

```bash
# First time: create a staging profile and login
eve profile create staging --api-url https://api.eh1.incept5.dev
eve profile use staging
eve auth login --email you@incept5.com --ssh-key ~/.ssh/id_ed25519.pub
eve profile set --org org_Incept5 --project proj_01khygftvpf24t3yyetbkk9nyn

# Sync manifest and deploy to staging
eve project sync --repo-dir .
eve env deploy staging --ref main --repo-dir .
```

The deploy pipeline builds the Docusaurus site, creates a release, and deploys it as a
single container (static HTML + Express for `/api/search` and `/api/health`).
