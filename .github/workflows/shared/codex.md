---
tools:
  edit:
  github:
    toolsets: [default]
  bash:
    - "ls"
    - "cat"
    - "head"
    - "tail"
    - "wc"
    - "grep"
    - "find"
    - "sort"
    - "uniq"
    - "cut"
    - "date"
    - "echo"
    - "mkdir"
    - "node scripts/check-codex.mjs"
  timeout: 120
---

## Working in the Codex

The rules of this world are in [`AGENTS.md`](../../../AGENTS.md) at the repo root — the contract, the file format, the
Split Rule, stub protocol, canon discipline. Follow it. This section is only the operating procedure.

### Orient first, in this order

1. `cat codex/state.md` — the world clock and what is currently happening. **Always.**
2. The one or two `README.md` indexes covering your task.
3. Only the leaf files you actually need.

Do not `find` the whole tree and read everything. A well-scoped run opens fewer than ten files.

### Generated files — read them, never write them

Two things in the repo are assembled from other files. Editing them by hand is wasted work: the next render
overwrites it, and meanwhile you have taken a lock on a file every other agent is also holding.

| File | Generated from | Change it by |
| --- | --- | --- |
| The party roster in `codex/state.md`, between `<!-- party:begin -->` and `<!-- party:end -->` | the `where:`, `where_link:`, `doing:` and `quest:` frontmatter on each `codex/characters/*/sheet.md` | editing that hero's sheet |
| `log/` | the commit history and the Actions API | committing, as you already do |

The rest of `codex/state.md` is ordinary prose and belongs to the [Dungeon Master](../dungeon-master.md).

### Useful sweeps

```bash
grep -rl "status: stub" codex/          # unclaimed work
grep -c "" codex/path/to/file.md        # line count — split at 150
find codex -name "*.md" -newermt "-7 days"   # what changed lately
```

### Before you finish

Run the checker — it catches most of what follows, in a second, for free:

```bash
node scripts/check-codex.mjs
```

Then confirm the things it cannot check:

- [ ] Every file you created is linked from its parent index, with a one-line gloss.
- [ ] Nothing you wrote restates a fact that already lives elsewhere — you linked instead.
- [ ] Nothing you wrote contradicts something already in the Codex.
- [ ] `updated:` is today's date on everything you touched, and `status:` still reflects reality.

If you changed nothing, that is a fine outcome — say why and stop. Do not invent work.
