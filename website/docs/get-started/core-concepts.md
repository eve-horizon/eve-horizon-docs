---
title: Core Concepts
description: The building blocks of Eve Horizon — manifests, jobs, pipelines, skills, and agents.
sidebar_position: 4
---

# Core Concepts

Eve Horizon is built around a small set of composable primitives. Understanding these gives you the mental model for everything else.

## Manifest

The `.eve/manifest.yaml` file is the single source of truth for your project. It defines services, environments, pipelines, and workflows using Docker Compose-style syntax with Eve extensions.

## Jobs

Jobs are the fundamental unit of work. Every action — building code, running tests, deploying services, executing agent tasks — is a job with a tracked lifecycle.

## Pipelines

Pipelines are ordered sequences of steps that expand into job graphs. They wire together builds, tests, releases, and deploys into repeatable workflows.

## Skills

Skills are portable instructions that agents use to perform specialized tasks. They're defined in `SKILL.md` files and distributed via skill packs.

## Agents and Teams

Agents are AI personas with specific skills, harnesses, and policies. Teams group agents for coordinated work like code review, planning, or implementation.

## Environments

Environments (staging, production) are deploy targets with their own overrides, approval gates, and pipeline bindings.

## What's next?

Put it all together: [Your First Deploy](./first-deploy.md)
