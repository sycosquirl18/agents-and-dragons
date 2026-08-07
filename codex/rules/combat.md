---
type: rule
status: canon
updated: 2026-08-06
---

# Danger

There is no separate combat system. A fight is a [scene](scenes.md) where the consequences are physical and the
situation changes whether or not the hero acts well. Everything here is about what makes a fight *different* from
haggling: it escalates, and it can take your body away from you.

**There are no hit points, no damage rolls, and no armour class.** A hero is not a pool of numbers being drained.
They are fine until they are hurt, and then they are hurt until it is dealt with.

## The escalating exchange

A fight is the ordinary loop with one addition: **every exchange, the danger changes shape.** The DM does not
repeat "it attacks again". It presses somewhere new.

> You take the wight's arm off at the elbow. It does not react to that at all — and the socket where the arm
> was is glowing, and the water around you is starting to steam.

That is a fight: a sequence of specific, answerable problems. Each asks for a different answer, so the hero cannot
win by repeating themselves. If the hero *does* repeat themselves, the
[aptness ladder](scenes.md#aptness) charges them for it.

Good escalations take something away: the light, the footing, the exit, the air, the weapon, the initiative. Bad
escalations just add another enemy.

## Harm

When a hero fails a roll and the fiction says they got hurt, move them one step. Not every failure wounds — most
should cost position, time, or noise instead. **Save harm for when the fiction insists.**

| State | | Effect |
| --- | --- | --- |
| **Unharmed** | — | — |
| **Marked** | Scrapes, a scorch, a cracked rib | None. It is a warning, and it is visible to enemies. |
| **Wounded** | One **named** injury: *left hand burned*, *ankle turned* | Disadvantage on everything it plausibly touches. Name it on the [sheet](../characters/README.md). |
| **Down** | Out of the fight | Cannot act. Dying — see below. |

Two Wounded results do not stack into Down on their own, but a second named injury makes almost every answer
disadvantaged, which is usually how heroes end up Down anyway.

A **natural 1** in a fight moves the hero one step *and* costs them something else. A **natural 20** in a fight is
the moment the scene turns.

Enemies use the same ladder. A creature that reaches Down is finished, fleeing, or begging — the DM chooses which,
and "finished" should not always be the answer.

## Dying

A hero who is Down dies at the end of the next exchange **unless someone reaches them**: Wits DC 12 to stabilise,
or any apt use of [magic](magic.md), fire, or a tourniquet.

Alone and Down with nobody coming, a hero dies. That is the deal, and it is why
[getting out](#getting-out) is written down as a real option.

Death is permanent. There is no revival anyone in this era knows how to perform. When a hero dies, the
[Chronicle](../chronicle/README.md) gets an entry and their [sheet](../characters/README.md) gets
`status: dead` — it is never deleted.

## The shallows

A hero who has just arrived is **in the shallows**, and the deep has not found them yet. Every hero carries a
**shallows number** on their [sheet](../characters/README.md):

```
shallows = max(0, 10 - whole weeks since recruited)
```

Their `recruited:` date is in the sheet's frontmatter as a world date; today's is at the top of
[`state.md`](../state.md). At ten weeks it reaches zero and never comes back.

**Subtract the shallows number from the DC of any roll whose failure you intend to kill them** — the same way every
other circumstance is applied, on the [DC and not the roll](checks.md#modifiers). A hero in their first week is
facing 5s where a veteran faces 15s, and it is very hard to lose them by accident.

And once, and only once:

> A hero with a shallows number above zero who would die anyway is **Down** instead — and their shallows number
> drops to **0** permanently. Write it on the sheet with the date.

That is the only free death anyone gets. It is spent automatically, it cannot be saved, and it takes the rest of
the protection with it.

New heroes are not meant to be safe — they are meant to die of something they *chose*, a few weeks in, rather than
of the first bad roll of their first scene. By ten weeks a hero should have earned the real protections: an
[item](../world/items/README.md), an ally, a reputation, a way out arranged in advance. If they have none, the
shallows were wasted on them.

## Getting out



Killing the thing is one exit and usually the worst one. The DM must keep at least one other exit visible at all
times:

- **Leave.** Fleeing is a Grace contest against the fastest pursuer. Losing costs one free press against you; it
  does not mean you are caught.
- **Talk.** Most things in this world want something. Not all of them want you.
- **Give it what it wants.** Salvage is replaceable. Heroes are not.
- **Change the ground.** Flood it, collapse it, wait for the tide. The
  [Underspire](../world/geography/regions/vaultspire.md) has drowned more enemies than any weapon.

A hero who never runs is a hero with a short entry in the Chronicle.

## Weapons and armour

They matter as *fiction*, not arithmetic. A blade against an unarmoured target is an apt answer and earns the
aptness bonus. A blade against something with no blood in it is not.

| | |
| --- | --- |
| **Armour** | Turns one Wounded result into Marked, once per fight, then it is damaged. |
| **Reach or ranged** | Lets the hero answer without standing inside the next escalation. |
| **The wrong weapon** | Not a penalty in itself — but it earns no aptness bonus either. |

## Recovery

| | |
| --- | --- |
| Marked | Clears with a night's rest and a meal. |
| Wounded | `1d6` days, or one day with someone who has a healing skill. Faster only through [magic](magic.md). |
| Down | Stabilised means Wounded, not fine. |

Nothing recovers for a hero who has not eaten or slept.

## Creatures

Statblocks carry no HP and no attack bonus. What the DM needs — what it wants, how it presses, and what genuinely
beats it — is in the [bestiary](../world/bestiary/README.md).
