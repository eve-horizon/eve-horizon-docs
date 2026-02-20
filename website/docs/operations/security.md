---
title: Security & Key Rotation
description: Authentication model, key rotation, agent sandboxing, and secret isolation.
sidebar_position: 4
---

# Security & Key Rotation

Eve implements defense-in-depth security with JWT authentication, agent sandboxing, and secret isolation.

## Authentication

Eve uses RS256 JWT tokens with automatic key rotation. SSH challenge-response is used for CLI authentication.

## Agent sandboxing

Agents run in isolated containers with controlled access to secrets, tools, and network resources.

## Secret isolation

Secrets are injected at runtime and never exposed in logs, environment listings, or API responses.

## Key rotation

Platform keys rotate automatically. Service tokens can be rotated via the CLI.
