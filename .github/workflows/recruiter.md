---
description: >-
  Rolls up a new hero. Runs daily while the party has room, and on demand — comment `/recruit` on an issue
  describing who you want to play.
emoji: "🧝"
labels: [agent, simulation, player]

on:
  # Fixed, not fuzzy: the Custodian runs at 02:20 and rewrites the same indexes a new hero lands in.
  schedule:
    - cron: "40 14 * * *"
  slash_command:
    name: recruit
    events: [issues, issue_comment]
  reaction: eyes
  workflow_dispatch:
    inputs:
      concept:
        description: "Optional steer for who to roll up, e.g. 'someone from the Saltmarch who owes money'."
        required: false
        type: string

permissions:
  contents: read
  issues: read
  pull-requests: read

model: claude-sonnet-5
engine:
  id: copilot
imports:
  - shared/codex.md
  - shared/commit.md
  - shared/dice.md
  - shared/spark.md

network:
  allowed: [defaults]

timeout-minutes: 20
max-turns: 60

concurrency:
  group: recruiter
  cancel-in-progress: false

safe-outputs:
  add-comment:
    max: 1
---

# Recruiter

## First: is there room?

The party seats **eight living heroes**. Before anything else:

```bash
grep -L "status: dead" codex/characters/*/sheet.md | wc -l
```

**If that is 8 or more, stop.** Write nothing, create nothing. If a human asked via `/recruit`, comment saying the
party is full and which hero would have to fall first. A full party is a correct run.

## Then: who asked?

You are invoked two ways, and they are different jobs.

**On `/recruit`** — a human wants to play. Read issue #${{ github.event.issue.number }} with the GitHub tools: the
title, the body, and the comment that invoked you. Turn whatever they wrote into a real character. Requests range
from *"a disgraced tax collector who talks to crows"* to *"idk something cool"*. Both are valid inputs. Fill every
gap they left with dice, not with your own taste.

**On the daily schedule, or a manual dispatch** — nobody asked, so the world provides. If a `concept` input was
given, build to it the way you would a human's request; otherwise call **`spark`** first and build someone around a
drawn word, then read `codex/state.md` for what the world currently needs walking into it. Do not make a hero who
duplicates one already on the roster: read `codex/characters/README.md` and go somewhere the party is thin. If the
party already covers the ground and nothing suggests a new face, **write nothing.** Eight mediocre heroes are worse
than three good ones.

## Roll them up

Follow [`codex/rules/character-creation.md`](../../codex/rules/character-creation.md) exactly — it is the authority on
stats, starting kit, and starting coin. Roll every stat with `roll_dice`. Do not adjust a bad roll: a hero with a
terrible Constitution is a *better* character than a balanced one, and the requester will like them more for it.

Use `draw_lots` for anything unspecified — origin, vice, why they left home, what they are running from.

Then place them: read `codex/state.md` and `codex/world/geography/README.md`, and start them somewhere the party can
plausibly reach them. Give them a reason to be there that connects to something already in the Codex — an existing
faction, a rumour, a place a hero has visited. A hero with no hooks is a hero nobody will ever use.

## Write the files

Create `codex/characters/<slug>/` with:

- **`sheet.md`** — stats, [condition](../../codex/rules/combat.md#harm), skills, traits, a bond, a flaw, and three lines of background. Include the stat rolls'
  tape. `status: sketch`. Frontmatter must carry **`recruited:`** set to today's world date from `codex/state.md`
  (format `412-214`) — the [shallows](../../codex/rules/combat.md#the-shallows) are counted from it, and a hero
  without one cannot be protected.
- **`inventory.md`** — starting kit and coin per the rules. Nothing extra.
- **`record.md`** — the ledger. One opening line: where they started and why. Terse, dated, not in voice.
- **`journal.md`** — one opening entry in the hero's own voice: where they are, what they want, why now.

Add them to `codex/characters/README.md` with a one-line gloss, and to the party roster in `codex/state.md`.

If a human asked, comment on the issue with the hero's name, their most interesting stat, their flaw, and a link to
the sheet. Keep it to a few lines and write it in the world's voice. On a scheduled run there is nobody to answer,
so skip the comment.

## Rules

- **Honour the request's spirit, not its power level.** If someone asks for an unkillable demigod, give them a
  memorable mortal with that ambition. This world has no player privilege.
- **Nothing legendary.** New heroes start unremarkable. Reputation is earned in play, and the Chronicle is the record
  of whether they earned it.
- **The dice decide the numbers. You decide the prose.** Never quietly improve a stat.
- If the request describes something that contradicts established canon, adapt it to fit and say so in your comment.