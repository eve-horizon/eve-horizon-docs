---
title: Troubleshooting
description: Diagnose and resolve common issues with deployments, jobs, builds, secrets, and local development.
sidebar_position: 5
---

# Troubleshooting

This guide covers common issues and their resolutions, organized by symptom. Eve is designed for CLI-first debugging -- most problems can be diagnosed without cluster access.

## Quick triage

When something goes wrong, start with these three commands:

```bash
eve system health          # Is the platform up?
eve auth status            # Am I authenticated?
eve job list --phase active  # What's running?
```

If `eve system health` fails, nothing else will work -- fix connectivity first.

## Common issues and fixes

### Authentication failures

**Symptom:** `401 Unauthorized` or "Not authenticated" errors.

```bash
# Re-authenticate
eve auth logout
eve auth login
eve auth status
```

If your SSH key is not registered, the CLI will prompt you to fetch keys from GitHub. You can also ask your admin to register your key using `eve admin invite`.

**Symptom:** "Challenge expired" when logging in.

SSH challenges are valid for 5 minutes. Request a new one by running `eve auth login` again. If challenges consistently expire, check your system clock.

**Symptom:** "No matching key for token" errors.

The token was signed with a key that has been rotated out. Re-authenticate:

```bash
eve auth login
```

**Symptom:** "OAuth token has expired" in job logs.

The Claude or Codex OAuth token needs refresh:

```bash
eve auth creds              # Check credential status
eve auth sync               # Sync fresh tokens
```

### Secret and interpolation errors

**Symptom:** Job fails with missing secret or interpolation error.

```bash
# List secrets for the project
eve secrets list --project proj_xxx

# Set the missing secret
eve secrets set MISSING_KEY "value" --project proj_xxx
```

Check that the secret exists at the correct scope. Secrets resolve in priority order: **project > user > org > system**. A project-level secret overrides an org-level one with the same name.

**Symptom:** Secrets not resolving during deployment.

Verify the required system variables are set:

```bash
# These must be configured on the API and worker
# EVE_SECRETS_MASTER_KEY -- encryption key for secrets at rest
# EVE_INTERNAL_API_KEY -- internal token for the resolve endpoint
```

Check orchestrator and worker logs for `[resolveSecrets]` warnings:

```bash
eve system logs orchestrator
eve system logs worker
```

**Symptom:** Secret validation fails on `eve project sync`.

Declare required secrets in the manifest and validate:

```bash
eve secrets validate --project proj_xxx
```

Validation reports missing secrets with scope-aware remediation hints.

### Deploy troubleshooting

**Symptom:** Deploy hangs or times out.

Check the deploy job and environment health:

```bash
eve job list --phase active
eve job diagnose <job-id>
eve env diagnose <project> <env>
```

**Symptom:** "service not provisioned" error.

The environment needs to be created first. Environments defined in the manifest are auto-created on first deploy, but if you see this error:

```bash
eve env create staging --project proj_xxx --type persistent
```

**Symptom:** "image pull backoff" in deployment.

Registry authentication failed. For managed apps using the Eve-native registry (`registry: "eve"`), this is typically a platform configuration issue. For custom registries, verify credentials:

```bash
eve secrets list --project proj_xxx
# Verify REGISTRY_USERNAME and REGISTRY_PASSWORD are set
```

**Symptom:** "healthcheck timeout" after deploy.

The app is not starting correctly. Check:

1. Service ports in the manifest match what the app actually listens on
2. The healthcheck path returns a 200 response
3. App logs for startup errors

```bash
eve job diagnose <job-id>
eve system logs worker
```

**Symptom:** App not reachable after successful deploy.

Validate the ingress host pattern:

```
{service}.{orgSlug}-{projectSlug}-{env}.{domain}
```

Ensure:
- The service port matches `x-eve.ingress.port` in the manifest
- `EVE_DEFAULT_DOMAIN` is set on the worker
- DNS resolves for the domain (for local dev, `lvh.me` resolves to `127.0.0.1` automatically)

