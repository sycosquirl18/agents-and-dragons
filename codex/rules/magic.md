---
type: rule
status: canon
updated: 2026-08-06
---

# Magic

**A spell is an object, not an ability.** It is inscribed on cinder-glass from the
[Glass Wound](../world/geography/regions/the-glass-wound.md), and casting it consumes the glass. Nobody in this era
knows how to make cinder-glass, and the supply is finite and shrinking.

This single fact does most of the work in this world: magic is scarce, it is *property*, and it is therefore
economics and politics before it is adventure.

## Casting

1. You must be holding the glass and able to speak.
2. `1d20 + Wits` vs the spell's DC.
3. **The glass shatters either way.** Success or failure, it is gone.
4. On a **natural 1**, it shatters *and* the spell goes somewhere it should not have. See the spell's Misfire line.

There is no spell list to memorise and no daily limit. The limit is what you can afford, and what you dare carry at
once — see [Carrying glass](#carrying-glass).

## Grades of glass

| Grade | | Spell DC | Effect | Stability | Cost |
| --- | --- | --- | --- | --- | --- |
| **Chip** | Cloudy, salvage-grade | 15 | Reduced — shortest duration, smallest area | Volatile, **+2** | ~40 silver |
| **Plate** | Clear, Wound-cut | 13 | As written | Sound, **+0** | ~200 silver |
| **Lens** | Kilnworks-made, no longer produced | 11 | Full, as the inscriber meant it | Inert, **−2** | not sold |

Grade changes three things at once: how hard the spell is to cast, how much of it you get, and how likely it is to
take the glass beside it when it goes wrong. A Chip is not a cheap Plate. It is a worse spell and a worse neighbour.

Cost is grade **and** inscription. A common spell on a Plate is dearer than a rare one on a Chip, and a few
inscriptions are worth more than any glass they are cut into.

## Carrying glass

Every spell has a **Load** of 1 to 3 — how violent the inscription is when it fails. A salvor's harness holds
**Load 6** in padded slots. More than that needs a case, both hands, and a reason worth giving.

**Sympathetic misfire.** On a natural 1 the spell misfires *and* may take its neighbours with it. Roll
`1d20 + Wits` vs **10 + total Load carried**, adjusted by the casting glass's stability above and by
[tradition](traditions.md#at-the-harness). On a failure the highest-Load crystal you carry shatters too, unspent.

Two Load-1 chips in a pouch are a nuisance. Two Load-3 plates are how a crew loses a season's wages in one bad roll.

## Inscribing

A blank piece of glass is worth about a third of an inscribed one. Inscribing requires the *Kilnworks notation* skill,
a full day, and `1d20 + Wits` vs DC 18. Failure destroys the blank.

Almost nobody can do this. Those who can are the most closely watched people in
[Vaultspire](../world/geography/regions/vaultspire.md).

## Consequences

- Casting in public is a claim of wealth, and is treated as one.
- The [Salvor's Concord](../world/factions/salvors-concord.md) licenses glass salvage like everything else.
- Every casting permanently reduces the world's total magic. The
  [Assayer](../../.github/workflows/assayer.md) tracks the supply as an economic quantity.

Individual spells: [spells/](spells/README.md). Inscription hands: [traditions](traditions.md).
