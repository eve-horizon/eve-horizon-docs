---
title: Pipelines & CI/CD
description: Define build, test, release, and deploy pipelines in your manifest.
sidebar_position: 3
---

# Pipelines & CI/CD

Pipelines are deterministic sequences of steps that expand into job graphs. They're the backbone of your CI/CD workflow.

## Defining a pipeline

```yaml
pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: test
        script:
          run: "pnpm test"
      - name: release
        depends_on: [build, test]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }
```

## Step types

- **action** — built-in operations (build, release, deploy, job, create-pr)
- **script** — shell commands executed by the worker
- **agent** — AI agent jobs with a prompt
- **run** — shorthand for script.run

## Triggers

Pipelines can be triggered by GitHub events, cron schedules, or manual invocation.

## What's next?

Manage deploy targets: [Environments & Promotion](./environments.md)
