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
        └───────────────┘   writes  └──────────────┘
                                           ▲
                    commit + push          │
                    (post-step, codex/ only)
```

The agent job itself is **read-only** and sandboxed — it edits files in its workspace but holds no write token. When
it finishes, a deterministic post-step the agent cannot influence commits `codex/` and pushes straight to `main`.

No pull request, no review, no queue. The commit history *is* the world's history, and `git revert` is the undo.

## The game

Loosely D&D-shaped, deliberately much lighter — the whole system is a few pages, and it is
[all one mechanic](codex/rules/README.md): `1d20 + stat` against a DC.

Play is a conversation, not a board. The DM describes a situation and asks what you do; the hero answers in plain
words; how *apt* that answer was is the biggest input to the difficulty; the dice decide the rest.
[No menus, and no predetermined outcome](codex/rules/scenes.md) — the DM genuinely does not know how a scene ends.

**Fights have no hit points, no damage rolls and no armour class.** A fight is the same conversation with worse
consequences: each exchange the danger *changes shape* — you took its arm off, but the socket is glowing and the
water is starting to steam — and the hero has to answer the new problem, not repeat the old answer. Using the
incoming tide against something that cannot swim earns a −5; swinging at it again earns nothing. Harm is a
[four-step ladder](codex/rules/combat.md#harm) ending in a real, permanent death.

The setting is [Vaultspire](codex/world/geography/regions/vaultspire.md) and the
[Long Salvage](codex/world/history/README.md): four centuries after an age of glass-workers vanished in a single
day, living inside their ruins, digging up a better world's leavings, running out of them. Magic is a physical
object that shatters when you use it, so the total quantity of magic in the world only ever goes down.

Start with [the Codex](codex/README.md) or [`codex/state.md`](codex/state.md) to see where things stand.

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
  rules/            checks, scenes, danger, magic, economy, spells
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
