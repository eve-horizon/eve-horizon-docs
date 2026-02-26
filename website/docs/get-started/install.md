---
title: Install the CLI
description: Install the Eve Horizon CLI and verify it works.
sidebar_position: 2
---

# Install the CLI

The `eve` CLI is your primary interface to the platform — the same tool used by both humans and AI agents.

## Prerequisites

- **Node.js 22+** — Check with `node --version`.
- **Git** — Check with `git --version`.

## Install via npm

```bash
npm install -g @eve-horizon/cli
```

Or with pnpm:

```bash
pnpm add -g @eve-horizon/cli
```

:::tip
If you encounter permission errors with `npm install -g`, see the [npm docs on fixing global install permissions](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).
:::

## Verify the installation

```bash
eve --help
```

You should see the top-level command list. Every subcommand also supports `--help`:

```bash
eve job --help
eve project --help
```

You can also confirm the installed version via npm:

```bash
npm list -g @eve-horizon/cli
```

### `command not found`?

If `eve --help` returns `command not found`, your global npm bin directory isn't on your `PATH`. This is common with nvm, volta, and fnm setups on macOS.

Find where npm installs global binaries:

```bash
npm config get prefix
```

That prints something like `/Users/you/.npm-global` or `/usr/local`. The `eve` binary lives in `<prefix>/bin/`.

**Quick fix** — add it to your current session:

```bash
export PATH="$(npm config get prefix)/bin:$PATH"
eve --help
```

**Permanent fix** — add this line to `~/.zshrc` (or `~/.bashrc`):

```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

Then restart your terminal or run `source ~/.zshrc`.

**Alternative** — bypass PATH entirely with `npx`:

```bash
npx @eve-horizon/cli --help
```

## Keep the CLI updated

```bash
npm update -g @eve-horizon/cli
```

## Next steps

The CLI is installed. Next, connect to the platform and run your first job.

[Quickstart →](./quickstart.md)
