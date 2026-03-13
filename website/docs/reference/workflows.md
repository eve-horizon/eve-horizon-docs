---
title: Workflows Reference
description: Workflow schema, invocation modes, triggers, skill-driven workflows, and CLI commands.
sidebar_position: 7
---

# Workflows Reference

Workflows are named, on-demand job templates defined in your manifest. They provide a stable entry point for recurring tasks -- nightly audits, incident remediation, data migrations -- that can be invoked by the CLI, the REST API, or event triggers without constructing a full job payload each time.

A workflow invocation compiles into a **job DAG**: one root container job plus one child job per step. Dependencies between steps are expressed via `depends_on` and wired through the job relation system, so the scheduler automatically respects ordering.

## Workflow vs pipeline

| Concern | Workflow | Pipeline |
|---------|----------|----------|
| **Unit of execution** | Job DAG (root + one child per step) | DAG of steps (each step may create a job) |
| **Definition location** | `workflows:` in manifest | `pipelines:` in manifest |
| **Invocation** | `eve workflow run <name>` or `POST /workflows/{name}/invoke` | `eve pipeline run <name>` or event trigger |
| **Use case** | Named agent tasks, remediation, audits | Build/test/deploy sequences |
| **Inputs** | JSON object merged into `hints.request_json` | Pipeline-level inputs distributed to steps |
| **Triggers** | Optional `trigger:` block on the workflow | Optional `trigger:` block on the pipeline |

Choose workflows when you need a single agent task with a stable name and optional input schema. Choose pipelines when you need orchestrated multi-step execution with dependency ordering.

## Defining a workflow

Workflows live under the `workflows:` key in `.eve/manifest.yaml`. Each workflow has a name (the YAML key) and a body that includes steps, and optionally `with_apis`, database access, hints, and triggers.

### Minimal workflow

A workflow with a single step:

```yaml
# .eve/manifest.yaml
workflows:
  nightly-audit:
    db_access: read_only
    steps:
      - name: audit
        agent:
          name: auditor
```

### Multi-step workflow with API access

A workflow with multiple steps, dependency ordering, and app API access for all steps:

```yaml
workflows:
  ingestion-pipeline:
    with_apis:
      - coordinator
    steps:
      - name: ingest
        agent:
          name: ingestion
      - name: extract
        depends_on: [ingest]
        agent:
          name: extraction
      - name: review
        depends_on: [extract]
        agent:
          name: reviewer
```

Each step references an agent by name from the project's agent registry. The `depends_on` field creates ordering constraints -- a step only runs after all its dependencies complete.

### Workflow with hints and triggers

A more complete workflow that includes remediation gating and an event trigger:

```yaml
workflows:
  fix-ci-failure:
    hints:
      gates: ["remediate:proj_abc123:staging"]
      timeout_seconds: 900
      permission_policy: auto_edit
    trigger:
      github:
        event: pull_request
        action: [opened, synchronize]
        base_branch: main
    steps:
      - name: diagnose-and-fix
        agent:
          name: ci-fixer
```

### Workflow with database access

Workflows that need to query or modify the project database declare their access level. This is particularly useful for reporting and data maintenance tasks:

```yaml
workflows:
  weekly-report:
    db_access: read_only
    steps:
      - name: generate-report
        agent:
          name: reporter

  cleanup-stale-data:
    db_access: read_write
    steps:
      - name: archive
        agent:
          name: data-janitor
```

