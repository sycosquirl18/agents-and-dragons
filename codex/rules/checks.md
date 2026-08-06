---
type: rule
status: canon
updated: 2026-08-06
---

# Checks

**`1d20 + stat modifier` vs DC. Meet it or beat it.** Roll with the `roll_dice` tool, never by choosing a number.

This is the atom. [scenes.md](scenes.md) is how these get strung together into play.

## Stats

| Stat | Covers |
| --- | --- |
| **Might** | Force, endurance, carrying, holding on |
| **Grace** | Speed, balance, stealth, precision, reflex |
| **Wits** | Noticing, deducing, recalling, tinkering, reading |
| **Heart** | Nerve, persuasion, deception, resolve, command |

Scores run 3–18. The modifier is **(score − 10) ÷ 2, rounded down**: a 7 gives −2, a 14 gives +2, an 18 gives +4.

## Difficulty

| DC | | Example |
| --- | --- | --- |
| 8 | Easy | A locked door that has been kicked before |
| 11 | Ordinary | Haggling a fair price |
| 13 | Tricky | Climbing a wet vault rib |
| 15 | Hard | Picking a Concord lock |
| 18 | Severe | Talking an enforcer out of a revocation |
| 21 | Extraordinary | Reading Kilnworks notation |

**Do not roll unless failure costs something.** If a hero has time, tools, and no pressure, they simply succeed.
The roll is for when the tide is coming in.

## Modifiers

Circumstance shifts the DC by ±2 (minor) or ±5 (major) — adjust the DC, not the roll, so the tape stays readable.
The right tool, a relevant background, or good preparation is worth −2 to −5 DC.

The largest single input is usually how *apt* the hero's answer was; that has its own ladder in
[scenes.md](scenes.md#aptness).

## Advantage

Roll twice, keep the higher (`mode: "advantage"`) or lower (`mode: "disadvantage"`). Grant it for a genuinely clever
approach or a real material edge. They cancel: you never have both.

## Crits and fumbles

Read off the **natural** d20, before modifiers.

- **Natural 20** — succeed, and get something extra: information, position, speed, or a free consequence in your favour.
- **Natural 1** — fail, and something else goes wrong. Not slapstick. The lock holds *and* you hear footsteps.

A natural 20 does not beat an impossible DC, and a natural 1 does not fail a task with no DC.

## Contests

Both sides roll `1d20 + stat`; higher wins; the defender wins ties.

## Consequences

Every failed roll must move the situation, never freeze it. Fail forward: the hero gets in, but late, loud, hurt, or
watched. "You don't get in" is a dead end, and dead ends are the one thing this world cannot afford — there is nobody
at the table to unstick it.
