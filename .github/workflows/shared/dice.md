---
mcp-scripts:
  roll_dice:
    description: >-
      Roll dice and get an honest, uniformly random result. Use this for EVERY uncertain outcome — attacks, saves,
      skill checks, damage, loot, weather, whether the rumour is true. Never invent a number you could have rolled for.
    inputs:
      notation:
        description: "Dice expression, e.g. '1d20+4', '2d6', '4d6+1d4-1'. Defaults to 1d20."
        type: string
        required: true
      mode:
        description: "'normal', 'advantage' (roll twice, keep higher) or 'disadvantage' (keep lower)."
        type: string
        default: "normal"
        enum: ["normal", "advantage", "disadvantage"]
      reason:
        description: "What is being resolved, e.g. 'Brannoc forces the vault door'. Echoed back for your journal entry."
        type: string
    script: |
      const MAX_DICE = 100, MAX_SIDES = 1000;

      // Rejection sampling over crypto bytes -> genuinely uniform in [0, n).
      const rand = (n) => {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / n) * n;
        let v;
        do { globalThis.crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
        return v % n;
      };

      const spec = String(notation || "1d20").toLowerCase().replace(/\s+/g, "");
      const terms = spec.match(/[+-]?[^+-]+/g);
      if (!terms) throw new Error(`Unparseable dice notation: ${notation}`);

      const parsed = terms.map((raw) => {
        const sign = raw.startsWith("-") ? -1 : 1;
        const body = raw.replace(/^[+-]/, "");
        const dice = body.match(/^(\d*)d(\d+)$/);
        if (dice) {
          const count = dice[1] === "" ? 1 : parseInt(dice[1], 10);
          const sides = parseInt(dice[2], 10);
          if (count < 1 || count > MAX_DICE) throw new Error(`Dice count out of range in '${raw}' (1-${MAX_DICE})`);
          if (sides < 2 || sides > MAX_SIDES) throw new Error(`Die size out of range in '${raw}' (2-${MAX_SIDES})`);
          return { kind: "dice", sign, count, sides };
        }
        if (/^\d+$/.test(body)) return { kind: "flat", sign, value: parseInt(body, 10) };
        throw new Error(`Unparseable term '${raw}' in notation '${notation}'`);
      });

      const evaluate = () => {
        const dice = [];
        let total = 0, modifier = 0;
        for (const t of parsed) {
          if (t.kind === "flat") { modifier += t.sign * t.value; total += t.sign * t.value; continue; }
          const values = Array.from({ length: t.count }, () => rand(t.sides) + 1);
          dice.push({ die: `${t.count}d${t.sides}`, sides: t.sides, values, sign: t.sign });
          total += t.sign * values.reduce((a, b) => a + b, 0);
        }
        return { dice, modifier, total };
      };

      const m = (mode || "normal").toLowerCase();
      const attempts = m === "normal" ? [evaluate()] : [evaluate(), evaluate()];
      const kept = m === "disadvantage"
        ? attempts.reduce((a, b) => (b.total < a.total ? b : a))
        : attempts.reduce((a, b) => (b.total > a.total ? b : a));

      // "Natural" = first die of the first dice term, the one crits are read off.
      const lead = kept.dice[0];
      const natural = lead ? lead.values[0] : null;

      const flat = kept.dice.flatMap((d) => d.values);
      const sign = kept.modifier < 0 ? "-" : "+";
      const detail = `${spec}${m === "normal" ? "" : " " + m} [${flat.join(", ")}]`
        + `${kept.modifier ? ` ${sign} ${Math.abs(kept.modifier)}` : ""} = ${kept.total}`;

      return {
        notation: spec,
        mode: m,
        reason: reason || null,
        total: kept.total,
        dice: kept.dice,
        modifier: kept.modifier,
        natural,
        crit: lead ? natural === lead.sides : false,
        fumble: lead ? natural === 1 : false,
        all_attempts: m === "normal" ? undefined : attempts.map((a) => a.total),
        detail,
      };

  draw_lots:
    description: >-
      Pick randomly from a list of options, with optional weights. Use for random encounters, loot tables, which NPC
      shows up, or any time you would otherwise be tempted to just choose the most interesting one.
    inputs:
      options:
        description: "Options separated by ';' or newlines. Weight an option with a trailing '*N', e.g. 'goblin*3; ogre*1'."
        type: string
        required: true
      count:
        description: "How many to draw. Defaults to 1."
        type: string
        default: "1"
      unique:
        description: "'true' to draw without replacement."
        type: string
        default: "true"
        enum: ["true", "false"]
    script: |
      const rand = (n) => {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / n) * n;
        let v;
        do { globalThis.crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
        return v % n;
      };

      let pool = String(options || "")
        .split(/[;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const m = s.match(/^(.*?)\s*\*\s*(\d+)$/);
          return m ? { label: m[1].trim(), weight: parseInt(m[2], 10) } : { label: s, weight: 1 };
        });
      if (!pool.length) throw new Error("No options provided to draw_lots.");

      const n = Math.max(1, parseInt(count || "1", 10) || 1);
      const withoutReplacement = String(unique || "true") === "true";
      const picks = [];

      for (let i = 0; i < n && pool.length; i++) {
        const total = pool.reduce((a, o) => a + o.weight, 0);
        let t = rand(total);
        const idx = pool.findIndex((o) => (t -= o.weight) < 0);
        picks.push(pool[idx].label);
        if (withoutReplacement) pool = pool.filter((_, j) => j !== idx);
      }

      return { picks, drawn: picks.length, detail: `drew ${picks.length}: ${picks.join(", ")}` };
---

## Dice

Outcomes in this world are rolled, not chosen. You have two tools:

- **`roll_dice`** — `notation` like `1d20+4` or `2d6`, optional `mode` of `advantage`/`disadvantage`, and a `reason`
  string. Returns `total`, the individual `dice`, `natural` (the lead die, for crits), and `crit`/`fumble` flags.
- **`draw_lots`** — pick randomly from a `;`-separated list, with optional `*N` weights.

Rules of the table:

1. **Roll before you narrate.** Decide what you are rolling and what the target is, roll, *then* write what happened.
   Narrating first and rolling to match is cheating, and it is obvious in the logs.
2. **Take the result.** A bad roll is a better story than a safe one. Heroes fail, get robbed, and die.
3. **Show the tape.** Every roll that mattered goes into the relevant journal or Chronicle entry in the returned
   `detail` format — e.g. `Lockpicking (DC 15): 1d20+4 [11] + 4 = 15 — success by a hair`.
4. **Don't re-roll because you disliked the answer.** One roll per question.

Difficulty classes, modifiers, crits, and death are defined in [`codex/rules/checks.md`](../../../codex/rules/checks.md).
