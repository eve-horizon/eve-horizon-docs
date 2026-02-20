---
title: OpenAPI Spec
description: API design philosophy, authentication, endpoint categories, error format, and the code-first OpenAPI pipeline.
sidebar_position: 10
---

# OpenAPI Spec

Eve Horizon's REST API is the single source of truth for all operations. The CLI, web UI, and agent integrations are thin clients that call the API. No client bypasses the API to access the database directly.

The API contract is defined code-first using NestJS controllers and Zod schemas. The generated OpenAPI spec is the authoritative reference for every request and response shape.

## API design philosophy

### CLI-first

The primary interface for Eve is the CLI, used by humans and AI agents alike. The API is designed to power that CLI experience:

- **CLI-friendly resource hierarchies** -- Clear parent-child relationships in URL paths
- **Predictable pagination** -- Offset/limit on all list endpoints
- **Consistent errors** -- Uniform error shapes across all endpoints
- **Machine-readable output** -- Every CLI command supports `--json` for programmatic consumption

### The CLI is thin

The published CLI (`@eve/cli`) exists solely to:

1. Parse command-line arguments
2. Call the appropriate REST endpoint
3. Format the response for human or machine consumption

The CLI never accesses the database directly, contains business logic, or makes validation decisions. If behavior changes, it changes once in the API.

## Authentication

Eve supports multiple authentication methods depending on the client type.

### Bearer tokens

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are RS256 JWTs issued by the Eve API. Public keys for verification are available at `/.well-known/jwks.json`.

### Authentication methods

| Method | Use case | How to obtain |
|--------|----------|--------------|
| **SSH challenge** | CLI login via GitHub identity | `eve login` triggers `POST /auth/challenge` then `POST /auth/verify` |
| **Supabase exchange** | Web UI login | `POST /auth/exchange` converts a Supabase token to an Eve token |
| **Service principal** | CI/CD and automation | Create via `POST /orgs/{org_id}/service-principals`, mint tokens via the tokens sub-resource |
| **Admin mint** | Admin tooling | `POST /auth/mint` (admin only) |

### Token types

| Token type | Issued by | Scope |
|------------|-----------|-------|
| **User token** | SSH challenge or Supabase exchange | Full user permissions based on org/project membership |
| **Service principal token** | Service principal token endpoint | Scoped to org with configurable permissions |
| **Job token** | Internal mint (orchestrator) | Scoped to a specific job with explicit permission list |

## Base URL and discovery

| Endpoint | URL |
|----------|-----|
| **Swagger UI** | `http://localhost:4801/docs` |
| **OpenAPI JSON** | `http://localhost:4801/openapi.json` |
| **OpenAPI YAML** | `http://localhost:4801/openapi.yaml` |
| **Auth config** | `GET /auth/config` |
| **Health** | `GET /health` |

The `/auth/config` endpoint returns the public authentication provider URL and keys so that clients can discover the auth provider dynamically without hardcoding URLs.

## REST conventions

### HTTP methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| `GET` | Read resource(s) | Yes |
| `POST` | Create resource or trigger action | No |
| `PUT` | Full replacement | Yes |
| `PATCH` | Partial update | Yes |
| `DELETE` | Remove resource | Yes |

Exception: `POST /resource/ensure` is idempotent by design (see the ensure pattern below).

### Status codes

| Code | Meaning | When used |
|------|---------|-----------|
| `200 OK` | Success | GET, PUT, PATCH, ensure operations |
| `201 Created` | Resource created | POST creating a new resource |
| `204 No Content` | Success with no body | DELETE |
| `400 Bad Request` | Invalid input | Validation failures, malformed JSON |
| `404 Not Found` | Resource does not exist | GET/PUT/DELETE on missing resource |
| `409 Conflict` | State conflict | Ensure with conflicting parameters, gate contention |
| `422 Unprocessable Entity` | Semantic error | Valid JSON but business rule violation |
| `500 Internal Server Error` | Server failure | Unexpected errors |

### URL patterns

```
# Collection operations
GET    /resources              # List
POST   /resources              # Create
POST   /resources/ensure       # Find-or-create (idempotent)

# Instance operations
GET    /resources/{id}         # Read
PUT    /resources/{id}         # Replace
PATCH  /resources/{id}         # Update
DELETE /resources/{id}         # Remove

# Nested resources
GET    /resources/{id}/children
POST   /resources/{id}/children
```

