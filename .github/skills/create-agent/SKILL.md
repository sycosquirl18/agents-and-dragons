---
name: create-agent
description: Create a new AI agent for the Agents & Dragons world simulation. Use when the user wants to add an agent, add a new kind of automated participant to the world (cartographer, rumour mill, rival party, necrologist, herald, etc.), or asks how to make agents do a new job in this repository. Scaffolds the agentic workflow markdown, wires up triggers, dice, safe-outputs and dispatch, compiles it with gh aw, and validates it.
---

# Creating an Agents & Dragons agent

An agent is one markdown file in `.github/workflows/`: YAML frontmatter (when it runs, what it may touch) plus a
prompt body (its job). `gh aw compile` turns it into a `.lock.yml` that GitHub Actions runs.

Read [`AGENTS.md`](../../../AGENTS.md) and [`docs/agent-authoring.md`](../../../docs/agent-authoring.md) before
starting. Read one existing agent as a model — [`loremaster.md`](../../workflows/loremaster.md) for a maintenance
agent, [`adventurer.md`](../../workflows/adventurer.md) for one that rolls dice and role-plays.

## Procedure

### 1. Check it doesn't already exist

Look at the roster in the repo README. If the request overlaps an existing agent, **extend that agent instead** and
say so. Two agents with overlapping remits produce contradictory PRs, duplicate lore, and fight over the same files.

### 2. Pin down the job

Before writing anything, be able to answer all five. Ask the user about any you cannot infer — do not guess at 3 or 5.

1. **What is its one job?** One sentence. If it needs "and", it is two agents.
2. **What does it read?** Specific paths, in order. Always starts with `codex/state.md`.
3. **What does it write?** Specific paths, or issues, or both.
4. **When does it run?** Cron, dispatch, slash command, or in response to a label.
5. **Does it roll dice?** If it decides any uncertain outcome, yes.

### 3. Write the file

`.github/workflows/<kebab-name>.md`. Start from the template in
[`docs/agent-authoring.md`](../../../docs/agent-authoring.md) and adjust:

- `imports: [shared/codex.md]` always; add `shared/dice.md` if it rolls.
- `permissions:` stays read-only. Writes go through `safe-outputs`. Never add `contents: write`.
- **Never add `copilot-requests: write`.** It makes gh-aw ignore `COPILOT_GITHUB_TOKEN` and bill inference to the
  repository owner instead of the intended account. See [operations.md](../../../docs/operations.md#auth).
- `safe-outputs.create-pull-request.labels` **must include `codex-update`**, or auto-merge will not land it.
- `concurrency.group` unique per agent, so two runs never fight.
- `title-prefix` short and in the agent's voice: `[lore] `, `[turn] `, `[economy] `.

### 4. Write the prompt body

This is the work. The frontmatter is boilerplate; the prompt is the agent.

House style, derived from the existing roster:

- **Address it as a person with a role**, not as a spec. "You are the world's immune system" produces better output
  than "This workflow validates consistency."
- **Name the files it should read, in order.** The biggest quality and cost lever there is. Vague reading
  instructions produce agents that grep the whole Codex and do worse work for more money.
- **Include a "stay in your lane" section.** Every existing agent has one. Say explicitly what it must not touch —
  usually another agent's output.
- **Give it a rule for choosing**, including the tempting-but-wrong choice. *"Pick the gap that has come up most
  often, not the one that is most interesting to design."*
- **End with permission to do nothing.** Without it, agents manufacture changes to look useful and fill the Codex
  with noise.
- **Tell it what to roll for** if it imports dice. An agent that picks outcomes drifts toward the most dramatic one
  every time.
- Keep it under ~80 lines. It is loaded on every run.

### 5. Wire it up

If the Dungeon Master should be able to dispatch it, add the filename to `dispatch-workflow.workflows` in
[`dungeon-master.md`](../../workflows/dungeon-master.md), and add a row to its dispatch table describing when to use
it and what inputs to pass. **Compilation fails if the workflow is listed but missing, and silently never runs if it
is missing from the list.**

Add a row to the roster table in the repo README.

### 6. Compile and verify

```bash
gh aw compile <name>
node scripts/check-codex.mjs
```

Both must pass. Commit **both** `<name>.md` and `<name>.lock.yml` — the lock file is what actually runs, and CI fails
if it is stale.

Offer the user a dry run:

```bash
gh aw trials <name>      # real agent, no writes
gh workflow run "<Name>" # for real
gh aw logs <name>        # what it did and what it cost
```

## New capabilities

If the agent needs a tool that does not exist, add an `mcp-scripts` entry to a file under
`.github/workflows/shared/` — plain JavaScript, shell, or Python in frontmatter, no server required. See
[`shared/dice.md`](../../workflows/shared/dice.md) for the pattern. Put genuinely shared tools in their own
`shared/<tool>.md` so other agents can import them.

If the agent needs a new *kind* of Codex file, add its `type` to the `TYPES` list in
[`scripts/check-codex.mjs`](../../../scripts/check-codex.mjs) and document it in `AGENTS.md` §4.

## Anti-patterns

| Don't | Why |
| --- | --- |
| `permissions: contents: write` | Breaks the security model; gh-aw rejects it in strict mode |
| `permissions: copilot-requests: write` | Silently redirects inference billing to the repo owner |
| Omitting the `codex-update` label | The PR never merges and quietly rots |
| "Review the entire world and improve it" | Reads everything, costs a fortune, does nothing well |
| An agent that both writes lore and audits it | It will always approve of itself |
| Letting the agent decide outcomes | Everything drifts to maximum drama; use `roll_dice` |
| Editing another agent's output directly | Open an issue instead — see AGENTS.md §7 |
| Cron more often than hourly | Merge conflicts and spend, with no more story |
