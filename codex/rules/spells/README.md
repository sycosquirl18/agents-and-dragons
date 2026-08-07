---
type: index
status: sketch
updated: 2026-08-07
---

# Spells

Each spell is an inscription pattern that can be cut into [cinder-glass](../magic.md). Casting consumes the glass.

| Spell | Tradition | Load | Effect |
| --- | --- | --- | --- |
| [Cold Light](cold-light.md) | Kilnworks | 1 | Light that burns underwater and in dead air |
| [Drawn Breath](drawn-breath.md) | Salvor's | 2 | Breathe water for an hour |
| [Glasskin](glasskin.md) | Kilnworks | 2 | Ignore one step of harm, once |
| [The Held Wall](the-held-wall.md) | Kilnworks | 3 | Water will not cross a line, for ten minutes |
| [The Steady Hand](the-steady-hand.md) | Salvor's | 1 | Advantage on one Grace check |
| [Last Mark](last-mark.md) | Covenant plainscript | 3 | Shards hold an eight-heartbeat sensory echo of the moment of casting |
| [The Way Back](the-way-back.md) | Salvor's | 2 | Points to the nearest air or open water |
| [The Founding Cut](the-founding-cut.md) | Kilnworks | 3 | Anchors you within ten feet of a fixed mark against any force you didn't choose |
| [The Witnessed Ground](the-witnessed-ground.md) | Covenant plainscript | 1 | Records the ground within thirty feet as fixed, binding testimony |
| [The True Edge](the-true-edge.md) | Kilnworks | 1 | Tells you, without a check, whether a fixed fitting is sound or already flawed |

Every spell here solves exactly one problem that this world actually has — the dark, the water, the tide, the
shaking hand. None of them throw fire. Magic in the Kilnworks tradition was industrial, and what survived it is
the tooling, not the weaponry. A spell is an apt answer in a [scene](../scenes.md#aptness) because it is
*specific*, not because it is powerful.

Only two [Covenant plainscript](../traditions.md#covenant-plainscript) spells are listed here, and the Covenant
sells neither. That scarcity is a fact about the world, not a gap in the record.

## Writing a new spell

Minted one at a time by [the Magician](../../../.github/workflows/magician.md). Keep entries to this shape — the
whole file should fit on a screen:

```markdown
**Tradition:** which hand it was cut in, and one clause on how you can tell.
**Load:** 1, 2, or 3 — how violent it is when it fails.
**Effect:** what happens, in one sentence, with concrete numbers.
**Duration:** how long.
**Misfire (natural 1):** what happens instead. Must be genuinely bad.
```

Rules for new spells, set by [Rules Smith](../../../.github/workflows/rules-smith.md) and obeyed by the Magician:

- **Nothing that removes a check.** Spells give advantage or change the terms; they do not skip the roll.
- **Nothing that raises the dead**, undoes an event, or contradicts the [Chronicle](../../chronicle/README.md).
- **Nothing that creates cinder-glass.** That is the one hard limit in this world, and the whole economy rests on it.
- Every spell needs a misfire that is worse than simply wasting the glass.
- **Load must match the misfire.** A spell that fails quietly is Load 1. A spell whose failure takes the room is 3.
