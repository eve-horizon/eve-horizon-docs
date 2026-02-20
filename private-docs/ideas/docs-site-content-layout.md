# Docs site layout and content inclusion map

## Scope

This is the post-sweep mapping used to bootstrap the docs site structure.

- 18 Eve-read reference docs reviewed from `eve-read-eve-docs/references`.
- 64 source system docs reviewed from `incept5/eve-horizon/docs/system`.

## Source corpus inventory

### Eve-read references corpus

- `agents-teams.md`
- `builds-releases.md`
- `cli-auth.md`
- `cli-deploy-debug.md`
- `cli-jobs.md`
- `cli-org-project.md`
- `cli-pipelines.md`
- `cli.md`
- `deploy-debug.md`
- `events.md`
- `gateways.md`
- `harnesses.md`
- `jobs.md`
- `manifest.md`
- `overview.md`
- `pipelines-workflows.md`
- `secrets-auth.md`
- `skills-system.md`

### Eve source `docs/system` corpus

- `ARCHITECTURE.md`
- `README.md`
- `agent-app-api-access.md`
- `agent-harness-design.md`
- `agent-runtime.md`
- `agent-sandbox-security.md`
- `agent-secret-isolation.md`
- `agents.md`
- `analytics.md`
- `api-philosophy.md`
- `app-service-eve-api-access.md`
- `auth.md`
- `builds.md`
- `chat-gateway.md`
- `chat-routing.md`
- `ci-cd.md`
- `cli-debugging.md`
- `cli-tools-and-credentials.md`
- `configuration-model-refactor.md`
- `container-registry.md`
- `db.md`
- `deploy-polling.md`
- `deployment.md`
- `environment-gating.md`
- `events.md`
- `extension-points.md`
- `harness-adapters.md`
- `harness-execution.md`
- `harness-policy.md`
- `identity-providers.md`
- `inference-ollama.md`
- `integrations.md`
- `job-api.md`
- `job-cli.md`
- `job-context.md`
- `job-control-signals.md`
- `job-git-controls.md`
- `k8s-local-stack.md`
- `manifest.md`
- `observability.md`
- `ollama-api-key-auth.md`
- `openapi.md`
- `orchestration-skill.md`
- `orchestrator.md`
- `pipelines.md`
- `pr-preview-environments.md`
- `pricing-and-billing.md`
- `secrets.md`
- `skillpacks.md`
- `skills-manifest.md`
- `skills-workflows.md`
- `skills.md`
- `system-overview.md`
- `template.md`
- `testing-strategy.md`
- `threads.md`
- `unified-architecture.md`
- `user-getting-started-guide.md`
- `webhooks.md`
- `worker-types.md`
- `workflow-invocation.md`
- `workflows.md`

## Proposed docs layout

## 1) Landing and learning paths

Top-level:

- `docs/introduction/overview` (first load: what Eve is, who it is for, where to start)
- `docs/introduction/getting-started` (new user onboarding path)
- `docs/introduction/quickstart` (first successful deploy path)
- `docs/introduction/new-user-faq`
- `docs/introduction/advanced-entry` (advanced jump links, command glossary)

## 2) Core foundations

- `docs/concepts/platform-overview`
- `docs/concepts/system-model`
- `docs/concepts/architecture`
- `docs/concepts/runtime`
- `docs/concepts/integration-patterns`

## 3) CLI and local workflows

- `docs/cli/quick-reference`
- `docs/cli/setup-auth`
- `docs/cli/projects-and-orgs`
- `docs/cli/jobs`
- `docs/cli/pipelines-workflows`
- `docs/cli/build-release-deploy`
- `docs/cli/debugging`
- `docs/cli/troubleshooting`

## 4) Control plane APIs and object model

- `docs/reference/manifest`
- `docs/reference/environment-gating`
- `docs/reference/jobs`
- `docs/reference/pipelines`
- `docs/reference/workflows`
- `docs/reference/skills`
- `docs/reference/events`
- `docs/reference/secrets-and-auth`

## 5) Build, deploy, and operations

