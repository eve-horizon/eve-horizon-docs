---
title: Pipelines Reference
description: Pipeline step types, dependency graphs, trigger configuration, and streaming.
sidebar_position: 6
---

# Pipelines Reference

Pipelines define ordered steps that expand into job graphs.

## Step types

| Type | Description |
|------|-------------|
| `action` | Built-in operations: build, release, deploy, job, create-pr |
| `script` | Shell command executed by the worker |
| `agent` | AI agent job with prompt and config |
| `run` | Shorthand for script.run |

## Dependencies

Steps declare dependencies with `depends_on`. Eve builds a DAG and executes steps in parallel where possible.

## Triggers

Pipelines can be triggered by GitHub webhooks, cron schedules, system events, or manual invocation.
