---
type: index
status: sketch
updated: 2026-08-07
---

# Quests

| Quest | Status | Turn | Who |
| --- | --- | --- | --- |
| [The Kiln Still Burns](the-kiln-still-burns.md) | active | brannoc-vell | [Brannoc Vell](../characters/brannoc-vell/sheet.md) |

## Shape of a quest file

Keep it to: the hook, the objectives (ticked as they resolve), what is known, what is unknown, and the stakes of
failing. Narrative belongs in the [Chronicle](../chronicle/README.md) and in hero journals — not here. This file is a
*state tracker*, and it is read on every single turn.

Resolved quests stay, marked `status: resolved` with an outcome line. Quests that were abandoned or failed stay too,
and are more interesting.

## The turn baton

Every `status: active` quest carries a `turn:` field in its frontmatter. It says **whose move it is**, and it is the
only thing that stops two agents writing the same quest in the same hour.

| `turn:` | Meaning | Who may write |
| --- | --- | --- |
| `dm` | The world owes this quest its next beat | Dungeon Master |
| a hero slug, e.g. `brannoc-vell` | That hero owes an answer | Adventurer, playing that hero |
| `none` | Nobody's move — only on quests no longer active | nobody |

The rule is simple and absolute: **if the baton is not yours, you do not touch the quest.** A Dungeon Master that
finds `turn: brannoc-vell` has already had its say and is waiting; it moves on to another thread. An Adventurer
dispatched onto a quest that reads `turn: dm` has nothing to answer yet, and stops.

**Whoever acts passes the baton in the same change.** The DM poses a beat and sets `turn:` to the hero it landed on.
The hero answers and sets `turn: dm`. Forgetting to pass it deadlocks the quest, so it goes in the same edit as the
objectives, not as an afterthought.

A quest with more than one hero on it names the specific hero whose move it is. The others wait.

