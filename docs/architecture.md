# Architecture

## The one-sentence version

The world is markdown in `codex/`; agents are markdown in `.github/workflows/`; nothing runs between runs.

## Why there is no service

A persistent simulation server would need hosting, a database, a schema, migrations, and a deploy story — and it would
still need agents to generate content. Making the *repository* the runtime removes all of that:

| Need | How the repo covers it |
| --- | --- |
| Storage | Markdown files |
| Schema | Frontmatter + [`scripts/check-codex.mjs`](../scripts/check-codex.mjs) |
| Transactions | Pull requests |
| History / audit | Git |
| Rollback | `git revert` |
| Scheduler | GitHub Actions cron |
| Access control | Branch protection, labels, workflow permissions |
| Observability | Actions logs, `gh aw logs` |

The cost is latency — the world moves in discrete jumps, not continuously. For a play-by-post game that is the
correct trade.

## Anatomy of a run

```
trigger (cron | dispatch | slash command | another agent)
   │
   ├─ activation job ...... checks the trigger is legitimate, applies role/bot gating
   │
   ├─ agent job ........... READ-ONLY token, sandboxed container, network firewall
   │                        reads codex/, calls roll_dice, writes files in its workspace
   │
   ├─ threat detection .... scans the agent's output before anything is applied
   │
   └─ post-step ........... outside the sandbox, deterministic, not agent-authored
                            commits codex/ and pushes to main
```

The agent never holds a write token — the push happens in a fixed shell script the agent cannot read, edit, or reach,
using a PAT that is never exposed inside the sandbox. Two limits keep an unattended direct push tolerable:

- **Path restriction.** The post-step stages `codex/` and nothing else. Edits to workflows, scripts, or `AGENTS.md`
  are reported as a warning and discarded, so an agent cannot rewrite its own machinery or grant itself more.
- **Reversibility.** Every push is one commit with the run URL in its trailer. The blast radius of a bad run is
  `git revert`.

## How agents coordinate

They don't talk. They leave state for each other, which means coordination survives across runs, restarts, and months.

| Channel | Written by | Read by |
| --- | --- | --- |
| `codex/state.md` | Dungeon Master | Everyone, first |
| `codex/quests/TURN.txt` | Dungeon Master, Adventurer | Both, before writing |
| `status: stub` files | Anyone | World Designer |
| `lore-gap` issues | Custodian, anyone | Arbiter, humans |
| `rules-gap` issues | Adventurer, anyone | Rules Smith |
| Chronicle entries | Anyone | Chronicler, Dungeon Master |
| `dispatch-workflow` | Dungeon Master | The dispatched agent, immediately |

Only the last is synchronous. Everything else is a message in a bottle, which is the right default: an agent that
depends on another agent having *just* run is an agent that breaks.

### The turn baton

