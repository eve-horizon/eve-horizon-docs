---
title: Troubleshooting
description: Common issues, debug playbooks, and diagnostic commands.
sidebar_position: 5
---

# Troubleshooting

Common issues and how to resolve them.

## Deploy failures

```bash
eve env status staging --verbose
eve env logs staging
eve env recover staging --target <previous-deploy-id>
```

## Job failures

```bash
eve job list --status failed
eve job follow <job-id>
eve job diagnose <job-id>
```

## Build failures

```bash
eve build list --status failed
eve build logs <build-id>
```

## Common issues

| Issue | Resolution |
|-------|------------|
| Deploy stuck in progress | Check environment gates: `eve env gates staging` |
| Job timeout | Increase timeout in pipeline step or scheduling hints |
| Secret not found | Verify scope and name: `eve secret list --project` |
| Build OOM | Increase resource class in build hints |
