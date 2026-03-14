---
title: Chat & Conversations
description: Connect agents to Slack, Nostr, and WebChat through the chat gateway, configure routing rules, and manage conversation threads.
sidebar_position: 7
---

# Chat & Conversations

Eve connects agents to messaging platforms through the **chat gateway** — a pluggable service that normalizes external chat events into Eve events. Users talk to agents from Slack, Nostr, or a browser-based WebChat client, and the gateway handles the rest: authentication, routing, job creation, threaded replies, progress updates, and file handling.

## Chat gateway overview

The gateway uses a provider architecture with two transport models:

| Transport | Mechanism | Provider |
|-----------|-----------|----------|
| **Webhook** | Platform sends HTTP POST to Eve | Slack |
| **Subscription** | Eve opens a persistent connection and listens | Nostr, WebChat |

Every provider implements the `GatewayProvider` interface:

- **`name`** — unique identifier (e.g. `slack`, `nostr`, `webchat`)
- **`transport`** — `webhook` or `subscription`
- **`capabilities`** — feature flags: threads, reactions, file uploads
- **`initialize(config)` / `shutdown()`** — lifecycle hooks for setup and teardown
- **`sendMessage(target, content)`** — deliver an outbound reply
- **`resolveIdentity(externalUserId, accountId)`** — map an external user to an Eve identity

Webhook providers also expose `validateWebhook(req)` for signature verification and `parseWebhook(req)` for payload normalization. Subscription providers open their connections during `initialize()` and tear them down on `shutdown()`.

Provider instances are created per integration — one instance per org integration — and managed by the provider registry.

### Multi-tenant mapping

Each external workspace maps to an Eve organization. When a Slack workspace or Nostr relay is connected as an integration, the mapping (`team_id` to `org_id`) is stored at connect time. Agent slugs in `agents.yaml` are unique per org, so the gateway can resolve any slug to a specific `{project_id, agent_id}` pair.

### Identity resolution

The `resolveIdentity` method maps an external user (Slack user ID, Nostr pubkey) to an Eve identity. External identities are stored in the `external_identities` table and linked to Eve users and orgs for permission checks and audit trails.

Identity resolution proceeds through three tiers, evaluated in order. The first tier that produces a match short-circuits the rest.

#### Tier 1: Email auto-match

The gateway fetches the external user's email (e.g., via Slack's `users.info` API) and checks whether an Eve user with that email exists and is a member of the integration's org. If both conditions are met, the external identity is automatically bound to the Eve user — no action required.

```
Slack user (U123) → email → user@company.com → Eve user (usr_xxx) → org member? → BOUND
```

This is the zero-friction path for teams where Slack and Eve share the same email domain.

#### Tier 2: Self-service CLI link

An existing Eve user who was not auto-matched (e.g., different email on Slack vs. Eve) can link their identity manually:

```bash
eve identity link slack --org <org_id>
```

This generates a one-time link token. Send the token to `@eve` in Slack:

```text
@eve link <token>
```

The gateway validates the token, binds the external identity, and confirms in-channel.

#### Tier 3: Admin approval

When neither Tier 1 nor Tier 2 resolves the user, the platform creates a **membership request**. This is the fallback for completely unknown users — someone in a Slack workspace who has no Eve account.

Org admins can act on requests through:

- **CLI**: `eve org membership-requests list --org <org_id>`
- **Slack interactive buttons**: If `admin_channel_id` is configured on the integration, a Block Kit message is posted to the admin channel with Approve/Deny buttons

On approval, the platform creates an Eve user (if needed), adds org membership, binds the external identity, and notifies the user in Slack. On denial, the request is closed and the user is informed.

#### Resolution decision table

| Slack user has Eve email? | Eve user is org member? | Result |
|---------------------------|------------------------|--------|
| Yes | Yes | Tier 1: auto-bind |
| Yes | No | Tier 3: membership request (user exists but not a member) |
| No / unknown | — | Tier 2 if they self-link, otherwise Tier 3 |

:::tip
For most teams, Tier 1 handles identity resolution automatically. You only need Tier 2 or Tier 3 when email addresses differ between Slack and Eve, or when someone outside your org wants access.
:::

## Membership requests

When identity resolution falls through to Tier 3, Eve creates a membership request that tracks the user through an approval workflow.

### Lifecycle

