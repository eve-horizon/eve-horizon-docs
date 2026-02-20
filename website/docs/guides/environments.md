---
title: Environments & Promotion
description: Configure environments, deploy gates, and promotion patterns.
sidebar_position: 4
---

# Environments & Promotion

Environments are deploy targets with their own overrides, approval gates, and pipeline bindings.

## Defining environments

```yaml
environments:
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required
```

## Service overrides

Override environment variables, ports, or other service config per environment.

## Promotion patterns

Deploy to test, promote the release to staging, then to production with approval.

## What's next?

Add agent skills: [Skills & Skill Packs](./skills.md)
