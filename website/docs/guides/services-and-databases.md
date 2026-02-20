---
title: Services & Databases
description: Define services, managed databases, health checks, and dependencies in your manifest.
sidebar_position: 2
---

# Services & Databases

Eve services follow Docker Compose conventions. This guide covers service definitions, managed databases, health checks, and inter-service dependencies.

## Service basics

Define a service with a build context or base image, ports, and environment variables.

## Managed databases

Use `x-eve.role: managed_db` to provision platform-managed databases.

## Health checks

Docker-style health checks ensure services are ready before dependents start.

## Dependencies

Use `depends_on` with `condition: service_healthy` to control startup order.

## What's next?

Wire up your build pipeline: [Pipelines & CI/CD](./pipelines.md)
