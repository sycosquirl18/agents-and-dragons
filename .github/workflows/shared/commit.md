---
post-steps:
  - name: Commit the world
    if: always()
    env:
      CODEX_PUSH_TOKEN: ${{ secrets.CODEX_PUSH_TOKEN }}
      # `github.workflow` is the workflow's own `name:`. GH_AW_WORKFLOW_NAME is not set in post-steps, which is
      # why every commit before this said `Agent: unknown`.
      AGENT_NAME: ${{ github.workflow }}
    run: |
      set -euo pipefail

      if [ -z "${CODEX_PUSH_TOKEN:-}" ]; then
        echo "::error title=CODEX_PUSH_TOKEN is not set::Agents cannot write to the world. See docs/operations.md."
        exit 1
      fi

      git config user.name "github-actions[bot]"
      git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      # Only the world is committable. AGENTS.md says agents never write outside codex/; this is where that
      # stops being a request. Anything else the run touched is reported and dropped.
      stray=$(git status --porcelain -- . ':!codex/' || true)
      if [ -n "$stray" ]; then
        echo "::warning title=Changes outside codex/ were discarded::$(echo "$stray" | tr '\n' ' ')"
      fi

      git add -A -- codex/
      if git diff --cached --quiet; then
        echo "The Codex is unchanged. Nothing to commit."
        echo "No changes to the Codex." >> "$GITHUB_STEP_SUMMARY"
        exit 0
      fi

      # A run may not leave the Codex more broken than it found it.
      #
      # Deliberately a *relative* gate, not "the Codex must be clean". An absolute gate deadlocks the world: the
      # moment anything is broken, every agent's push is refused — including the Custodian's, whose entire job is
      # to fix it — and nothing can ever recover. Comparing against HEAD lets repairs through and stops damage.
      if [ -f scripts/check-codex.mjs ]; then
        after=$(node scripts/check-codex.mjs 2>&1 | grep -c '^  ERROR' || true)
        before=0
        pristine="${RUNNER_TEMP:-/tmp}/codex-head"
        rm -rf "$pristine"
        if git worktree add -q --detach "$pristine" HEAD 2>/dev/null; then
          before=$(cd "$pristine" && node scripts/check-codex.mjs 2>&1 | grep -c '^  ERROR' || true)
          git worktree remove --force "$pristine" >/dev/null 2>&1 || true
        fi
        if [ "$after" -gt "$before" ]; then
          {
            echo "### Refused: this run broke the Codex"
            echo ""
            echo "Errors went from **$before** to **$after**. Nothing was pushed."
            echo ""
            echo '```'
            node scripts/check-codex.mjs 2>&1 | grep '^  ERROR' || true
            echo '```'
          } >> "$GITHUB_STEP_SUMMARY"
          echo "::error title=Refusing to push a broken Codex::Errors rose from $before to $after. This run's work is discarded and will be redone next cycle."
          exit 1
        fi
      fi

      # The agent writes its own commit subject; see the prompt section below.
      if [ -s .commit-msg ]; then
        subject=$(head -1 .commit-msg)
        body=$(tail -n +2 .commit-msg)
      else
        subject="${GH_AW_WORKFLOW_NAME:-Agent}: run ${GITHUB_RUN_NUMBER}"
        body=""
      fi

      trailers=$(printf 'Agent: %s\nRun: %s/%s/actions/runs/%s' \
        "${AGENT_NAME:-unknown}" "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID")

      git commit -q -m "$subject" -m "$body" -m "$trailers"

      git remote set-url origin \
        "https://x-access-token:${CODEX_PUSH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

      # Several agents can be awake at once, so losing the race to main is normal, not an error.
      for attempt in 1 2 3 4 5; do
        if git push -q origin HEAD:main 2>/dev/null; then
          echo "Pushed to main: $subject"
          {
            echo "### Committed to \`main\`"
            echo ""
            echo "**$subject**"
            echo ""
            echo '```'
            git --no-pager show --stat --format= HEAD
            echo '```'
          } >> "$GITHUB_STEP_SUMMARY"
          exit 0
        fi
        echo "push rejected (attempt $attempt) — rebasing onto main"
        git fetch -q origin main
        if ! git rebase -q origin/main; then
          git rebase --abort || true
          echo "::error title=Could not rebase onto main::Another agent changed the same lines. This run's work is lost; it will be redone next cycle."
          exit 1
        fi
        sleep $(( (RANDOM % 8) + 2 ))
      done

      echo "::error title=Could not push to main::Five attempts, all rejected."
      exit 1
---

## Committing your work

Your edits to `codex/` go **straight to `main`** when you finish. There is no pull request, no review, and no undo.
Write the world as if it is already true, because a minute after you stop, it is.

Only `codex/` is committed. Anything you write elsewhere is discarded — if a change is genuinely needed outside the
Codex, open an issue instead.

Before you finish, write your commit message to `.commit-msg` in the repo root: one short subject line in the voice
of your role, then a blank line, then a couple of lines on what changed and why. This becomes the world's history
**and the [log](../../../log/README.md)** — the one place a human can see what every agent has been doing —
so write it for someone reading the log in a year, not for a diff.

```
The Concord closes the Kiln, and the seal is cut from inside

Three crews lost. Recorded the closure, the cut seal, and the warm water.
Left the question of who cut it open — nobody in the fiction knows yet.
```

If you changed nothing, do not write `.commit-msg`. An empty run is a valid result.