### Job debugging

**Symptom:** Job stuck in "ready" phase -- not starting.

```bash
eve job show <job-id> --verbose    # Check phase and state
eve job dep list <job-id>          # Check blocked dependencies
eve job ready --project <id>       # Check the ready queue
```

Common causes:
- Job is blocked by dependencies (check `dep list`)
- Orchestrator is not healthy (check `eve system health`)
- No available workers

**Symptom:** Job failed.

Use `diagnose` for the most comprehensive output:

```bash
eve job diagnose <job-id>
```

This shows the job timeline, attempt history with durations, LLM routing metadata, error messages, recent logs, and diagnostic recommendations.

For more detail on a specific attempt:

```bash
eve job logs <job-id> --attempt 2
```

**Symptom:** Job stuck in "active" phase -- possibly hanging.

```bash
eve job diagnose <job-id>
```

Look for "Attempt running for Xs - may be stuck" in the output. Possible causes:

- Harness (mclaude/zai/code) is hanging
- Worker crashed without marking the attempt failed
- Network issues between worker and API

The orchestrator has recovery mechanisms that detect stale running attempts (configured via `EVE_ORCH_STALE_RUNNING_SECONDS`).

### Build failures

**Symptom:** Pipeline fails at the build step.

```bash
eve build list --project <project_id>
eve build diagnose <build_id>
eve build logs <build_id>
```

**Registry authentication:** If using a custom registry, verify `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` secrets are set. With the managed registry (`registry: "eve"`), this is handled automatically.

**Dockerfile not found:** Check the `build.context` path in your manifest. The Dockerfile defaults to `<context>/Dockerfile`.

**Workspace errors:** The build context is not available at the correct git SHA. Check `eve build diagnose` for workspace preparation errors.

**Image push fails with UNAUTHORIZED:**

1. Verify secrets: `eve secrets list --project proj_xxx`
2. If using a custom registry, verify credentials match `registry.host`
3. Add an OCI source label to your Dockerfile: `LABEL org.opencontainers.image.source="https://github.com/ORG/REPO"`

### Network and connectivity issues

**Symptom:** `eve system health` fails or times out.

Check that the API URL is correct:

```bash
eve profile show
```

Verify connectivity:

| Environment | Expected `EVE_API_URL` |
|-------------|------------------------|
| Local dev | `http://localhost:4801` |
| Docker Compose | `http://localhost:4801` |
| Kubernetes (k3d) | `http://api.eve.lvh.me` |

**Symptom:** "git clone failed" in job logs.

The worker cannot access the repository. Set the appropriate credential:

```bash
# For HTTPS clone
eve secrets set github_token ghp_xxx --project proj_xxx

# For SSH clone
eve secrets set ssh_key "$(cat ~/.ssh/id_ed25519)" --project proj_xxx
```

## CLI debugging

### Verbose and debug modes

Most CLI commands support `--verbose` for additional output:

```bash
eve job show <job-id> --verbose     # Includes attempt details
eve job wait <job-id> --verbose     # Shows status changes while waiting
```

### JSON output

Add `--json` to any command for machine-readable output:

```bash
eve job list --json
eve auth status --json
```

This is useful for scripting and for sharing diagnostic output.

## Real-time debugging

When a job is running and you need to see what is happening in real time, use a multi-terminal approach:

```bash
# Terminal 1: Stream harness logs (SSE)
eve job follow <job-id>

# Terminal 2: Poll status with updates
eve job watch <job-id>

# Terminal 3: System logs
eve system logs worker
```

### Log command reference

| Command | What it shows |
|---------|---------------|
| `eve job watch <id>` | Combined status + logs streaming |
| `eve job follow <id>` | Harness JSONL logs (SSE) -- harness output only |
| `eve job runner-logs <id>` | K8s runner pod stdout/stderr |
| `eve job wait <id> --verbose` | Status changes while waiting |

