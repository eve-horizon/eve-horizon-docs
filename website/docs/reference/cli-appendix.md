---
sidebar_position: 11
title: CLI Reference (Complete)
description: Every Eve CLI command, subcommand, flag, and usage example.
---

# CLI Reference (Complete)

The `eve` CLI is the single entry point to the Eve Horizon platform. Every operation — bootstrapping a project, creating jobs, deploying environments, managing secrets, coordinating agent teams — flows through this tool. Both humans and AI agents use the same commands, making the CLI the shared language of the entire system.

```bash
eve <command> [subcommand] [options]
```

This page documents every command, every subcommand, every flag, and every example. Use your browser's search (Ctrl+F / Cmd+F) or the sidebar to jump to a specific command.

---

## Global options {#global-options}

These flags work with any command and override profile defaults for the current invocation.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--help` | boolean | — | Show help for the current command or subcommand |
| `--api-url <url>` | string | Profile default | Override the API base URL |
| `--profile <name>` | string | Active profile | Use a named repo-local profile |
| `--org <id>` | string | Profile default | Override default organization ID |
| `--project <id>` | string | Profile default | Override default project ID |
| `--json` | boolean | `false` | Output as machine-readable JSON |

---

## eve access {#eve-access}

Manage access control: check permissions, manage roles/bindings, and sync policy-as-code from `.eve/access.yaml`.

```
eve access <subcommand> [options]
```

### eve access can {#eve-access-can}

Check if a principal can perform an action.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Org scope |
| `--user <user_id>` | string | — | User to check (mutually exclusive with `--service-account`/`--group`) |
| `--service-account <id>` | string | — | Service account to check (mutually exclusive with `--user`/`--group`) |
| `--group <group_id>` | string | — | Group to check directly (mutually exclusive with `--user`/`--service-account`) |
| `--permission <perm>` | string | — | Permission to check (e.g., `chat:write`, `jobs:admin`) |
| `--project <project_id>` | string | — | Optional project scope for the check |
| `--resource-type <type>` | string | — | Optional resource type: `orgfs`, `orgdocs`, `envdb` |
| `--resource <id>` | string | — | Optional resource id/path (required when `--resource-type` used) |
| `--action <action>` | string | — | Optional action: `read`, `write`, `admin` |

**Examples:**

```bash
eve access can --org org_xxx --user user_abc --permission chat:write
eve access can --org org_xxx --user user_abc --project proj_xxx --permission jobs:admin
eve access can --org org_xxx --service-account sa_xxx --permission jobs:read
eve access can --org org_xxx --user user_abc --permission orgfs:read \
  --resource-type orgfs --resource /groups/pm/spec.md --action read
```

### eve access explain {#eve-access-explain}

Explain the permission resolution chain.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Org scope |
| `--user <user_id>` | string | — | User to explain (mutually exclusive with `--service-account`/`--group`) |
| `--service-account <id>` | string | — | Service account to explain |
| `--group <group_id>` | string | — | Group to explain directly |
| `--permission <perm>` | string | — | Permission to explain |
| `--project <project_id>` | string | — | Optional project scope |
| `--resource-type <type>` | string | — | Optional resource type: `orgfs`, `orgdocs`, `envdb` |
| `--resource <id>` | string | — | Optional resource id/path |
| `--action <action>` | string | — | Optional action: `read`, `write`, `admin` |

**Examples:**

```bash
eve access explain --org org_xxx --user user_abc --permission jobs:admin
eve access explain --org org_xxx --user user_abc --project proj_xxx --permission jobs:admin
eve access explain --org org_xxx --service-account sa_xxx --permission jobs:read
```

### eve access groups {#eve-access-groups}

Manage access groups and members.

```
eve access groups <create|list|show|update|delete|members> [args]
```

**Examples:**

```bash
eve access groups create "Product Management" --org org_xxx --slug pm-team
eve access groups list --org org_xxx
eve access groups members add pm-team --org org_xxx --user user_abc
eve access groups members list pm-team --org org_xxx
```

### eve access memberships {#eve-access-memberships}

Inspect memberships, effective bindings, and effective scopes for a principal.

```
eve access memberships --org <org_id> (--user <id>|--service-account <id>|--group <id>)
```

**Examples:**

```bash
eve access memberships --org org_xxx --user user_abc
eve access memberships --org org_xxx --service-account sa_abc
eve access memberships --org org_xxx --group grp_abc
```

### eve access roles {#eve-access-roles}

List, create, or inspect platform roles.

```
eve access roles <list|show|create|update|delete> [--org <org_id>] [flags]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Scope organization |
| `--name <name>` | string | — | Role name |
| `--description <text>` | string | — | Human-readable role description |

**Examples:**

```bash
eve access roles list --org org_xxx
eve access roles create --org org_xxx --name reviewer --description "Can review jobs"
eve access roles show reviewer --org org_xxx
```

### eve access bind {#eve-access-bind}

Bind a role to a principal.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Target organization |
| `--role <name>` | string | — | Role name |
| `--user <user_id>` | string | — | Bind to a user |
| `--service-account <id>` | string | — | Bind to a service account |
| `--group <group_id>` | string | — | Bind to an access group |

**Examples:**

```bash
eve access bind --org org_xxx --role reviewer --user user_abc
eve access bind --org org_xxx --role ci-bot --service-account sa_xyz
```

### eve access unbind {#eve-access-unbind}

Remove a principal-to-role binding.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Target organization |
| `--role <name>` | string | — | Role name |
| `--user <user_id>` | string | — | Unbind from user |
| `--service-account <id>` | string | — | Unbind from service account |
| `--group <group_id>` | string | — | Unbind from access group |

**Examples:**

```bash
eve access unbind --org org_xxx --role reviewer --user user_abc
eve access unbind --org org_xxx --role ci-bot --service-account sa_xyz
```

### eve access bindings {#eve-access-bindings}

List effective and explicit bindings for a role or principal.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Target organization |
| `--role <name>` | string | — | Optional role filter |
| `--service-account <id>` | string | — | Optional principal filter |
| `--user <id>` | string | — | Optional principal filter |
| `--group <id>` | string | — | Optional principal filter |

**Examples:**

```bash
eve access bindings --org org_xxx
eve access bindings --org org_xxx --role reviewer
```

### eve access validate {#eve-access-validate}

Validate an `.eve/access.yaml` file (schema + semantic checks).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--file <path>` | string | `.eve/access.yaml` | Path to access YAML file |
| `--json` | boolean | `false` | Output validation result as JSON |

**Examples:**

```bash
eve access validate
eve access validate --file custom/access.yaml
eve access validate --json
```

### eve access plan {#eve-access-plan}

Show changes needed to sync `access.yaml` to an org (dry run).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--file <path>` | string | `.eve/access.yaml` | Path to access YAML file |
| `--org <org_id>` | string | Profile default | Org to plan against |
| `--json` | boolean | `false` | Output plan as machine-readable JSON |

**Examples:**

```bash
eve access plan --org org_xxx
eve access plan --file .eve/access.yaml --org org_xxx --json
```

### eve access sync {#eve-access-sync}

Apply `access.yaml` to an org (create/update roles and bindings).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--file <path>` | string | `.eve/access.yaml` | Path to access YAML file |
| `--org <org_id>` | string | Profile default | Org to sync to |
| `--yes` | boolean | `false` | Skip confirmation prompt |
| `--prune` | boolean | `false` | Delete roles/bindings that exist in the org but not in the YAML |
| `--json` | boolean | `false` | Output sync result as JSON |

**Examples:**

```bash
eve access sync --org org_xxx
eve access sync --org org_xxx --yes
eve access sync --org org_xxx --prune --yes
eve access sync --file .eve/access.yaml --org org_xxx --json
```

---

## eve admin {#eve-admin}

Administrative commands for user, identity, and platform operations.

```
eve admin <subcommand> [options]
```

### eve admin users {#eve-admin-users}

List platform users and org memberships (system admin).

```bash
eve admin users [--json]
```

Output includes user email, display name, admin status, org memberships/roles, and creation date.

**Examples:**

```bash
eve admin users
eve admin users --json
```

### eve admin invite {#eve-admin-invite}

Invite a user by registering their GitHub SSH keys and adding them to an org.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--email <email>` | string | — | User email address (required) |
| `--github <username>` | string | — | GitHub username to fetch SSH keys from |
| `--role <role>` | string | `member` | Org role: `owner`, `admin`, `member` |
| `--org <org_id>` | string | Profile default | Organization to add user to |

**Examples:**

```bash
eve admin invite --email user@example.com --github octocat
eve admin invite --email user@example.com --github octocat --role admin --org org_xxx
```

### eve admin ingress-aliases {#eve-admin-ingress-aliases}

Inspect and reclaim ingress alias claims (system admin).

```
eve admin ingress-aliases <list|reclaim> [options]
```

List options: `--alias <name>`, `--project <id>`, `--environment <id|null>`, `--limit <n>`, `--offset <n>`

Reclaim usage: `eve admin ingress-aliases reclaim <alias> --reason "<text>"`

**Examples:**

```bash
eve admin ingress-aliases list --project proj_xxx
eve admin ingress-aliases reclaim eve-pm --reason "Reserved org rename"
```

### eve admin access-requests {#eve-admin-access-requests}

List or act on pending self-service access requests.

```
eve admin access-requests <list|approve|reject> [request_id] [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Organization scope |
| `--request-id <id>` | string | — | Request identifier for approve/reject |
| `--limit <n>` | number | `20` | Max items |
| `--offset <n>` | number | `0` | Page offset |
| `--reason <text>` | string | — | Rejection reason |

**Examples:**

```bash
eve admin access-requests list --org org_xxx
eve admin access-requests approve req_xxx
eve admin access-requests reject req_xxx --reason "Invalid identity proof"
```

### eve admin pricing {#eve-admin-pricing}

View model pricing and exchange-rate settings (admin scope).

```bash
eve admin pricing [--org <org_id>]
```

### eve admin balance {#eve-admin-balance}

Show organization or platform wallet balances (admin scope).

```bash
eve admin balance [--org <org_id>]
```

### eve admin usage {#eve-admin-usage}

View usage statistics for billing and quota analysis (admin scope).

```bash
eve admin usage [--org <org_id>] [--window <duration>] [--json]
```

### eve admin receipts {#eve-admin-receipts}

List or fetch billing receipts for an organization (admin scope).

```bash
eve admin receipts --org org_xxx [--limit <n>] [--offset <n>]
```

### eve admin models {#eve-admin-models}

Manage platform model enablement and provider configuration.

```bash
eve admin models <list|enable|disable> [flags]
```

**Examples:**

```bash
eve admin models list
eve admin models enable claude-3-7-sonnet
eve admin models disable gpt-4.1-nano
```

---

## eve agents {#eve-agents}

Inspect agent policy config and harness capabilities for orchestration. Default profile: `primary-orchestrator`.

```
eve agents <config|sync|runtime-status> [options]
```

### eve agents config {#eve-agents-config}

Show agent policy (profiles/councils) and harness availability.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--path <dir>` | string | cwd | Repository root to inspect |
| `--repo-dir <dir>` | string | — | Alias for `--path` |
| `--no-harnesses` | boolean | `false` | Skip harness availability lookup |

**Examples:**

```bash
eve agents config
eve agents config --json
eve agents config --path ../my-repo
```

### eve agents sync {#eve-agents-sync}

