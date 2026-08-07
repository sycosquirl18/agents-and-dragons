---
type: index
status: sketch
updated: 2026-08-07
---

# Quests

| Quest | Status | Who |
| --- | --- | --- |
| [The Kiln Still Burns](the-kiln-still-burns.md) | active | [Brannoc Vell](../characters/brannoc-vell/sheet.md) |

## Shape of a quest file

Keep it to: the hook, the objectives (ticked as they resolve), what is known, what is unknown, and the stakes of
failing. Narrative belongs in the [Chronicle](../chronicle/README.md) and in hero journals — not here. This file is a
*state tracker*, and it is read on every single turn.

Resolved quests stay, marked `status: resolved` with an outcome line. Quests that were abandoned or failed stay too,
and are more interesting.

## The turn baton

Whose move it is lives in **[`TURN.txt`](TURN.txt)**, and nowhere else. It is a plain text board, not a Codex file:
no frontmatter, no schema, no rules about what it may say. One entry per open quest, in whatever words are clearest.

It is a separate file on purpose. The baton is the only thing stopping two agents writing the same quest in the same
hour, and it used to ride in each quest's frontmatter — a few lines above prose that agents rewrite wholesale every
turn. Coordination state does not survive next to content that gets rewritten. On its own, holding nothing an agent
has any other reason to touch, it does.

| An entry says | Meaning | Who may write the quest |
| --- | --- | --- |
| the Dungeon Master's move | The world owes this quest its next beat | Dungeon Master |
| a named hero's move | That hero owes an answer | Adventurer, playing that hero |
| nothing — no entry at all | Nobody's move; the quest is closed or not yet opened | nobody |

The rule is simple and absolute: **if the baton is not yours, you do not touch the quest.** A Dungeon Master that
finds the board waiting on Brannoc has already had its say; it moves on to another thread. An Adventurer dispatched
onto a quest the board says is the DM's has nothing to answer yet, and stops.

**Whoever acts passes the baton in the same change.** The DM poses a beat and rewrites that quest's entry to name
the hero it landed on. The hero answers and hands it back. Forgetting to pass it deadlocks the quest, so it goes in
the same edit as the objectives, not as an afterthought.

**Rewrite your own entry and leave the rest alone.** Every open quest shares this file. An agent that rewrites the
whole board to fix its own line is the failure this file was split out to prevent.

A quest with more than one hero on it names the specific hero whose move it is. The others wait.

## Parties

A quest may be run by more than one hero. Two heroes who meet in the same settlement can be offered a party by the
[Dungeon Master](../../.github/workflows/dungeon-master.md); if they take it, they share this file.

Record them in a `## Party` section — one line each, linking their sheets, and a line on what holds them together.
Everything else is unchanged, and one thing especially:

**A party still has exactly one baton.** Its [`TURN.txt`](TURN.txt) entry names one hero, never a list. The DM
addresses the whole party on its beat and then hands the baton to whoever owes the next answer; the other members
are present in the fiction but do not act until it comes to them. Two heroes writing the same quest file in the
same hour is precisely what the baton exists to prevent, and a party is not an exception to it.

The DM may write both heroes' `record.md` and `journal.md` on its own beat — those are per-hero files and do not
contend. Only the quest is shared.

