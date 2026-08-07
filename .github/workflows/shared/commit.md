---
post-steps:
  - name: Commit the world
    if: always()
    env:
      CODEX_PUSH_TOKEN: ${{ secrets.CODEX_PUSH_TOKEN }}
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

      # The agent writes its own commit subject; see the prompt section below.
      if [ -s .commit-msg ]; then
        subject=$(head -1 .commit-msg)
        body=$(tail -n +2 .commit-msg)
      else
        subject="${GH_AW_WORKFLOW_NAME:-Agent}: run ${GITHUB_RUN_NUMBER}"
        body=""
      fi

      trailers=$(printf 'Agent: %s\nRun: %s/%s/actions/runs/%s' \
        "${GH_AW_WORKFLOW_NAME:-unknown}" "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID")

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