Sync `agents.yaml`/`teams.yaml`/`chat.yaml` to the API.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--ref <ref>` | string | — | Git ref to sync (required unless `--local`) |
| `--local` | boolean | `false` | Allow local sync (only for localhost/lvh.me API) |
| `--allow-dirty` | boolean | `false` | Allow syncing a dirty working tree |
| `--repo-dir <path>` | string | cwd | Repository root |
| `--force-nonlocal` | boolean | `false` | Allow `--local` against non-local API URL |

**Examples:**

```bash
eve agents sync --project proj_xxx --ref main
eve agents sync --project proj_xxx --ref HEAD
eve agents sync --project proj_xxx --local --allow-dirty
```

### eve agents runtime-status {#eve-agents-runtime-status}

Show agent runtime status for an org.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

**Examples:**

```bash
eve agents runtime-status --org org_xxx
eve agents runtime-status --json
```

---

## eve analytics {#eve-analytics}

View org-wide analytics: job counts, pipeline success rates, and environment health.

```
eve analytics <subcommand> [options]
```

### eve analytics summary {#eve-analytics-summary}

Org-wide activity summary (jobs, pipelines, environments).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--window <duration>` | string | `7d` | Time window (e.g., `7d`, `24h`, `30d`) |
| `--json` | boolean | `false` | Output raw JSON |

**Examples:**

```bash
eve analytics summary --org org_xxx
eve analytics summary --org org_xxx --window 30d
eve analytics summary --org org_xxx --json
```

### eve analytics jobs {#eve-analytics-jobs}

Job breakdown for the given time window.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--window <duration>` | string | `7d` | Time window |
| `--json` | boolean | `false` | Output raw JSON |

**Examples:**

```bash
eve analytics jobs --org org_xxx
eve analytics jobs --org org_xxx --window 24h --json
```

### eve analytics pipelines {#eve-analytics-pipelines}

Pipeline success rates and durations.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--window <duration>` | string | `7d` | Time window |
| `--json` | boolean | `false` | Output raw JSON |

**Examples:**

```bash
eve analytics pipelines --org org_xxx
eve analytics pipelines --org org_xxx --window 30d
```

### eve analytics env-health {#eve-analytics-env-health}

Current environment health snapshot.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--json` | boolean | `false` | Output raw JSON |

**Examples:**

```bash
eve analytics env-health --org org_xxx
eve analytics env-health --org org_xxx --json
```

---

## eve api {#eve-api}

Explore project API sources and call them with Eve auth.

```
eve api <subcommand> [options]
```

### eve api list {#eve-api-list}

List API sources for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID |
| `--env <name>` | string | — | Environment name (optional filter) |

**Examples:**

```bash
eve api list
eve api list proj_xxx --env staging
```

### eve api show {#eve-api-show}

Show details for a single API source.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name (optional filter) |

**Examples:**

```bash
eve api show app
eve api show app proj_xxx --env staging
```

### eve api spec {#eve-api-spec}

Show cached API spec (OpenAPI/GraphQL).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name (optional filter) |

**Examples:**

```bash
eve api spec app
eve api spec app proj_xxx --env staging
```

### eve api refresh {#eve-api-refresh}

Refresh cached API spec.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name (optional filter) |

**Examples:**

```bash
eve api refresh app --env staging
```

### eve api examples {#eve-api-examples}

Print curl templates from the cached API spec.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name (optional filter) |

**Examples:**

```bash
eve api examples app
eve api examples app --env staging
```

### eve api call {#eve-api-call}

Call an API endpoint with Eve auth.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--env <name>` | string | — | Environment name (optional source) |
| `--json <payload>` | string | — | JSON body inline or `@file` |
| `--data <payload>` | string | — | Alias for `--json` (curl-style) |
| `-d <payload>` | string | — | Shorthand alias for `--json` |
| `--jq <expr>` | string | — | Filter JSON output with jq |
| `--graphql <query>` | string | — | GraphQL query inline or `@file` |
| `--variables <json>` | string | — | JSON variables for GraphQL query |
| `--token <token>` | string | — | Override auth token |
| `--print-curl` | boolean | `false` | Print curl command instead of executing |

**Examples:**

```bash
eve api call app GET /notes --jq ".items"
eve api call app POST /notes --json '{"title":"Hello"}'
eve api call app POST /notes --data '{"title":"Hello"}'
eve api call graphql POST /graphql --graphql "{ notes { id } }"
```

### eve api generate {#eve-api-generate}

Export the API OpenAPI spec from the server.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--out <dir>` | string | `docs/system` | Output directory |

**Examples:**

```bash
eve api generate
eve api generate --out ./tmp/openapi
```

### eve api diff {#eve-api-diff}

Diff generated OpenAPI spec against the repo copy.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--exit-code` | boolean | `false` | Exit non-zero when drift detected |
| `--out <dir>` | string | `docs/system` | Directory containing expected spec |

**Examples:**

```bash
eve api diff --exit-code
```

---

## eve auth {#eve-auth}

Authenticate with Eve Horizon. Auth is optional for local development but required for cloud deployments. Credentials are stored globally per API URL.

```
eve auth <login|logout|status|whoami|bootstrap|sync|creds|token|mint|permissions>
```

### eve auth login {#eve-auth-login}

Login via GitHub SSH challenge (default) or Supabase (legacy).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--email <email>` | string | Profile `default_email` | Email address for SSH login |
| `--user-id <id>` | string | — | User id for SSH login |
| `--ssh-key <path>` | string | Profile `default_ssh_key` | Path to SSH private key (when omitted, the CLI auto-discovers keys in `~/.ssh/`, preferring `id_ed25519`, then `id_ecdsa`, then `id_rsa`) |
| `--ttl <days>` | number | Server configured | Token TTL in days (1-90) |
| `--password <pass>` | string | — | Supabase password (triggers Supabase login) |
| `--supabase-url <url>` | string | — | Supabase URL |
| `--supabase-anon-key <key>` | string | — | Supabase anon key |

**Examples:**

```bash
eve auth login --email user@example.com
eve auth login --email user@example.com --ttl 30
eve auth login                    # uses profile defaults if set
eve auth login --ssh-key ~/.ssh/id_rsa
```

If auto-discovery is used, the CLI prints which SSH key succeeded.

### eve auth logout {#eve-auth-logout}

Clear stored credentials.

```bash
eve auth logout
```

### eve auth status {#eve-auth-status}

Check authentication status.

```bash
eve auth status
```

### eve auth request-access {#eve-auth-request-access}

Submit or check self-service access requests.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization to request access for |
| `--email <email>` | string | — | Requesting user email |
| `--ssh-key <path>` | string | `~/.ssh/id_ed25519.pub` | SSH public key for bootstrap |
| `--nostr-pubkey <hex>` | string | — | Nostr identity key |
| `--role <role>` | string | `member` | Requested organization role |
| `--status <request_id>` | string | — | Poll request status (optional) |
| `--wait` | boolean | `false` | Poll until request is processed |

**Examples:**

```bash
eve auth request-access --org org_xxx --email you@example.com
eve auth request-access --org org_xxx --ssh-key ~/.ssh/id_ed25519.pub
eve auth request-access --org org_xxx --nostr-pubkey 9a...
eve auth request-access --status req_xxx
```

### eve auth whoami {#eve-auth-whoami}

Show current user info.

```bash
eve auth whoami
```

### eve auth token {#eve-auth-token}

Print the current access token to stdout for sharing with reviewers or use in scripts.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--print` | boolean | `true` | Explicitly request token print (default behavior) |

**Examples:**

```bash
eve auth token
TOKEN=$(eve auth token)
curl -H "Authorization: Bearer $(eve auth token)" https://api.example.com
eve auth token | pbcopy    # Copy to clipboard
```

### eve auth mint {#eve-auth-mint}

Mint a user token (admin-only, no SSH login required).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--email <email>` | string | — | Target user email (created if missing) |
| `--org <org_id>` | string | — | Org scope for membership and permission checks |
| `--project <id>` | string | — | Project scope for membership and permission checks |
| `--role <role>` | string | `member` | Role to assign: `member`, `admin` |
| `--ttl <days>` | number | Server configured | Token TTL in days (1-90) |

**Examples:**

```bash
eve auth mint --email app-bot@example.com --org org_xxx
eve auth mint --email app-bot@example.com --project proj_xxx
eve auth mint --email app-bot@example.com --project proj_xxx --role admin
eve auth mint --email bot@example.com --org org_xxx --ttl 90
```

### eve auth create-service-account {#eve-auth-create-service-account}

Create a service account for CI/CD automation.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | — | Organization for the service account |
| `--name <name>` | string | — | Service account name |
| `--role <role>` | string | `member` | Service account role |
| `--description <text>` | string | — | Optional description |

**Examples:**

```bash
eve auth create-service-account --org org_xxx --name "ci-bot"
eve auth create-service-account --org org_xxx --name "release-bot" --role admin
```

### eve auth list-service-accounts {#eve-auth-list-service-accounts}

List service accounts for an organization.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Organization to list from |
| `--limit <n>` | number | `100` | Maximum rows |
| `--offset <n>` | number | `0` | Paging offset |
| `--include-disabled` | boolean | `false` | Include disabled service accounts |

**Examples:**

```bash
eve auth list-service-accounts --org org_xxx
eve auth list-service-accounts --org org_xxx --limit 20
```

### eve auth revoke-service-account {#eve-auth-revoke-service-account}

Revoke and delete a service account.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <org_id>` | string | Profile default | Organization containing account |
| `--service-account-id <id>` | string | — | Service account ID |
| `--force` | boolean | `false` | Skip confirmation prompt |

**Examples:**

```bash
eve auth revoke-service-account --org org_xxx --service-account-id sa_xxx
eve auth revoke-service-account --service-account-id sa_xxx --force
```

### eve auth bootstrap {#eve-auth-bootstrap}

Bootstrap the first admin user with flexible security modes.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--email <email>` | string | — | Admin email address (required for bootstrap) |
| `--token <token>` | string | `$EVE_BOOTSTRAP_TOKEN` | Bootstrap token (required in secure mode) |
| `--ssh-key <path>` | string | `~/.ssh/id_ed25519.pub` | Path to SSH public key |
| `--display-name <name>` | string | — | Display name for the admin user |
| `--status` | boolean | `false` | Check bootstrap status instead of bootstrapping |

Bootstrap modes (configured server-side via `BOOTSTRAP_MODE`):

- **auto-open** — Token not required during initial window (default for new installs)
- **recovery** — Like auto-open, but for disaster recovery scenarios
- **secure** — Token always required (recommended for production)
- **closed** — Bootstrap disabled (use database seeding instead)

**Examples:**

```bash
eve auth bootstrap --status
eve auth bootstrap --email admin@example.com
eve auth bootstrap --email admin@example.com --token secret123
EVE_BOOTSTRAP_TOKEN=secret123 eve auth bootstrap --email admin@example.com
eve auth bootstrap --email admin@example.com --ssh-key ~/.ssh/id_rsa.pub
```

### eve auth sync {#eve-auth-sync}

Extract OAuth tokens from host and set as Eve secrets.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--claude` | boolean | `false` | Only extract Claude/Anthropic tokens |
| `--codex` | boolean | `false` | Only extract Codex/OpenAI tokens |
| `--org <id>` | string | — | Set as org-level secrets |
| `--project <id>` | string | — | Set as project-level secrets |
| `--dry-run` | boolean | `false` | Show what would be set without actually setting |

Scope priority: `--project` > `--org` > user (default). Default scope is user-level, so credentials are available to all your jobs.

**Examples:**

```bash
eve auth sync                        # Sync to user-level (default)
eve auth sync --org org_xxx          # Sync to org-level
eve auth sync --project proj_xxx     # Sync to project-level
eve auth sync --dry-run              # Preview without syncing
```

### eve auth creds {#eve-auth-creds}

