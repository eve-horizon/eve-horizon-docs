---
title: Skills System
description: How agents discover, install, and execute skills — the portable instruction format.
sidebar_position: 2
---

# Skills System

Skills are portable instructions that tell agents how to perform specific tasks. They're the primary mechanism for extending agent capabilities.

## SKILL.md format

Each skill is a markdown file following the OpenSkills format:

```markdown
# Skill Name

Description of what this skill does.

## When to Use

- Trigger condition 1
- Trigger condition 2

## Instructions

Step-by-step instructions for the agent.
```

## Discovery priority

1. Project skills (`.claude/skills/`, `.agents/skills/`)
2. Skill packs (`x-eve.packs` in manifest)
3. Global skills (`skills.txt`)

## Installation

```bash
eve agents sync
```
