---
title: Skills & Skill Packs
description: Install, create, and manage agent skills and skill packs for portable agent capabilities.
sidebar_position: 5
---

# Skills & Skill Packs

Skills are portable instructions that tell agents how to perform specialized tasks. They follow Anthropic's SKILL.md format — a markdown file with frontmatter metadata and imperative instructions. Skill packs bundle related skills for distribution.

Eve supports two installation paths: **AgentPacks** via `x-eve.packs` in the manifest (preferred) and a root `skills.txt` manifest. Most teams keep in-repo and remote pack sources in `skills.txt` and run `eve skills install`.

## What are skills?

A skill is a directory containing a `SKILL.md` file and optional bundled resources. Skills use progressive disclosure — metadata is always available, instructions load when the skill is invoked, and resources load on demand.

```
my-skill/
├── SKILL.md           # Instructions (required)
├── references/        # Detailed documentation (on demand)
├── scripts/           # Executable utilities (via CLI)
└── assets/            # Templates, images (used by scripts)
```

When an agent needs a capability, it reads the skill with `skill read <skill-name>`, which outputs the SKILL.md content and the base directory path for resolving bundled resources.

## Directory structure

Skills are installed into two mirrored locations — one universal, one Claude-specific:

```
your-repo/
├── skillpacks/              # Tracked skill sources (committed)
│   └── my-pack/
│       └── pr-review/
│           ├── SKILL.md
│           └── references/
├── skills.txt               # Legacy manifest of skill sources
├── .agents/
│   └── skills/              # Installed skills (gitignored)
├── .claude/
│   └── skills -> ../.agents/skills  # Symlink (gitignored)
└── .gitignore
```

The key distinction: skill **sources** (under `skillpacks/` or in a remote repo) are tracked in version control. Skill **installations** (under `.agents/skills/`) are gitignored and regenerated on clone.

```gitignore
.agents/skills/
.claude/skills
```

## SKILL.md format

Every skill starts with YAML frontmatter followed by markdown instructions.

```markdown
---
name: my-skill
description: Brief description of what this skill does
---

# My Skill

Instructions in imperative form (not second-person).

## When to Use

Load this skill when the user asks about X or when Y condition applies.

## Instructions

To accomplish X:
1. Check the configuration in `config/`
2. Apply the standard patterns from references/patterns.md
3. Validate the output

## References

- `references/patterns.md` - Standard patterns to apply
```

### Frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Hyphen-case identifier (e.g., `my-skill`) |
| `description` | Yes | One to two sentence summary |

### Writing guidelines

- **Imperative form:** Write "To do X, execute Y" rather than "You should execute Y."
- **Size limit:** Keep SKILL.md under 5,000 words. Move detailed documentation to `references/`.
- **Trigger phrases:** Include a "When to Use" section so agents know when to load the skill.
- **Resource references:** Point to files in `references/`, `scripts/`, or `assets/` using relative paths.

## Bundled resources

Skills can include supporting files alongside the SKILL.md:

| Directory | Purpose | Loading behavior |
|-----------|---------|-----------------|
| `references/` | Detailed documentation, guides, examples | Loaded on demand when referenced |
| `scripts/` | Executable utilities and automation | Never loaded into context (executed via CLI) |
| `assets/` | Templates, images, configuration files | Never loaded into context (used by scripts) |

Resources keep the SKILL.md concise. An agent reads the skill instructions first, then loads specific reference files only when needed — minimizing context window usage.

## Installing skills

### Via skills.txt (repo manifest)

The `skills.txt` file lists one skill source per line. Sources can be local paths, Git URLs, or `org/repo` identifiers.

```txt
# Local skills (use explicit path prefixes)
./skillpacks/my-pack/my-skill
./skillpacks/my-pack/*

# Remote sources
https://github.com/incept5/eve-skillpacks
git@github.com:org/private-skills
```

