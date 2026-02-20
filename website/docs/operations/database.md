---
title: Database Operations
description: Managed database provisioning, migrations, and the eve db CLI.
sidebar_position: 3
---

# Database Operations

Eve provides managed Postgres databases and CLI tools for database administration.

## Managed databases

Declare a managed database in your manifest:

```yaml
services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"
```

## CLI

```bash
eve db status --env staging
eve db connect --env staging
```

## Migrations

Run migrations as jobs using `x-eve.role: job` services.