Show local AI tool credentials (Claude Code, Codex/Code) without syncing.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--claude` | boolean | `false` | Only check Claude/Anthropic credentials |
| `--codex` | boolean | `false` | Only check Codex/OpenAI credentials |

**Examples:**

```bash
eve auth creds
eve auth creds --claude
eve auth creds --json
```

### eve auth permissions {#eve-auth-permissions}

Show the permission matrix (which permissions each role has).

**Examples:**

```bash
eve auth permissions
eve auth permissions --json
```

---

## eve build {#eve-build}

Manage builds. Builds are first-class primitives for container image creation (specs, runs, artifacts).

```
eve build <subcommand> [options]
```

### eve build create {#eve-build-create}

Create a new build spec.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--ref <sha>` | string | — | Git SHA (required). Non-SHA refs resolve against the repo in `--repo-dir` or cwd. |
| `--manifest-hash <hash>` | string | — | Manifest hash (required) |
| `--services <list>` | string | — | Comma-separated service names to build |
| `--repo-dir <path>` | string | cwd | Resolve `--ref` against this repo instead of cwd |

**Examples:**

```bash
eve build create --ref 0123456789abcdef0123456789abcdef01234567 --manifest-hash mfst_123
eve build create --project proj_xxx --ref 0123456789abcdef0123456789abcdef01234567 \
  --manifest-hash mfst_123 --services api,web
eve build create --project proj_xxx --ref main --repo-dir ./my-app --manifest-hash mfst_123
```

### eve build list {#eve-build-list}

List build specs for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--limit <n>` | number | — | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve build list
eve build list --project proj_xxx --limit 20
```

### eve build show {#eve-build-show}

Show build spec details.

```bash
eve build show build_xxx
```

### eve build run {#eve-build-run}

Start a build run for an existing build spec.

```bash
eve build run build_xxx
```

### eve build runs {#eve-build-runs}

List runs for a build spec.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--limit <n>` | number | — | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve build runs build_xxx
```

### eve build logs {#eve-build-logs}

Show build logs.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--run <id>` | string | Latest | Specific run ID |
| `--follow` | boolean | `false` | Stream logs in real time |

**Examples:**

```bash
eve build logs build_xxx
eve build logs build_xxx --run brun_yyy
eve build logs build_xxx --follow
```

### eve build artifacts {#eve-build-artifacts}

List build artifacts (images produced).

```bash
eve build artifacts build_xxx
```

### eve build diagnose {#eve-build-diagnose}

Show full build state (spec, runs, artifacts, logs).

```bash
eve build diagnose build_xxx
```

### eve build cancel {#eve-build-cancel}

Cancel an active build run.

```bash
eve build cancel build_xxx
```

---

## eve chat {#eve-chat}

Chat tooling for gateway testing.

```
eve chat <subcommand> [options]
```

### eve chat simulate {#eve-chat-simulate}

Simulate an inbound chat message.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | — | Project ID (legacy simulate path) |
| `--provider <name>` | string | `slack` | Provider name |
| `--team-id <id>` | string | — | Slack team ID |
| `--channel-id <id>` | string | — | Channel ID |
| `--user-id <id>` | string | — | User ID |
| `--thread-id <id>` | string | — | Thread ID override (`--thread-key` alias supported) |
| `--external-email <email>` | string | — | External identity email hint for routing |
| `--dedupe-key <key>` | string | — | Deterministic deduplication key |
| `--event-type <type>` | string | — | Provider event type override |
| `--metadata <json>` | string | — | Legacy metadata JSON (`external_email` supported) |

**Examples:**

```bash
eve chat simulate --team-id T123 --text "hello"
eve chat simulate --team-id T123 --text "hello" --external-email user@example.com
eve chat simulate --project proj_xxx --team-id T123 --text "hello"   # legacy path
```

When `--project` is set, the CLI uses the legacy project simulate endpoint. Without `--project`, it uses the gateway simulate endpoint (`/gateway/providers/simulate`).

---

## eve db {#eve-db}

Inspect and query environment databases with Eve auth + RLS.

```
eve db <subcommand> [options]
```

### eve db schema {#eve-db-schema}

Show database schema for an environment.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name |
| `--url <postgres-url>` | string | — | Direct Postgres connection |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve db schema --env staging
eve db schema --url postgres://app:secret@localhost:5432/myapp
```

### eve db rls {#eve-db-rls}

Show RLS policies or scaffold helper SQL.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name (required for inspect mode) |
| `--with-groups` | boolean | `false` | Generate `app.current_group_ids()`/`app.has_group()` helper SQL (init mode) |
| `--out <path>` | string | `db/rls/helpers.sql` | Output file for init mode |
| `--force` | boolean | `false` | Overwrite output file when it already exists |

**Examples:**

```bash
eve db rls --env staging
eve db rls init --with-groups
```

### eve db sql {#eve-db-sql}

Run parameterized SQL as the calling user.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--env <name>` | string | — | Environment name |
| `--url <postgres-url>` | string | — | Direct Postgres connection |
| `--sql <statement>` | string | — | SQL to run (inline) |
| `--file <path>` | string | — | Read SQL from file |
| `--params <json>` | string | — | JSON array/object of parameters |
| `--write` | boolean | `false` | Allow writes (requires `db.write` scope) |

**Examples:**

```bash
eve db sql --env staging --sql "select * from notes"
eve db sql --url postgres://app:secret@localhost:5432/myapp --sql "select 1"
eve db sql --env staging --file ./query.sql --params "[1]"
```

### eve db migrate {#eve-db-migrate}

Apply pending migrations.

```bash
eve db migrate --env staging
eve db migrate --url postgres://app:secret@localhost:5432/myapp
```

### eve db migrations {#eve-db-migrations}

List applied migrations.

```
eve db migrations --env <name>|--url <postgres-url> [--project <id>]
```

### eve db reset {#eve-db-reset}

Reset schema and optionally re-apply migrations.

```
eve db reset --env <name>|--url <postgres-url> --force [--no-migrate] [--project <id>]
```

### eve db wipe {#eve-db-wipe}

Alias for reset with `--no-migrate`.

```
eve db wipe --env <name>|--url <postgres-url> --force [--project <id>]
```

---

## eve docs {#eve-docs}

Manage org documents (versioned).

```
eve docs <subcommand> [options]
```

### eve docs write {#eve-docs-write}

Create or update an org document.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--path <path>` | string | — | Document path (required) |
| `--file <path>` | string | — | Read content from file |
| `--stdin` | boolean | `false` | Read content from stdin |
| `--project <id>` | string | — | Project ID to associate |
| `--metadata <json>` | string | — | Document metadata JSON |
| `--review-in <dur>` | string | — | Set `review_due` from now (e.g., `30d`) |
| `--review-due <iso>` | string | — | Set explicit `review_due` timestamp |
| `--expires-in <dur>` | string | — | Set `expires_at` from now (e.g., `14d`) |
| `--expires-at <iso>` | string | — | Set explicit `expires_at` timestamp |
| `--lifecycle-status <s>` | string | — | Lifecycle status override |

**Examples:**

```bash
eve docs write --org org_xxx --path /pm/features/FEAT-123.md --file ./feat.md
eve docs write --org org_xxx --path /agents/reviewer/memory/learnings/auth.md \
  --file ./auth.md --review-in 30d
```

### eve docs read {#eve-docs-read}

Read a document (optionally pinned to a version).

```
eve docs read --org <org_id> --path <doc_path> [--version <n>]
```

**Examples:**

```bash
eve docs read --org org_xxx --path /pm/features/FEAT-123.md --version 3
```

### eve docs show {#eve-docs-show}

Show document metadata (verbose includes version info).

```
eve docs show --org <org_id> --path <doc_path> [--verbose]
```

### eve docs list {#eve-docs-list}

List documents by path prefix.

```
eve docs list --org <org_id> [--path <prefix>]
```

### eve docs search {#eve-docs-search}

Full-text search documents.

```
eve docs search --org <org_id> --query <text> [--limit <n>] [--mode text|semantic|hybrid]
```

### eve docs stale {#eve-docs-stale}

List stale documents by `review_due` age.

```
eve docs stale --org <org_id> [--overdue-by 7d] [--prefix <path>] [--limit <n>]
```

**Examples:**

```bash
eve docs stale --org org_xxx --overdue-by 7d
```

### eve docs review {#eve-docs-review}

Mark a document reviewed and set next review date.

```
eve docs review --org <org_id> --path <doc_path> --next-review <duration|iso>
```

**Examples:**

```bash
eve docs review --org org_xxx --path /agents/reviewer/memory/learnings/auth.md --next-review 30d
```

### eve docs versions {#eve-docs-versions}

List document versions.

```
eve docs versions --org <org_id> --path <doc_path> [--limit <n>] [--offset <n>]
```

**Examples:**

```bash
eve docs versions --org org_xxx --path /pm/features/FEAT-123.md
```

### eve docs query {#eve-docs-query}

Structured metadata query.

```
eve docs query --org <org_id> [--path-prefix <prefix>] --where "metadata.foo eq bar"
```

**Examples:**

```bash
eve docs query --org org_xxx --where "metadata.feature_status in draft,review"
```

### eve docs delete {#eve-docs-delete}

Delete a document.

```
eve docs delete --org <org_id> --path <doc_path>
```

---

## eve env {#eve-env}

Manage environments for projects. Environments are deployment targets (staging, production, test).

```
eve env <subcommand> [options]
```

### eve env list {#eve-env-list}

List environments for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID or slug |

**Examples:**

```bash
eve env list
eve env list proj_xxx
```

### eve env show {#eve-env-show}

Show details of an environment.

```bash
eve env show proj_xxx staging
eve env show my-project production
```

### eve env create {#eve-env-create}

Create an environment.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<name>` | string | — | Environment name (e.g., `staging`, `production`, `test`) |
| `--type <type>` | string | — | Environment type: `persistent` or `temporary` (required) |
| `--namespace <ns>` | string | — | K8s namespace (optional) |
| `--db-ref <ref>` | string | — | Database reference (optional) |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve env create staging --type=persistent
eve env create test --type=persistent --namespace=eve-test
```

### eve env suspend {#eve-env-suspend}

Suspend environment reconciliation and stop auto-deploys.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<env>` | string | — | Environment name |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve env suspend staging
```

### eve env resume {#eve-env-resume}

Resume a suspended environment.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<env>` | string | — | Environment name |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve env resume staging
```

### eve env health {#eve-env-health}

Check environment readiness status without logs.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | — | Project ID or slug |
| `<env>` | string | — | Environment name |
| `--json` | boolean | `false` | Output machine-readable JSON |

**Examples:**

```bash
eve env health proj_xxx staging
eve env health proj_xxx staging --json
```

### eve env deploy {#eve-env-deploy}

Deploy to an environment.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<env>` | string | — | Environment name |
| `--ref <sha>` | string | — | Git SHA (choose one: `--ref` or `--release-tag`) |
| `--release-tag <tag>` | string | — | Deploy an existing release by tag |
| `--direct` | boolean | `false` | Bypass pipeline and do direct deploy |
| `--inputs <json>` | string | — | JSON inputs for the deployment |
| `--image-tag <tag>` | string | — | Use a specific image tag for deploy (direct only) |
| `--repo-dir <path>` | string | cwd | Resolve `--ref` against this repo instead of cwd |
| `--skip-preflight` | boolean | `false` | Skip deploy image preflight checks |
| `--project <id>` | string | Profile default | Project ID or slug |
| `--watch` | boolean | `true` | Poll deployment status until ready |
| `--timeout <seconds>` | number | `120` | Watch timeout in seconds |

**Examples:**

```bash
eve env deploy staging --ref 0123456789abcdef0123456789abcdef01234567
eve env deploy staging --release-tag v1.2.3
eve env deploy staging --ref 0123456789abcdef0123456789abcdef01234567 --direct
eve env deploy staging --ref main --repo-dir ./my-app
```

### eve env rollback {#eve-env-rollback}

Roll back an environment to a known release.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<env>` | string | — | Environment name |
| `--release <ref>` | string | — | Release ID, release tag, or `"previous"` |
| `--project <id>` | string | Profile default | Project ID |
| `--skip-preflight` | boolean | `false` | Skip deploy image preflight checks |

**Examples:**

