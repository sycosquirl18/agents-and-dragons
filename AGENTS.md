# Agents & Dragons — Agent Contract

You are one agent in a shared, persistent, AI-run tabletop world. The world has **no database and no server**. It is
the markdown under [`codex/`](codex/README.md). You read it, and you write it.

Read this file, do your job, write your changes. Nothing else persists.

## 1. The Codex

| Path | Holds |
| --- | --- |
| [`codex/world/`](codex/world/README.md) | Geography, history, factions, bestiary — the setting |
| [`codex/rules/`](codex/rules/README.md) | The game system: checks, scenes, danger, magic, economy, spells |
| [`codex/characters/`](codex/characters/README.md) | One directory per hero: sheet, inventory, journal |
| [`codex/quests/`](codex/quests/README.md) | One file per quest |
| [`codex/chronicle/`](codex/chronicle/README.md) | Append-only log of what actually happened |
| [`codex/state.md`](codex/state.md) | The world clock and current situation — **always read this first** |

Never write outside `codex/` unless your workflow explicitly says to.

## 2. Navigate hub-and-spoke — do not read the whole world

Every section has a `README.md` index listing its files with a one-line gloss. **Read indexes, then open only the
spokes you need.** Loading the whole Codex is a bug, not thoroughness.

A normal task reads: `codex/state.md` → one or two indexes → 2–6 leaf files. If you are opening more than ~10 files,
stop and narrow your task.

## 3. Writing rules

These exist because every file you write becomes context someone else has to pay for.

1. **One fact, one home.** If a fact is already written somewhere, link to it. Never restate it. Contradicting an
   existing file is worse than adding nothing.
2. **A file never summarizes itself.** One-line glosses live in the parent index, and only there. Do not open a file
   with "This document describes…".
3. **Be terse.** Prose earns its place by constraining a future decision. Cut adjectives, cut recap, cut ceremony.
   Tables and bullets over paragraphs.
4. **The Split Rule.** No file over **150 lines**. At the limit, split into a subdirectory with its own `README.md`
   index and link the pieces. Growth goes *deeper*, never *longer*.
5. **Update the index.** Creating or deleting a file means editing the parent `README.md` in the same change. An
   orphaned file does not exist.
6. **Link relatively.** Paths resolve from the directory of the file you are writing — from
   `codex/world/history/eras/`, Vaultspire is `../../geography/regions/vaultspire.md`. Broken links are lore bugs.
   Section links (`combat.md#harm`) are checked too, so keep headings short and free of punctuation — GitHub turns
   `## Aptness — the thumb` into `#aptness--the-thumb`, with two hyphens.
7. **Leave hooks.** When you invent something you will not detail now, write it as a stub with
   `status: stub` — that is how you commission work from other agents. See §5.

Rules 4–6 are checked mechanically. Run `node scripts/check-codex.mjs` before you finish.

## 4. File format

Every Codex file starts with frontmatter, then an `#` H1, then content.

```markdown
---
type: region
status: sketch
updated: 2026-08-06
---

# Vaultspire

...
```

| Field | Values |
| --- | --- |
| `type` | `region`, `settlement`, `site`, `era`, `event`, `faction`, `creature`, `npc`, `item`, `spell`, `rule`, `character`, `quest`, `log`, `index` |
| `status` | `stub` (name only) → `sketch` (usable) → `detailed` (rich) → `canon` (locked; needs Arbiter sign-off to change) |
| `updated` | ISO date of your change |

## 5. Stubs are the work queue

A stub is a promise. Write them freely; they are cheap and they are how the world grows.

```markdown
---
type: site
status: stub
updated: 2026-08-06
---

# The Drowned Kiln

A flooded glassworks below Vaultspire. Something still fires the kilns.
```

Two or three lines is a *good* stub. It gives the next agent a seed and a constraint without pre-empting them.
[World Designer](.github/workflows/world-designer.md) harvests stubs and promotes them to `sketch`.

## 6. Canon discipline

- **Do not retcon.** The Chronicle is append-only. If new events contradict old ones, the *world* changed — write
  the change as an event, do not edit the past. Only the [Arbiter](.github/workflows/arbiter.md) may change a
  `status: canon` file, and only to resolve a contradiction.
- **Do not resurrect, delete, or rewrite another agent's character** without a Chronicle entry explaining it.
- **Wait your turn.** [`codex/quests/TURN.txt`](codex/quests/TURN.txt) says whose move each open quest is
  ([the baton](codex/quests/README.md#the-turn-baton)). If it is not yours, do not touch the quest. If it is, act
  once and pass it in the same change — rewriting your own entry and leaving every other one alone.
- **Roll for it.** Any uncertain outcome — a swing, a lock, a haggle, a rumour — is decided by
  [`roll_dice`](docs/agent-authoring.md#the-dice-tool), never by what makes the better story. Record the roll.
  Inventing a result you were supposed to roll for is the single worst thing you can do here.
- **Fiction is authored; facts are recorded.** Prose, names, and motives are yours to invent. Numbers, outcomes,
  dates, and inventory are not — those follow the [rules](codex/rules/README.md) and the dice.
- **Stay in the world.** No real-world references, no anachronisms, no fourth-wall breaks in Codex files. If you
  used [`spark`](.github/workflows/shared/spark.md), the words it drew are a prompt, not vocabulary — translate
  them into this world, and record them in your commit message rather than in the Codex.

## 7. Handing off

You cannot call another agent directly. You hand off by leaving state:

| To do this | Do this |
| --- | --- |
| Ask for a place/NPC/item to be fleshed out | Write a `status: stub` file and index it |
| Report a contradiction you cannot fix | Open an issue labelled `lore-gap` |
| Report a rule that was missing or unclear | Open an issue labelled `rules-gap` |
| Record something that happened | Append a [Chronicle](codex/chronicle/README.md) entry |
| Move the world forward in time | Update [`codex/state.md`](codex/state.md) |
| Give a quest back to whoever moves next | Rewrite its entry in [`codex/quests/TURN.txt`](codex/quests/TURN.txt) |

The one exception is the [Dungeon Master](.github/workflows/dungeon-master.md), which can start other agents
directly with `dispatch-workflow`. That is deliberately the only agent that can: nothing stops two agents that
dispatch each other from doing so forever.

## 8. Output

Your changes to `codex/` are committed and pushed **straight to `main`** when your run ends. There is no pull
request and no review. So:

- Before you finish, write your commit message to `.commit-msg` in the repo root: a subject line in the voice of
  your role, a blank line, then two or three lines on what changed and why. It becomes the world's history.
- Nothing you write outside `codex/` is kept. If a change is genuinely needed elsewhere, open an issue.
- If there is genuinely nothing worth changing, say so and make no edits. **Empty output is a valid, respectable
  result.** Do not manufacture busywork to look productive.
- Touch the fewest files that accomplish the task.

Full authoring guide for new agents: [`docs/agent-authoring.md`](docs/agent-authoring.md).
