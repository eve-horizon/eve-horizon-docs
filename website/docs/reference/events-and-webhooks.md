---
title: Events & Webhooks
description: Event types, trigger syntax, webhook subscriptions, and delivery guarantees.
sidebar_position: 4
---

# Events & Webhooks

Eve's event system is a Postgres-backed event spine that powers triggers, notifications, and automation.

## Event sources

- **GitHub** — push, pull_request, issue, release
- **Slack** — message, reaction, channel events
- **System** — job state changes, deploy events, pipeline completions
- **Cron** — scheduled triggers

## Trigger syntax

```yaml
pipelines:
  ci:
    trigger:
      github:
        event: push
        branch: main
```

## Webhooks

Subscribe to events and receive HTTP callbacks with signed payloads.