:::note
`eve job follow` only shows harness output. Startup errors (clone, workspace, auth) appear in orchestrator, worker, or runner logs -- not in `follow`.
:::

## Local stack troubleshooting

### Docker Compose issues

**Stack won't start:**

```bash
# Check if ports are in use
lsof -i :4801

# Kill orphaned processes
pkill -f "port-forward.*4801"
```

**Container logs:**

```bash
docker logs eve-api -f
docker logs eve-orchestrator -f
docker logs eve-worker -f
```

### Kubernetes (k3d) issues

**Connection EOF / load balancer issues:**

After sleep/wake cycles, the k3d load balancer can become stale:

```bash
docker restart k3d-eve-local-serverlb
kubectl --context k3d-eve-local get nodes
```

**TLS handshake timeout:**

```bash
# Recreate cluster with explicit localhost binding
k3d cluster delete eve-local
k3d cluster create eve-local --api-port 127.0.0.1:6443
```

**Image pull errors:**

```bash
# Verify images are in k3d
docker images | grep eve-horizon

# Re-import images
./bin/eh k8s-image push
```

**Pod stuck in pending:**

```bash
kubectl --context k3d-eve-local -n eve describe pod <pod-name>
```

Common causes: insufficient Docker Desktop resources (increase memory to 8GB+) or unbound PVCs.

**Viewing pod logs:**

```bash
# API logs
kubectl --context k3d-eve-local -n eve logs -l app=eve-api -f

# Worker logs
kubectl --context k3d-eve-local -n eve logs -l app=eve-worker -f

# Migration logs
kubectl --context k3d-eve-local -n eve logs job/eve-db-migrate
```

### Kube context safety

Local operations are locked to the `k3d-eve-local` context. If you see unexpected behavior, verify the active context:

```bash
kubectl config current-context
# Should be: k3d-eve-local

# Switch back if needed
kubectl config use-context k3d-eve-local
```

## Common error reference

| Error | Meaning | Fix |
|-------|---------|-----|
| `401 Unauthorized` | Token expired or invalid | `eve auth login` |
| `OAuth token has expired` | Claude/Codex auth stale | `eve auth creds` then `eve auth sync` |
| `No protocol bridge...` | Harness/provider mismatch | Align managed model harness/provider |
| `Bridge ... missing base URL` | Bridge env not configured | Set bridge URL and key env vars |
| `git clone failed` | Repo inaccessible | Set `github_token` or `ssh_key` secret |
| `service not provisioned` | Environment missing | `eve env create <env>` |
| `image pull backoff` | Registry auth failed | Verify registry credentials |
| `healthcheck timeout` | App not starting | Check ports, healthcheck path, app logs |
| `Challenge expired` | Login took too long | Retry `eve auth login` |
| `No matching key for token` | Key was rotated | Re-authenticate with `eve auth login` |
| `Orchestrator restarted` | Job orphaned | Auto-retries via recovery -- wait |

## Getting help

### CLI help system

```bash
# Main help
eve --help

# Command help
eve job --help

# Subcommand help
eve job create --help
```

### Diagnostic collection

When escalating to a platform operator, collect:

```bash
eve system health
eve job diagnose <job-id>
eve profile show
```

Include the manifest diff if you recently made changes, and note the runtime environment (local dev, Docker Compose, or Kubernetes).

### Debugging checklist

1. **Start with `diagnose`** -- it gives the most context in one command
2. **Check `--verbose` output** -- shows attempt exit codes and durations
3. **API is the gateway** -- if `system health` fails, fix that first
4. **Logs are per-attempt** -- specify `--attempt N` for specific retries
5. **For k3d: check runner pods first** -- errors often appear there before job status updates
6. **Run parallel terminals** -- one for status polling, one for log streaming

See [CLI Commands](/docs/reference/cli-commands) for the full command reference.
