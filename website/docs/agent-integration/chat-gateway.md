---
title: Chat Gateway & Routing
description: Pluggable provider architecture, message routing, chat.yaml schema, and integration with Slack, Nostr, and WebChat.
sidebar_position: 4
---

# Chat Gateway & Routing

The chat gateway connects external messaging platforms to Eve agents. It normalizes inbound messages from Slack, Nostr, and WebChat into a common format, routes them to the correct agent or team, creates jobs, and delivers replies. This page covers the gateway architecture, provider adapters, routing engine, and integration setup.

## Gateway architecture

The gateway service uses a pluggable provider architecture. Each provider implements the `GatewayProvider` interface and registers via a factory at startup. Two transport models are supported:

| Transport | Mechanism | Example |
|-----------|-----------|---------|
| **Webhook** | External platform sends HTTP POST to Eve | Slack |
| **Subscription** | Eve connects to external service and listens | Nostr, WebChat |

Webhook providers are stateless between requests. Subscription providers maintain persistent connections for the lifetime of the integration.

The message lifecycle for any provider follows the same path:

```mermaid
graph LR
    Inbound["Inbound Message"] --> Validate["Validate"]
    Validate --> Parse["Parse & Normalize"]
    Parse --> Resolve["Resolve Agent"]
    Resolve --> Dispatch["Create Job"]
    Dispatch --> Execute["Agent Executes"]
    Execute --> Reply["Outbound Reply"]
```

## Provider interface

All providers implement a common contract:

| Member | Description |
|--------|-------------|
| `name` | Unique provider identifier (`slack`, `nostr`, `webchat`) |
| `transport` | `'webhook'` or `'subscription'` |
| `capabilities` | Feature flags: threads, reactions, file uploads |
| `initialize(config)` | Lifecycle hook for setup (load secrets, open connections) |
| `shutdown()` | Lifecycle hook for teardown (close sockets, flush state) |

### Webhook-specific methods

| Method | Description |
|--------|-------------|
| `validateWebhook(req)` | Verify request authenticity (signatures, challenge handling) |
| `parseWebhook(req)` | Parse payload into `message`, `handshake`, or `ignored` |

### Shared methods

| Method | Description |
|--------|-------------|
| `sendMessage(target, content)` | Deliver outbound message to provider-specific target |
| `resolveIdentity(externalUserId, accountId)` | Map external user to Eve identity |

### Provider registry

Factories register at startup. Instances are created per integration (one per org integration). The `WebhookController` dispatches `POST /gateway/providers/:provider/webhook` to the correct provider instance.

## Provider adapters

### Slack (webhook transport)

Slack is the primary webhook-based provider. Events arrive via HTTP POST and are processed through signature validation, integration resolution, and agent dispatch.

**Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `POST /gateway/providers/slack/webhook` | Slack webhook endpoint |
| `POST /gateway/providers/slack/interactive` | Slack interactive actions endpoint |

**Signature validation:** Slack requests are validated using the signing secret (`EVE_SLACK_SIGNING_SECRET`). The provider computes `HMAC-SHA256(signing_secret, v0:timestamp:body)` and compares against the `X-Slack-Signature` header. Invalid signatures are rejected before parsing.

**Event flow:**

1. Event arrives at the webhook endpoint.
2. Signature validated.
3. Duplicate check by Slack `event_id`.
4. Integration resolved: `team_id` maps to `org_id`.
5. Identity resolution and optional identity-link interception.
6. Event type determines the dispatch path:

| Event Type | Trigger | Dispatch |
|------------|---------|----------|
| `app_mention` | User writes `@eve ...` | Parsed as `@eve <agent-slug> <command>`, routed to specific agent |
| `message` | Any message in subscribed channel | Dispatched to channel/thread listeners only |

For `app_mention` events, the first word after `@eve` is tested as an agent slug. If it matches a known slug, the message routes directly to that agent's project. If no match, the org `default_agent_slug` receives the full message as the command.

**Outbound:** Responses are delivered via the Slack Web API (`chat.postMessage`), threaded to the originating message.

### Slack deduplication and 3-second ACK behavior

Slack retries delivery when the webhook handler does not respond quickly. The gateway acknowledges requests immediately and de-duplicates retries using `event_id` in a short-lived cache.

