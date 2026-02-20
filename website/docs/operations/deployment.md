---
title: Deployment Guide
description: Kubernetes deployment architecture, ingress, TLS, and container registry setup.
sidebar_position: 1
---

# Deployment Guide

Eve deploys services to Kubernetes with automatic ingress, TLS, and health checking.

## Architecture

Services are deployed as Kubernetes Deployments with associated Services and Ingress resources.

## Container registry

Eve supports its own registry (`registry: "eve"`) or external registries with configurable auth.

## Ingress and TLS

Public services get automatic HTTPS with managed TLS certificates.

## Deploy flow

```mermaid
graph LR
    A[Build] --> B[Release]
    B --> C[Deploy]
    C --> D[Health Check]
    D --> E[Traffic Switch]
```
