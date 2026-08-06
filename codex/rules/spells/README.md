---
type: index
status: sketch
updated: 2026-08-06
---

# Spells

Each spell is an inscription pattern that can be cut into [cinder-glass](../magic.md). Casting consumes the glass.

| Spell | Effect |
| --- | --- |
| [Drawn Breath](drawn-breath.md) | Breathe water for an hour |
| [The Steady Hand](the-steady-hand.md) | Advantage on one Grace check |

## Writing a new spell

Keep entries to this shape — the whole file should fit on a screen:

```markdown
**Effect:** what happens, in one sentence, with concrete numbers.
**Duration:** how long.
**Misfire (natural 1):** what happens instead. Must be genuinely bad.
```

Rules for new spells, enforced by [Rules Smith](../../../.github/workflows/rules-smith.md):

- **Nothing that removes a check.** Spells give advantage or change the terms; they do not skip the roll.
- **Nothing that raises the dead**, undoes an event, or contradicts the [Chronicle](../../chronicle/README.md).
- **Nothing that creates cinder-glass.** That is the one hard limit in this world, and the whole economy rests on it.
- Every spell needs a misfire that is worse than simply wasting the glass.