```bash
eve env rollback staging --release previous
eve env rollback staging --release rel_xxx --project proj_xxx
```

### eve env reset {#eve-env-reset}

Reset an environment (cancel runs, teardown workloads, redeploy release).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<env>` | string | — | Environment name |
| `--release <ref>` | string | Current release | Optional release override |
| `--project <id>` | string | Profile default | Project ID |
| `--force` | boolean | `false` | Required for non-production persistent envs |
| `--danger-reset-production` | boolean | `false` | Required for production envs |
| `--skip-preflight` | boolean | `false` | Skip deploy image preflight checks |

**Examples:**

```bash
eve env reset staging --force
eve env reset production --danger-reset-production --release v1.2.3
```

### eve env recover {#eve-env-recover}

Analyze environment issues and suggest the next recovery command.

```bash
eve env recover proj_xxx staging
```

### eve env diagnose {#eve-env-diagnose}

Diagnose environment deployments (k8s-only).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | — | Project ID or slug |
| `<env>` | string | — | Environment name |
| `--events <n>` | number | — | Limit number of recent events |

**Examples:**

```bash
eve env diagnose proj_xxx staging
eve env diagnose proj_xxx staging --events 20
```

### eve env services {#eve-env-services}

Show per-service pod status summary (k8s-only).

```bash
eve env services proj_xxx staging
```

### eve env logs {#eve-env-logs}

Fetch logs for a service in an environment (k8s-only).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | — | Project ID or slug |
| `<env>` | string | — | Environment name |
| `<service>` | string | — | Service name from manifest |
| `--since <seconds>` | number | — | Seconds since now |
| `--tail <n>` | number | — | Tail line count |
| `--grep <text>` | string | — | Filter lines containing text |
| `--pod <name>` | string | — | Specific pod name |
| `--container <name>` | string | — | Specific container name |
| `--previous` | boolean | `false` | Use previous container logs |
| `--all-pods` | boolean | `false` | Fetch logs for all matching pods |

**Examples:**

```bash
eve env logs proj_xxx staging api --tail 200
eve env logs proj_xxx staging api --since 3600 --grep ERROR
eve env logs proj_xxx staging api --all-pods
```

### eve env delete {#eve-env-delete}

Delete an environment.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<name>` | string | — | Environment name to delete |
| `--project <id>` | string | Profile default | Project ID |
| `--force` | boolean | `false` | Skip confirmation prompt |
| `--danger-delete-production` | boolean | `false` | Required for production envs |

**Examples:**

```bash
eve env delete test
eve env delete staging --project=proj_xxx
eve env delete old-env --force
```

---

## eve event {#eve-event}

Emit and inspect events. Apps use this to participate in the Event Ecosystem.

```
eve event <subcommand> [options]
```

### eve event list {#eve-event-list}

List events for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID or slug |
| `--type <type>` | string | — | Filter by event type (e.g., `github.push`, `app.deploy.complete`) |
| `--source <source>` | string | — | Filter by source (e.g., `github`, `cron`, `app`) |
| `--status <status>` | string | — | Filter by status: `pending`, `processed`, `failed` |
| `--limit <n>` | number | — | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve event list
eve event list --type app.deploy.complete --source app
```

### eve event show {#eve-event-show}

Show event details.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve event show evt_xxx
eve event show evt_xxx --project proj_yyy
```

### eve event emit {#eve-event-emit}

Emit an event to trigger pipelines or notify other services.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | — | Project ID (required) |
| `--type <type>` | string | — | Event type (e.g., `app.build.complete`) |
| `--source <source>` | string | — | Event source (e.g., `app`, `ci`, `manual`) |
| `--env <name>` | string | — | Environment name |
| `--ref-branch <branch>` | string | — | Git branch reference |
| `--ref-sha <sha>` | string | — | Git commit SHA |
| `--actor-type <type>` | string | `user` | Actor kind (`user`, `system`, `app`) |
| `--actor-id <id>` | string | — | Actor identifier |
| `--dedupe-key <key>` | string | — | Idempotency key for deduplicating events |
| `--mutation-id <id>` | string | — | External mutation identifier |
| `--request-id <id>` | string | — | Upstream request identifier |
| `--payload <json>` | string | — | JSON payload with event data |

**Examples:**

```bash
eve event emit --project proj_xxx --type app.build.complete --source app
eve event emit --project proj_xxx --type deploy.finished --source ci \
  --env production --ref-branch main --payload '{"version":"1.2.3"}'
```

---

## eve fs {#eve-fs}

Manage org filesystem sync links, share links, public path prefixes, and diagnostics.

```
eve fs <sync|share|shares|revoke|publish|public-paths> [options]
```

### eve fs sync {#eve-fs-sync}

Org filesystem sync operations.

```
eve fs sync <init|status|logs|pause|resume|disconnect|mode|conflicts|resolve|doctor> [options]
```

| Subcommand | Flags |
|------------|-------|
| `init` | `--org <id> --local <path> [--mode two-way\|push-only\|pull-only] [--include <glob>] [--exclude <glob>] [--remote-path <path>] [--device-name <name>]` |
| `status` | `--org <id>` |
| `logs` | `--org <id> [--after <seq>] [--limit <n>] [--follow]` |
| `pause` | `--org <id> [--link <link_id>]` |
| `resume` | `--org <id> [--link <link_id>]` |
| `disconnect` | `--org <id> [--link <link_id>]` |
| `mode` | `--org <id> --set <two-way\|push-only\|pull-only> [--link <link_id>]` |
| `conflicts` | `--org <id> [--open-only]` |
| `resolve` | `--org <id> --conflict <id> --strategy <pick-remote\|pick-local\|manual>` |
| `doctor` | `--org <id>` |

**Examples:**

```bash
eve fs sync init --org org_xxx --local ~/Eve/acme --mode two-way \
  --include "docs/**" --exclude ".git/**" --device-name laptop-01
eve fs sync status --org org_xxx
eve fs sync logs --org org_xxx --follow
eve fs sync mode --org org_xxx --set pull-only
eve fs sync doctor --org org_xxx
```

### eve fs share {#eve-fs-share}

Create a time-limited share URL for an org filesystem path.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization scope |
| `--expires <duration>` | string | Server default | Expiry duration (for example `1h`, `7d`) |
| `--label <text>` | string | — | Human-readable label |
| `--json` | boolean | `false` | Output full share payload as JSON |

**Examples:**

```bash
eve fs share /test/scenario-26.md --org org_xxx --expires 1h
eve fs share /docs/roadmap.md --org org_xxx --label "External review"
eve fs share /docs/roadmap.md --org org_xxx --json
```

### eve fs shares {#eve-fs-shares}

List active share tokens for an org.

```bash
eve fs shares --org org_xxx [--json]
```

### eve fs revoke {#eve-fs-revoke}

Revoke an active share token.

```bash
eve fs revoke <token> --org org_xxx [--json]
```

### eve fs publish {#eve-fs-publish}

Publish a path prefix for tokenless public access.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization scope |
| `--label <text>` | string | — | Human-readable label for the published prefix |
| `--json` | boolean | `false` | Output result as JSON |

**Examples:**

```bash
eve fs publish /test/ --org org_xxx --label "Public test area"
eve fs publish /assets/ --org org_xxx --json
```

### eve fs public-paths {#eve-fs-public-paths}

List currently published public path prefixes.

```bash
eve fs public-paths --org org_xxx [--json]
```

---

## eve github {#eve-github}

Configure and verify project-level GitHub webhook integration.

```
eve github <setup|status|test> [--project <id>]
```

### eve github setup {#eve-github-setup}

Generate or rotate webhook configuration for a project. Attempts to auto-create/update the webhook using `gh` when available; otherwise prints manual instructions.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--regenerate` | boolean | `false` | Rotate webhook secret |

**Examples:**

```bash
eve github setup --project proj_xxx
eve github setup --project proj_xxx --regenerate
```

### eve github status {#eve-github-status}

Show whether GitHub webhook integration is configured for the project.

```bash
eve github status --project proj_xxx
```

### eve github test {#eve-github-test}

Emit a test GitHub event for trigger validation.

```bash
eve github test --project proj_xxx
```

---

## eve harness {#eve-harness}

Inspect available harnesses, variants, and auth status.

```
eve harness <subcommand> [options]
```

### eve harness list {#eve-harness-list}

List available harnesses.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--capabilities` | boolean | `false` | Show model/reasoning capability hints |

**Examples:**

```bash
eve harness list
eve harness list --capabilities
```

### eve harness get {#eve-harness-get}

Get harness details and auth requirements.

```bash
eve harness get mclaude
```

---

## eve init {#eve-init}

Initialize a new Eve Horizon project from a template. Downloads the starter template, strips git history, initializes a fresh repo, and installs skills. After init, start your AI coding agent and run the `eve-new-project-setup` skill to complete configuration.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[directory]` | string | `.` | Target directory |
| `--template <url>` | string | `https://github.com/incept5/eve-horizon-starter` | Template repository URL |
| `--branch <branch>` | string | `main` | Branch to use |
| `--skip-skills` | boolean | `false` | Skip automatic skill installation |

**Examples:**

```bash
eve init
eve init my-project
eve init my-project --template https://github.com/myorg/my-template
eve init . --branch develop
```

---

## eve identity {#eve-identity}

Identity linking helpers for external providers.

```
eve identity <link>
```

### eve identity link {#eve-identity-link}

Create a link token for the current user and provider/org pair.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[provider]` | string | — | Provider name (currently `slack`) |
| `--org <id>` | string | Profile default | Organization ID |

**Examples:**

```bash
eve identity link slack --org org_xxx
eve identity link slack --org org_xxx --json
```

---

## eve integrations {#eve-integrations}

Manage chat integrations (Slack) for an organization.

```
eve integrations <subcommand> [options]
```

### eve integrations list {#eve-integrations-list}

List integrations for an org.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

### eve integrations slack {#eve-integrations-slack}

Manage Slack integration setup (`connect` or `install-url`).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | — | Organization ID |
| `--team-id <id>` | string | — | Slack team ID |
| `--token <token>` | string | — | Slack access token (stored in `tokens_json`) |
| `--tokens-json <json>` | string | — | Raw `tokens_json` payload |
| `--status <status>` | string | `active` | Integration status |

**Examples:**

```bash
eve integrations list --org org_xxx
eve integrations slack connect --org org_xxx --team-id T123 --token xoxb-...
eve integrations slack install-url --org org_xxx
```

### eve integrations test {#eve-integrations-test}

Test an integration.

```bash
eve integrations test <integration_id>
```

### eve integrations update {#eve-integrations-update}

Patch integration settings with a single `key=value` entry.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<integration_id>` | string | — | Integration ID |
| `--org <id>` | string | Profile default | Organization ID |
| `--setting <key=value>` | string | — | Setting update (for example `admin_channel_id=C12345`) |

**Examples:**

```bash
eve integrations update int_xxx --org org_xxx --setting admin_channel_id=C12345
```

---

## eve job {#eve-job}

Manage jobs. Jobs are units of work executed by AI agents against a project's repo.

Phase lifecycle: `idea` > `backlog` > `ready` > `active` > `review` > `done` (or `cancelled`). Jobs default to `ready` phase, making them immediately schedulable.

```
eve job <subcommand> [options]
```

### eve job create {#eve-job-create}

Create a new job.