### Identity interception and reserved command

Before agent routing, the gateway resolves the Slack user identity for org-scoped authorization. If identity is missing, the user receives a linking instruction.

The `link` command is reserved and intercepted before slug routing:

```text
@eve link
```

This guarantees identity-link bootstrap without requiring a preconfigured `link` agent.

### Slack interactive actions

`POST /gateway/providers/slack/interactive` handles Slack interactive payloads (`application/x-www-form-urlencoded`, `payload=<json>`). Requests use the same Slack signature verification flow as webhook events.

### Nostr (subscription transport)

The Nostr provider connects to relay(s) via WebSocket and subscribes to events targeting the platform pubkey.

**Inbound event types:**

| Kind | Type | Description |
|------|------|-------------|
| Kind 4 | NIP-04 Encrypted DM | Private message to platform pubkey |
| Kind 1 | Public Mention | Public note tagging platform pubkey |

**Inbound flow:**

1. Relay broadcasts event matching subscription filters.
2. Provider verifies Schnorr signature.
3. Kind 4 events are decrypted using NIP-04.
4. Message normalized to standard inbound format.
5. Agent slug extracted from content.
6. Routed through the same dispatch pipeline as Slack.

**Agent slug extraction patterns:**

| Pattern | Example |
|---------|---------|
| `/agent-slug <text>` | `/mission-control review PR` |
| `agent-slug: <text>` | `mission-control: review PR` |
| First word of public mention | `mission-control review PR` |

If no slug matches, the org default agent is used.

**Outbound:** DM replies use Kind 4 (NIP-04 encrypted). Public replies use Kind 1 with NIP-10 reply threading tags.

**Deduplication:** Event IDs are tracked in a bounded set (10k entries) to handle cross-relay duplicates.

### WebChat (subscription transport)

Browser-native agent chat via WebSocket. Follows the subscription transport model.

**Connection:**

```
ws://gateway:4820/?token=<jwt>
```

**Send message:**

```json
{"type": "message", "text": "Hello", "agent_slug": "coder", "thread_id": "optional"}
```

**Receive reply:**

```json
{"type": "message", "text": "Queued 1 job(s)...", "thread_id": "...", "timestamp": "..."}
```

**Features:**
- JWT authentication in WebSocket handshake
- Heartbeat ping/pong (30-second interval)
- Thread continuity across reconnections
- Multi-tab support (same user, multiple connections)

## Routing engine

The routing engine determines which agent or team handles an inbound message. Two routing paths exist: direct slug routing and `chat.yaml` rule matching.

### Direct slug routing

When a message includes an agent slug (e.g., `@eve coder review this PR`), the gateway bypasses `chat.yaml` and routes directly to the agent. Agent slugs are org-unique and resolve to a specific `{project_id, agent_id}` pair.

If no slug is recognized, the org `default_agent_slug` receives the message.

### chat.yaml schema

For rule-based routing, define routes in `chat.yaml`:

```yaml
version: 1
default_route: route_default
routes:
  - id: deploy-route
    match: "deploy|release|ship"
    target: agent:deploy-agent
    permissions:
      project_roles: [admin, member]

  - id: review-route
    match: "review|PR|pull request"
    target: team:review-council

  - id: route_default
    match: ".*"
    target: team:ops
    permissions:
      project_roles: [member, admin, owner]
```

### Route matching rules

1. Routes are evaluated in order.
2. The `match` field is a regex tested against the message text.
3. First match wins.
4. If no route matches, `default_route` is used.

### Target types

| Prefix | Description | Example |
|--------|-------------|---------|
| `agent:<id>` | Dispatch to a single agent | `agent:deploy-agent` |
| `team:<id>` | Dispatch using team mode (fanout, council, relay) | `team:review-council` |
| `workflow:<name>` | Invoke a workflow | `workflow:nightly-audit` |
| `pipeline:<name>` | Launch a pipeline | `pipeline:deploy` |

## Gateway discovery policy

Agents control their visibility to gateway clients via the `gateway` section in `agents.yaml`:

```yaml
agents:
  mission-control:
    gateway:
      policy: routable
      clients: [slack]
```