The Dungeon Master and the Adventurer both write quest files, and they alternate.
[`codex/quests/TURN.txt`](../codex/quests/TURN.txt) says whose move it is, one entry per open quest. Whoever holds
it acts and passes it in the same change; whoever does not holds off entirely. See
[the quest index](../codex/quests/README.md#the-turn-baton).

This is what makes a quest a *conversation* rather than two agents narrating over each other. It also bounds the
work: the DM poses one beat, the hero answers with one exchange, and neither can run ahead of the other.

The baton lived in each quest's frontmatter until it was eaten once too often. Coordination state cannot share a
file with prose that agents rewrite wholesale — sooner or later a run rewriting the body takes the header with it,
and the damage is invisible because the file still reads fine. A file that holds *only* the baton is one an agent
has no reason to touch except to pass it. That is the general principle here, and it applies to any flag the world
depends on: **give it its own file.**

Its contents are deliberately unvalidated prose. An LLM reads them, and a schema would only be one more thing for
an agent to get subtly wrong; if we ever need structure for tooling, the right answer is a tool the agent calls,
not a format it must hand-write. The [checker](../scripts/check-codex.mjs) therefore checks one thing only, by
substring: that every active quest appears on the board at all, because a quest nobody holds is a quest that
silently stops.

### Dispatch, and why only the DM has it

`dispatch-workflow` is the one place an agent starts another agent. It is a `safe-outputs` entry naming an
allow-list of workflows and a per-run cap:

```yaml
safe-outputs:
  dispatch-workflow:
    workflows: [adventurer, world-designer, assayer, rules-smith, armorer, magician, arbiter]
    max: 3
```

Any agent *can* be given it. Only the Dungeon Master has it, deliberately: **gh-aw has no recursion or depth guard.**
If the Adventurer could dispatch the DM and the DM dispatches the Adventurer, the pair would ping-pong until the
credit ceiling stopped them. A star topology with one hub cannot loop.

It is a spawn, not a call. The dispatch triggers an independent workflow run with its own checkout and context; the
dispatcher does not block, does not get a return value, and has usually finished before the worker starts.

### The dispatch race

`dispatch-workflow` fires immediately, and the dispatcher's own push lands seconds later — but the order is not
guaranteed. A dispatched agent may read a `state.md` that predates the dispatch.

This is why the Dungeon Master puts the full situation in the `directive` input rather than only writing it to
`state.md`. Anything a worker needs *right now* travels with the dispatch; anything durable goes in the Codex.

### Losing the race to main

Several agents can be awake at once, so a push can be rejected as non-fast-forward. The post-step retries up to five
times, rebasing onto `main` between attempts, which resolves the common case: two agents touching different files.

If both edited the same lines, the rebase conflicts and the run fails with its work dropped. That is deliberate —
there is no correct automatic answer to "which agent's version of this fact is true", and the next scheduled run
starts from the world as it actually is.

This retry loop, not the timetable, is what makes concurrent agents safe. Scheduled runs are delivered late by
[hours](operations.md#do-not-rely-on-the-spacing) when GitHub is busy, so no two agents can be assumed to be apart
just because their crons are. Note also what a clean rebase does *not* prove: the text merged, but two agents can
still have written a contradiction into different files. That is the
[Arbiter](../.github/workflows/arbiter.md)'s job, not git's.

## Context economy

The binding constraint on this project is not compute, it is the agent's context window. Every convention in
[`AGENTS.md`](../AGENTS.md) exists to keep a run's working set small:

- **Hub-and-spoke** means an agent reads ~5 files instead of ~200.
- **The Split Rule** caps any single read at 150 lines.
- **Deduplication** means a fact is loaded once, not five times.
- **Separate `sheet.md` / `inventory.md` / `journal.md`** means a combat resolver never loads a year of narrative.

These get *more* important as the world grows, not less. A world of 5,000 files works fine if the hierarchy holds;
it becomes unusable the moment agents start needing to grep everything.

## Failure modes to watch

| Failure | Symptom | Mitigation |
| --- | --- | --- |
| Context bloat | Runs get slow and expensive; agents miss things | Split Rule, enforced by the checker |
| Structural rot | Dead links, orphans, stale indexes | Custodian, nightly |
| Lore drift | Two files disagree | Custodian files `lore-gap`; Arbiter rules |
| Tonal drift | Something that doesn't belong to this world | Arbiter, twice weekly |
| Scale drift | A reward makes the price list meaningless | Assayer keeps every number readable against a day's wage |
| Narrative stall | Quests never resolve | DM instructed to close threads |
| Deadlocked quest | Baton never passed; nobody may act | Checker warns if a quest is off the board; Custodian resets a stuck baton |
| Sameness | Every agent writes the same voice | Distinct role prompts; dice over taste; `spark` for creative agents |
| Merge storms | Agents conflict on the same file | Per-agent concurrency groups + rebase-then-retry |
| Dispatch loops | Two agents dispatch each other forever | Only the DM dispatches; gh-aw has no depth guard |
| Runaway spend | Cron × 11 agents × tokens | `max-ai-credits`, `timeout-minutes`, `stop-after` |

## Adding to the system

- **New agent** → [`docs/agent-authoring.md`](agent-authoring.md)
- **New kind of world data** → add a `type` to `scripts/check-codex.mjs`, add a section index, document it in
  `AGENTS.md`
- **New tool** → an `mcp-scripts` entry in a `shared/*.md`, imported by whoever needs it
