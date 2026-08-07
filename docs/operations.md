# Operations

## First-time setup

```bash
gh extension install github/gh-aw
gh aw compile
```

### Auth

Agents use the `copilot` engine, authenticated by a **fine-grained PAT in `COPILOT_GITHUB_TOKEN`**.

Inference is billed to **whoever owns that PAT**, which does not have to be whoever owns this repository. That split
is deliberate here: the repo lives on one account, and inference is billed to another account that has an active
Copilot subscription.

1. [**Create a fine-grained PAT**](https://github.com/settings/personal-access-tokens/new?name=COPILOT_GITHUB_TOKEN&description=Agents+and+Dragons&user_copilot_requests=read)
   while signed in as **the account you want billed**.
   - **Resource owner:** that user account (not an organisation).
   - **Account permissions → Copilot Requests: Read.** Nothing else is needed — this token never touches the repo.
2. Add it to *this* repository's secrets:
   ```bash
   gh aw secrets set COPILOT_GITHUB_TOKEN --value "<the PAT>"
   ```

> **Do not add `copilot-requests: write` to a workflow's `permissions:`.** It looks harmless and it is the documented
> default elsewhere, but it makes gh-aw use the Actions token and **ignore `COPILOT_GITHUB_TOKEN` entirely** — which
> silently moves billing to the repository owner. No agent in this repo sets it, and new ones should not either.

The token must be a fine-grained PAT. gh-aw rejects `gho_*` OAuth tokens (what `gh auth token` returns) at activation.

### The push token

Agents commit to `main` themselves, which needs a **second** fine-grained PAT in `CODEX_PUSH_TOKEN`. This one is
about repo write access and has nothing to do with billing, so it can belong to whoever owns the repository.

1. [**Create a fine-grained PAT**](https://github.com/settings/personal-access-tokens/new?name=CODEX_PUSH_TOKEN&description=Agents+and+Dragons+world+pushes)
   with **Repository access → only `agents-and-dragons`**, and **Repository permissions → Contents: Read and write**.
   Nothing else.
2. Add it:
   ```bash
   gh aw secrets set CODEX_PUSH_TOKEN --value "<the PAT>"
   ```

Why a PAT rather than the built-in `GITHUB_TOKEN`: gh-aw refuses to grant the agent job `contents: write` on
principle, and a PAT is scoped independently of job permissions. It also fixes a quieter problem — **GitHub does not
raise workflow events for pushes made with `GITHUB_TOKEN`**, so a world pushed by the Actions token would never
trigger [`codex-check.yml`](../.github/workflows/codex-check.yml). Pushes made with a PAT do.

If the secret is missing, agents fail loudly on their final step rather than doing a run's work and dropping it.

Check what is configured:

```bash
gh aw secrets bootstrap --non-interactive
```

## Starting the world

```bash
gh workflow run "Dungeon Master"
```

Everything else follows: the DM dispatches workers, each worker pushes its own commit to `main` as it finishes.

## Cadence

Listed in **Pacific**, ordered by the clock you read. `gh aw compile` scatters fuzzy schedules so agents don't all
wake at once; a few are pinned to keep writers of the same files apart. Treat every time as approximate — see
[below](#do-not-rely-on-the-spacing).

| Pacific | UTC (cron) | Agent | Every |
| --- | --- | --- | --- |
| 02:36 | 09:36 | Bestiary Keeper | day |
| 04:20 | 11:20 | Magician | day |
| 05:47, 11:47, 17:47, 23:47 | 00:47, 06:47, 12:47, 18:47 | Dungeon Master | 6h |
| 07:40 | 14:40 | Recruiter | day |
| 10:51 | 17:51 | Armorer | day |
| 15:06 | 22:06 | Chronicler | **Sat** |
| 16:49 | 23:49 | World Designer | day |
| 19:20 | 02:20 | Custodian | day |
| 20:39 | 03:39 | Assayer | **Tue** |
| 21:07 | 04:07 | Rules Smith | **Sun** |
| 22:08 | 05:08 | Folk Caller | day |
| 23:13 | 06:13 | Arbiter | **Mon, Fri** |
| 23:17 | 06:17 | Activity Log | day (also on every push to `codex/`) |
| — | — | Adventurer | on dispatch only |

Cron is fixed in **UTC**, so the Pacific column shifts by an hour at each daylight-saving boundary, and the *day*
in the "Every" column is the Pacific one. That is not a rounding detail: an agent scheduled `* * 3` (Wednesday UTC)
runs on **Tuesday** evening where you are. Recompute after changing a schedule rather than converting in your head.

That is roughly 4 DM beats, 4 hero exchanges and 3 new pieces of world a day.

**When adding an agent, check the minute it landed on.** Fuzzy schedules are name-hashed, not collision-free — two
agents have already been assigned the identical minute in this repo:

```bash
grep -h "cron:" .github/workflows/*.lock.yml | sort -t' ' -k3
```

### Do not rely on the spacing

The timetable above is a *best effort*, not a guarantee. GitHub runs scheduled workflows on a queue, and under load
it delivers them late or not at all. Measured in this repository: World Designer's `49 23` cron (16:49 Pacific)
produced a run at **18:53 — two hours and four minutes late**. Gaps of thirty minutes on paper mean nothing at that
scale.

So spacing is a courtesy, not a safety mechanism. What actually keeps concurrent agents from corrupting the world is:

| Mechanism | Covers |
| --- | --- |
| Per-agent `concurrency.group` | Two runs of the *same* agent overlapping |
| The rebase-and-retry loop in [`shared/commit.md`](../.github/workflows/shared/commit.md) | Two *different* agents pushing to `main` in the same window |
| The [turn baton](../codex/quests/README.md#the-turn-baton) | The DM and an Adventurer both writing the same quest |
| [Custodian](../.github/workflows/custodian.md) and [Arbiter](../.github/workflows/arbiter.md) | Conflicts that merged cleanly but do not *mean* anything consistent |

The last row is the one to keep in mind: a clean `git rebase` proves the text merged, not that the world still makes
sense. Two agents can each write something reasonable and produce a contradiction between them, and no amount of
scheduling prevents it.

A corollary worth planning for: **a daily agent is not guaranteed to run daily.** Nothing should depend on having
run yesterday.

Slower is usually better. A world that advances four times a day accumulates more interesting history than one
thrashing every fifteen minutes, and it costs a fraction as much.

## Watching it

Start at **[`log/`](../log/README.md)** — health, recent failures, and one file per week of everything that changed.
It is regenerated by [`activity-log.yml`](../.github/workflows/activity-log.yml) on every push to `codex/` and daily,
from two sources: the commit history (what changed) and the Actions API (what *ran*). Both are needed — a run that
fails commits nothing, so a git-only log is one in which nothing ever goes wrong.

The Health table lists every workflow that *should* run, so an agent that has never run once is visible as such.
That is the failure the Actions tab hides: a workflow with a broken trigger looks identical to one that simply has
not been scheduled yet.

```bash
node scripts/activity.mjs            # this week, without leaving the terminal
gh aw status                  # what is enabled, and when it last ran
gh aw logs                    # recent runs, durations, token counts
gh aw logs dungeon-master     # one agent
gh aw audit                   # cost breakdown
git log --oneline -- codex/          # the history of the world
gh issue list --label lore-gap       # contradictions awaiting judgement
```

## Cost control

Every agent ships with `timeout-minutes`, `max-turns`, and gh-aw's default `max-ai-credits` budget. To tighten:

```yaml
max-ai-credits: 500        # hard per-run budget
max-daily-ai-credits: 3000 # rolling 24h ceiling
timeout-minutes: 15
max-turns: 40
```

The dominant cost driver is **how much of the Codex each run reads**, not how much it writes. If spend climbs, the
fix is almost always to make a prompt more specific about which files to open.

## Pausing

```bash
gh aw disable                  # stop everything
gh aw disable dungeon-master   # stop one
gh aw enable
```

For a fixed-term experiment, add `stop-after: "+72h"` to a workflow's `on:` block and it disables itself.

## When something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Every agent fails at inference | `COPILOT_GITHUB_TOKEN` missing, expired, or an OAuth (`gho_*`) token | Recreate as a fine-grained PAT — see [Auth](#auth) |
| Inference billed to the wrong account | A workflow has `copilot-requests: write` | Remove it; that permission overrides the PAT |
| Agents run but the world never changes | `CODEX_PUSH_TOKEN` missing or lacking Contents: write | Check the final step's log — see [The push token](#the-push-token) |
| `Could not rebase onto main` | Two agents edited the same lines | Nothing to do; that run's work is dropped and redone next cycle |
| `Changes outside codex/ were discarded` | An agent tried to edit its own machinery | Working as intended. If the change was wanted, make it yourself |
| `codex-check` fails | Broken link, orphan, or oversized file | `node scripts/check-codex.mjs` locally |
| Lock files stale | Frontmatter edited without recompiling | `gh aw compile` and commit |
| Jobs sit `queued` with no runner, or a push starts nothing | Usually not your repo | Check [githubstatus.com](https://www.githubstatus.com) — an Actions capacity incident delays both runner assignment and webhook delivery. Wait it out; queued runs pick up on recovery |
| Agent produced nothing | Often correct | Check `gh aw logs <name>` before assuming a bug |
| Lore contradictions | Normal at this scale | Custodian files `lore-gap`; Arbiter rules on them; you adjudicate the rest |
| A quest stops advancing | Its `turn:` baton was never passed | `grep -rn "^turn:" codex/quests/`; set it and note why |
| `spark` errors with "could not find data/words" | The word lists are missing from the checkout | Confirm `data/words/*.txt` is committed |

## Rolling back the world

The world is git, so a bad turn is a revert:

```bash
git revert <sha>            # undo one agent's change
git log --oneline codex/state.md   # find where things went wrong
```

Prefer moving forward in-world — a retcon breaks the append-only Chronicle. Revert for genuinely broken output, not
for disliked outcomes. Bad rolls are the game working.

## Growing the roster

New agents: [`docs/agent-authoring.md`](agent-authoring.md), or ask Copilot CLI to use the
[`create-agent`](../.github/skills/create-agent/SKILL.md) skill.

Ideas the scaffold is built for: a Cartographer that renders ASCII maps, a Rumour Mill that seeds misinformation, a
Necrologist that writes obituaries for dead heroes, a Rival Party that plays antagonists on the same board, a Herald
that posts weekly digests as GitHub Discussions.
