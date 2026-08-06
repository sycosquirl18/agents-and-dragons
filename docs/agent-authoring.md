# Writing a new agent

An agent is one markdown file in `.github/workflows/`. Frontmatter says when it runs and what it may touch; the body
is the prompt. `gh aw compile` turns it into a `.lock.yml` that GitHub Actions runs.

The [`create-agent` skill](../.github/skills/create-agent/SKILL.md) automates all of this — in Copilot CLI, just say
*"create an agent that runs the tavern rumour mill"*. What follows is the reference.

## Template

```yaml
---
description: >-
  One or two sentences. Shows up in listings and in the compiled workflow.
emoji: "🍺"
labels: [agent, simulation]

on:
  schedule: weekly            # or: daily, every 6h, or a cron expression
  workflow_dispatch:          # always include — the DM dispatches through this
    inputs:
      directive:
        description: "What the Dungeon Master wants from this run."
        required: false
        type: string

permissions:                  # read-only. Writes happen in the safe-outputs job.
  contents: read
  issues: read
  pull-requests: read
                              # Deliberately no `copilot-requests: write` — see docs/operations.md#auth.
                              # That permission bills the repo owner and overrides COPILOT_GITHUB_TOKEN.

engine:
  id: copilot

imports:
  - shared/codex.md           # tools + Codex operating procedure. Always.
  - shared/dice.md            # only if the agent rolls for things.

network:
  allowed: [defaults]

timeout-minutes: 25
max-turns: 70

concurrency:
  group: rumour-mill          # stops two copies fighting over the same files
  cancel-in-progress: false

safe-outputs:
  create-pull-request:
    title-prefix: "[rumours] "
    labels: [codex-update, agent]   # `codex-update` is what auto-merge looks for
    draft: false
    max: 1
    if-no-changes: warn
---

# Rumour Mill

<the prompt>
```

Then:

```bash
gh aw compile rumour-mill
node scripts/check-codex.mjs
git add .github/workflows/rumour-mill.md .github/workflows/rumour-mill.lock.yml
```

Commit the `.lock.yml` — it is what actually runs. `codex-check.yml` fails the PR if you forget.

## Writing the prompt

This is the part that matters, and it is closer to writing a job description than writing code.

**Give it a job nobody else has.** Overlapping agents produce contradictory PRs and duplicated lore. Check the
[roster](../README.md#the-roster) first. If your idea is a variation on an existing agent, extend that agent instead.

**Say what to read, in order.** The single biggest quality lever. `codex/state.md`, then the one index, then the two
or three leaf files. An agent told to "review the world" will read everything, cost a fortune, and do a worse job than
one told to read four specific files.

**Say what NOT to do.** Agents overreach by default: the world designer starts writing the hero's dialogue, the
economist starts rewriting inventories. Every prompt here has an explicit "stay in your lane" section, and they earn
their keep.

**Give it judgement, not just steps.** "Pick the gap that has come up most often, not the one that is most
interesting to design" beats any amount of procedure. Tell it how to choose, and what the tempting-but-wrong choice
looks like.

**Make doing nothing acceptable, explicitly.** Otherwise it will manufacture changes to look useful, and the Codex
fills with noise. Every agent's prompt ends with permission to stop.

**Roll, don't decide.** If the agent picks outcomes, everything it writes drifts toward the most dramatic option.
Import `shared/dice.md` and tell it what to roll for.

**Write in the agent's voice.** These prompts read as if addressed to a person with a role — a historian, an auditor,
a quartermaster. It produces noticeably better output than a spec written as bullet points.

## Choosing a trigger

| | Use for |
| --- | --- |
| `schedule: daily` / `weekly` / `every 6h` | Maintenance and background work. Fuzzy schedules scatter automatically |
| `workflow_dispatch` | Always add it — manual runs and DM dispatch both need it |
| `slash_command: {name: x}` | Human entry points. Comment `/x` on an issue |
| `on: issues: {types: [labeled]}` | React to labels, e.g. a `lore-gap` triage agent |
| `workflow_run` | Chain after a specific workflow completes |

To let the Dungeon Master dispatch your agent, add its filename to `dispatch-workflow.workflows` in
[`dungeon-master.md`](../.github/workflows/dungeon-master.md) — otherwise compilation fails, deliberately.

## Safe outputs

The agent job cannot push. It edits files in its sandbox and a separate job turns those edits into a PR.

| Output | For |
| --- | --- |
| `create-pull-request` | Codex changes. Needs `labels: [codex-update]` to auto-merge |
| `create-issue` | `lore-gap`, `rules-gap`, anything needing human or cross-agent judgement |
| `add-comment` | Replying on the issue that triggered you |
| `dispatch-workflow` | Orchestrators only |

Auto-merge will refuse anything touching files outside `codex/`. An agent that needs to change rules infrastructure
should open an issue instead.

## The dice tool

Import `shared/dice.md` and the agent gets two tools:

```
roll_dice(notation: "2d6+1", mode: "normal"|"advantage"|"disadvantage", reason: "...")
  → { total, dice, modifier, natural, crit, fumble, detail }

draw_lots(options: "goblin*3; ogre; wraith", count: "1", unique: "true")
  → { picks, detail }
```

Both are `mcp-scripts` — plain JavaScript in the frontmatter of
[`shared/dice.md`](../.github/workflows/shared/dice.md), run on the runner host, outside the agent sandbox. Adding a
new deterministic tool means adding another entry there (or in a new `shared/*.md`); no server, no MCP package.

## Testing before you unleash it

```bash
gh aw compile <name>              # schema + reference validation
gh aw trials <name>               # dry run: real agent, no writes
gh workflow run "<Name>"          # real run
gh aw logs <name>                 # what it actually did, and what it cost
```

Watch the first real run's PR closely. The usual first-draft failures: reads too much, writes too much, invents
outcomes it should have rolled for, and duplicates lore that already existed.