```mermaid
graph TD
    A[Unknown user messages @eve] --> B[External identity created]
    B --> C[Membership request created — pending]
    C --> D[Admin notified via Slack + CLI]
    D --> E{Admin decision}
    E -->|Approve| F[Eve user created]
    F --> G[Org membership added]
    G --> H[External identity bound]
    H --> I[User notified in Slack]
    E -->|Deny| J[Request closed — user informed]
```

### Request states

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin decision |
| `approved` | Admin approved; user created and identity bound |
| `denied` | Admin denied; no access granted |

### Managing requests

```bash
# List pending requests
eve org membership-requests list --org <org_id>

# Approve (creates user + membership + identity binding)
eve org membership-requests approve <request_id> --org <org_id>

# Deny
eve org membership-requests deny <request_id> --org <org_id>
```

:::warning
Membership requests are org-scoped. If a user has an Eve account but is not a member of the integration's org, they will receive a membership request rather than an auto-bind — even if their email matches.
:::

### External identity lifecycle

External identities track the binding between a provider user and an Eve user. Understanding their lifecycle helps when debugging identity issues:

1. **Created** — when a provider user is first seen (e.g., first Slack message to `@eve`). The `eve_user_id` field is null (unresolved).
2. **Bound** — when identity resolution succeeds through any tier. The `eve_user_id` is set, and subsequent messages skip identity resolution entirely.
3. **Unbound** — if the linked Eve user is deleted, the identity returns to unresolved state.

Once bound, the external identity serves as a fast lookup for all future messages from that user — no resolution tiers are evaluated.

## Slack integration

Slack is the most common gateway provider. It uses the webhook transport model.

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /gateway/providers/slack/webhook` | Slack webhook ingress |
| `POST /gateway/providers/slack/interactive` | Slack interactive actions ingress |

### Inbound flow

1. Slack sends an event to the webhook endpoint.
2. The provider validates the request signature using `HMAC-SHA256(signing_secret, v0:timestamp:body)` against the `X-Slack-Signature` header. The signing secret is the org's Slack signing secret, configured via `eve integrations configure slack`.
3. Duplicate delivery is checked via Slack `event_id` (retries are acknowledged and dropped).
4. The integration mapping resolves `team_id` to `org_id`.
5. Identity is resolved before agent routing.
6. The event type determines the dispatch path:

| Event type | Trigger | Dispatch |
|------------|---------|----------|
| `app_mention` | User writes `@eve ...` | Parsed as `@eve <agent-slug> <command>` and routed to that agent |
| `message` | Any message in a subscribed channel (no mention) | Dispatched to channel/thread listeners only |

For `app_mention` events, the first word after `@eve` is tested as an agent slug. If it matches a known slug, the message routes directly to that agent's project. If no match is found, Eve falls back to the org's `default_agent_slug` and passes the full text as the command.

If identity cannot be resolved, the gateway returns a provider-specific linking message instead of a generic routing failure.

### Connecting a Slack workspace

:::note Prerequisites
Before connecting a Slack workspace, you must register your Slack app credentials with Eve. See the [Integrations guide](./integrations.md#slack) for setup instructions.
:::

The recommended way to connect a Slack workspace is with a **shareable install link**. An Eve admin generates the link, then sends it to anyone with Slack workspace admin access — no Eve credentials required on the recipient's side.

```bash
# Generate a shareable install link (24h TTL by default)
eve integrations slack install-url --org <org_id>

# Custom TTL
eve integrations slack install-url --org <org_id> --ttl 7d
```

The link redirects to Slack's OAuth consent screen. On approval, Eve exchanges the OAuth code for a bot token and creates the integration automatically. Install links are HMAC-signed, single-use, and expire after the configured TTL.

**Hot-loading**: The gateway detects and initializes new integrations within ~30 seconds — no restart required.

For air-gapped environments or when OAuth is unavailable, a manual fallback is still supported:

```bash
# Manual connect (requires bot token from Slack app settings)
eve integrations slack connect \
  --org <org_id> \
  --team-id <T-ID from Slack> \
  --token xoxb-...

# Verify the connection
eve integrations list --org <org_id>
eve integrations test <integration_id> --org <org_id>
```

Subscribe to these bot events in the Slack App configuration:

| Event | Purpose |
|-------|---------|
| `app_mention` | `@eve` commands |
| `message.channels` | Listener dispatch in public channels |
| `message.groups` | Listener dispatch in private channels |
| `message.im` | Direct messages to the bot |

### Integration settings

Each integration stores authentication tokens and configuration separately:

**`tokens_json`** holds sensitive credentials (bot token, bot user ID, app ID). These are never exposed in list responses.

**`settings_json`** holds non-sensitive configuration. The key setting is `admin_channel_id`, which controls where membership request notifications are posted:

```bash
# Set the admin notification channel for membership approvals
eve integrations update <integration_id> --org <org_id> \
  --setting admin_channel_id=C-ADMIN-CHANNEL
