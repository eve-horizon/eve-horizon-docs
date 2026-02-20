---
title: Agents & Teams
description: Define agent personas, team compositions, and dispatch modes.
sidebar_position: 6
---

# Agents & Teams

Agents are AI personas with specific skills, harnesses, and policies. Teams group agents for coordinated work.

## Defining agents

Agents are configured in `.eve/agents.yaml` with harness profiles, skills, and system prompts.

## Teams

Teams compose multiple agents with dispatch modes: fanout, council, relay, or single.

## Dispatch modes

- **fanout** — all agents work in parallel
- **council** — agents collaborate on a shared decision
- **relay** — agents work sequentially, passing context forward
- **single** — one agent handles the entire task

## What's next?

Set up chat integrations: [Chat & Conversations](./chat.md)
