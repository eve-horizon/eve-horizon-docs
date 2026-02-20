---
title: Install the CLI
description: Install the Eve Horizon CLI, verify it works, and configure your shell.
sidebar_position: 2
---

# Install the CLI

The `eve` CLI is your primary interface to the platform. Both humans and AI agents use it for everything — creating jobs, deploying services, managing secrets, and monitoring execution. This page walks you through installation and first-time setup.

## Prerequisites

Before installing the CLI, make sure you have:

- **Node.js 22+** — The CLI requires Node.js 22 or later. Check with `node --version`.
- **Git** — For repository operations. Check with `git --version`.
- **An SSH key** — Used for authentication with the Eve platform. Typically at `~/.ssh/id_ed25519`. If you do not have one, generate it:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
```

- **A GitHub account** (recommended) — Eve can auto-discover your SSH keys from GitHub during login.

## Install via npm

The CLI is published as `@eve-horizon/cli` on npm.

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

You should see the top-level command list including `job`, `project`, `auth`, `profile`, and others. If the command is not found, ensure your global npm bin directory is on your `PATH`.

Check the version:

```bash
eve --version
```

## Create a profile

Profiles store connection settings for different Eve environments (local, staging, production). Create one for the hosted staging platform:

```bash
eve profile create staging --api-url https://api.eh1.incept5.dev
eve profile use staging
```

For a local development cluster, point to your local API:

```bash
eve profile create local --api-url http://api.eve.lvh.me
```

List your profiles at any time:

```bash
eve profile list
```

## Authenticate

Log in with your SSH key:

```bash
eve auth login
```

If your SSH key is not yet registered with the platform, the CLI will offer to discover your keys from GitHub:

```
No registered SSH key found for this user.
Enter GitHub username to register keys (or press Enter to skip): your-username

Found 2 SSH key(s) for github.com/your-username
Register them? [Y/n]: y
Registered 2 SSH key(s)

Retrying login with registered keys...
Logged in
```

Verify your auth status:

```bash
eve auth status
```

:::info New user?
If this is your first time and you are not pre-registered, use the bootstrap skill described in the [Quickstart](./quickstart.md) — it handles access requests and approval workflows automatically.
:::

## Set profile defaults

Once authenticated, set your default organization and project so you do not need to pass them on every command:

```bash
eve profile set --org org_xxx --project proj_xxx
```

View your current profile:

```bash
eve profile show
```

## Sync OAuth tokens for AI agents

If you use Claude Code or other AI coding agents locally, sync your OAuth tokens so Eve can use them when running jobs on your behalf:

```bash
eve auth sync
```

This transfers locally stored OAuth credentials (e.g., `CLAUDE_CODE_OAUTH_TOKEN`) to the Eve platform, where they are encrypted and injected into job workspaces at runtime.

## Keep the CLI updated

Update to the latest version:

```bash
npm update -g @eve-horizon/cli
```

Or with pnpm:

```bash
pnpm update -g @eve-horizon/cli
```

## Troubleshooting

### `eve: command not found`

Your global npm bin directory is not on your `PATH`. Find it with `npm bin -g` and add it to your shell profile (`.zshrc`, `.bashrc`, etc.):

```bash
export PATH="$(npm bin -g):$PATH"
```

### `No registered SSH key found`

Your SSH key is not registered with the Eve platform. During `eve auth login`, enter your GitHub username when prompted to auto-register your keys. Alternatively, ask your admin to register your key using `eve admin invite`.

### `Challenge expired`

SSH authentication challenges are valid for 5 minutes. If you see this error, simply run `eve auth login` again to get a fresh challenge.

### `Not authenticated` after a period of time

Your auth token may have expired. Log in again:

```bash
eve auth logout
eve auth login
```

### Wrong profile active

If commands are hitting the wrong API, switch profiles:

```bash
eve profile use staging
```

## Getting help

Every command supports `--help` for detailed usage:

```bash
eve --help
eve job --help
eve job create --help
```

Add `--json` to any command for machine-readable output:

```bash
eve job list --json
eve auth status --json
```

## Next steps

You have the CLI installed and authenticated. Time to create your first project and run a job.

[Quickstart →](./quickstart.md)
