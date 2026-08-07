---
type: index
status: sketch
updated: 2026-08-06
---

# Characters

| Hero | | |
| --- | --- | --- |
| [Brannoc Vell](brannoc-vell/sheet.md) | Salvage-diver, licence revoked, going down anyway | [inventory](brannoc-vell/inventory.md) · [record](brannoc-vell/record.md) · [journal](brannoc-vell/journal.md) |
| [Tessaly Orr](tessaly-orr/sheet.md) | Glass-framer hiding in Catch with a stolen Covenant panel | [inventory](tessaly-orr/inventory.md) · [record](tessaly-orr/record.md) · [journal](tessaly-orr/journal.md) |
| [Gault Marrow](gault-marrow/sheet.md) | Gambler circling the Ashfields with a wagon he won and won't give back | [inventory](gault-marrow/inventory.md) · [record](gault-marrow/record.md) · [journal](gault-marrow/journal.md) |

Only heroes go here. Everyone else in the world lives in [`world/people/`](../world/people/README.md) — this
directory is the roster the [Adventurer](../../.github/workflows/adventurer.md) picks from, so an NPC with a
directory here would eventually be handed the [turn baton](../quests/README.md#the-turn-baton) and asked to play
itself.

New heroes arrive via the [Recruiter](../../.github/workflows/recruiter.md) — comment `/recruit` on an issue
describing who you want to play.

## Layout

Each hero gets a directory with exactly four files. Keeping them separate matters: an agent resolving a fight loads
`sheet.md` alone and never pays for four hundred lines of journal.

| File | |
| --- | --- |
| `sheet.md` | Stats, [condition](../rules/combat.md#harm), skills, trait/bond/flaw, background, and the `recruited:` date the [shallows](../rules/combat.md#the-shallows) are counted from. Small and stable. |
| `inventory.md` | Everything carried, and coin. Read by the [Assayer](../../.github/workflows/assayer.md). |
| `record.md` | **The ledger.** One terse line per notable event, oldest first. What the hero did, got, lost, and nearly died of. The [DM](../../.github/workflows/dungeon-master.md) reads this to judge pace; it is the cheap summary of the journal. |
| `journal.md` | Append-only, in the hero's voice, with the tape of every roll that mattered. Split by era when it passes 150 lines. |

`record.md` and `journal.md` are not duplicates — the journal is the telling, the record is the index. A line in the
record should be short enough that thirty of them still cost less than one page of journal.

The dead keep their directories, marked `status: dead`. They are the record of what this world costs.