- `docs/operations/builds`
- `docs/operations/deployment`
- `docs/operations/deploy-monitoring`
- `docs/operations/local-stack`
- `docs/operations/ci-cd`
- `docs/operations/pr-preview`
- `docs/operations/database`

## 6) Agents, skills, and conversations

- `docs/agents/agents-teams`
- `docs/agents/harness-runtime`
- `docs/agents/chat-and-threads`
- `docs/agents/skills-system`
- `docs/agents/skillpacks`
- `docs/agents/orchestrator`
- `docs/agents/orchestration-skills`

## 7) Security, policy, and identity

- `docs/security/auth-governance`
- `docs/security/secrets`
- `docs/security/identity-providers`
- `docs/security/agent-secret-isolation`
- `docs/security/webhooks`
- `docs/security/integrations`

## 8) Extensibility and integration

- `docs/integrations/app-service-api-access`
- `docs/integrations/agent-runtime-access`
- `docs/integrations/harness-adapters`
- `docs/integrations/ollama-inference`
- `docs/integrations/apis`

## 9) Observability and troubleshooting

- `docs/troubleshoot/deploy-debug`
- `docs/troubleshoot/incident-checklists`
- `docs/troubleshoot/diagnostics`
- `docs/troubleshoot/events`
- `docs/troubleshoot/observability`
- `docs/troubleshoot/analytics`

## 10) Reference and governance

- `docs/reference/pricing-billing` (if publicly exposed)
- `docs/reference/testing-strategy`
- `docs/reference/openapi`
- `docs/reference/appendix-cli-maps`

## Exact mapping by source document

### Eve-read references

- `agents-teams.md` → `docs/agents/agents-teams`
- `builds-releases.md` → `docs/operations/builds`, `docs/operations/build-release-deploy`, `docs/operations/ci-cd` (as needed)
- `cli-auth.md` → `docs/cli/setup-auth`
- `cli-deploy-debug.md` → `docs/cli/build-release-deploy`, `docs/troubleshoot/deploy-debug`
- `cli-jobs.md` → `docs/cli/jobs`, `docs/reference/jobs`
- `cli-org-project.md` → `docs/cli/projects-and-orgs`, `docs/agents/agents-teams`
- `cli-pipelines.md` → `docs/cli/pipelines-workflows`
- `cli.md` → `docs/cli/quick-reference`
- `deploy-debug.md` → `docs/troubleshoot/deploy-debug`
- `events.md` → `docs/reference/events`, `docs/reference/integration-and-events`
- `gateways.md` → `docs/agents/chat-and-threads`
- `harnesses.md` → `docs/agents/harness-runtime`
- `jobs.md` → `docs/reference/jobs`
- `manifest.md` → `docs/reference/manifest`
- `overview.md` → `docs/introduction/overview`, `docs/concepts/platform-overview`
- `pipelines-workflows.md` → `docs/reference/pipelines`, `docs/reference/workflows`, `docs/cli/pipelines-workflows`
- `secrets-auth.md` → `docs/security/secrets-and-auth`, `docs/security/auth-governance`
- `skills-system.md` → `docs/agents/skills-system`

### Source `docs/system` (first-pass placement)

