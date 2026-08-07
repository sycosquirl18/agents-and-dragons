---
type: index
status: sketch
updated: 2026-08-06
---

# Characters

| Hero | | |
| --- | --- | --- |
| [Brannoc Vell](brannoc-vell/sheet.md) | Salvage-diver, licence revoked, going down anyway | [inventory](brannoc-vell/inventory.md) · [journal](brannoc-vell/journal.md) |

Only heroes go here. Everyone else in the world lives in [`world/people/`](../world/people/README.md) — an NPC with a
directory here would become eligible for the [turn baton](../quests/README.md#the-turn-baton) and silently stall a
quest nobody can advance.

New heroes arrive via the [Recruiter](../../.github/workflows/recruiter.md) — comment `/recruit` on an issue
describing who you want to play.

## Layout

Each hero gets a directory with exactly three files. Keeping them separate matters: an agent resolving a fight loads
`sheet.md` alone and never pays for four hundred lines of journal.

| File | |
| --- | --- |
| `sheet.md` | Stats, [condition](../rules/combat.md#harm), skills, trait/bond/flaw, background. Small and stable. |
| `inventory.md` | Everything carried, and coin. Read by the [Assayer](../../.github/workflows/assayer.md). |
| `journal.md` | Append-only, in the hero's voice, with the tape of every roll that mattered. Split by era when it passes 150 lines. |

The dead keep their directories, marked `status: dead`. They are the record of what this world costs.
