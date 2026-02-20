---
title: llms.txt Spec
description: The llms.txt format for agent discovery — how agents find and consume documentation.
sidebar_position: 6
---

# llms.txt Spec

`llms.txt` is a machine-readable index of documentation pages, designed for AI agents to discover and consume content.

## Format

Each line contains a title, one-line summary, and URL:

```
# Eve Horizon Docs

## Get Started
- [What is Eve Horizon?](/docs/get-started/what-is-eve-horizon): Platform overview and architecture
- [Quickstart](/docs/get-started/quickstart): Zero to deployed in five minutes
```

## Files

| File | Content |
|------|---------|
| `llms.txt` | Title + summary + URL per page |
| `llms-full.txt` | Full rendered text, stripped of HTML |

## Generation

Both files are generated at build time from the docs source and served as static files.
