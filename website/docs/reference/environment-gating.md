---
title: Environment Gating
description: Concurrent deploy prevention, gate lifecycle, and approval requirements.
sidebar_position: 8
---

# Environment Gating

Environment gating prevents concurrent deploys to the same environment and enforces approval requirements.

## How gates work

When a deploy starts, Eve acquires a gate on the target environment. If another deploy is in progress, the new deploy waits or fails based on policy.

## Gate lifecycle

1. Deploy requested
2. Gate acquired (or queued)
3. Deploy executes
4. Gate released on completion

## Approval gates

Set `approval: required` on an environment to require human sign-off before deploy proceeds.
