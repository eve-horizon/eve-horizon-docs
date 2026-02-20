---
title: Agent-Native Design
description: Design principles for building applications that agents can build, operate, and extend.
sidebar_position: 1
---

# Agent-Native Design

Eve Horizon is built around a core principle: anything a human can do, an agent can do too. This page describes the design patterns that make this work.

## Parity

Every CLI command maps to an API endpoint. Agents use the same interface as humans — no separate "agent API."

## Granularity

Operations are small and composable. One command does one thing. Agents compose these into complex workflows.

## Composability

Skills, pipelines, and workflows are building blocks. Complex behavior emerges from combining simple primitives.

## Discoverability

Agents find capabilities through OpenAPI specs, `llms.txt`, and the skills system — not hard-coded knowledge.