| Policy | Listed in directory | Direct chat | Internal dispatch |
|--------|--------------------|----|---|
| `none` | Hidden | Rejected | Works |
| `discoverable` | Visible | Rejected (with hint) | Works |
| `routable` | Visible | Works | Works |

The `clients` field restricts which providers can reach the agent. Omitting it allows all providers.

Resolution order: pack `gateway.default_policy` (defaults to `none`) then agent `gateway.policy` then project overlay.

## Listener subscriptions

Agents can passively listen to channels and threads without requiring explicit mentions. This enables monitoring, logging, and reactive workflows.

### Slack listener commands

```
@eve agents listen <agent-slug>      # Listen in this channel (or thread)
@eve agents unlisten <agent-slug>    # Remove listener
@eve agents listening                # Show active listeners
@eve agents list                     # Directory of available slugs
```

### Scope behavior

- Command issued in a **channel**: creates a channel-level listener. All `message` events in that channel are dispatched.
- Command issued inside a **thread**: creates a thread-level listener. Only messages in that specific thread are dispatched.
- Multiple agents can listen to the same channel or thread.
- Listening uses `message.channels` events; explicit `@eve` commands use `app_mention`.

Each listener agent receives a separate job in its own project for every matching message.

## Outbound delivery

When an agent finishes a chat-originated job, the result is posted back to the originating thread automatically. The orchestrator detects job completion, resolves the chat origin from thread metadata, and pushes the result through the gateway.

### Delivery flow

```mermaid
graph LR
    Done["Job Done"] --> Orch["Orchestrator"]
    Orch --> API["API<br/>resolve thread"]
    API --> GW["Gateway"]
    GW --> Provider["Provider<br/>sendMessage()"]
```

1. The orchestrator marks the job done and checks for a chat origin (`chat` label + `hints.thread_id`).
2. The orchestrator calls `POST /internal/projects/{project_id}/chat/deliver` with the job ID, thread ID, and result text.
3. The API resolves the delivery target from thread `metadata_json` (provider, account, channel, thread ID stored at inbound time).
4. The API forwards to the gateway's internal delivery endpoint (`POST /gateway/internal/deliver`).
5. The gateway calls `provider.sendMessage()` to deliver to the originating thread.

Result text is taken from `result.resultText` when available, falling back to the `eve.summary` field from the agent's control signal. If both are absent, a generic "Job completed with no output" message is delivered.

### Message truncation

Slack enforces a 4000-character limit per message. If the result exceeds 3900 characters, the gateway truncates it and appends a pointer to the full result:

```
...[Truncated — full result: eve job result {job_id}]
```

### Delivery status tracking

Each outbound message is recorded as a `thread_message` with `direction = 'outbound'` and a `delivery_status` field (`pending`, `delivered`, or `failed`). Delivery failures are logged with an error message but never block job completion -- the job is always marked done first.

Inspect delivery history with the CLI:

```bash
eve thread messages <thread_id>
```

### Thread metadata

Threads store provider-specific routing information in a `metadata_json` column, set when the thread is created from an inbound message:

```json
{
  "provider": "slack",
  "account_id": "T06ABCDEF",
  "channel_id": "C0AKFH4HXNF",
  "thread_id": "1773141918.681009"
}
```

For threads created before this metadata existed, the delivery endpoint falls back to parsing the thread key (`account_id:channel_id:thread_id`).

## Progress updates

Agents can send real-time progress messages to the originating chat thread during execution. This bridges the gap between the initial "Job routed" acknowledgment and the final result, giving users visibility into long-running work.

### How it works

Agents emit `eve-message` fenced blocks in their output. The `EveMessageRelay` in the agent runtime detects these blocks and delivers them to the originating chat channel via the same delivery pipeline used for final results.

````
```eve-message
Pulling metrics data from the warehouse...
```
````

The relay has two delivery paths:

| Path | Target | When |
|------|--------|------|
| **Coordination thread** | Internal thread for team dispatch | When the job has a parent (team member) |
| **Chat channel** | Originating Slack/Nostr/WebChat thread | When the job has the `chat` label and a `thread_id` hint |

Both paths can fire for the same message (e.g., a team member's progress is visible to both the coordination thread and the user's Slack thread).

### Rate limiting

Progress messages are rate-limited to prevent channel spam and respect provider API limits:

