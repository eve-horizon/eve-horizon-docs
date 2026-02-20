---
title: Workflows Reference
description: Manifest-defined workflows, invocation patterns, and database access controls.
sidebar_position: 7
---

# Workflows Reference

Workflows are manifest-defined on-demand jobs, often agent-driven, that can be invoked by name.

## Defining workflows

```yaml
workflows:
  nightly-audit:
    db_access: read_only
    steps:
      - agent:
          prompt: "Audit errors and summarize anomalies"
```

## Invocation

```bash
eve workflow run nightly-audit --env staging
```

## Database access

Workflows can declare `db_access: read_only` or `read_write` to control what the executing agent can do.
