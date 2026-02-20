---
title: Your First Deploy
description: Walk through a complete deployment — from writing a manifest to a running service in a staging environment.
sidebar_position: 5
---

# Your First Deploy

This guide walks through the full deployment cycle: writing a manifest, syncing it to the platform, setting secrets, triggering a deploy pipeline, and verifying the result. By the end, you will have a service running in a staging environment with a public URL.

## Prerequisites

- The `eve` CLI installed and authenticated ([Install the CLI](./install.md))
- A project created and linked to a Git repository ([Quickstart](./quickstart.md))
- A Dockerfile in your repository (or a pre-built container image)
- Your profile defaults set:

```bash
eve profile show
# Should show org, project, and API URL
```

## 1. Write the manifest

Create `.eve/manifest.yaml` at the root of your repository. This is the single source of truth for how your project builds and deploys.

Here is a minimal manifest for a single-service application:

```yaml
schema: eve/compose/v2
project: myapp

registry: "eve"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports: [3000]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app:${secret.DB_PASSWORD}@db:5432/app
    x-eve:
      ingress:
        public: true
        port: 3000

environments:
  staging:
    pipeline: deploy

pipelines:
  deploy:
    steps:
      - name: build
        action: { type: build }
      - name: release
        depends_on: [build]
        action: { type: release }
      - name: deploy
        depends_on: [release]
        action: { type: deploy }
```

Key elements:

- **`registry: "eve"`** — Uses the Eve-managed container registry. You can also specify a custom registry (e.g., GHCR, ECR) with explicit `host`, `namespace`, and `auth` fields.
- **`services`** — Docker Compose-style service definitions. Each service has a build context, ports, and environment variables. The `x-eve.ingress` block makes the service publicly accessible.
- **`environments`** — Declares `staging` as a deploy target, bound to the `deploy` pipeline.
- **`pipelines`** — Defines the deploy pipeline as three steps: `build` (container image), `release` (versioned release artifact), and `deploy` (roll out to the environment).

:::info Secret interpolation
Environment variables can reference secrets with `${secret.KEY}` syntax. These are resolved at deploy time from the platform's encrypted secret store.
:::

### Multi-service example

For a fullstack application with a database, API, and frontend:

```yaml
schema: eve/compose/v2
project: myapp

registry: "eve"

services:
  db:
    x-eve:
      role: managed_db
      managed:
        class: db.p1
        engine: postgres
        engine_version: "16"

  api:
    build:
      context: ./apps/api
    ports: [3000]
    environment:
      DATABASE_URL: ${managed.db.url}
    depends_on:
      db:
        condition: service_healthy
    x-eve:
      ingress:
        public: true
        port: 3000

  web:
    build:
      context: ./apps/web
    ports: [80]
    depends_on:
      api:
        condition: service_healthy

environments:
  staging:
    pipeline: deploy
  production:
    pipeline: deploy
    approval: required
```

Services with `role: managed_db` are not deployed as containers — the platform provisions a managed Postgres instance automatically.

## 2. Validate the manifest

Before syncing, verify that the manifest is well-formed:

```bash
eve manifest validate
```

This checks schema validity and reports missing required secrets. To also validate that all referenced secrets exist in the platform:

```bash
eve manifest validate --project proj_xxx
```

## 3. Sync the manifest

Push your manifest configuration to the platform:

```bash
eve project sync
```

This uploads the manifest, extracts pipeline definitions, environment configurations, and any agent profiles. The platform uses this as the authoritative configuration for all subsequent operations.

:::warning
`eve project sync` reads from the current working directory. Make sure you run it from your repository root where `.eve/manifest.yaml` lives.
:::

## 4. Set secrets

If your manifest references secrets (e.g., `${secret.DB_PASSWORD}`), set them before deploying:

```bash
# Set a project-level secret
eve secrets set DB_PASSWORD my-secure-password

# Set an org-level secret (shared across projects)
eve secrets set GITHUB_TOKEN ghp_xxx --scope org
```

You can also import secrets from an env file:

```bash
eve secrets import --project proj_xxx --file ./secrets.env
```

Verify your secrets are in place:

```bash
eve secrets list
```

:::danger
Never commit secrets to your repository. Use `eve secrets set` or `eve secrets import` to store them in the platform's encrypted store.
:::

Secrets are resolved at deploy time with a scope precedence of **project > user > org > system**. A project-level secret always wins over an org-level one with the same name.

## 5. Create the environment

If the environment does not exist yet, create it:

```bash
eve env create staging --type persistent
```

For a project bootstrapped with environments, this step may already be done:

```bash
eve project bootstrap --name "My App" \
  --repo-url git@github.com:acme/myapp.git \
  --environments staging,production
```

## 6. Trigger the deploy

Deploy to staging by providing a Git ref:

```bash
eve env deploy staging --ref main --repo-dir .
```

The `--ref` flag accepts a branch name, tag, or 40-character SHA. When `--repo-dir` is provided, the CLI resolves the ref against your local repository.

Because the `staging` environment is bound to the `deploy` pipeline in the manifest, this command triggers a full pipeline run — build, release, and deploy — rather than a direct deployment.

:::tip Direct deploy
To bypass the pipeline and deploy directly (useful for debugging), add the `--direct` flag:

```bash
eve env deploy staging --ref main --repo-dir . --direct
```
:::

## 7. Watch the pipeline

Monitor the pipeline as it runs:

```bash
eve pipeline runs myapp
```

Follow the logs for a specific run:

```bash
eve pipeline logs deploy <run-id>
```

For real-time streaming:

```bash
eve pipeline logs deploy <run-id> --follow
```

You will see output like:

```
[14:23:07] [build] Cloning repository...
[14:23:15] [build] Building api image...
[14:24:01] [release] Creating release v0.1.0...
[14:24:12] [deploy] Deploying to staging namespace...
[14:24:30] [deploy] Deployment status: 1/1 ready
```

If a step fails, the CLI prints the error and a diagnostic hint.

## 8. Verify

Check the environment status:

```bash
eve env diagnose proj_xxx staging
```

Your service is now accessible at a URL following the pattern:

```
{service}.{orgSlug}-{projectSlug}-{env}.{domain}
```

For example, if your org slug is `acme`, project slug is `myapp`, and the domain is `eh1.incept5.dev`:

```
https://api.acme-myapp-staging.eh1.incept5.dev
```

Test it:

```bash
curl https://api.acme-myapp-staging.eh1.incept5.dev/health
```

## What you have built

At this point, your project has:

- A **manifest** that declaratively defines services, environments, and pipelines
- **Secrets** stored securely in the platform and interpolated at deploy time
- A **staging environment** running your service on Kubernetes with public ingress
- A **deploy pipeline** that can be triggered again on every push or manually via the CLI

## Next steps

From here, you can explore the platform in depth:

- [Manifest Authoring](/docs/guides/manifest-authoring) — Service definitions, environment overrides, registry configuration, and advanced manifest patterns.
- [Pipelines](/docs/guides/pipelines) — Event triggers, step types, promotion flows, and CI/CD patterns.
- [Skills](/docs/guides/skills) — Writing custom skills, installing skill packs, and the SKILL.md format.
- [Environments](/docs/guides/environments) — Environment types, approval gates, and PR preview environments.
- [Secrets and Auth](/docs/guides/secrets-and-auth) — Multi-scope secret management, OAuth sync, and Git auth injection.
