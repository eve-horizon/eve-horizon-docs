---
title: Builds & Releases
description: Build specs, build runs, artifacts, release creation, and promotion patterns.
sidebar_position: 5
---

# Builds & Releases

Eve's build system creates container images from your services and tracks them as releases for deployment.

## Build specs

Build specs are derived from your manifest's service definitions. Each buildable service gets a build spec.

## Build runs

A build run compiles your code, creates a container image, and pushes it to the registry.

## Releases

Releases bundle build artifacts for a specific Git ref. They're the unit of promotion between environments.

## Promotion

```bash
eve release resolve v1.2.3
eve env deploy production --inputs '{"release_id":"rel_xxx"}'
```