**Core options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--description <text>` | string | — | Work description/prompt (required) |
| `--title <text>` | string | Auto-generated | Title |
| `--parent <id>` | string | — | Parent job ID (for sub-jobs) |
| `--type <type>` | string | `task` | Issue type: `task`, `bug`, `feature`, `epic`, `chore` |
| `--priority <0-4>` | number | `2` | Priority P0-P4 |
| `--phase <phase>` | string | `ready` | Initial phase |
| `--review <type>` | string | `none` | Review requirement: `none`, `human`, `agent` |
| `--labels <a,b,c>` | string | — | Comma-separated labels |
| `--assignee <id>` | string | — | Assign to agent/user |
| `--defer-until <date>` | string | — | Hide until date (ISO 8601) |
| `--due-at <date>` | string | — | Deadline (ISO 8601) |
| `--env <name>` | string | — | Environment name for persistent execution |
| `--execution-mode <mode>` | string | — | Execution mode: `persistent`, `ephemeral` |

**Harness selection:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--harness <name>` | string | — | Preferred harness, e.g., `mclaude` |
| `--profile <name>` | string | — | Harness profile name |
| `--variant <name>` | string | — | Harness variant preset |
| `--model <name>` | string | — | Model override for harness |
| `--reasoning <level>` | string | — | Reasoning effort: `low`, `medium`, `high`, `x-high` |

**Scheduling hints:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--worker-type <type>` | string | — | Worker type preference |
| `--permission <policy>` | string | — | Permission policy: `default`, `auto_edit`, `yolo` |
| `--timeout <seconds>` | number | — | Execution timeout |
| `--resource-class <rc>` | string | — | Compute SKU (e.g., `job.c1`, `job.c2`) |

**Inline execution:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--claim` | boolean | `false` | Create and immediately claim the job |
| `--agent <id>` | string | `$EVE_AGENT_ID` | Agent ID for claim |

**Git controls:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--git-ref <ref>` | string | — | Target ref (branch, tag, or SHA) |
| `--git-ref-policy <policy>` | string | — | `auto`, `env`, `project_default`, `explicit` |
| `--git-branch <branch>` | string | — | Branch to create/checkout |
| `--git-create-branch <mode>` | string | — | `never`, `if_missing`, `always` |
| `--git-commit <policy>` | string | — | `never`, `manual`, `auto`, `required` |
| `--git-commit-message <text>` | string | — | Commit message template |
| `--git-push <policy>` | string | — | `never`, `on_success`, `required` |
| `--git-remote <remote>` | string | `origin` | Remote to push to |

**Workspace options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--workspace-mode <mode>` | string | `job` | `job`, `session`, `isolated` |
| `--workspace-key <key>` | string | — | Workspace key for session mode |

**Examples:**

```bash
eve job create --description "Fix the login bug in auth.ts"
eve job create --description "Add dark mode" --priority 1 --harness mclaude
eve job create --parent MyApp-abc123 --description "Implement tokens" --claim
eve job create --description "Feature branch work" \
  --git-branch feature/new-api --git-push on_success
```

### eve job list {#eve-job-list}

List jobs in a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--all` | boolean | `false` | Admin mode: list across projects |
| `--org <id>` | string | — | Org filter for `--all` |
| `--phase <phase>` | string | — | Filter by phase |
| `--assignee <id>` | string | — | Filter by assignee |
| `--priority <n>` | number | — | Filter by priority |
| `--since <time>` | string | — | Filter jobs created after time (e.g., `1h`, `30m`, `2d`, or ISO timestamp) |
| `--stuck` | boolean | `false` | Show only jobs stuck in active phase (no progress for 5+ min) |
| `--stuck-minutes <n>` | number | `5` | Minutes threshold for stuck detection |
| `--limit <n>` | number | `50` | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve job list --phase active
eve job list --since 1h
eve job list --stuck
eve job list --all --org org_xxx
```

### eve job ready {#eve-job-ready}

Show schedulable jobs (ready phase, not blocked, not deferred).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--limit <n>` | number | `10` | Number of results |

### eve job blocked {#eve-job-blocked}

Show jobs blocked by dependencies.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |

### eve job show {#eve-job-show}

Get job details.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--verbose` | boolean | `false` | Include attempt details, exit codes, durations |

**Examples:**

```bash
eve job show MyApp-abc123
eve job show MyApp-abc123 --verbose
```

### eve job current {#eve-job-current}

Get the current job context (defaults to `$EVE_JOB_ID`).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--tree` | boolean | `false` | Render job hierarchy instead of JSON |

**Examples:**

```bash
eve job current
eve job current MyApp-abc123 --tree
```

### eve job diagnose {#eve-job-diagnose}

Comprehensive job debugging (state, attempts, timeline, logs, recommendations).

```bash
eve job diagnose MyApp-abc123
```

### eve job tree {#eve-job-tree}

Show job hierarchy (parent + children).

```bash
eve job tree MyApp-abc123
```

### eve job update {#eve-job-update}

Update job fields.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--phase <phase>` | string | — | Transition phase (validated) |
| `--priority <n>` | number | — | Set priority (0-4) |
| `--assignee <id>` | string | — | Set assignee |
| `--title <text>` | string | — | Update title |
| `--description <text>` | string | — | Update description |
| `--labels <a,b,c>` | string | — | Set labels |
| `--defer-until <date>` | string | — | Set defer date |
| `--due-at <date>` | string | — | Set due date |
| `--review <type>` | string | — | Set review requirement |
| `--git-ref <ref>` | string | — | Target ref |
| `--git-ref-policy <policy>` | string | — | `auto`, `env`, `project_default`, `explicit` |
| `--git-branch <branch>` | string | — | Branch to create/checkout |
| `--git-create-branch <mode>` | string | — | `never`, `if_missing`, `always` |
| `--git-commit <policy>` | string | — | `never`, `manual`, `auto`, `required` |
| `--git-commit-message <text>` | string | — | Commit message template |
| `--git-push <policy>` | string | — | `never`, `on_success`, `required` |
| `--git-remote <remote>` | string | `origin` | Remote to push to |
| `--workspace-mode <mode>` | string | `job` | `job`, `session`, `isolated` |
| `--workspace-key <key>` | string | — | Workspace key for session mode |

**Examples:**

```bash
eve job update MyApp-abc123 --git-branch feature/work --git-push on_success
eve job update MyApp-abc123 --workspace-mode session --workspace-key session:123
```

### eve job close {#eve-job-close}

Mark job as done.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--reason <text>` | string | — | Completion reason |

```bash
eve job close MyApp-abc123 --reason "Completed"
```

### eve job cancel {#eve-job-cancel}

Mark job as cancelled.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--reason <text>` | string | — | Cancellation reason |

```bash
eve job cancel MyApp-abc123 --reason "Superseded by new approach"
```

### eve job dep {#eve-job-dep}

Manage job dependencies.

| Subcommand | Description |
|------------|-------------|
| `add <from> <to>` | Add dependency: from depends on to |
| `remove <from> <to>` | Remove dependency |
| `list <job-id>` | Show dependencies and dependents |

**Examples:**

```bash
eve job dep add MyApp-abc123 MyApp-def456
eve job dep list MyApp-abc123
```

### eve job claim {#eve-job-claim}

Claim a job for execution (creates attempt, transitions to active).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--agent <id>` | string | `$EVE_AGENT_ID` or `cli-user` | Agent identifier |
| `--harness <name>` | string | — | Harness to use (overrides job harness) |

:::tip
This is typically called by the scheduler or by agents creating sub-jobs. For normal workflows, jobs are auto-scheduled when ready.
:::

### eve job release {#eve-job-release}

Release a claimed job (ends attempt, returns to ready).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--agent <id>` | string | `$EVE_AGENT_ID` or `cli-user` | Agent identifier |
| `--reason <text>` | string | — | Release reason |

### eve job attempts {#eve-job-attempts}

List execution attempts for a job.

```bash
eve job attempts MyApp-abc123
```

### eve job logs {#eve-job-logs}

View execution logs for a job attempt.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--attempt <n>` | number | Latest | Attempt number |
| `--after <seq>` | number | — | Return logs after sequence number |

### eve job submit {#eve-job-submit}

Submit job for review.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--summary <text>` | string | — | Submission summary (required) |
| `--status <status>` | string | `succeeded` | Submission status: `succeeded` or `failed` |
| `--result-json <json>` | string | `none` | Optional structured result payload |
| `--agent-id <id>` | string | `cli-user` | Agent ID |

### eve job approve {#eve-job-approve}

Approve a job in review.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--comment <text>` | string | — | Approval comment |
| `--reviewer-id <id>` | string | `cli-user` | Reviewer ID |

### eve job reject {#eve-job-reject}

Reject a job in review (creates new attempt).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--reason <text>` | string | — | Rejection reason (required) |
| `--reviewer-id <id>` | string | `cli-user` | Reviewer ID |

### eve job result {#eve-job-result}

Get job execution result.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--format <mode>` | string | `text` | Output format: `text`, `json`, `full` |
| `--attempt <n>` | number | Latest | Attempt number |

**Examples:**

```bash
eve job result MyApp-abc123
```

### eve job wait {#eve-job-wait}

Wait for job completion, polling until done.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--timeout <seconds>` | number | `300` | Max wait time |
| `--quiet` | boolean | `false` | Suppress progress output |
| `--verbose` | boolean | `false` | Show phase/status transitions |
| `--json` | boolean | `false` | Output JSON summary |

**Examples:**

```bash
eve job wait MyApp-abc123
eve job wait MyApp-abc123 --timeout 600
```

### eve job follow {#eve-job-follow}

Stream job logs in real-time (SSE).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--raw` | boolean | `false` | Show raw log entries |
| `--no-result` | boolean | `false` | Don't fetch final result when done |

**Examples:**

```bash
eve job follow MyApp-abc123
```

### eve job watch {#eve-job-watch}

Combined status polling + log streaming.

```bash
eve job watch MyApp-abc123
```

### eve job runner-logs {#eve-job-runner-logs}

Stream runner pod logs (kubectl required).

```bash
eve job runner-logs MyApp-abc123
```

### eve job batch {#eve-job-batch}

Create a batch job graph from a JSON definition.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--file <path>` | string | — | Path to JSON batch definition (required) |
| `--json` | boolean | `false` | Output raw JSON response |

**Examples:**

```bash
eve job batch --project proj_xxx --file batch.json
eve job batch --file batch.json --json
```

### eve job batch-validate {#eve-job-batch-validate}

Validate a batch job graph definition without creating jobs.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--file <path>` | string | — | Path to JSON batch definition (required) |
| `--json` | boolean | `false` | Output raw JSON response |

**Examples:**

```bash
eve job batch-validate --project proj_xxx --file batch.json
```

---

## eve kv {#eve-kv}

Manage agent KV state with optional TTL.

```
eve kv <set|get|list|mget|delete> [options]
```

### eve kv set {#eve-kv-set}

Set a KV value.

```
eve kv set --org <org_id> --agent <slug> --key <key> --value <json-or-string> [--namespace <ns>] [--ttl <seconds>]
```

### eve kv get {#eve-kv-get}

Get a KV value.

```
eve kv get --org <org_id> --agent <slug> --key <key> [--namespace <ns>]
```

### eve kv list {#eve-kv-list}

List keys in a namespace.

```
eve kv list --org <org_id> --agent <slug> [--namespace <ns>] [--limit <n>]
```

### eve kv mget {#eve-kv-mget}

Batch get keys.

```
eve kv mget --org <org_id> --agent <slug> --keys a,b,c [--namespace <ns>]
```

### eve kv delete {#eve-kv-delete}

Delete a KV value.

```
eve kv delete --org <org_id> --agent <slug> --key <key> [--namespace <ns>]
```

**Examples:**

```bash
eve kv set --org org_xxx --agent reviewer --key last_commit \
  --value '"abc123"' --ttl 86400
eve kv mget --org org_xxx --agent reviewer --keys last_commit,focus_area
```

---

## eve local {#eve-local}

Local development environment management. Manages a local k3d Kubernetes cluster running the Eve platform. Requires Docker Desktop; k3d and kubectl are auto-managed by the CLI.

```
eve local <up|down|status|reset|logs|health> [options]
```

### eve local up {#eve-local-up}

Create/prepare local cluster and deploy Eve services.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--skip-deploy` | boolean | `false` | Create cluster only, skip deploy step |
| `--skip-health` | boolean | `false` | Skip waiting for API health |
| `--timeout <sec>` | number | `300` | Health wait timeout in seconds |
| `--version <tag>` | string | `latest` | Platform image version |
| `--verbose` | boolean | `false` | Print detailed command output |

