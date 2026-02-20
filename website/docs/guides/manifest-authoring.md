---
title: Manifest Authoring
description: Write and maintain Eve manifest files for services, environments, and pipelines.
sidebar_position: 1
---

# Manifest Authoring

The `.eve/manifest.yaml` file defines everything about your project — services, builds, deploys, environments, and pipelines. This guide covers the patterns you'll use most.

## Manifest structure

```yaml
schema: eve/compose/v2
project: my-project

services:
  # Docker Compose-style service definitions
environments:
  # Deploy targets with overrides
pipelines:
  # Build and deploy workflows
```

## Services

Services follow Docker Compose conventions with Eve extensions under `x-eve`.

## Environments

Environments bind pipelines to deploy targets and provide service overrides.

## Pipelines

Pipelines define ordered steps that expand into job graphs.

## What's next?

Configure services and databases: [Services & Databases](./services-and-databases.md)