| Limit | Value | Rationale |
|-------|-------|-----------|
| Minimum interval | 30 seconds | Slack rate limits (1 msg/sec/channel) |
| Max per job | 10 messages | Prevents runaway agents from flooding |
| Max text length | 500 characters | Keeps progress concise |

A 10-minute job produces at most ~10 progress updates. Messages that exceed the rate limit are silently dropped. Delivery failures are logged but never affect job execution.

### Structured progress

For agents that want to send structured data (for future rich formatting), the relay also accepts JSON with a `body` field:

````
```eve-message
{"kind": "progress", "body": "Found 847 records, analyzing trends..."}
```
````

If the content is valid JSON with a `body` field, the relay extracts the body as display text. Otherwise, the raw content is used.

## File materialization

When a user uploads files in a chat message (e.g., a PDF or image in Slack), the gateway downloads them and stages them into the agent's workspace. This bridges provider-specific file hosting into Eve's provider-agnostic file system.

### Materialization flow

```mermaid
graph LR
    Upload["Chat + File"] --> GW["Gateway<br/>resolveFiles()"]
    GW --> S3["Eve Storage"]
    S3 --> Worker["Worker<br/>stage workspace"]
    Worker --> Agent["Agent reads<br/>.eve/attachments/"]
```

1. **Gateway downloads:** The provider's `resolveFiles()` hook downloads files using provider-specific auth (e.g., Slack bot token) and uploads them to Eve storage via presigned URLs. Provider URLs are replaced with `eve-storage://` references in the message metadata.
2. **Worker stages:** During workspace provisioning, the worker detects `eve-storage://` URLs in `job.metadata.files`, downloads them via presigned URLs, and writes them to `.eve/attachments/` in the workspace.
3. **Agent reads:** The agent reads `.eve/attachments/index.json` for the file manifest and accesses files at `.eve/attachments/{filename}`.

### What the agent sees

```json
{
  "files": [
    {
      "id": "F019ABC123",
      "name": "product-spec-v2.pdf",
      "path": ".eve/attachments/F019ABC123-product-spec-v2.pdf",
      "mimetype": "application/pdf",
      "size": 245760,
      "source_provider": "slack"
    }
  ]
}
```

### Provider interface

Providers that support file uploads implement an optional `resolveFiles()` method on the `GatewayProvider` interface. The method receives the raw file metadata and a `FileResolveContext` with presigned URL helpers. Providers that don't support files omit the method entirely.

The gateway calls `resolveFiles()` in the async phase after webhook acknowledgment, so file downloads never block the initial response to the chat platform.

### File limits

| Limit | Value |
|-------|-------|
| Max files per message | 10 |
| Max file size | 50 MB |
| Max total per message | 100 MB |
| Filename length | 255 characters |

Files exceeding limits are skipped with a warning. The original provider URL is preserved as fallback metadata.

### Storage layout

Files are stored in S3 keyed by org, provider account, channel, and message timestamp:

```
chat-attachments/{org_id}/{provider}:{account_id}/{channel_id}/{message_ts}/{filename}
```

This channel-scoped layout enables future features like channel file history (`eve chat files --channel <id>`) and channel-based cleanup.

## Message lifecycle

Understanding the full message lifecycle helps when debugging routing issues or building custom integrations.

1. **Inbound:** External message arrives via webhook POST or subscription connection.
2. **Validation:** Provider verifies authenticity (Slack signature, Nostr Schnorr signature, WebChat JWT).
3. **Integration resolution:** Provider identity maps to Eve org (`team_id` to `org_id` for Slack, pubkey for Nostr).
4. **Normalization:** Provider-specific payload is converted to a standard inbound message format.
5. **File materialization:** If the message includes file attachments, the provider downloads them and uploads to Eve storage. Provider URLs are replaced with `eve-storage://` references.
6. **Agent resolution:** Slug extracted from message text. If recognized, routes to that agent. If not, routes to org default.
7. **Thread creation:** Thread key computed from account, channel, and optional thread ID. Existing thread matched or new thread created. Provider metadata stored for outbound delivery.
8. **Job creation:** Job created for the resolved agent in the agent's project. Thread and event recorded. File references carried in job metadata.
9. **Workspace staging:** Worker downloads materialized files from Eve storage into `.eve/attachments/` and writes the index manifest.
10. **Execution:** Orchestrator claims the job and dispatches to a worker. Agent executes, optionally emitting progress updates via `eve-message` blocks.
11. **Progress delivery:** Progress updates are relayed to the originating chat thread in real time (rate-limited to 30-second intervals).
12. **Result delivery:** On job completion, the orchestrator pushes the result to the API, which forwards to the gateway for delivery to the originating thread.

