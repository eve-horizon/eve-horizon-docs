---
title: Local Development
description: Run your Eve project locally with Docker Compose and the k3d stack.
sidebar_position: 8
---

# Local Development

Eve supports local development through Docker Compose for app services and an optional k3d stack for full platform testing.

## Docker Compose workflow

```bash
eve local up        # Start services
eve local logs      # Stream logs
eve local down      # Stop services
```

## k3d local stack

For full platform testing, spin up a local Kubernetes cluster with Eve services.

## Hot reload

Your local services mount source code and rebuild on changes.

## What's next?

Manage secrets and authentication: [Secrets & Auth](./secrets-and-auth.md)
