---
title: Secrets & Auth
description: Manage secrets, authenticate services, and configure access control.
sidebar_position: 9
---

# Secrets & Auth

Eve provides multi-scope secret management and flexible authentication for both users and services.

## Secret scopes

Secrets cascade through four levels: system, organization, user, and project. Project secrets override org secrets.

## Using secrets in manifests

Reference secrets with `${secret.KEY}` interpolation:

```yaml
environment:
  DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
```

## Authentication

Eve supports SSH key challenge-response, JWT tokens, and browser-based OAuth flows.

## Service accounts

Create service accounts for CI/CD and automation with scoped permissions.
