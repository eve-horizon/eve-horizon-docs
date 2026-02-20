---
title: Orchestration Patterns
description: Job orchestration, depth propagation, parallel decomposition, and agent coordination.
sidebar_position: 3
---

# Orchestration Patterns

Eve's orchestrator manages job execution, concurrency, and agent coordination.

## Job graphs

Pipelines expand into directed acyclic graphs (DAGs) of jobs. The orchestrator executes them respecting dependencies and concurrency limits.

## Depth propagation

Parent jobs can spawn child jobs. The orchestrator tracks depth and prevents runaway recursion.

## Parallel decomposition

Break large tasks into parallel subtasks. The orchestrator coordinates completion and aggregates results.

## Auto-tuner

The orchestrator automatically adjusts concurrency based on worker availability and job characteristics.