- `ARCHITECTURE.md` → `docs/concepts/architecture`, `docs/concepts/system-model`
- `README.md` → `docs/introduction/overview`
- `agent-app-api-access.md` → `docs/integrations/app-service-api-access`
- `agent-harness-design.md` → `docs/agents/harness-runtime`
- `agent-runtime.md` → `docs/agents/harness-runtime`
- `agent-sandbox-security.md` → `docs/security/agent-secret-isolation`
- `agent-secret-isolation.md` → `docs/security/agent-secret-isolation`
- `agents.md` → `docs/agents/agents-teams`
- `analytics.md` → `docs/operations/analytics`, `docs/troubleshoot/analytics`
- `api-philosophy.md` → `docs/concepts/platform-overview`, `docs/integrations/apis`
- `app-service-eve-api-access.md` → `docs/integrations/app-service-api-access`
- `auth.md` → `docs/security/auth-governance`
- `builds.md` → `docs/operations/builds`
- `chat-gateway.md` → `docs/agents/chat-and-threads`
- `chat-routing.md` → `docs/agents/chat-and-threads`
- `ci-cd.md` → `docs/operations/ci-cd`
- `cli-debugging.md` → `docs/cli/debugging`
- `cli-tools-and-credentials.md` → `docs/cli/quick-reference`
- `configuration-model-refactor.md` → `docs/reference/manifest`, `docs/reference/system-model`
- `container-registry.md` → `docs/operations/deployment`
- `db.md` → `docs/operations/database`
- `deploy-polling.md` → `docs/operations/deploy-monitoring`
- `deployment.md` → `docs/operations/deployment`
- `environment-gating.md` → `docs/reference/environment-gating`
- `events.md` → `docs/reference/events`
- `extension-points.md` → `docs/concepts/integration-patterns`, `docs/integrations/apis`
- `harness-adapters.md` → `docs/integrations/harness-adapters`
- `harness-execution.md` → `docs/agents/harness-runtime`
- `harness-policy.md` → `docs/agents/harness-runtime`
- `identity-providers.md` → `docs/security/identity-providers`
- `inference-ollama.md` → `docs/integrations/ollama-inference`
- `integrations.md` → `docs/integrations`
- `job-api.md` → `docs/reference/jobs`, `docs/reference/apis`
- `job-cli.md` → `docs/cli/jobs`
- `job-context.md` → `docs/reference/jobs`
- `job-control-signals.md` → `docs/reference/jobs`
- `job-git-controls.md` → `docs/operations/workflows`
- `k8s-local-stack.md` → `docs/operations/local-stack`
- `manifest.md` → `docs/reference/manifest`
- `observability.md` → `docs/troubleshoot/observability`
- `ollama-api-key-auth.md` → `docs/integrations/ollama-inference`
- `openapi.md` → `docs/reference/openapi`, `docs/integrations/apis`
- `orchestration-skill.md` → `docs/agents/orchestration-skills`
- `orchestrator.md` → `docs/agents/orchestrator`
- `pipelines.md` → `docs/reference/pipelines`
- `pr-preview-environments.md` → `docs/operations/pr-preview`
- `pricing-and-billing.md` → `docs/reference/pricing-billing`
- `secrets.md` → `docs/security/secrets`
- `skillpacks.md` → `docs/agents/skillpacks`
- `skills-manifest.md` → `docs/agents/skills-system`
- `skills-workflows.md` → `docs/agents/skills-system`, `docs/reference/workflows`
- `skills.md` → `docs/agents/skills-system`
- `system-overview.md` → `docs/concepts/system-overview`
- `template.md` → `docs/contributing/doc-template`
- `testing-strategy.md` → `docs/reference/testing-strategy`
- `threads.md` → `docs/agents/chat-and-threads`
- `unified-architecture.md` → `docs/concepts/architecture`
- `user-getting-started-guide.md` → `docs/introduction/getting-started`, `docs/introduction/quickstart`
- `webhooks.md` → `docs/security/webhooks`
- `worker-types.md` → `docs/agents/harness-runtime`
- `workflow-invocation.md` → `docs/reference/workflows`
- `workflows.md` → `docs/reference/workflows`

## Routing policy for this docs site

- Every source topic appears at least once in public docs; advanced readers get a parallel "deep reference" breadcrumb from core pages.
- Duplicate overlap areas (events, jobs, workflows, skills) should be consolidated into canonical anchors to avoid conflicting instructions.
- If a topic has high operational risk, include a short warning + expected outcomes first, then implementation details.
- All content lands as:
  - one onboarding-friendly page in `docs/introduction`
  - one deep reference page in the relevant domain section
  - one optional Mermaid diagram card for topology and call flow

## Mermaid inclusion target

- Each section above gets a single diagram cap of 1 per article, except:
  - `docs/concepts/architecture`
  - `docs/reference/pipelines`
  - `docs/agents/harness-runtime`
  - `docs/reference/workflows`

## Open decisions left

- Should `pricing-and-billing.md` stay public in phase one?
- Should `testing-strategy.md` include internal failure matrices or keep it implementation-facing only?
- Which CLI pages should include copy-paste command snippets by default (all or selected advanced subsets)?