**Examples:**

```bash
eve local up
eve local up --version 0.1.70
eve local up --skip-deploy
eve local up --timeout 600
```

### eve local down {#eve-local-down}

Stop local stack resources, or destroy cluster entirely.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--destroy` | boolean | `false` | Delete k3d cluster and persistent data |
| `--force` | boolean | `false` | Skip confirmation prompts |

**Examples:**

```bash
eve local down
eve local down --destroy --force
```

### eve local status {#eve-local-status}

Show cluster state, service readiness, and URLs.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--watch` | boolean | `false` | Refresh every 5 seconds |
| `--json` | boolean | `false` | Machine-readable JSON output |

**Examples:**

```bash
eve local status
eve local status --watch
eve local status --json
```

### eve local reset {#eve-local-reset}

Destroy and recreate local stack.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | boolean | `false` | Skip confirmation prompts |

```bash
eve local reset --force
```

### eve local logs {#eve-local-logs}

Stream or dump logs from local stack services.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[service]` | string | — | `api`, `orchestrator`, `worker`, `gateway`, `agent-runtime`, `auth`, `postgres`, `mailpit`, `sso` |
| `--follow` | boolean | `false` | Follow logs in real time |
| `--tail <n>` | number | `50` | Show last n lines |
| `--since <duration>` | string | — | Show logs since duration (e.g., `5m`, `1h`) |

**Examples:**

```bash
eve local logs
eve local logs api --follow
eve local logs worker --tail 200
```

### eve local health {#eve-local-health}

Quick health check (exit code 0 when healthy).

**Examples:**

```bash
eve local health
eve local health --json
```

---

## eve manifest {#eve-manifest}

Validate project manifests for schema and required secrets.

```
eve manifest <subcommand> [options]
```

### eve manifest validate {#eve-manifest-validate}

Validate a manifest (schema + secrets).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--path <path>` | string | `.eve/manifest.yaml` | Path to manifest |
| `--latest` | boolean | `false` | Validate latest synced manifest instead of local file |
| `--validate-secrets` | boolean | `false` | Validate required secrets (from manifest) |
| `--strict` | boolean | `false` | Fail validation if required secrets are missing |

**Examples:**

```bash
eve manifest validate
eve manifest validate --project proj_xxx
eve manifest validate --latest --project proj_xxx
```

---

## eve memory {#eve-memory}

Manage canonical agent memory namespaces backed by org docs.

```
eve memory <set|get|list|delete|search> [options]
```

### eve memory set {#eve-memory-set}

Create or update a memory entry.

```
eve memory set --org <org_id> (--agent <slug>|--shared) --category <name> --key <key> (--file <path>|--stdin|--content <text>)
```

### eve memory get {#eve-memory-get}

Read a memory entry by key.

```
eve memory get --org <org_id> (--agent <slug>|--shared) --key <key> [--category <name>]
```

### eve memory list {#eve-memory-list}

List memory entries by namespace/category.

```
eve memory list --org <org_id> (--agent <slug>|--shared) [--category <name>] [--tags a,b] [--limit <n>]
```

### eve memory delete {#eve-memory-delete}

Delete a memory entry.

```
eve memory delete --org <org_id> (--agent <slug>|--shared) --category <name> --key <key>
```

### eve memory search {#eve-memory-search}

Search memory across agent/shared namespaces.

```
eve memory search --org <org_id> --query <text> [--agent <slug>] [--limit <n>]
```

**Examples:**

```bash
eve memory set --org org_xxx --agent reviewer --category learnings \
  --key auth-retry --file ./finding.md --tags auth,security
eve memory set --org org_xxx --shared --category conventions \
  --key api-style --file ./style.md
eve memory list --org org_xxx --agent reviewer --category learnings
eve memory search --org org_xxx --query "authentication retry"
```

---

## eve migrate {#eve-migrate}

Migration helpers for upgrading config formats.

```
eve migrate <subcommand>
```

### eve migrate skills-to-packs {#eve-migrate-skills-to-packs}

Generate AgentPack config from `skills.txt`.

**Examples:**

```bash
eve migrate skills-to-packs
eve migrate skills-to-packs > packs-fragment.yaml
```

---

## eve ollama {#eve-ollama}

Manage inference targets, installs, models, aliases, and platform-managed availability.

```
eve ollama <subcommand> [options]
```

### eve ollama targets {#eve-ollama-targets}

List inference targets.

```
eve ollama targets [--scope-kind <platform|org|project>] [--scope-id <id>] [--json]
```

### eve ollama target {#eve-ollama-target}

Manage a single target (add, rm, test, wake, pull, models).

| Subcommand | Flags |
|------------|-------|
| `add` | `--name <name> --base-url <url> [--scope-kind <kind>] [--scope-id <id>] [--target-type <type>] [--transport-profile <profile>] [--api-key-ref <secret-ref>]` |
| `rm` | `<target-id>` |
| `test` | `<target-id>` |
| `wake` | `<target-id>` |
| `pull` | `<target-id> --model-id <id>` |
| `models` | `<target-id>` |

### eve ollama target wake {#eve-ollama-target-wake}

Warm a target before first request.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<target-id>` | string | — | Target ID |
| `--wait <bool>` | boolean | `false` | Wait for wake completion |
| `--timeout-ms <ms>` | number | `120000` | Max wait time in milliseconds when `--wait true` |

```bash
eve ollama target wake <target_id>
eve ollama target wake <target_id> --wait true
eve ollama target wake <target_id> --wait true --timeout-ms 180000
```

### eve ollama target pull {#eve-ollama-target-pull}

Synchronously pull a model onto a specific target.

```bash
eve ollama target pull <target_id> --model-id llama3.1:8b
eve ollama target pull tgt_abc --model-id qwen2.5:14b --json
```

### eve ollama target models {#eve-ollama-target-models}

List models currently present on a specific target.

```bash
eve ollama target models <target_id>
eve ollama target models <target_id> --json
```

### eve ollama models {#eve-ollama-models}

List canonical inference models.

```bash
eve ollama models [--json]
```

### eve ollama model {#eve-ollama-model}

Create canonical inference model.

```
eve ollama model add --canonical <id> --provider <name> --slug <provider-model-slug>
```

### eve ollama aliases {#eve-ollama-aliases}

List alias routes.

```
eve ollama aliases [--scope-kind <kind>] [--scope-id <id>] [--json]
```

### eve ollama alias {#eve-ollama-alias}

Set or remove alias route.

| Subcommand | Flags |
|------------|-------|
| `set` | `--alias <name> --target-id <target-id> --model-id <model-id> [--scope-kind <kind>] [--scope-id <id>]` |
| `rm` | `--alias <name> [--scope-kind <kind>] [--scope-id <id>]` |

### eve ollama installs {#eve-ollama-installs}

List target-model installs.

```
eve ollama installs [--target-id <id>] [--model-id <id>] [--json]
```

### eve ollama install {#eve-ollama-install}

Install or remove model availability on a target.

| Subcommand | Flags |
|------------|-------|
| `add` | `--target-id <target-id> --model-id <model-id> [--requires-warm-start true\|false] [--min-target-capacity <n>]` |
| `rm` | `--target-id <target-id> --model-id <model-id>` |

### eve ollama assignments {#eve-ollama-assignments}

Inspect target assignment/load and queue depth.

```
eve ollama assignments [--scope-kind <platform|org|project>] [--scope-id <id>] [--json]
```

### eve ollama route-policies {#eve-ollama-route-policies}

List route policies by scope.

```
eve ollama route-policies [--scope-kind <platform|org|project>] [--scope-id <id>] [--json]
```

### eve ollama route-policy {#eve-ollama-route-policy}

Set or remove a route policy.

| Subcommand | Flags |
|------------|-------|
| `set` | `--scope-kind <kind> [--scope-id <id>] --preferred-target-id <target-id> [--fallback-to-alias-target true\|false]` |
| `rm` | `--scope-kind <kind> [--scope-id <id>]` |

### eve ollama managed {#eve-ollama-managed}

List, publish, and unpublish platform-managed catalog models.

| Subcommand | Flags |
|------------|-------|
| `list` | `[--json]` |
| `publish` | `--canonical <id> --provider <name> --slug <provider_model_slug> --target-id <id> [--requires-warm-start true\|false] [--enabled true\|false] [--json]` |
| `unpublish` | `--canonical <id> [--json]` |

**Examples:**

```bash
eve ollama target add --name local --base-url http://localhost:11434 \
  --scope-kind platform --target-type external_ollama
eve ollama model add --canonical gpt-oss:120b --provider ollama --slug gpt-oss:120b
eve ollama install add --target-id itgt_xxx --model-id imod_xxx --min-target-capacity 1
eve ollama assignments --scope-kind platform
eve ollama managed list
eve ollama managed publish --canonical deepseek-r1 --provider ollama \
  --slug deepseek-r1:latest --target-id itgt_xxx
eve ollama managed unpublish --canonical deepseek-r1
```

---

## eve org {#eve-org}

Manage organizations. Organizations group projects and users, including membership request workflows.

```
eve org <subcommand> [options]
```

### eve org list {#eve-org-list}

List all organizations.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--limit <n>` | number | `10` | Number of results |
| `--offset <n>` | number | — | Skip first n results |
| `--include-deleted` | boolean | `false` | Include soft-deleted orgs |

### eve org get {#eve-org-get}

Get organization details.

```bash
eve org get org_xxx
```

### eve org ensure {#eve-org-ensure}

Create org if it doesn't exist, or return existing.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--slug <slug>` | string | — | Organization slug (used in URLs) |
| `--id <id>` | string | — | Organization ID override (optional) |

**Examples:**

```bash
eve org ensure "My Company" --slug myco
```

### eve org update {#eve-org-update}

Update organization.

```
eve org update <org_id> [--name <name>] [--deleted <bool>]
```

### eve org delete {#eve-org-delete}

Soft-delete an organization.

```bash
eve org delete org_xxx
```

### eve org members {#eve-org-members}

Manage organization members (list, add, remove).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--email <email>` | string | — | Email for add |
| `--role <role>` | string | `member` | Role: `member`, `admin`, `owner` |

**Examples:**

```bash
eve org members --org org_xxx
eve org members add user@example.com --role admin --org org_xxx
eve org members remove user_abc --org org_xxx
```

### eve org membership-requests {#eve-org-membership-requests}

List, approve, or deny pending membership requests.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `list` | subcommand | — | List requests (`--status <status>` optional) |
| `approve <request_id>` | subcommand | — | Approve request (`--role` optional, `--email` optional) |
| `deny <request_id>` | subcommand | — | Deny request |
| `--org <id>` | string | Profile default | Organization ID |
| `--status <status>` | string | — | Filter list by status |
| `--role <role>` | string | `member` | Approval role (`member` or `admin`) |
| `--email <email>` | string | — | Optional email to attach on approval |

**Examples:**

```bash
eve org membership-requests list --org org_xxx
eve org membership-requests list --org org_xxx --status pending
eve org membership-requests approve req_xxx --org org_xxx --role admin
eve org membership-requests deny req_xxx --org org_xxx
```

---

## eve packs {#eve-packs}

Manage AgentPack lockfile and resolution.

```
eve packs <subcommand> [options]
```

### eve packs status {#eve-packs-status}

Show resolved packs from lockfile, effective config stats, and drift detection.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--path <dir>` | string | cwd | Repository root to inspect |

**Examples:**

```bash
eve packs status
eve packs status --path ../my-repo
```

### eve packs resolve {#eve-packs-resolve}

