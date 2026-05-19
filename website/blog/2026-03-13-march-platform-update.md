---
title: "March Platform Update: Chat Pipeline, Private Endpoints, and Toolchain-on-Demand"
description: "14 shipped capabilities covering the full chat pipeline, Tailscale-connected endpoints, slim worker images, and more."
slug: march-2026-platform-update
authors:
  - name: Eve Horizon Team
tags: [platform, changelog]
---

# March Platform Update

The biggest platform update since launch: 14 shipped capabilities across agents, chat, networking, workers, and workflows.

<!-- truncate -->

## Chat pipeline is complete

The chat system now handles the full lifecycle from inbound message to outbound reply:

- **Outbound delivery** — Agent results are posted back to the originating Slack thread automatically. No more running `eve job result` to see what happened.
- **Progress updates** — Agents send real-time status messages during execution via `eve-message` blocks. Users see what the agent is doing instead of minutes of silence.
- **File materialization** — Files uploaded in Slack are downloaded via bot token auth and staged into the agent's workspace at `.eve/attachments/`. Agents can read files attached to chat messages.
- **Slack message chunking** — Long responses support up to 39,000 characters with Block Kit chunking (up from 3,900).

## Agent aliases

Agents can now declare a short `alias` in their manifest. Instead of `@eve pmbot-pm hello`, users type `@eve pm hello`. Aliases are org-scoped and share namespace with slugs.

## Staged team dispatch

Council teams gain a `staged: true` option. The lead agent executes first to prepare work (e.g., transcribe audio), then members fan out in parallel with the prepared context. Combines the quality of sequential preparation with the speed of parallel execution.

## Private endpoints (Tailscale)

New `eve endpoint` CLI for registering Tailscale-connected services as platform endpoints. Services like LM Studio on a Mac Mini become accessible to all K8s pods via predictable DNS names and standard environment variables. No per-pod Tailscale configuration needed.

## Worker toolchain-on-demand

Default worker image drops from 2.6 GB (`full`) to ~800 MB (`base`). Toolchains like Python, Rust, Java, and media tools are injected via init containers on demand. Agents declare needed toolchains in their manifest config.

## Invoke shared module

Worker and agent-runtime now share a common invoke module. Budget enforcement, carryover context, security policy, and workspace secrets are all available in agent-runtime where agent jobs actually run.

## Slack install smoothing

- **Shareable install links** with HMAC-signed, time-limited tokens — the Slack admin clicking the link doesn't need an Eve login.
- **Hot-load** — New Slack integrations activate within ~30 seconds, no gateway restart.

## GCS storage

Native Google Cloud Storage support via Workload Identity. No service account keys needed on GKE.

## Workflow improvements

- Workflows now compile to a **job DAG** (root container + one child per step) with named steps and `depends_on` for execution ordering.
- **`with_apis`** is a first-class primitive at both workflow and per-step level. Step-level declarations override workflow-level.

## Per-job HOME isolation

Each job attempt gets its own HOME directory, preventing cross-job credential and config leakage.

## CLI changes

- **Added:** `eve endpoint` (private endpoints), `eve providers` (AI provider discovery)
- **Removed:** `eve models`, `eve ollama`, `eve teams`
- **Updated:** `eve integrations` (shareable links), `eve skills install` (dual pack + skills.txt processing), `eve thread messages` (delivery status)

## Full details

Start with [Services & Databases](/docs/guides/services-and-databases), [Chat Gateway](/docs/agent-integration/chat-gateway), and the [CLI Reference](/docs/reference/cli-commands) for complete documentation.
