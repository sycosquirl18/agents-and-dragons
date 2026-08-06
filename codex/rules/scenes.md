---
type: rule
status: canon
updated: 2026-08-06
---

# Scenes

Play is a conversation. The [Dungeon Master](../../.github/workflows/dungeon-master.md) describes a situation and
asks what you do. The [hero](../characters/README.md) answers in plain words. The DM decides what that answer risks,
sets a DC, and calls for a [roll](checks.md). The roll decides. The situation changes, and the DM describes it again.

That loop is the entire game. [Combat](combat.md) is this loop with worse consequences; haggling, sneaking and
lying are this loop with cheaper ones. There is no second system.

## The exchange

| | Who | |
| --- | --- | --- |
| 1. **Situation** | DM | Concrete, present tense, ends in a live problem. |
| 2. **Answer** | Hero | What they actually do, and with what. One action. |
| 3. **Ruling** | DM | Is it uncertain? What does failure cost? Set the DC. |
| 4. **Roll** | Dice | `roll_dice`, always. Never a chosen number. |
| 5. **Consequence** | DM | Narrate the result, then hand back a *changed* situation. |

Then go again. Three to six exchanges is a scene. Ten is a slog.

## Aptness

The hero's answer is the main input to the difficulty. This is the DM's thumb on the scale, and it is the most
important judgement call in the game.

A good answer uses something *true*: a fact the scene just revealed, a tool actually on the
[inventory](../characters/README.md), the terrain, the weather, the tide, something learned two scenes ago. Reward
that through the DC — not with a free pass.

| The answer | DC |
| --- | --- |
| Uses a real, specific advantage — ice against the fire, the tide against something that cannot swim | **−5**, or no roll at all |
| Sensible and specific | **−2** |
| Reasonable but generic — "I attack it again" | as set |
| Ignores what the scene just told them | **+2** |
| Actively wrong — the thing it is immune to, the thing that feeds it | **+5**, and failure bites harder |

Stack this with ordinary [circumstance modifiers](checks.md#modifiers) and trained
[skills](character-creation.md#skills), then stop: **cap the total swing at ±7.** Past that the answer has settled
the question, so do not roll — say what happens.

## Never pre-decide

The DM does not know how the scene ends. There is no intended path, no prepared ending, no beat that has to land.
If you notice yourself steering toward an outcome you already pictured, you have stopped running a game and started
writing a book. Roll, and take what the dice give you.

The corollary: **an apt answer is allowed to trivialise your scene.** If the hero pours a waterskin into the
mechanism and that genuinely solves it, it is solved. Do not invent a reason it fails. Being outsmarted is a good
outcome and you get to spend the rest of the scene on what happens next.

## No menus

Never offer numbered options. Offering three choices tells the hero there are exactly three, and the answer worth
having is the fourth — which only exists if nobody listed the first three. Describe the situation fully enough that
options are *obvious*, then ask an open question.

Describe what the hero can **see, hear, smell and reach**. Those four are where good answers come from.

## When not to roll

Do not roll if failure costs nothing, and do not roll if failure ends the story. With time, tools and no pressure,
the hero simply succeeds. Against a sheer unclimbable wall, they simply fail — and the scene is about finding
another way in, which is more interesting anyway.

## Ending a scene

A scene ends when the problem is resolved, escaped, or made someone else's. Then:

- Append what happened to the hero's [journal](../characters/README.md), with the rolls.
- Update the [quest](../quests/README.md) file if it moved.
- If something happened the world should remember, it belongs in the [Chronicle](../chronicle/README.md).
- If the scene revealed a place, person or thing that does not exist yet, leave a
  [stub](../../AGENTS.md#5-stubs-are-the-work-queue).