### Step fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique name within the workflow |
| `agent` | Yes | Agent reference: `name` (required), optional `harness`, `harness_profile`, `toolchains` |
| `depends_on` | No | List of step names that must complete before this step runs |
| `with_apis` | No | Per-step API override (see [with_apis](#app-api-access-with_apis) below) |

### Workflow-level fields

| Field | Type | Description |
|-------|------|-------------|
| `with_apis` | string[] | App APIs available to all steps. Individual steps can override this. See [with_apis](#app-api-access-with_apis). |
| `db_access` | `read_only` \| `read_write` | Database access level granted to the executing agent. Merged into `hints.db_access` on invocation. |
| `steps` | array | Workflow step definitions (see step fields above). |
| `hints` | object | Key-value pairs merged into the root job's `hints` at invocation time. Use this for gates, timeouts, and harness preferences. |
| `trigger` | object | Event trigger configuration. When matched, the orchestrator creates a workflow job automatically. |

The workflow name (the YAML key) must be unique within the project manifest. It becomes the stable identifier used in CLI commands, API calls, and trigger matching.

## Workflow hints

The `hints` block is the intended place to set scheduling preferences, remediation gates, and timeout overrides. These hints are merged into the job at invocation time regardless of invocation mode (API, CLI, or event trigger).

```yaml
workflows:
  deploy-staging:
    hints:
      gates: ["env:proj_abc123:staging"]
      timeout_seconds: 1800
      permission_policy: auto_edit
```

### Available hint fields

| Hint | Type | Description |
|------|------|-------------|
| `gates` | string[] | Gate keys that must be acquired before execution. See [Environment Gating](/docs/reference/environment-gating). |
| `timeout_seconds` | number | Maximum execution time. Default: 1800 (30 minutes). |
| `permission_policy` | string | Permission policy for the harness: `default`, `auto_edit`, `never`, `yolo`. |
| `worker_type` | string | Target worker type (e.g., `python-worker`). See [Harnesses & Workers](/docs/reference/harnesses-and-workers). |
| `db_access` | string | Set automatically from the workflow's `db_access` field. |
| `workflow_name` | string | Set automatically to the workflow name. |
| `request_json` | string | Set automatically from the invocation input. |

Hints from the workflow definition are merged with any hints provided at invocation time. Invocation-time hints take precedence over definition-time hints for overlapping keys.

### Remediation gating

For workflows that remediate environment-specific issues, use the `gates` hint to enforce mutual exclusion. Only one remediation job per gate key can run at a time:

```yaml
workflows:
  fix-ci-failure:
    hints:
      gates: ["remediate:proj_abc123:staging"]
```

This ensures that if the same CI failure triggers the workflow twice in quick succession, the second invocation waits for the first to complete before executing. Without gating, two concurrent remediation jobs could make conflicting changes to the same codebase.

See [Environment Gating](/docs/reference/environment-gating) for the full gate lifecycle.

## Triggers

Workflows can fire automatically when an event matches their `trigger` block. The orchestrator evaluates triggers on incoming events and creates workflow jobs for matches.

### GitHub trigger

```yaml
workflows:
  pr-review:
    trigger:
      github:
        event: pull_request
        base_branch: main
    steps:
      - name: review
        agent:
          name: security-reviewer
```

### System trigger

```yaml
workflows:
  self-heal:
    trigger:
      system:
        event: job.failed
        pipeline: deploy
    steps:
      - name: investigate
        agent:
          name: deploy-doctor
```

### Slack trigger

```yaml
workflows:
  slack-mentions:
    trigger:
      slack:
        event: message
        channel: C123ABC
    steps:
      - name: summarize
        agent:
          name: channel-watcher
```

### Manual trigger

```yaml
workflows:
  on-demand-audit:
    trigger:
      manual: true
    steps:
      - name: audit
        agent:
          name: security-auditor
```

### Trigger fields

| Field | Type | Description |
|-------|------|-------------|
| `trigger.github.event` | string | GitHub event type: `push` or `pull_request` |
| `trigger.github.branch` | string | Branch filter for push events |
| `trigger.github.base_branch` | string | Base branch filter for pull request events |
| `trigger.github.action` | `array<string>` | Actions to match for pull request events |
| `trigger.system` | object | Optional system event trigger: `event` and optional `pipeline` |
| `trigger.slack` | object | Optional Slack event filter (`event`, `channel`) |
| `trigger.manual` | boolean | Set to `true` for manual-only invocation |

Trigger configuration follows the same structure as [pipeline triggers](/docs/reference/pipelines) -- specify the event source, event type, and optional branch filter.

When a trigger fires, the orchestrator creates a workflow job with the event payload available in the job context. The agent can use this payload to understand what triggered the workflow and act accordingly.

## Job DAG expansion

When a workflow is invoked, the API compiles it into a job tree:

1. A **root container job** is created with workflow metadata in `hints`
2. One **child job per step** is created as a child of the root
3. `depends_on` references are wired as `blocks`-type job relations
4. The scheduler moves child jobs to `ready` only when all blockers are `done`

### Job tree

For a three-step workflow, the resulting job tree looks like:

```
[*] proj-abc12345 [Workflow] ingestion-pipeline
 |- [-] proj-abc12345.1 [ingestion-pipeline] ingest
 |- [-] proj-abc12345.2 [ingestion-pipeline] extract
 |- [-] proj-abc12345.3 [ingestion-pipeline] review
```

The invocation response includes a `step_jobs` array mapping step names to child job IDs:

```json
{
  "job_id": "proj-abc12345",
  "status": "active",
  "step_jobs": [
    { "job_id": "proj-abc12345.1", "step_name": "ingest" },
    { "job_id": "proj-abc12345.2", "step_name": "extract", "depends_on": ["ingest"] },
    { "job_id": "proj-abc12345.3", "step_name": "review", "depends_on": ["extract"] }
  ]
}
```

### Per-step resolution

Each step resolves its own execution context independently:

- **Agent**: resolved from the project's agent registry by name
- **Harness**: step-level `harness` overrides the agent's default
- **Harness profile**: step-level `harness_profile` overrides the agent's default
- **Toolchains**: step-level `toolchains` overrides the agent's default

### Validation

`eve manifest validate` checks workflow graphs at sync time:

| Check | Error |
|-------|-------|
| Duplicate step names | `Duplicate step name '{name}' in workflow '{workflow}'` |
| Cyclic dependencies | `Cycle detected in workflow '{workflow}': {step_a} -> {step_b} -> ... -> {step_a}` |
| Invalid `depends_on` references | `Step '{name}' depends on unknown step '{ref}' in workflow '{workflow}'` |

## App API access (`with_apis`)

Workflows can declare which app-published APIs their steps should have access to. The `with_apis` field names the APIs (as declared in `x-eve.api_spec` in the manifest), and the server validates each name, generates an instruction block, and appends it to the step's job description.

### Workflow-level declaration

When set at the workflow level, all steps inherit the API access:

```yaml
workflows:
  triage:
    with_apis:
      - coordinator
      - analytics
    steps:
      - name: classify
        agent:
          name: classifier
      - name: assign
        depends_on: [classify]
        agent:
          name: assigner
```

### Per-step overrides

Individual steps can override the workflow-level `with_apis`. A step with its own `with_apis` uses that list instead of inheriting from the workflow:

```yaml
workflows:
  data-pipeline:
    with_apis:
      - coordinator
    steps:
      - name: ingest
        agent:
          name: ingestion
      - name: analyze
        depends_on: [ingest]
        with_apis:
          - coordinator
          - analytics
        agent:
          name: analyst
```

In this example, the `ingest` step sees only the `coordinator` API (inherited from the workflow level), while the `analyze` step sees both `coordinator` and `analytics` (its own override).

`with_apis` works the same way regardless of how the workflow is invoked -- CLI, REST API, or event trigger. It is a server-side primitive; the CLI `--with-apis` flag on `eve job create` is a thin wrapper around the same mechanism.

## Invocation modes

Workflows support three invocation modes: CLI, REST API, and event triggers. All three create a standard job with workflow metadata in its hints.

### How invocation works

When a workflow is invoked, the platform creates a root container job and one child job per step (see [Job DAG expansion](#job-dag-expansion) above). The root job carries the following metadata:

- `labels`: `workflow:{name}` for filtering and identification
- `hints.workflow_name`: the workflow name
- `hints.request_json`: JSON-encoded input (if provided)
- `hints.db_access`: from the workflow definition (if set)
- `hints.app_apis`: from the workflow's `with_apis` field (if set)
- Additional hints merged from the workflow's `hints` block

Each child job follows the standard lifecycle: `ready` -> `active` -> `done` (or `review`). The root job transitions to `done` when all child jobs complete.

### CLI invocation

The simplest way to run a workflow:

```bash
# Fire-and-forget (returns immediately)
eve workflow run my-project nightly-audit

# With input data
eve workflow run my-project nightly-audit --input '{"severity": "error"}'

# Synchronous (waits for result, up to 60 seconds)
eve workflow run my-project nightly-audit --wait --input '{"severity": "error"}'
```

The CLI prints the job ID on success. Use `eve job show` or `eve job logs` to monitor progress.

### API invocation

For programmatic access from agents, CI/CD systems, or external tools:

```bash
# Fire-and-forget
curl -X POST \
  -H "Authorization: Bearer $EVE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": {"severity": "error"}}' \
  "$EVE_API_URL/projects/proj_abc123/workflows/nightly-audit/invoke"

# Synchronous
curl -X POST \
  -H "Authorization: Bearer $EVE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": {"severity": "error"}}' \
  "$EVE_API_URL/projects/proj_abc123/workflows/nightly-audit/invoke?wait=true"
```

### Event trigger invocation

When a workflow has a `trigger` block, the orchestrator automatically creates workflow jobs when matching events arrive. No manual invocation is required -- the trigger fires as soon as the event is received.

### Fire-and-forget vs synchronous

| Mode | Query parameter | Behavior |
|------|----------------|----------|
| **Fire-and-forget** | `wait=false` (default) | Returns immediately with the job ID |
| **Synchronous** | `wait=true` | Blocks up to 60 seconds, returns `result_json` from the latest attempt |

Synchronous mode is useful for agent-to-agent communication where one workflow needs the result of another before proceeding. If the workflow does not complete within 60 seconds, the API returns the job ID and current status so the caller can poll for results.

## REST API

### List workflows

```
GET /projects/{project_id}/workflows
```

Returns all workflow definitions for the project, as extracted from the manifest.

### Show workflow

```
GET /projects/{project_id}/workflows/{name}
```

Returns a single workflow definition by name.

### Invoke workflow

```
POST /projects/{project_id}/workflows/{name}/invoke?wait=true|false
```

**Request body:**

```json
{
  "input": {
    "env": "staging",
    "ticket": "INC-1234"
  }
}
```

The `input` object is JSON-encoded and stored in `hints.request_json` on the created job. The executing agent can read this input to parameterize its work.

**Response (fire-and-forget):**

```json
{
  "job_id": "42",
  "project_id": "proj_abc123",
  "status": "ready"
}
```

**Response (synchronous, wait=true):**

```json
{
  "job_id": "42",
  "project_id": "proj_abc123",
  "status": "done",
  "result_json": {
    "anomalies_found": 3,
    "summary": "Found 3 recurring timeout errors in the auth service"
  }
}
```

## Workflow inputs

Workflow inputs are arbitrary JSON passed at invocation time. They become available to the executing agent as part of the job context.

```bash
# Pass structured input
eve workflow run my-project audit-logs --input '{"severity": "error", "since": "24h"}'
```

The input is stored as `hints.request_json` on the job. The agent reads this from the job context and uses it to parameterize its work.

### Input examples

**Simple string inputs:**

```bash
eve workflow run my-project deploy --input '{"environment": "staging"}'
```

**Complex structured inputs:**

```bash
eve workflow run my-project incident-response --input '{
  "ticket": "INC-1234",
  "severity": "high",
  "affected_services": ["api", "worker"],
  "rollback_to": "v2.3.1"
}'
```

### Input validation

There is no schema validation on inputs today. The agent receives the raw JSON and is responsible for interpreting it. Request/response schema validation is a planned enhancement that will allow workflow definitions to declare input and output schemas using JSON Schema.

## Execution model

Workflow execution follows the job DAG lifecycle:

```mermaid
graph LR
  A[Invoke] --> B[Root Job]
  B --> C[Child Jobs]
  C --> D[ready]
  D --> E[active]
  E --> F[done]
  E --> G[review]
  G --> F
```

1. **Invoke** -- CLI, API, or event trigger creates the job DAG
2. **Root job** -- A container job is created with workflow metadata in hints
3. **Child jobs** -- One child job per step, with `depends_on` wired as job relations
4. **Gate check** -- If `hints.gates` are present, gates must be acquired before child jobs move to `active`
5. **Execution** -- The scheduler moves each child job to `ready` once its blockers complete. The worker spawns the configured harness for each step's agent.
6. **Completion** -- Each child job transitions to `done` (or `review` if configured). The root job transitions to `done` when all children complete.

The workflow itself does not introduce additional lifecycle states. It compiles to standard jobs with dependency relations.

### Result data

When a workflow job completes, the agent can write structured results to `result_json` on the job. This is particularly useful with synchronous invocation (`wait=true`), where the caller receives the result directly:

```json
{
  "anomalies_found": 3,
  "summary": "Found 3 recurring timeout errors in the auth service",
  "recommendations": [
    "Increase connection pool size",
    "Add circuit breaker to auth service"
  ]
}
```

Callers can also retrieve results after the fact by reading the completed job's `result_json` field via the Job API.

### Error handling

If a workflow job fails, it follows the standard job error handling:

- The attempt is marked as failed with error details
- If retries are configured (via `hints.max_attempts`), the orchestrator creates a new attempt
- Failed workflow jobs can be inspected via `eve job show` and `eve job logs`

## Common patterns

### Nightly audit with read-only database access

A workflow that runs every night to audit system logs, with read-only database access to query logs and metrics:

```yaml
workflows:
  nightly-audit:
    db_access: read_only
    steps:
      - name: audit
        agent:
          name: log-auditor
```

```bash
eve workflow run my-project nightly-audit --wait
```

### Incident remediation with gating

A workflow triggered by CI failures that automatically diagnoses and fixes issues, with gating to prevent concurrent remediation on the same environment:

```yaml
workflows:
  fix-ci:
    hints:
      gates: ["remediate:proj_abc123:staging"]
      permission_policy: auto_edit
      timeout_seconds: 900
    trigger:
      github:
        event: pull_request
        branch: main
    steps:
      - name: diagnose-and-fix
        agent:
          name: ci-fixer
```

### Agent-to-agent communication

A workflow that one agent invokes synchronously to get structured data from another:

```bash
# Agent A calls Agent B's workflow and waits for structured results
eve workflow run my-project analyze-dependencies --wait \
  --input '{"package": "@eve/shared", "depth": 3}'
```

The invoking agent receives the result directly and can use it to make decisions without parsing logs or intermediate artifacts.

## Skill-driven workflows (planned)

:::note
Skill-driven workflows are planned but not yet implemented. This section describes the intended design.
:::

A skill-driven workflow is a standard OpenSkills skill with additional frontmatter metadata that marks it as a workflow:

```yaml
---
name: prd-workflow
kind: workflow
version: 1
inputs_schema: inputs.schema.json
outputs_schema: outputs.schema.json
config: config.yaml
personas_dir: personas
skills_required:
  - eve-review-plan
  - eve-review-security
---
```

### Skill layout

```
skills/prd-workflow/
  SKILL.md
  config.yaml
  personas/
    security.md
  references/
```

### Manifest mapping

Manifest workflows will be able to reference a workflow skill by name:

```yaml
workflows:
  prd-epic:
    skill: prd-workflow
```

### Project overrides

Projects can override workflow skill configuration by placing files in `.eve/skills/<skill>/`:

```
.eve/skills/prd-workflow/
  config.yaml
  personas/
```

Resolution order for configuration:

1. Job inputs (invocation-time overrides)
2. `.eve/skills/<skill>/config.yaml` (project overrides)
3. `<skill>/config.yaml` (skill defaults)

### Orchestration

Skill-driven workflows use standard job relations (`waits_for`, `blocks`) for multi-job coordination. A workflow skill returns `eve.status = "waiting"` when it is blocked on child jobs.

## CLI commands

### List workflows

```bash
eve workflow list [project]
```

Lists all workflows defined in the project manifest. See [eve workflow list](/docs/reference/cli-appendix#eve-workflow-list).

### Show workflow details

```bash
eve workflow show <project> <name>
```

Displays the full workflow definition including hints, triggers, and database access configuration.

### Run a workflow

```bash
eve workflow run [project] <workflow-name> --input '{"key": "value"}'
```

Creates a job from the workflow definition. Supports `--input` for passing structured JSON input and `--wait` for synchronous execution. See [eve workflow run](/docs/reference/cli-appendix#eve-workflow-run).

### Invoke a workflow (alias)

```bash
eve workflow invoke [project] <workflow-name> --input '{"key": "value"}'
```

Alias for `eve workflow run`.

### View workflow logs

```bash
eve workflow logs <job-id>
```

Streams the execution logs for a workflow job. Equivalent to `eve job logs <job-id>`.
