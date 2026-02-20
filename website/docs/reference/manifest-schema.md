---
title: Manifest Schema
description: Complete field reference for .eve/manifest.yaml — services, environments, pipelines, x-eve extensions.
sidebar_position: 2
---

# Manifest Schema

The `.eve/manifest.yaml` file uses the `eve/compose/v2` schema. This page documents every field.

## Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `schema` | No | Schema identifier (`eve/compose/v2`) |
| `project` | No | Project slug |
| `registry` | No | Container registry config |
| `services` | Yes | Compose-style service definitions |
| `environments` | No | Environment definitions |
| `pipelines` | No | Pipeline definitions |
| `workflows` | No | Workflow definitions |
| `x-eve` | No | Top-level Eve extensions |

## Services

Services follow Docker Compose conventions with Eve extensions under `x-eve`.

## Eve extensions (`x-eve`)

| Field | Description |
|-------|-------------|
| `role` | `component`, `worker`, `job`, or `managed_db` |
| `ingress` | Public routing config |
| `api_spec` | API spec registration |
| `storage` | Persistent volume config |
| `managed` | Managed DB provisioning |
