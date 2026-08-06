# 🐉 Agents & Dragons

A tabletop world that plays itself.

There is no server, no database, and no game engine. There is a folder of markdown files — [the Codex](codex/README.md)
— and a roster of AI agents that read it and write it back. Agents design the geography, invent the rules, roll the
dice, role-play the heroes, audit the lore for contradictions, and keep the economy from collapsing. Each one runs as a
[GitHub Agentic Workflow](https://github.github.io/gh-aw/) on a cron, on a trigger, or because another agent asked for it.

Nothing runs continuously. The world advances one workflow run at a time, and every change to it is a pull request.

## How it works

```
   cron / dispatch / slash-command
                │
                ▼
        ┌───────────────┐   reads   ┌──────────────┐
        │ agent workflow│ ────────▶ │    codex/    │
        │  (markdown +  │           │   markdown   │
        │  frontmatter) │ ◀──────── │   the world  │
        └───────┬───────┘   writes  └──────────────┘
                │                          ▲
                │ safe-outputs             │
                ▼                          │
        ┌───────────────┐           ┌──────┴───────┐
        │  pull request │ ────────▶ │  auto-merge  │
        └───────────────┘           └──────────────┘
```

The agent job itself is **read-only**. It cannot push. Edits are captured by gh-aw's safe-outputs, opened as a PR, and
merged by [`auto-merge.yml`](.github/workflows/auto-merge.yml). The result: the world's git history *is* its history,
and every change is reviewable and revertible.

## The roster

| Agent | Runs | Does |
| --- | --- | --- |
| [Dungeon Master](.github/workflows/dungeon-master.md) | every 6h | Reads the world state, decides what happens next, dispatches the others |
| [Adventurer](.github/workflows/adventurer.md) | dispatched | Role-plays one hero taking one turn. Rolls dice. Updates sheet, inventory, journal |
| [World Designer](.github/workflows/world-designer.md) | daily + dispatched | Promotes `status: stub` places into real, detailed locations |
| [Chronicler](.github/workflows/chronicler.md) | weekly | Folds raw session logs into the history; keeps indexes honest |
| [Loremaster](.github/workflows/loremaster.md) | daily | Audits for contradictions, broken links, and oversized files |
| [Quartermaster](.github/workflows/quartermaster.md) | weekly | Tends prices, treasure, and the money supply |
| [Rules Smith](.github/workflows/rules-smith.md) | weekly | Writes the rules the world turned out to need |
| [Recruiter](.github/workflows/recruiter.md) | `/recruit` comment | Rolls up a new hero from an issue and adds them to the party |

New agents are added constantly — that is the point. See **[Agent authoring guide](docs/agent-authoring.md)**, or just
ask Copilot CLI: *"create an agent that runs the tavern rumour mill"* — the
[`create-agent` skill](.github/skills/create-agent/SKILL.md) knows the house style.

## Dice

Agents do not decide outcomes; they roll for them. A [`roll_dice`](.github/workflows/shared/dice.md) MCP tool is
available to any workflow that imports `shared/dice.md`:

```
roll_dice(notation: "1d20+4", mode: "advantage", reason: "Brannoc picks the vault lock")
  → { rolls: [17, 6], kept: 17, total: 21, natural: 17, crit: false, detail: "1d20+4 adv [17, 6] → 17+4 = 21" }
```

It uses a rejection-sampled CSPRNG, so the distribution is actually flat. Every roll is written into the hero's journal,
so the tape is auditable.

## Running it

```bash
gh extension install github/gh-aw   # once
gh aw compile                       # markdown workflows -> .lock.yml
git add -A && git commit && git push
```

Add a Copilot PAT for the account that should be **billed** for inference (this need not be the account that owns the
repo — see [operations.md](docs/operations.md#auth)):

```bash
gh aw secrets set COPILOT_GITHUB_TOKEN --value "<fine-grained PAT with Copilot Requests: Read>"
```

Then kick it off:

```bash
gh aw trials                        # optional: dry-run a workflow without writing
gh workflow run "Dungeon Master"    # start the world turning
```

See [`docs/operations.md`](docs/operations.md) for secrets, cadence, cost controls, and how to pause the world.

## Layout

```
codex/            the world — everything the agents read and write
  state.md          world clock + current situation (every agent reads this first)
  world/            geography, history, factions, bestiary
  rules/            checks, combat, magic, economy, spells
  characters/       one folder per hero: sheet, inventory, journal
  quests/           one file per quest
  chronicle/        append-only log of what happened
.github/workflows/  the agents (*.md) + compiled Actions (*.lock.yml)
  shared/           imported components: dice, codex conventions, engine config
.github/skills/     Copilot CLI skill for authoring new agents
docs/               architecture, conventions, operations
AGENTS.md           the contract every agent obeys
```

## Design constraints

Every rule here exists to keep agent context small and the world coherent:

- **Terse, deduplicated, cross-linked.** A fact lives in exactly one file; everything else links to it.
- **Hub-and-spoke.** Indexes carry one-line glosses so an agent can navigate without reading the world.
- **The Split Rule.** No file over 150 lines. Growth goes deeper, not longer.
- **Stubs are the work queue.** A three-line `status: stub` file is how one agent commissions another.
- **Append-only history.** The Chronicle is never retconned. Contradictions get resolved forward, as events.

These are enforced socially by [`AGENTS.md`](AGENTS.md) and mechanically by the
[Loremaster](.github/workflows/loremaster.md).
