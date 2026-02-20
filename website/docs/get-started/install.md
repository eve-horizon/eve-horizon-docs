---
title: Install the CLI
description: Get the Eve CLI installed and verify it works.
sidebar_position: 2
---

# Install the CLI

The Eve CLI is your primary interface to the platform. Everything you can do in Eve starts here.

## Prerequisites

- Node.js 20+
- An SSH key (for Git operations)
- A GitHub account

## Install

```bash
npm install -g @anthropic/eve-cli
```

## Verify

```bash
eve --help
```

You should see the command list. If you see a version number and help output, you're ready.

## Authenticate

```bash
eve auth login
```

This opens a browser to complete authentication. Once done, the CLI stores your token locally.

## What's next?

Deploy your first project: [Quickstart](./quickstart.md)
