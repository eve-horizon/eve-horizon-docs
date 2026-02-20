---
title: Harnesses & Workers
description: Harness selection, profiles, worker types, and permission policies.
sidebar_position: 9
---

# Harnesses & Workers

Harnesses are execution backends for AI agents. Workers are the containers that run them.

## Available harnesses

| Harness | Description |
|---------|-------------|
| `mclaude` | Claude with MCP tools |
| `claude` | Claude direct |
| `zai` | Anthropic Zai |
| `gemini` | Google Gemini |
| `codex` | OpenAI Codex |
| `code` | Custom code execution |

## Profiles

Define harness profiles in your manifest to control model selection and options:

```yaml
x-eve:
  agents:
    profiles:
      primary-orchestrator:
        - harness: mclaude
          model: opus-4.5
          reasoning_effort: high
```

## Permission policies

Control what agents can do: `auto_edit`, `read_only`, `full_auto`.