:::note
Always use explicit path prefixes (`./`, `../`, `/`, or `~`) for local paths. Bare paths like `skillpacks/my-pack` are ambiguous and may be interpreted as `org/repo` identifiers.
:::

Install with:

```bash
eve skills install
```

This reads `skills.txt`, installs each source into `.agents/skills/`, and symlinks `.claude/skills` to `.agents/skills/` when possible.
Re-run `eve skills install` periodically to refresh from updated published packs.

### Via AgentPacks (preferred)

AgentPacks are declared in the manifest under `x-eve.packs` and resolved into a lockfile at `.eve/packs.lock.yaml`. This is the preferred path because it provides reproducible resolution and integrates with the broader agent configuration sync.

```yaml
x-eve:
  packs:
    # Local pack
    - source: ./skillpacks/my-pack

    # Remote pack (ref required, full repo)
    - source: incept5/eve-skillpacks
      ref: 0123456789abcdef0123456789abcdef01234567

    # Remote pack with subset (ref + packs)
    - source: incept5/eve-skillpacks
      ref: 0123456789abcdef0123456789abcdef01234567
      packs: [eve-work, eve-se]
```

Remote sources require a 40-character SHA in the `ref` field. Add `packs` to scope to selected packs in a repository.

Packs are resolved during `eve agents sync`, which reads the manifest, resolves all pack sources, and writes `.eve/packs.lock.yaml`.

### Automatic installation

When a job runs, the worker clones the repository and executes `.eve/hooks/on-clone.sh`, which installs skills automatically. No manual installation is needed for CI/CD or agent job execution.

Use this minimal hook to keep clone-time install behavior consistent for all jobs:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
eve skills install
```

## Creating a custom skill

### Step 1 — Create the skill directory

```bash
mkdir -p skillpacks/my-pack/my-skill
```

### Step 2 — Write the SKILL.md

```bash
cat > skillpacks/my-pack/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Handles code review with project-specific conventions
---

# My Skill

To perform a code review:
1. Check the diff against patterns in references/conventions.md
2. Verify test coverage for changed functions
3. Flag any security concerns using the checklist in references/security.md

## When to Use

Load this skill when reviewing pull requests or code changes.

## References

- `references/conventions.md` - Project coding conventions
- `references/security.md` - Security review checklist
EOF
```

### Step 3 — Add reference files (optional)

```bash
mkdir -p skillpacks/my-pack/my-skill/references
# Add your reference documentation
```

### Step 4 — Register and install

For `skills.txt`:

```bash
echo './skillpacks/my-pack/*' >> skills.txt
eve skills install
```

For AgentPacks, add the local source to your manifest:

```yaml
x-eve:
  packs:
    - source: ./skillpacks/my-pack
    - source: incept5/eve-skillpacks
      ref: 0123456789abcdef0123456789abcdef01234567
      packs: [eve-work]
```

### Step 5 — Commit the source

```bash
git add skillpacks/my-pack skills.txt
git commit -m "Add my-skill for code review"
```

## Skill packs

Skill packs are directories containing multiple related skills grouped by domain. Think of them as packages — a way to bundle and distribute coherent sets of capabilities.

### Pack structure

```
my-pack/
├── README.md            # Pack description and audience
├── skill-one/
│   ├── SKILL.md
│   └── references/
├── skill-two/
│   ├── SKILL.md
│   └── scripts/
└── skill-three/
    └── SKILL.md
```

Each subdirectory containing a `SKILL.md` is an individual skill. The skill name comes from the directory name — `skill-one/` becomes the skill `skill-one`.

### Creating your own pack

1. Create the pack directory with a README documenting its purpose and included skills.
2. Add skill subdirectories, each with a SKILL.md and optional resources.
3. Reference the pack in `skills.txt` (with a glob) or in `x-eve.packs`.

```bash
# Create the pack
mkdir -p skillpacks/team-standards

# Add skills
mkdir -p skillpacks/team-standards/api-design
mkdir -p skillpacks/team-standards/testing-conventions

