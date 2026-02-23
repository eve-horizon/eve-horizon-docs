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
eve --version
```

You should see a version number. If you get `command not found`, your global npm bin directory is not on your `PATH` — find it with `npm bin -g` and add it to your shell profile:

```bash
export PATH="$(npm bin -g):$PATH"
```

Check that the CLI is working:

```bash
eve --help
```

This shows the top-level command list. Every subcommand also supports `--help`:

```bash
eve job --help
eve project --help
```

## Keep the CLI updated

```bash
npm update -g @eve-horizon/cli
```

## Next steps

The CLI is installed. Next, connect to the platform and run your first job.

[Quickstart →](./quickstart.md)