```

When `admin_channel_id` is not set, membership notifications are suppressed and admins must use the CLI to manage requests.

### Reserved command: `link`

`@eve link` is intercepted before slug resolution and always starts the [Tier 2 identity-link flow](#tier-2-self-service-cli-link).

```text
@eve link <token>
```

### Deduplication and timeouts

Slack retries webhook deliveries when a response takes more than ~3 seconds. The gateway acknowledges quickly and performs slower work asynchronously. Retries are de-duplicated by `event_id` in a short-lived in-memory cache.

### Outbound replies

When an agent completes a chat-originated job, the orchestrator automatically delivers the result back to the originating Slack thread. No manual `eve job result` needed — the reply appears in the same thread the user started.

The delivery path is:

1. **Orchestrator** detects job completion on a chat-labeled job with a `thread_id` hint.
2. **API** resolves the thread's provider metadata (channel, thread timestamp, provider credentials).
3. **Gateway** calls `chat.postMessage` via the Slack Web API, threaded to the originating message.

Delivery status is tracked per message (`pending`, `delivered`, `failed`) and visible in `eve thread messages <thread_id>`.

Long responses are formatted using Slack **Block Kit** — text is chunked into multiple section blocks, supporting up to **39,000 characters** per message. If a result exceeds the limit, it is truncated with a pointer to `eve job result <job_id>` for the full output.

### Progress updates

Agents can send real-time progress messages to the originating Slack thread while a job is running. Users see status updates instead of silence during long-running tasks.

Agents emit progress updates by writing `eve-message` fenced blocks in their output:

````
```eve-message
Pulling metrics data from the warehouse...
```
````

The `EveMessageRelay` on the agent runtime detects these blocks and delivers them through the same outbound pipeline as final results. Progress delivery is rate-limited to one message every 30 seconds, with a maximum of 10 progress messages per job. Each progress message is capped at 500 characters.

For team dispatch jobs, progress updates are also written to the coordination thread for sibling visibility.

### File attachments

When a user uploads files alongside a Slack message, the gateway downloads them using the bot token and stores them in Eve's internal storage. Files are then staged into the agent's workspace at `.eve/attachments/` before the job starts.

Agents read attached files through a manifest:

```
.eve/attachments/index.json     # file listing with metadata
.eve/attachments/<filename>     # the actual files
```

The `index.json` contains the file name, MIME type, size, and origin for each attachment. Agents are provider-agnostic — they read local files, not Slack URLs.

| Limit | Value |
|-------|-------|
| Max files per message | 10 |
| Max file size | 50 MB |
| Max total per message | 100 MB |

Files that exceed limits are skipped with a warning. The original provider URL is preserved in metadata as a fallback reference.

### Listener commands

Agents can passively monitor channels and threads using listener subscriptions:

```bash
@eve agents listen <agent-slug>     # Subscribe agent to this channel (or thread)
@eve agents unlisten <agent-slug>   # Remove listener
@eve agents listening               # Show active listeners
@eve agents list                    # Directory of available agent slugs
```

When a listener is set from within a channel, it creates a **channel-level** listener — all messages in that channel are dispatched. When set from inside a thread, it creates a **thread-level** listener — only messages within that specific thread are dispatched.

Multiple agents can listen to the same channel or thread. Each listener agent receives a separate job in its own project.

## Nostr integration

The Nostr provider uses the subscription transport model. It connects to configured relay(s) via WebSocket and subscribes to events targeting the platform's public key.

### Inbound event types

| Kind | Type | Description |
|------|------|-------------|
| Kind 4 | NIP-04 encrypted DM | Private message addressed to the platform pubkey |
| Kind 1 | Public mention | Public note tagging the platform pubkey |

### Inbound flow

1. A relay broadcasts an event matching the subscription filters.
2. The provider verifies the Schnorr signature (BIP-340).
3. Kind 4 events are decrypted using NIP-04 (shared secret derived from sender pubkey and platform private key).
4. The message is normalized to the standard inbound format.
5. The agent slug is extracted from the content.
6. The message is routed through the same dispatch pipeline as Slack.

### Agent slug extraction

| Pattern | Example |
|---------|---------|
| `/agent-slug <text>` | `/mission-control review PR` |
| `agent-slug: <text>` | `mission-control: review PR` |
| First word of public mention | `mission-control review PR` |

If no slug matches a known agent, the org's default agent is used.

### Outbound replies

| Context | Event kind | Details |
|---------|-----------|---------|
| DM reply | Kind 4 | NIP-04 encrypted, published to relays |
| Public reply | Kind 1 | NIP-10 reply threading tags (`e` and `p` tags) |

Cross-relay deduplication tracks event IDs in a bounded set (10k entries). Duplicate events from multiple relays are dropped.

## WebChat

WebChat is a browser-native agent chat provider that uses the subscription transport model (like Nostr) over WebSocket.

### Connection

```
ws://gateway:4820/?token=<jwt>
```

Authentication is performed during the WebSocket handshake using a JWT token.

### Message protocol

Send a message:

```json
{"type": "message", "text": "Hello", "agent_slug": "coder", "thread_id": "optional"}
```

Receive a reply:

```json
{"type": "message", "text": "Queued 1 job(s)...", "thread_id": "...", "timestamp": "..."}
```

### Features

- **JWT auth** — validated during the WebSocket handshake
- **Heartbeat** — ping/pong at 30-second intervals
- **Thread continuity** — threads persist across reconnections
- **Multi-tab** — same user, multiple simultaneous connections

WebChat is configured as an integration with `provider: webchat`.

## Chat routing

Chat routing controls how inbound messages reach the right agent, team, or workflow. Routes are defined in `chat.yaml`.

### chat.yaml

```yaml
version: 1
default_route: route_default
routes:
  - id: route_default
    match: ".*"
    target: team:ops
    permissions:
      project_roles: [member, admin, owner]