### The ensure pattern

The `/ensure` endpoint implements find-or-create semantics that make setup scripts idempotent:

1. If a resource matching the unique key exists and parameters match, return it (200)
2. If a resource exists but parameters conflict, return 409
3. If no resource exists, create it and return 200

```bash
# Safe to run multiple times
eve org ensure "My Org"
eve project ensure --name "my-project" --repo-url "https://..."
```

## Versioning

The API does not currently use URL-based versioning (e.g., `/v1/`). The OpenAPI spec is the contract, and breaking changes are managed through schema evolution. Versioned specs and changelog enforcement in CI are planned.

The canonical spec is checked into the repository under `docs/system/openapi.json` and `docs/system/openapi.yaml`. These files are regenerated from the running API:

```bash
pnpm --filter @eve/api build
pnpm --filter @eve/api openapi:export
```

## Endpoint categories

The API is organized into the following resource groups.

### Auth and identity

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/auth/*` | Login flows (SSH challenge, Supabase exchange, bootstrap) |
| `/.well-known/jwks.json` | Public keys for JWT verification |
| `/auth/invites` | Org invitation management |
| `/auth/request-access` | Self-service access requests |

### Organizations

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/orgs` | CRUD for organizations |
| `/orgs/ensure` | Idempotent org creation |
| `/orgs/{org_id}/members` | Org membership management |
| `/orgs/{org_id}/agents` | Org-level agent listing |
| `/orgs/{org_id}/spend` | Org spend and usage tracking |

### Projects

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/projects` | CRUD for projects |
| `/projects/ensure` | Idempotent project creation |
| `/projects/{project_id}/manifest` | Manifest retrieval and validation |
| `/projects/{project_id}/agents` | Project agent configuration |
| `/projects/{project_id}/releases` | Release management |
| `/projects/{project_id}/schedules` | Scheduled trigger management |
| `/projects/{project_id}/routes` | Chat routing configuration |

### Jobs

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/projects/{project_id}/jobs` | Job CRUD, listing, phase transitions |
| `/projects/{project_id}/jobs/{job_number}/attempts` | Job attempt management |
| `/projects/{project_id}/workflows` | Workflow listing and invocation |
| `/jobs/{job_id}/attachments` | Job file attachments |
| `/jobs/{job_id}/receipt` | Job cost receipt |

### Secrets

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/projects/{project_id}/secrets` | Project-scoped secrets |
| `/orgs/{org_id}/secrets` | Org-scoped secrets |
| `/users/{user_id}/secrets` | User-scoped secrets |
| `/system/secrets` | System-level secrets (admin) |

### Access control

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/orgs/{org_id}/service-principals` | Service principal CRUD and token minting |
| `/orgs/{org_id}/access/can` | Permission check |
| `/orgs/{org_id}/access/explain` | Permission resolution explanation |
| `/orgs/{org_id}/access/roles` | Custom role management |
| `/orgs/{org_id}/access/bindings` | Role binding management |
| `/orgs/{org_id}/access/groups` | Group management |

### Inference and models

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/providers` | LLM provider listing |
| `/providers/{name}/models` | Provider model discovery |
| `/models` | Unified model listing (BYOK + managed) |
| `/inference/managed-models` | Managed model catalog |
| `/inference/targets` | Inference target configuration |
| `/inference/v1/chat/completions` | OpenAI-compatible inference proxy |
| `/harnesses` | Harness auth status and capabilities |

### Webhooks and events

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/orgs/{org_id}/webhooks` | Webhook subscription management |
| `/orgs/{org_id}/webhooks/{wh_id}/deliveries` | Delivery history |
| `/orgs/{org_id}/webhooks/{wh_id}/replays` | Replay failed deliveries |
| `/orgs/{org_id}/events` | Org event listing |

### Analytics and billing

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/orgs/{org_id}/analytics/summary` | Org-wide analytics summary |
| `/orgs/{org_id}/analytics/jobs` | Job analytics |
| `/orgs/{org_id}/analytics/pipelines` | Pipeline analytics |
| `/orgs/{org_id}/analytics/env-health` | Environment health metrics |
| `/admin/pricing/*` | Rate card and exchange rate management |
| `/admin/orgs/{orgId}/usage` | Org usage and billing |

### Threads and chat

| Endpoint pattern | Purpose |
|-----------------|---------|
| `/projects/{project_id}/threads` | Thread listing and management |
| `/orgs/{org_id}/threads/{thread_id}/distill` | Thread distillation |

## Error format

Errors use NestJS default error shapes with consistent fields:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

For gate contention errors, additional context is provided:

```json
{
  "statusCode": 409,
  "message": "Job blocked on gates",
  "blocked_on_gates": ["env:proj_abc123:staging"],
  "jobId": "staging-deploy-a3f2dd12"
}
```

:::note
A standardized error envelope is planned but not yet enforced. The current format is consistent across endpoints but not formally documented in the OpenAPI spec as a shared schema.
:::

## Pagination

All list endpoints return paginated results with offset/limit:

```json
{
  "data": [],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 50
  }
}
```

Query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 10 | Maximum items to return |
| `offset` | 0 | Number of items to skip |

Results are ordered by `created_at` descending (newest first).

## IDs

Eve uses two ID formats depending on scope:

| Scope | Format | Example |
|-------|--------|---------|
| **Global entities** (org, project) | TypeID | `org_abc123`, `proj_xyz789` |
| **Scoped entities** (job, attempt) | Human-friendly numbers | `123`, `1` |
| **Cross-context references** | Composite | `proj_xxx:123:1` |

## Soft delete

Resources support soft delete via a `deleted` boolean:

- Deleted resources are excluded from lists by default
- Include `?include_deleted=true` to show deleted items
- `PATCH` with `{ "deleted": true }` marks a resource as deleted

## Code-first pipeline

The OpenAPI spec is generated code-first from NestJS controllers and Zod schemas. This ensures that validation rules and API documentation are always in sync.

### How it stays in sync

1. **Validation** stays in Zod via `ZodValidationPipe`
2. **OpenAPI schemas** are derived from those same Zod schemas via `zodSchemaToOpenApi`
3. **Controllers** add Swagger decorators (`@ApiBody`, `@ApiResponse`, `@ApiParam`)

One schema definition per request/response, used for both runtime validation and OpenAPI generation.

### Adding or updating an endpoint

1. Define or extend the Zod schema in `packages/shared/src/schemas`
2. Use `ZodValidationPipe` in the controller for request validation
3. Add Swagger decorators that reference the Zod schema via `zodSchemaToOpenApi`

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Create a job in a project' })
@ApiParam({ name: 'project_id', type: String })
@ApiBody({
  schema: zodSchemaToOpenApi(CreateJobRequestSchema, 'CreateJobRequest'),
})
@ApiCreatedResponse({
  schema: zodSchemaToOpenApi(CreateJobResponseSchema, 'CreateJobResponse'),
})
async create(
  @Param('project_id') projectId: string,
  @Body(new ZodValidationPipe(CreateJobRequestSchema)) body: CreateJobRequest,
): Promise<CreateJobResponse> {
  return this.jobsService.create(projectId, body);
}
```

### Exporting the spec

Generate the canonical spec files:

```bash
pnpm --filter @eve/api build
pnpm --filter @eve/api openapi:export
```

The export sets `EVE_OPENAPI_EXPORT=1` and `EVE_AUTH_ENABLED=false` so it can run without a live API service or database connection.

## Service-to-Eve API access

Applications deployed on Eve can access the Eve API using job tokens. The orchestrator mints a scoped token for each job that provides access to project-specific resources.

Job tokens are injected into the execution environment and are scoped to the specific job's permissions. See the [Job API](/docs/reference/job-api) reference for details on job token scope and usage.

Service principals provide long-lived API access for CI/CD pipelines and automation. Create a service principal via the API or CLI, mint a token, and use it as a Bearer token:

```bash
# Create a service principal for CI
eve service-principal create --org org_xxx --name "ci-pipeline"

# Mint a token
eve service-principal mint-token --org org_xxx --sp sp_yyy
```

## CLI commands

### API discovery

```bash
# Check API health
eve api health

# Get API version
eve api version
```

The Eve CLI discovers the API base URL from the `EVE_API_URL` environment variable or the `~/.eve/config.json` file. See [eve auth login](/docs/reference/cli-appendix#eve-auth-login) for initial setup.
