---
title: Quickstart
description: Go from zero to a running Eve project in five minutes.
sidebar_position: 3
---

# Quickstart

This guide takes you from an empty directory to a deployed service in five minutes.

## 1. Initialize your project

```bash
eve init my-app
cd my-app
```

This creates a `.eve/manifest.yaml` with sensible defaults.

## 2. Link to an organization

```bash
eve org list
eve project create --name my-app --org <org-id>
```

## 3. Deploy to staging

```bash
eve env deploy staging --ref $(git rev-parse HEAD)
```

## 4. Check status

```bash
eve env status staging
```

Once the deploy completes, Eve provides the URL for your running service.

## What's next?

Understand the building blocks: [Core Concepts](./core-concepts.md)