```

### Matching rules

1. Routes are evaluated in order.
2. The first regex match wins.
3. If no route matches, the `default_route` is used.

### Route targets

| Target | Behavior |
|--------|----------|
| `agent:<id>` | Dispatch to a single agent |
| `team:<id>` | Dispatch using the team's configured mode (fanout, council, relay) |
| `workflow:<name>` | Invoke a named workflow |
| `pipeline:<name>` | Launch a pipeline run |

### Direct slug routing

When a user writes `@eve <agent-slug> <command>`, the gateway resolves the agent slug across the org and dispatches directly to that agent's project. This **bypasses** `chat.yaml` matching and is intended for cross-project routing.

Resolution proceeds in order: canonical slug first, then **alias**, then the org's default agent. Aliases are short vanity names declared in `agents.yaml` — for example, an agent with slug `pmbot-pm` can declare alias `pm`, so users type `@eve pm hello` instead of `@eve pmbot-pm hello`. See [Agents & Teams](./agents-and-teams.md) for alias configuration.

If neither slug nor alias matches a known agent, Eve uses the org's `default_agent_slug` and passes the full message as the command.

## Message flow

The following sequence shows the end-to-end path of a chat message from Slack through to an agent reply, including file materialization, progress updates, and outbound delivery:

```mermaid
sequenceDiagram
    participant U as User (Slack)
    participant G as Gateway
    participant S as Storage
    participant R as Router
    participant A as Agent
    participant O as Orchestrator
    U->>G: @eve coder review PR #42 [+ file]
    G->>G: Validate signature + resolve identity
    G->>S: Download file, upload to Eve storage
    G->>R: Normalized message (eve-storage refs)
    R->>R: Resolve slug or alias
    R->>A: Dispatch to agent
    Note over A: Files staged at .eve/attachments/
    A->>G: Progress: "Reviewing PR..."
    G->>U: Progress update in thread
    A->>O: Job complete
    O->>G: Deliver result
    G->>U: Threaded reply in Slack
