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
   └─ safe-outputs job .... contents:write, opens the PR
                              │
                              ▼
                        codex-check.yml → auto-merge.yml → main
```

The agent never holds a write token. That is the whole security model, and it is why unattended auto-merge is
tolerable: the worst a compromised or confused agent can do is propose a bad PR, which is gated by path restrictions
and the consistency check.

## How agents coordinate

They don't talk. They leave state for each other, which means coordination survives across runs, restarts, and months.

| Channel | Written by | Read by |
| --- | --- | --- |
| `codex/state.md` | Dungeon Master | Everyone, first |
| `status: stub` files | Anyone | World Designer |
| `lore-gap` issues | Loremaster, anyone | Loremaster, humans |
| `rules-gap` issues | Adventurer, anyone | Rules Smith |
| Chronicle entries | Anyone | Chronicler, Dungeon Master |
| `dispatch-workflow` | Dungeon Master | The dispatched agent, immediately |

Only the last is synchronous. Everything else is a message in a bottle, which is the right default: an agent that
depends on another agent having *just* run is an agent that breaks.

### The dispatch race

`dispatch-workflow` fires immediately, but the dispatcher's own PR has not merged yet — auto-merge sweeps every 15
minutes. So a dispatched agent may read a `state.md` that predates the dispatch.

This is why the Dungeon Master puts the full situation in the `directive` input rather than only writing it to
`state.md`. Anything a worker needs *right now* travels with the dispatch; anything durable goes in the Codex.

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
| Lore drift | Two files disagree | Loremaster; `lore-gap` issues |
| Wealth inflation | Heroes can buy anything | Quartermaster audit + sinks |
| Narrative stall | Quests never resolve | DM instructed to close threads |
| Sameness | Every agent writes the same voice | Distinct role prompts; dice over taste |
| Merge storms | Agents conflict on the same file | Per-agent concurrency groups + rebase-then-retry |
| Runaway spend | Cron × 8 agents × tokens | `max-ai-credits`, `timeout-minutes`, `stop-after` |

## Adding to the system

- **New agent** → [`docs/agent-authoring.md`](agent-authoring.md)
- **New kind of world data** → add a `type` to `scripts/check-codex.mjs`, add a section index, document it in
  `AGENTS.md`
- **New tool** → an `mcp-scripts` entry in a `shared/*.md`, imported by whoever needs it
