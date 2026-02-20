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

## References

- `private-docs/ideas/eve-docs-site-bootstrap.md` (plan and test plan)
- `README.md` (quick entry points)