Resolve packs and merge configs (delegates to agents sync).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | boolean | `false` | Preview resolution without writing lockfile |
| `--path <dir>` | string | cwd | Repository root to inspect |

**Examples:**

```bash
eve packs resolve --dry-run
eve packs resolve
```

---

## eve pipeline {#eve-pipeline}

Run and inspect pipelines defined in the project manifest.

```
eve pipeline <subcommand> [options]
```

### eve pipeline list {#eve-pipeline-list}

List pipelines for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID or slug |

**Examples:**

```bash
eve pipeline list
eve pipeline list proj_xxx
```

### eve pipeline show {#eve-pipeline-show}

Show pipeline definition.

```bash
eve pipeline show proj_xxx release
eve pipeline show my-project deploy
```

### eve pipeline run {#eve-pipeline-run}

Run a pipeline.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--ref <sha>` | string | — | Git SHA (required). Non-SHA refs resolve against the repo in `--repo-dir` or cwd. |
| `--env <env>` | string | — | Target environment |
| `--project <id>` | string | Profile default | Project ID |
| `--wait` | boolean | `false` | Wait for completion |
| `--timeout <n>` | number | — | Max wait time (seconds) |
| `--inputs <json>` | string | — | JSON inputs for the pipeline |
| `--only <step>` | string | — | Run a single step (includes dependencies) |
| `--repo-dir <path>` | string | cwd | Resolve `--ref` against this repo instead of cwd |

**Examples:**

```bash
eve pipeline run deploy-test --ref 0123456789abcdef0123456789abcdef01234567 --env test
eve pipeline run deploy-test --ref 0123456789abcdef0123456789abcdef01234567 \
  --env test --wait --timeout 120
eve pipeline run deploy-test --ref main --repo-dir ./my-app --env test
```

### eve pipeline runs {#eve-pipeline-runs}

List runs for a pipeline.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--limit <n>` | number | `10` | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve pipeline runs deploy-test
eve pipeline runs deploy-test proj_xxx
```

### eve pipeline show-run {#eve-pipeline-show-run}

Show a pipeline run.

```bash
eve pipeline show-run deploy-test prun_xxx
```

### eve pipeline approve {#eve-pipeline-approve}

Approve a pipeline run awaiting approval.

```bash
eve pipeline approve prun_xxx
```

### eve pipeline cancel {#eve-pipeline-cancel}

Cancel a pipeline run.

```bash
eve pipeline cancel prun_xxx --reason "superseded"
```

### eve pipeline logs {#eve-pipeline-logs}

Show logs for a pipeline run.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--step <name>` | string | — | Show logs for a specific step only |
| `--follow` (`-f`) | boolean | `false` | Stream live logs via SSE |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve pipeline logs deploy-test prun_xxx
eve pipeline logs deploy-test prun_xxx --step build
eve pipeline logs deploy-test prun_xxx --follow
```

---

## eve profile {#eve-profile}

Manage repo-local CLI profiles. Profiles store defaults (API URL, org, project) so you don't have to specify them on every command.

Profiles live in `.eve/profile.yaml` inside the repo, so each project keeps its own defaults and switching profiles won't affect other checkouts.

```
eve profile <subcommand> [options]
```

### eve profile list {#eve-profile-list}

List all profiles.

```bash
eve profile list
```

### eve profile show {#eve-profile-show}

Show profile details.

```bash
eve profile show
eve profile show prod
```

### eve profile use {#eve-profile-use}

Switch active profile (repo-local).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | — | Set org override |
| `--project <id>` | string | — | Set project override |
| `--api-url <url>` | string | — | Set API URL override |
| `--clear` | boolean | `false` | Remove local `.eve/profile.yaml` (clears all profiles) |

**Examples:**

```bash
eve profile use staging --org org_xxx --project proj_yyy
eve profile use --clear
```

### eve profile create {#eve-profile-create}

Create a new named profile (repo-local).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--api-url <url>` | string | — | API base URL |
| `--org <id>` | string | — | Default organization ID |
| `--project <id>` | string | — | Default project ID |
| `--harness <name>` | string | — | Default harness (e.g., `mclaude:fast`) |
| `--supabase-url <url>` | string | — | Supabase URL (for cloud auth) |
| `--supabase-anon-key <key>` | string | — | Supabase anon key |
| `--default-email <email>` | string | — | Default email for auth login |
| `--default-ssh-key <path>` | string | — | Default SSH key path for auth login |

**Examples:**

```bash
eve profile create local --api-url http://localhost:4801
eve profile create prod --api-url https://api.example.com --org org_xxx
```

### eve profile set {#eve-profile-set}

Update profile settings (repo-local).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | — | Default organization ID |
| `--project <id>` | string | — | Default project ID |
| `--api-url <url>` | string | — | API base URL |
| `--harness <name>` | string | — | Default harness |
| `--supabase-url <url>` | string | — | Supabase URL |
| `--supabase-anon-key <key>` | string | — | Supabase anon key |
| `--default-email <email>` | string | — | Default email for auth login |
| `--default-ssh-key <path>` | string | — | Default SSH key path for auth login |

**Examples:**

```bash
eve profile set --org org_xxx --project proj_yyy
eve profile set staging --org org_xxx --project proj_yyy
eve profile set --default-email user@example.com
```

### eve profile remove {#eve-profile-remove}

Remove a named profile (repo-local).

```bash
eve profile remove staging
```

---

## eve project {#eve-project}

Manage projects. Projects link a git repo to an organization for running jobs.

```
eve project <subcommand> [options]
```

### eve project list {#eve-project-list}

List projects in an organization.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--limit <n>` | number | — | Number of results |
| `--offset <n>` | number | — | Skip first n results |

### eve project get {#eve-project-get}

Get project details.

```bash
eve project get proj_xxx
```

### eve project ensure {#eve-project-ensure}

Create project if it doesn't exist, or return existing.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--name <name>` | string | — | Project name (required) |
| `--repo-url <url>` | string | — | Git repository URL (optional, can be set later) |
| `--org <id>` | string | Profile default | Organization ID |
| `--branch <branch>` | string | `main` | Default branch |
| `--slug <slug>` | string | — | Short memorable slug (4-8 chars, e.g., `MyProj`) |
| `--force` | boolean | `false` | Re-clone repo even if project exists |

**Examples:**

```bash
eve project ensure --name my-app --slug MyApp
eve project ensure --name my-app --slug MyApp --repo-url https://github.com/org/repo
eve project ensure --name my-app --repo-url file:///path/to/repo --force
```

### eve project update {#eve-project-update}

Update project.

```
eve project update <project_id> [--name <name>] [--repo-url <url>] [--branch <branch>] [--deleted <bool>]
```

### eve project sync {#eve-project-sync}

Sync manifest from local `.eve/manifest.yaml` to Eve API.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID |
| `--path <path>` | string | `.eve/manifest.yaml` | Path to manifest |
| `--validate-secrets` | boolean | `false` | Validate manifest required secrets |
| `--strict` | boolean | `false` | Fail sync if required secrets are missing |

**Examples:**

```bash
eve project sync
eve project sync proj_xxx
eve project sync --path ./custom-manifest.yaml
```

### eve project status {#eve-project-status}

Show deployment status across all profiles with revision info, service URLs, and deploy age.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--profile <name>` | string | — | Show only this profile |
| `--env <name>` | string | — | Show only this environment |
| `--json` | boolean | `false` | Machine-readable JSON output |

**Examples:**

```bash
eve project status
eve project status --profile staging
eve project status --env sandbox --json
```

### eve project members {#eve-project-members}

Manage project members (list, add, remove).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--email <email>` | string | — | Email for add |
| `--role <role>` | string | `member` | Role: `member`, `admin`, `owner` |

**Examples:**

```bash
eve project members --project proj_xxx
eve project members add user@example.com --role admin --project proj_xxx
eve project members remove user_abc --project proj_xxx
```

---

## eve release {#eve-release}

Manage and inspect releases.

```
eve release <subcommand> [options]
```

### eve release resolve {#eve-release-resolve}

Look up a release by tag and output its details.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<tag>` | string | — | Release tag (e.g., `v1.2.3`) |
| `--project <id>` | string | Profile default or `.eve/manifest.yaml` | Project ID |
| `--json` | boolean | `false` | Output as JSON |

**Examples:**

```bash
eve release resolve v1.2.3
eve release resolve v1.2.3 --project proj_xxx
eve release resolve v1.2.3 --json
```

---

## eve resources {#eve-resources}

Resolve resource URIs into content snapshots.

```
eve resources <subcommand> [options]
```

### eve resources resolve {#eve-resources-resolve}

Resolve a resource URI (optionally without content).

```
eve resources resolve <uri> [--no-content]
```

### eve resources ls {#eve-resources-ls}

List resources under a URI prefix.

```
eve resources ls <uri-prefix>
```

### eve resources cat {#eve-resources-cat}

Output resource content.

```
eve resources cat <uri>
```

**Examples:**

```bash
eve resources resolve org_docs:/pm/features/FEAT-123.md
eve resources ls org_docs:/pm/features/
eve resources cat job_attachments:/myproj-a3f2dd12/plan.md
```

---

## eve search {#eve-search}

Unified org search across memory/docs/threads/attachments/events.

```
eve search --org <org_id> --query <text> [--sources memory,docs,threads,attachments,events] [--limit <n>] [--agent <slug>]
```

**Examples:**

```bash
eve search --org org_xxx --query "authentication retry"
eve search --org org_xxx --query "authentication retry" \
  --sources memory,docs,threads --agent reviewer
```

---

## eve secrets {#eve-secrets}

Manage secrets at system/org/user/project scope. Values are never returned in plaintext.

```
eve secrets <subcommand> [options]
```

### eve secrets set {#eve-secrets-set}

Create or update a secret value.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--system` | boolean | `false` | System scope (admin only) |
| `--project <id>` | string | Profile default | Project ID |
| `--org <id>` | string | — | Organization ID |
| `--user <id>` | string | — | User ID |
| `--type <type>` | string | — | `env_var`, `file`, `github_token`, `ssh_key` |

### eve secrets list {#eve-secrets-list}

List secrets (metadata only).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--system` | boolean | `false` | System scope (admin only) |
| `--project <id>` | string | Profile default | Project ID |
| `--org <id>` | string | — | Organization ID |
| `--user <id>` | string | — | User ID |

### eve secrets show {#eve-secrets-show}

Show a masked secret value.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--system` | boolean | `false` | System scope (admin only) |
| `--project <id>` | string | Profile default | Project ID |
| `--org <id>` | string | — | Organization ID |
| `--user <id>` | string | — | User ID |

### eve secrets delete {#eve-secrets-delete}

Delete a secret.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--system` | boolean | `false` | System scope (admin only) |
| `--project <id>` | string | Profile default | Project ID |
| `--org <id>` | string | — | Organization ID |
| `--user <id>` | string | — | User ID |

### eve secrets import {#eve-secrets-import}

Import env entries from an env file.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--file <path>` | string | `.env` | Path to env file |
| `--system` | boolean | `false` | System scope (admin only) |
| `--project <id>` | string | Profile default | Project ID |
| `--org <id>` | string | — | Organization ID |
| `--user <id>` | string | — | User ID |

### eve secrets validate {#eve-secrets-validate}

Validate manifest-required secrets for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--keys <k1,k2>` | string | Latest manifest | Explicit keys to validate |

### eve secrets ensure {#eve-secrets-ensure}

Ensure safe secrets exist at project scope.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--keys <k1,k2>` | string | — | Keys to ensure (allowlist only) |

### eve secrets export {#eve-secrets-export}