# Write SKILL.md files for each skill
# ...

# Install all skills in the pack
echo './skillpacks/team-standards/*' >> skills.txt
eve skills install
```

### Glob patterns in skills.txt

| Pattern | Behavior |
|---------|----------|
| `./path/*` | All direct child directories with SKILL.md |
| `./path/**` | Recursive — all nested directories with SKILL.md |
| `./path/skill` | Single specific skill |

## Official packs

Eve publishes three public skill packs in the [eve-skillpacks](https://github.com/incept5/eve-skillpacks) repository:

### eve-work

Skills for productive work using Eve Horizon patterns. Includes orchestration, job lifecycle management, job debugging, skill distillation, agent memory, and platform documentation.

**Who should use it:** Anyone using Eve Horizon for knowledge work — software engineering, research, writing, or other domains.

### eve-se

Skills for working with the Eve Horizon platform. Includes project bootstrap, CLI primitives, manifest authoring, auth and secrets, local dev loop, deploy debugging, pipelines and workflows, troubleshooting, and repo upkeep.

**Who should use it:** Teams building applications on Eve Horizon.

### eve-design

Skills for architectural thinking on Eve Horizon. Includes agent-native design principles, full-stack app design, and agentic app design.

**Who should use it:** Anyone designing applications, APIs, or agent systems on Eve Horizon. The three skills form a progression — principles, then PaaS architecture, then agentic architecture.

Install all official packs at once:

```txt
https://github.com/incept5/eve-skillpacks
```

Or install selectively by cloning the repo and referencing specific packs or skills.

## AgentPacks via manifest

AgentPacks are the preferred way to manage skills in production. They integrate skill resolution with agent configuration, provide lockfile-based reproducibility, and support per-pack agent targeting.

```yaml
x-eve:
  # Which agents should receive installed skills
  install_agents: [claude-code, codex, gemini-cli]

  packs:
    # Local pack
    - source: ./skillpacks/my-pack

    # Remote pack (pinned to commit)
    - source: incept5/eve-skillpacks
      ref: 0123456789abcdef0123456789abcdef01234567

    # Per-pack agent targeting
    - source: ./skillpacks/claude-only
      install_agents: [claude-code]
```

### Source formats

| Format | Example |
|--------|---------|
| Local path | `./skillpacks/my-pack` |
| GitHub shorthand | `incept5/eve-skillpacks` |
| GitHub prefixed | `github:incept5/eve-skillpacks` |
| Git URL | `git@github.com:org/private-skills` |

Remote sources require a `ref` field with a 40-character SHA. This ensures every team member and every CI run resolves the exact same skill versions.

### Lockfile

When you run `eve agents sync`, the resolver reads `x-eve.packs`, fetches each source, and writes `.eve/packs.lock.yaml`. The lockfile captures the resolved commit SHA and the list of skills found in each pack. Subsequent installs use the lockfile for deterministic resolution.

Check lockfile state and drift:

```bash
eve packs status
eve packs resolve --dry-run
```

## Migrating from skills.txt to AgentPacks

If you have an existing `skills.txt`, Eve provides a migration command:

```bash
eve migrate skills-to-packs
```

This reads your `skills.txt`, resolves each source, and generates a YAML fragment suitable for `x-eve.packs`. Review the output, merge it into `.eve/manifest.yaml`, run `eve agents sync` to verify, then remove `skills.txt`.

## Search priority and shadowing

When an agent reads a skill, the skills CLI searches these locations in order (first match wins):

1. `./.agents/skills/` — project universal
2. `~/.agents/skills/` — global universal
3. `./.claude/skills/` — project Claude-specific
4. `~/.claude/skills/` — global Claude-specific

Project skills shadow global skills with the same name. This means you can install a global skill pack for general use and override specific skills at the project level when you need project-specific behavior.

## What's next?

Configure agents and teams to use your skills: [Agents & Teams](./agents-and-teams.md)