```

## Threads and continuity

Threads provide continuity for chat-driven work. A thread captures the route, participants, and message history for a conversation session.

### Thread key format

Thread continuity uses a canonical key scoped to the integration account:

```
account_id:channel[:thread_id]
```

Examples:

- **Slack**: `T123ABC:C456DEF:1234567890.123456`
- **Nostr**: `<platform-pubkey>:<sender-pubkey>`

### Thread scopes

| Scope | Description |
|-------|-------------|
| `project` | Belongs to a project, emits project chat events |
| `org` | Org-wide, used for multi-project or cross-channel coordination |

### Coordination threads

When a team dispatch creates child jobs, a **coordination thread** is automatically created and linked to the parent job. Child agents receive `EVE_PARENT_JOB_ID` in their environment and derive the coordination thread key:

```
coord:job:{parent_job_id}
```

When a child job's attempt completes, the orchestrator posts a summary to the coordination thread, giving the lead agent and team members visibility into sibling progress.

### Coordination inbox

When a coordination thread exists, the worker writes a lightweight inbox file into the repo workspace for quick review:

```
.eve/coordination-inbox.md
```

This file is regenerated from recent coordination thread messages at job start, giving agents immediate context about sibling activity.

### Supervision

Lead agents can long-poll child events for a job:

```bash
eve supervise
eve supervise <job-id> --timeout 60
```

### Org threads

Org-scoped threads provide continuity for multi-project or cross-channel coordination. They follow the same message schema as project threads but are keyed independently:

```
org:{org_id}:{user_key}
```

```bash
# Org thread API
eve thread list --org org_xxx
eve thread show --org org_xxx --id thr_xxx
```

### Thread CLI

```bash
eve thread list --org org_xxx
eve thread show --org org_xxx --id thr_xxx
eve thread messages thr_xxx --org org_xxx --since 10m
eve thread post thr_xxx --body '{"kind":"directive","body":"focus on auth"}'
eve thread follow thr_xxx
```

`eve thread follow` uses SSE-style streaming (`/threads/{id}/follow`) for near-real-time updates.

### Message kinds

Coordination thread messages use a JSON body with `kind` and `body` fields:

| Kind | Purpose |
|------|---------|
| `status` | Automatic end-of-attempt summary |
| `directive` | Lead-to-member instruction |
| `question` | Member-to-lead question |
| `update` | Progress update from a member |

## Org-wide agent directory

Every agent can declare how it appears to gateway clients via the `gateway_exposure` field in `agents.yaml`:

| Policy | Directory | Direct chat | Internal dispatch |
|--------|-----------|-------------|-------------------|
| `none` | Hidden | Rejected | Works |
| `discoverable` | Visible | Rejected (with hint) | Works |
| `routable` | Visible | Works | Works |

Use `@eve agents list` to view the org's agent directory. Set the default agent for your org with:

```bash
eve org update <org_id> --default-agent <slug>
```

## Simulation

Test the full routing pipeline without a live provider connection:

```bash
eve chat simulate \
  --team-id T123 \
  --text "hello" \
  --json
```

Use `--project` only for legacy simulation mode. Without `--project`, simulation goes through the gateway routing path and supports additional fields such as `--thread-id`, `--external-email`, `--event-type`, and `--dedupe-key`.

The response includes normalized routing output (`thread_id`, `route_id`, `target`, `job_ids`, `event_id`) plus gateway metadata like `duplicate` and `immediate_reply`.

:::tip
Simulation is available via both API paths:
- Legacy: `POST /projects/{project_id}/chat/simulate`
- Gateway: `POST /gateway/providers/simulate`
:::

## API endpoints

The gateway exposes several endpoints for chat operations:

| Endpoint | Purpose |
|----------|---------|
| `POST /gateway/providers/:provider/webhook` | Generic webhook ingress |
| `POST /gateway/providers/slack/interactive` | Slack interactive actions ingress |
| `GET /internal/orgs/{org_id}/agents` | Agent directory (filtered by exposure policy) |
| `POST /internal/orgs/{org_id}/chat/route` | Slug-based routing (enforces `routable` policy) |
| `POST /internal/projects/{project_id}/chat/deliver` | Outbound delivery (orchestrator to API) |
| `POST /gateway/internal/deliver` | Outbound delivery (API to gateway provider) |
| `POST /internal/storage/chat-attachments/presign` | Presigned URLs for file upload/download |
| `GET /integrations/slack/install?token=...` | Public Slack install (signed token) |
| `POST /gateway/providers/simulate` | Simulate via gateway routing |
| `POST /projects/{project_id}/chat/simulate` | Legacy project-scoped simulate API |
| `POST /chat/listen` | Subscribe an agent to a channel/thread |
| `POST /chat/unlisten` | Unsubscribe an agent |
| `GET /chat/listeners` | List active listeners |

## What's next?

Set up your local dev environment: [Local Development](./local-development.md)