Export safe secrets for external configuration.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--project <id>` | string | Profile default | Project ID |
| `--keys <k1,k2>` | string | — | Keys to export (allowlist only) |
| `--json` | boolean | `false` | JSON output |

**Examples:**

```bash
eve secrets set GITHUB_TOKEN ghp_xxx --project proj_xxx --type github_token
eve secrets show GITHUB_TOKEN --project proj_xxx
eve secrets validate --project proj_xxx
eve secrets ensure --project proj_xxx --keys GITHUB_WEBHOOK_SECRET
eve secrets export --project proj_xxx --keys GITHUB_WEBHOOK_SECRET
```

---

## eve skills {#eve-skills}

Install skills from a URL, GitHub repo, or `skills.txt` manifest.

```
eve skills <subcommand> [source]
```

### eve skills install {#eve-skills-install}

Install skill packs from a source or `skills.txt` manifest.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[source]` | string | — | URL, GitHub repo (`owner/repo`), or local path |
| `--skip-installed` | boolean | `false` | Skip skills that are already installed |

**Examples:**

```bash
eve skills install https://github.com/org/skillpack
eve skills install org/skillpack
eve skills install ./local/skills
eve skills install                    # install from skills.txt
eve skills install --skip-installed
```

---

## eve supervise {#eve-supervise}

Long-poll for child job events and coordination messages. Used by lead agents to stay alive and react.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[job-id]` | string | `$EVE_JOB_ID` | Parent job ID |
| `--timeout <seconds>` | number | `30` (max: 120) | Max wait in seconds |
| `--since <cursor>` | string | — | ISO cursor for incremental polling |
| `--json` | boolean | `false` | Output as JSON |

**Examples:**

```bash
eve supervise
eve supervise MyApp-abc123 --timeout 60
eve supervise --since 2026-02-08T19:00:00Z --json
```

---

## eve system {#eve-system}

System administration and health checks (admin scope required for most commands).

```
eve system <subcommand> [options]
```

### eve system health {#eve-system-health}

Quick health check of the API.

If dependencies are degraded (for example database connectivity issues), this command can return a degraded status with diagnostic fields instead of a hard request failure.

```bash
eve system health
eve system health --json
```

### eve system status {#eve-system-status}

Show comprehensive system status (admin only).

```bash
eve system status
eve system status --json
```

### eve system jobs {#eve-system-jobs}

List all jobs across all projects (admin view).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | — | Filter by organization ID |
| `--project <id>` | string | — | Filter by project ID |
| `--phase <phase>` | string | — | Filter by job phase |
| `--limit <n>` | number | `50` | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve system jobs
eve system jobs --phase active
eve system jobs --project proj_xxx
```

### eve system envs {#eve-system-envs}

List all environments across all projects (admin view).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | — | Filter by organization ID |
| `--project <id>` | string | — | Filter by project ID |
| `--limit <n>` | number | `50` | Number of results |
| `--offset <n>` | number | — | Skip first n results |

**Examples:**

```bash
eve system envs
eve system envs --project proj_xxx
```

### eve system logs {#eve-system-logs}

Fetch recent logs for a system service (admin only).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--tail <n>` | number | `100` | Number of log lines |

Services: `api`, `orchestrator`, `worker`, `agent-runtime`, `postgres`

**Examples:**

```bash
eve system logs api
eve system logs agent-runtime --tail 200
eve system logs worker --tail 200
```

### eve system pods {#eve-system-pods}

List pods across the cluster (admin only).

```bash
eve system pods
```

### eve system events {#eve-system-events}

List recent cluster events (admin only).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--limit <n>` | number | `50` | Max number of events |

**Examples:**

```bash
eve system events
eve system events --limit 20
```

### eve system config {#eve-system-config}

Show deployment configuration summary (system admins only).

```bash
eve system config
```

### eve system settings {#eve-system-settings}

Get or set system settings (admin only).

| Subcommand | Description |
|------------|-------------|
| `get <key>` | Get specific setting |
| `set <key> <value>` | Update setting value |

**Examples:**

```bash
eve system settings
eve system settings get some-key
eve system settings set some-key some-value
```

### eve system orchestrator {#eve-system-orchestrator}

Manage orchestrator concurrency settings.

| Subcommand | Description |
|------------|-------------|
| `status` | Show concurrency status |
| `set-concurrency <n>` | Set concurrency limit |

**Examples:**

```bash
eve system orchestrator status
eve system orchestrator set-concurrency 8
```

---

## eve thread {#eve-thread}

Manage org-scoped coordination threads for agent team communication.

```
eve thread <subcommand> [options]
```

### eve thread create {#eve-thread-create}

Create an org thread.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--key <key>` | string | — | Thread key (required) |

**Examples:**

```bash
eve thread create --org org_xxx --key "project:review"
```

### eve thread list {#eve-thread-list}

List threads in an org.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--scope <scope>` | string | — | Filter by scope (e.g., `org`) |
| `--key-prefix <pfx>` | string | — | Filter by key prefix |

**Examples:**

```bash
eve thread list --org org_xxx
eve thread list --org org_xxx --key-prefix "project:"
```

### eve thread show {#eve-thread-show}

Show thread details.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

**Examples:**

```bash
eve thread show thr_xxx --org org_xxx
```

### eve thread messages {#eve-thread-messages}

List messages in a coordination thread.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--since <duration>` | string | — | Time window: `5m`, `1h`, `30s`, `2d`, or ISO timestamp |
| `--limit <n>` | number | — | Max messages to return |
| `--json` | boolean | `false` | Output as JSON |

**Examples:**

```bash
eve thread messages thr_xxx
eve thread messages thr_xxx --since 5m
eve thread messages thr_xxx --since 1h --limit 20 --json
```

### eve thread post {#eve-thread-post}

Post a message to a coordination thread.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--body <text>` | string | — | Message body (required) |
| `--actor-type <type>` | string | `user` | Actor type |
| `--actor-id <id>` | string | — | Actor identifier |
| `--job-id <id>` | string | — | Associated job ID |

**Examples:**

```bash
eve thread post thr_xxx --body "hello team"
eve thread post thr_xxx --body '{"kind":"directive","body":"focus on auth"}'
```

### eve thread follow {#eve-thread-follow}

Follow a thread in real-time via SSE.

```bash
eve thread follow thr_xxx
```

### eve thread distill {#eve-thread-distill}

Distill thread messages into durable docs/memory.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--to <path>` | string | — | Explicit destination doc path |
| `--agent <slug>` | string | — | Agent namespace for inferred path |
| `--category <name>` | string | — | Memory category: `learnings`, `decisions`, `runbooks`, `context`, `conventions` |
| `--key <key>` | string | — | Memory key for inferred path |
| `--prompt <text>` | string | — | Distillation prompt override |
| `--auto` | boolean | `false` | Skip if below threshold |
| `--threshold <n>` | number | — | Minimum message count for `--auto` |
| `--interval <dur>` | string | — | Advisory distillation interval metadata |

**Examples:**

```bash
eve thread distill thr_xxx --org org_xxx \
  --to /agents/shared/memory/decisions/sprint-42.md
eve thread distill thr_xxx --org org_xxx \
  --agent reviewer --category decisions --key sprint-42
```

---

## eve webhooks {#eve-webhooks}

Manage outbound webhook subscriptions and delivery logs.

```
eve webhooks <subcommand> [options]
```

### eve webhooks create {#eve-webhooks-create}

Create a webhook subscription.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--url <url>` | string | — | Delivery endpoint URL (required) |
| `--events <list>` | string | — | Comma-separated event types to subscribe to (required) |
| `--secret <secret>` | string | — | HMAC signing secret, min 16 chars (required) |
| `--filter <json>` | string | — | Optional JSON filter object |
| `--project <id>` | string | — | Scope webhook to a specific project |

**Examples:**

```bash
eve webhooks create --org org_xxx \
  --url https://example.com/hook \
  --events system.job.completed \
  --secret my-secret-key-1234
eve webhooks create --org org_xxx \
  --url https://example.com/hook \
  --events "system.job.*" \
  --secret my-secret-key-1234 \
  --filter '{"agent_slug":"pm-*"}'
```

### eve webhooks list {#eve-webhooks-list}

List webhook subscriptions for an org.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

### eve webhooks show {#eve-webhooks-show}

Show webhook subscription details.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

**Examples:**

```bash
eve webhooks show wh_xxx --org org_xxx
```

### eve webhooks deliveries {#eve-webhooks-deliveries}

List delivery attempts for a webhook subscription.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--limit <n>` | number | `50` | Max results |

### eve webhooks test {#eve-webhooks-test}

Send a test webhook event.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

### eve webhooks delete {#eve-webhooks-delete}

Delete a webhook subscription.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

### eve webhooks enable {#eve-webhooks-enable}

Re-enable a disabled webhook subscription.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

### eve webhooks replay {#eve-webhooks-replay}

Replay webhook deliveries for a subscription.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |
| `--from-event <id>` | string | — | Event ID to start replay from (inclusive) |
| `--to <iso>` | string | Now | ISO timestamp for end of replay window |
| `--max-events <n>` | number | `5000` (max: 10000) | Max events to scan |
| `--dry-run` | boolean | `false` | Return summary without enqueuing deliveries |

**Examples:**

```bash
eve webhooks replay wh_xxx --org org_xxx --from-event evt_123
eve webhooks replay wh_xxx --org org_xxx \
  --to 2026-02-12T12:00:00Z --max-events 2000 --dry-run
```

### eve webhooks replay-status {#eve-webhooks-replay-status}

Fetch webhook replay status.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--org <id>` | string | Profile default | Organization ID |

**Examples:**

```bash
eve webhooks replay-status wh_xxx rpl_xxx --org org_xxx
```

---

## eve workflow {#eve-workflow}

Inspect and invoke workflows defined in the project manifest.

```
eve workflow <subcommand> [options]
```

### eve workflow list {#eve-workflow-list}

List workflows for a project.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `<project>` | string | Profile default | Project ID or slug |

**Examples:**

```bash
eve workflow list
eve workflow list proj_xxx
```

### eve workflow show {#eve-workflow-show}

Show workflow definition.

```bash
eve workflow show proj_xxx qa-review
eve workflow show my-project release-notes
```

### eve workflow run {#eve-workflow-run}

Invoke a workflow (fire-and-forget).

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--input <json>` | string | — | Input payload (JSON string) |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve workflow run qa-review --input '{"task":"audit"}'
eve workflow run proj_xxx release-notes --input '{"tag":"v1.2.3"}'
```

### eve workflow invoke {#eve-workflow-invoke}

Invoke a workflow and wait for result.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--input <json>` | string | — | Input payload (JSON string) |
| `--no-wait` | boolean | `false` | Return immediately without waiting |
| `--project <id>` | string | Profile default | Project ID |

**Examples:**

```bash
eve workflow invoke qa-review --input '{"task":"audit"}'
eve workflow invoke proj_xxx release-notes --no-wait
```

### eve workflow logs {#eve-workflow-logs}

Show logs for a workflow job.

```bash
eve workflow logs job_abc123
```

## eve providers {#eve-providers}

Discover AI providers available to your org or project.

```
eve providers <subcommand> [options]
```

### eve providers list {#eve-providers-list}

List providers available for current scope.

```bash
eve providers list
eve providers list --org org_xxx --project proj_xxx
```

### eve providers show {#eve-providers-show}

Show details for one provider.

```bash
eve providers show openai
eve providers show openai --org org_xxx --json
```

### eve providers models {#eve-providers-models}

List models exposed by a provider.

```bash
eve providers models openai
eve providers models openai --org org_xxx
```

## eve models {#eve-models}

Inspect available model aliases.

```
eve models <subcommand> [options]
```

### eve models list {#eve-models-list}

List available model aliases.

```bash
eve models list
eve models list --org org_xxx --project proj_xxx
eve models list --json
```

## eve teams {#eve-teams}

Worker team management.

```
eve teams <subcommand> [options]
```

### eve teams list {#eve-teams-list}

List worker teams.

```bash
eve teams list
eve teams list --org org_xxx
```
