---
title: Your First Deploy
description: Walk through a complete deploy from manifest to running service.
sidebar_position: 5
---

# Your First Deploy

This guide walks through the full cycle: writing a manifest, building, and deploying a service.

## Write the manifest

Create `.eve/manifest.yaml`:

```yaml
schema: eve/compose/v2
project: my-app

services:
  api:
    build:
      context: .
    ports: [3000]
    environment:
      NODE_ENV: production
    x-eve:
      ingress:
        public: true
        port: 3000

environments:
  staging:
    pipeline: deploy

pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: release
        depends_on: [build]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }
```

## Sync and deploy

```bash
eve project sync
eve env deploy staging --ref $(git rev-parse HEAD)
```

## Monitor the pipeline

```bash
eve pipeline runs list
eve job follow <job-id>
```

## Verify

```bash
eve env status staging
curl https://<your-staging-url>/
```

## What's next?

Learn how to customize your manifest: [Manifest Authoring](../guides/manifest-authoring.md)
