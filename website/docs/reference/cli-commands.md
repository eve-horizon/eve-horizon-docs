---
title: CLI Commands
description: Complete reference for all Eve CLI commands, flags, and options.
sidebar_position: 1
---

# CLI Commands

The `eve` CLI is the primary interface to the Eve platform. Every operation — from authentication to deployment — starts here.

## Command categories

| Category | Commands |
|----------|----------|
| Auth | `eve auth login`, `eve auth logout`, `eve auth status` |
| Org / Project | `eve org list`, `eve project create`, `eve project sync` |
| Jobs | `eve job create`, `eve job list`, `eve job follow` |
| Pipelines | `eve pipeline run`, `eve pipeline runs list` |
| Deploy | `eve env deploy`, `eve env status`, `eve env recover` |
| Builds | `eve build list`, `eve release list` |
| Secrets | `eve secret set`, `eve secret list` |

## Global flags

- `--org <id>` — target organization
- `--project <id>` — target project
- `--env <name>` — target environment
- `--format json|table` — output format
- `--verbose` — verbose output
