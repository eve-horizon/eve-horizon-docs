# Eve Horizon Docs - Agent Notes

## Project scope

- This repository is the bootstrap for the Eve Horizon docs site.
- Primary stack: Docusaurus (docs + local search), plus a lightweight Node server for
  `/api/search` and health endpoints.

## Repository layout

- `website/` contains the Docusaurus app.
- `private-docs/` contains planning and architecture notes.
- `private-skills/` contains private sync skill definitions.
- `.eve/manifest.yaml` defines deployment wiring.

## Design system

The site follows a custom design system. Key references:

- **`private-docs/ideas/design-refactor-plan.md`** — the canonical style guide covering
  colors, typography, component styling, Mermaid diagram conventions, and flair pieces.
- **Color palette:** Dark-first design with sky-blue accent (`#38bdf8` dark / `#0284c7` light).
- **Typography:** Outfit (headings), Geist (body), JetBrains Mono (code).
- **Mermaid diagrams:** Styled globally via CSS — never use inline Mermaid styles in docs.
  Use `graph LR` for pipelines, `graph TD` for hierarchies, keep node labels short.

When modifying styles, always check the design plan first and keep changes consistent
with the established system.

## Default source location

When syncing from the main Eve Horizon source, assume the checkout is located at:

`../../incept5/eve-horizon`

Do not hardcode this path in automation; read it from config/environment where possible.

## Useful commands

- `pnpm install`
- `pnpm start` (local dev)
- `pnpm lint`
- `pnpm build`
- `pnpm serve`

## Deployment

Eve staging environment under Incept5 org, project slug `evdocs`.

```bash
eve profile use staging
eve project sync --repo-dir .
eve env deploy staging --ref main --repo-dir .
```

- **Org:** Incept5 (`org_Incept5`)
- **Project:** Eve Horizon Docs (`proj_01khygftvpf24t3yyetbkk9nyn`, slug: `evdocs`)
- **Pipeline:** build → release → deploy (single `docs` service)

## References

- `private-docs/ideas/design-refactor-plan.md` (style guide)
- `private-docs/ideas/eve-docs-site-bootstrap.md` (plan and test plan)
- `private-docs/ideas/docs-content-outline.md` (content tree)
- `README.md` (quick entry points)
