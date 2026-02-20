---
title: What is Eve Horizon?
description: Understand what Eve Horizon is, who it's for, and how it works.
sidebar_position: 1
---

# What is Eve Horizon?

Eve Horizon is a platform for running AI-powered software engineering workflows against your codebase. It combines a CLI-first developer experience with job orchestration, multi-agent execution, and deployment pipelines — all driven by a single manifest file.

## Who is it for?

- **Developer teams** who want AI agents integrated into their build, review, and deploy workflows
- **Platform engineers** building internal developer platforms with agent-native capabilities
- **AI-augmented teams** running code review, documentation, and development tasks at scale

## How it works

```mermaid
graph LR
    A[Developer] -->|eve CLI| B[Eve API]
    B --> C[Orchestrator]
    C --> D[Worker]
    D --> E[Agent / Harness]
    E -->|commits, PRs, artifacts| F[Git Repo]
```

You define your project in `.eve/manifest.yaml`, push code, and Eve handles the rest — building containers, running pipelines, deploying services, and executing AI-powered jobs.

## What's next?

Install the CLI and run your first command: [Install the CLI](./install.md)
