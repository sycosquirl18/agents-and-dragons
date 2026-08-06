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

Check what is configured:

```bash
gh aw secrets bootstrap --non-interactive
```

### Repo settings

Actions must be allowed to open pull requests, or every safe-output job fails:

**Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests".**

## Starting the world

```bash
gh workflow run "Dungeon Master"
```

Everything else follows: the DM dispatches workers, workers open PRs,
[`auto-merge.yml`](../.github/workflows/auto-merge.yml) lands them within 15 minutes.

## Cadence

| Agent | Schedule |
| --- | --- |
| Dungeon Master | every 6h |
| World Designer | daily + on dispatch |
| Loremaster | daily |
| Chronicler, Quartermaster, Rules Smith | weekly |
| Adventurer | on dispatch only |
| Recruiter | on `/recruit` |

Schedules are *fuzzy* — `gh aw compile` scatters them so eight agents don't all wake at midnight. Roughly 4 DM turns
and a dozen worker runs a day.

Slower is usually better. A world that advances four times a day accumulates more interesting history than one
thrashing every fifteen minutes, and it costs a fraction as much.

## Watching it

```bash
gh aw status                  # what is enabled, and when it last ran
gh aw logs                    # recent runs, durations, token counts
gh aw logs dungeon-master     # one agent
gh aw audit                   # cost breakdown
gh pr list --label codex-update      # world changes in flight
gh issue list --label lore-gap       # contradictions awaiting judgement
git log --oneline -- codex/          # the history of the world
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
| PRs pile up unmerged | Actions cannot create PRs, or checks failing | Check repo setting above; `gh pr checks <n>` |
| `needs-rebase` labels | Two agents edited the same file | `gh pr update-branch`, or close the stale one |
| `needs-review` labels | PR touched files outside `codex/` | Review by hand — this is working as intended |
| `codex-check` fails | Broken link, orphan, or oversized file | `node scripts/check-codex.mjs` locally |
| Lock files stale | Frontmatter edited without recompiling | `gh aw compile` and commit |
| Jobs sit `queued` with no runner, or a push starts nothing | Usually not your repo | Check [githubstatus.com](https://www.githubstatus.com) — an Actions capacity incident delays both runner assignment and webhook delivery. Wait it out; queued runs pick up on recovery |
| Agent produced nothing | Often correct | Check `gh aw logs <name>` before assuming a bug |
| Lore contradictions | Normal at this scale | Loremaster files `lore-gap`; you adjudicate |

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
