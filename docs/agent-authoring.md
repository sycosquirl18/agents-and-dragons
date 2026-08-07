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
  - shared/commit.md          # commits codex/ to main when the run ends. Always.
  - shared/dice.md            # only if the agent rolls for things.

network:
  allowed: [defaults]

timeout-minutes: 25
max-turns: 70

concurrency:
  group: rumour-mill          # stops two copies fighting over the same files
  cancel-in-progress: false
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
an assayer. It produces noticeably better output than a spec written as bullet points.

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

## How writes happen

The agent job cannot push. It edits files in its sandbox; when it finishes, the post-step from
[`shared/commit.md`](../.github/workflows/shared/commit.md) commits `codex/` and pushes to `main`. Importing that
file is all an agent has to do — there is no PR and nothing to configure.

The post-step stages `codex/` and nothing else. Edits anywhere else are warned about and dropped, so an agent that
needs to change rules infrastructure should open an issue instead.

Safe outputs are still used for everything that is *not* a file change:

| Output | For |
| --- | --- |
| `create-issue` | `lore-gap`, `rules-gap`, anything needing human or cross-agent judgement |
| `add-comment` | Replying on the issue that triggered you |
| `dispatch-workflow` | Orchestrators only |

An agent that only writes Codex files needs no `safe-outputs:` block at all.

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

Randomness is `crypto.getRandomValues` with rejection sampling, so a `d20` is genuinely uniform rather than
`Date.now() % 20`, which is not.

## The spark tool

Import `shared/spark.md` for agents that invent things:

```
spark(count: "10", parts: "nouns,adjectives,verbs")
  → { nouns: [...], adjectives: [...], verbs: [...], pool_sizes, detail }
```

It draws random words from [`data/words/`](../data/words/README.md) — about 17,000 English nouns, adjectives and
verbs derived from WordNet. The agent throws most of them away, picks from the survivors with `draw_lots`, and uses
at least one as a *seed*, not as vocabulary.

The point is that a model left alone reaches for the same handful of ideas, and the cursed blade shows up for the
seventh time. Real randomness in the prompt is the cheapest fix. Give it to any agent whose output would otherwise
converge — [Armorer](../.github/workflows/armorer.md), [Magician](../.github/workflows/magician.md), and
[World Designer](../.github/workflows/world-designer.md) all have it. Do not give it to auditors; there is nothing
creative about a link check.

## Human players

The [Recruiter](../.github/workflows/recruiter.md) already builds a hero from a GitHub issue, and hero files carry
no marker saying whether an AI or a person decides what they do next. That is deliberate. A human player is
intended to be the same architecture with a different input: the
[baton](../codex/quests/README.md#the-turn-baton) reads `turn: <their-hero>`, and instead of the Adventurer
answering, a person comments on an issue thread and an agent transcribes it into the journal under the same rules
and the same rolls.

Nothing here is built yet. When it is, it should reuse the quest baton, the journal format, and `roll_dice`
unchanged — the only new part is where the answer comes from.

## Testing before you unleash it

```bash
gh aw compile <name>              # schema + reference validation
gh aw trials <name>               # dry run: real agent, no writes
gh workflow run "<Name>"          # real run
gh aw logs <name>                 # what it actually did, and what it cost
```

Watch the first real run's PR closely. The usual first-draft failures: reads too much, writes too much, invents
outcomes it should have rolled for, and duplicates lore that already existed.
