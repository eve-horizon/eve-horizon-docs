# Eve Horizon Docs Bootstrap

This repository contains the bootstrap plan and implementation scaffolding for the
Eve Horizon documentation site.

## What’s here

- `website/` — Docusaurus application for the public docs site.
- `private-docs/` — planning notes and internal design docs.
- `private-skills/` — private update workflow definitions.
- `.eve/manifest.yaml` for deployment configuration.

## Local development

```bash
pnpm install
pnpm start
pnpm build
pnpm lint
pnpm serve
```

## Source repo reference

The Eve Horizon source repository this docs effort references is normally expected at:

`../../incept5/eve-horizon`

If your checkout differs, update the skill config or environment overrides used by the
`private-skills/update-eve-docs` flow.

## Deployment

- Docs are deployed as a single Eve service (static site + search endpoints in one
  container).
- Search and agent-discovery artifacts are generated at build time.

See `private-docs/ideas/eve-docs-site-bootstrap.md` for the full plan and execution phases.
