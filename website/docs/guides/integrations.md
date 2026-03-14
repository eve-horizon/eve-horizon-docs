---
title: Integrations
description: Connect external services to Eve Horizon — register OAuth apps, connect Slack workspaces, mount Google Drive folders, and manage provider credentials.
sidebar_position: 12
---

# Integrations

Eve connects your organization to external services through **integrations**. Each integration is org-scoped — one connection per provider account per org.

## Bring Your Own App (BYOA)

Eve uses a **Bring Your Own App** model for OAuth providers. Instead of sharing a single platform-wide OAuth application, each org registers their own OAuth app credentials. This gives you:

- **Security isolation** — your tokens are issued by your own OAuth app
- **Consent control** — users see your company name on the OAuth consent screen
- **Audit independence** — revoke access at the app level without affecting other orgs

### Setup flow

The general pattern for any OAuth provider:

1. Create an OAuth app in the provider's developer console
2. Register the credentials with Eve using `eve integrations configure`
3. Connect individual accounts using the provider-specific OAuth flow

### Get setup instructions

Eve can tell you exactly what to configure for each provider:

```bash
eve integrations setup-info google-drive --org <org_id>
eve integrations setup-info slack --org <org_id>
```

This returns the callback URL, required scopes, and step-by-step instructions for creating the OAuth app.

### Register credentials

```bash
# Google Drive
eve integrations configure google-drive \
  --org <org_id> \
  --client-id "your-google-client-id.apps.googleusercontent.com" \
  --client-secret "GOCSPX-..."

# Slack (includes signing secret for webhook verification)
eve integrations configure slack \
  --org <org_id> \
  --client-id "your-slack-client-id" \
  --client-secret "your-slack-client-secret" \
  --signing-secret "your-slack-signing-secret"
```

### View and manage credentials

```bash
# View current config (secrets are redacted)
eve integrations config google-drive --org <org_id>

# Remove credentials
eve integrations unconfigure google-drive --org <org_id>
```

## Google Drive

Mount Google Drive folders into Eve so agents and workflows can browse, search, and access files from your team's shared drives.

### Prerequisites

1. **Configure OAuth credentials** (see [BYOA setup](#register-credentials) above)
2. The Google Drive API must be enabled in your GCP project
3. OAuth consent screen must be configured (internal or external)

### Connect a Google Drive account

After registering OAuth credentials, authorize access to a specific Google Drive account:

```bash
# Initiate the OAuth flow (opens browser)
# The API redirects to Google's consent screen using your org's OAuth app
curl "$EVE_API_URL/orgs/<org_id>/integrations/google-drive/oauth/authorize"
```

On approval, Eve exchanges the authorization code for access and refresh tokens, creating an integration automatically.

### Mount a drive folder

Once connected, mount a Google Drive folder to make it accessible:

```bash
# List existing mounts
eve cloud-fs list --org <org_id>

# Mount a drive folder
eve cloud-fs mount --org <org_id> --project <proj_id> \
  --provider google_drive \
  --root-path "/" \
  --label "Team shared drive"

# Browse files
eve cloud-fs ls <mount_id> --path "/" --org <org_id>

# Search across mounted drives
eve cloud-fs search <mount_id> --query "quarterly report" --org <org_id>

# Unmount
eve cloud-fs unmount <mount_id> --org <org_id>
```

### Permissions

| Permission | Allows |
|------------|--------|
| `cloud_fs:read` | List mounts, browse files, search |
| `cloud_fs:write` | Create/update mounts |
| `cloud_fs:admin` | Remove mounts, manage all mounts |

### Token refresh

Access tokens expire after ~1 hour. Eve automatically refreshes tokens using the refresh token and your org's OAuth credentials. No manual intervention needed.

## Slack

Connect a Slack workspace to enable agent chat, mentions, and interactive workflows. See the [Chat & Conversations](./chat.md) guide for full details on chat routing and agent interactions.

### Prerequisites

1. **Configure Slack app credentials** (see [BYOA setup](#register-credentials) above)
2. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
3. Copy the Client ID, Client Secret, and Signing Secret from the app's Basic Information page

### Connect a workspace

Generate a shareable install link — the recipient needs Slack workspace admin access but no Eve credentials:

```bash
eve integrations slack install-url --org <org_id>
eve integrations slack install-url --org <org_id> --ttl 7d
```

The link redirects to Slack's OAuth consent screen using your org's OAuth app. On approval, Eve creates the integration automatically. The gateway hot-loads new integrations within ~30 seconds.

For manual connection (when OAuth is unavailable):

```bash
eve integrations slack connect \
  --org <org_id> \
  --team-id <T-ID> \
  --token xoxb-...
```

### Required bot events

Subscribe to these events in your Slack app configuration:

| Event | Purpose |
|-------|---------|
| `app_mention` | `@eve` commands |
| `message.channels` | Listener dispatch in public channels |
| `message.groups` | Listener dispatch in private channels |
| `message.im` | Direct messages |

## GitHub

GitHub integration uses webhook secrets (not OAuth apps) for event verification:

```bash
eve github setup
```

- Webhook endpoint: `/integrations/github/events/:projectId`
- Auth: `EVE_GITHUB_WEBHOOK_SECRET` with optional project-scoped override via `eve secrets set GITHUB_WEBHOOK_SECRET`

## CLI quick reference

| Command | Purpose |
|---------|---------|
| `eve integrations setup-info <provider> --org <org>` | Get provider setup instructions |
| `eve integrations configure <provider> --org <org> ...` | Register OAuth credentials |
| `eve integrations config <provider> --org <org>` | View current config |
| `eve integrations unconfigure <provider> --org <org>` | Remove OAuth credentials |
| `eve integrations list --org <org>` | List connected integrations |
| `eve integrations test <id> --org <org>` | Test integration health |
| `eve integrations slack install-url --org <org>` | Generate Slack install link |
| `eve integrations slack connect --org <org> ...` | Manual Slack connection |
| `eve cloud-fs list --org <org>` | List Cloud FS mounts |
| `eve cloud-fs mount --org <org> --project <proj> ...` | Mount a drive |
| `eve cloud-fs ls <mount> --org <org>` | Browse files |
| `eve cloud-fs search <mount> --query "..." --org <org>` | Search files |
| `eve cloud-fs unmount <mount> --org <org>` | Remove mount |
| `eve github setup` | GitHub webhook setup |

## What's next?

- Mount cloud storage for your agents: [Storage & Filesystem](./storage.md)
- Set up chat routing with Slack: [Chat & Conversations](./chat.md)
- Manage credentials for integrations: [Secrets & Credentials](./secrets.md)
