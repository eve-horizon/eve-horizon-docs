---
title: Chat Gateway & Routing
description: Pluggable chat providers, routing rules, and message dispatch.
sidebar_position: 4
---

# Chat Gateway & Routing

The chat gateway connects external messaging platforms to Eve agents through configurable routing rules.

## Providers

| Provider | Description |
|----------|-------------|
| Slack | Full Slack integration with channels and threads |
| Nostr | Decentralized messaging protocol |
| WebChat | Browser-based chat interface |

## Routing rules

Define routes in `.eve/chat.yaml`:

```yaml
routes:
  - match:
      channel: "#engineering"
    target:
      team: engineering-team
```

## Message dispatch

Messages are matched against routes and dispatched to the appropriate agent or team.