The gateway logs each step, making it possible to trace why a message was routed to a particular agent or dropped.

## Multi-tenant mapping

Integrations are org-scoped. The mapping from provider identity to Eve organization is established at integration connect time:

- Slack: `team_id` maps to `org_id`.
- Nostr: Platform pubkey maps to the org.
- WebChat: JWT claims map to user and org.

External identities (Slack user IDs, Nostr pubkeys) are stored in `external_identities` and linked to Eve users for permission checks and audit trails.

## Thread keys

Thread continuity uses a canonical key format scoped to the integration account:

```
account_id:channel[:thread_id]
```

| Provider | Example |
|----------|---------|
| Slack | `T123ABC:C456DEF:1234567890.123456` |
| Nostr | `<platform-pubkey>:<sender-pubkey>` |

Thread keys enable the gateway to maintain conversation context across messages and reconnections. See [Threads & Coordination](./threads.md) for the full thread model.

## Syncing configuration

Agent, team, and chat route configuration lives in YAML files in the repository and is synced to the platform:

```bash
# Sync from committed ref (production)
eve agents sync --project proj_xxx --ref abc123def456...

# Sync local state (development)
eve agents sync --project proj_xxx --local --allow-dirty

# Preview effective config without syncing
eve agents config --repo-dir ./my-app
```

Sync resolves AgentPacks from `x-eve.packs`, deep-merges pack agents/teams/chat with local overrides, validates org-wide slug uniqueness, and pushes the merged configuration to the API.

## Integration setup

### Connecting Slack

```bash
eve integrations slack connect --org <org_id> --team-id T123 --token xoxb-test
eve integrations test <integration_id> --org <org_id>
```

Required: subscribe to `app_mention` (for commands) and `message.channels` (for listeners) in your Slack app configuration.

### Setting a default agent

```bash
eve org update <org_id> --default-agent <slug>
```

When a message does not start with a known slug, the default agent receives it.

### Simulation

Test the full routing pipeline without a live provider:

```bash
eve chat simulate --project <id> --team-id T123 --channel-id C123 \
  --user-id U123 --text "hello" --json
```

Returns `thread_id` and `job_ids` showing how the message would be dispatched.

## CLI commands

| Command | Description |
|---------|-------------|
| [eve integrations slack connect](/docs/reference/cli-appendix#eve-integrations) | Connect a Slack workspace |
| [eve integrations list](/docs/reference/cli-appendix#eve-integrations) | List integrations for an org |
| [eve integrations test](/docs/reference/cli-appendix#eve-integrations) | Test an integration |
| [eve chat simulate](/docs/reference/cli-appendix#eve-chat-simulate) | Simulate a chat message |
| [eve org update](/docs/reference/cli-appendix#eve-org) | Set default agent and org config |
| [eve agents sync](/docs/reference/cli-appendix#eve-agents-sync) | Sync agents, teams, and routes |

## API endpoints

```
POST /gateway/providers/:provider/webhook    # Generic webhook ingress
POST /integrations/slack/events              # Legacy Slack endpoint

GET  /internal/orgs/{org_id}/agents          # Agent directory (filtered by policy)
POST /internal/orgs/{org_id}/chat/route      # Slug-based routing

POST /internal/projects/{project_id}/chat/deliver  # Outbound result/progress delivery
POST /gateway/internal/deliver               # Gateway delivery dispatch
POST /internal/storage/chat-attachments/presign  # Presigned URL for file upload/download

POST /chat/simulate                          # Simulate chat message
POST /chat/listen                            # Subscribe agent to channel/thread
POST /chat/unlisten                          # Unsubscribe agent
GET  /chat/listeners                         # List active listeners
```

## Next steps

Learn how threads enable conversation continuity and agent coordination: [Threads & Coordination](./threads.md)
