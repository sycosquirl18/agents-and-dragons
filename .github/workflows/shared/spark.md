---
mcp-scripts:
  spark:
    description: >-
      Draw random English words — nouns, adjectives and verbs — to spark an idea. Use this BEFORE you decide what to
      make, when you would otherwise reach for the first idea that came to mind. The words are raw material, not
      content: they are there to push you somewhere your instincts would not have gone.
    inputs:
      count:
        description: "How many candidates to draw from each part of speech. Defaults to 10."
        type: string
        default: "10"
      parts:
        description: "Comma-separated parts of speech to draw: 'nouns', 'adjectives', 'verbs'. Defaults to all three."
        type: string
        default: "nouns,adjectives,verbs"
    script: |
      const fs = require("fs");
      const path = require("path");

      const rand = (n) => {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / n) * n;
        let v;
        do { globalThis.crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
        return v % n;
      };

      const candidates = [
        process.env.GH_AW_GITHUB_WORKSPACE,
        process.env.GITHUB_WORKSPACE,
        process.cwd(),
      ].filter(Boolean);

      // Also walk up from cwd, in case the server was started somewhere below the repo root.
      let up = process.cwd();
      for (let i = 0; i < 6; i++) {
        candidates.push(up);
        const parent = path.dirname(up);
        if (parent === up) break;
        up = parent;
      }

      const root = candidates.find((r) => {
        try { return fs.existsSync(path.join(r, "data", "words", "nouns.txt")); } catch { return false; }
      });
      if (!root) {
        throw new Error(
          "Could not find data/words/ from any of: " + candidates.join(", ") +
          ". The word lists ship with the repository; check the checkout."
        );
      }

      const wanted = String(parts || "nouns,adjectives,verbs")
        .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const known = ["nouns", "adjectives", "verbs"];
      const bad = wanted.filter((p) => !known.includes(p));
      if (bad.length) throw new Error(`Unknown part(s) of speech: ${bad.join(", ")}. Known: ${known.join(", ")}`);

      const asked = parseInt(count ?? "10", 10);
      const n = Math.min(50, Math.max(1, Number.isFinite(asked) ? asked : 10));
      const drawn = {};
      const pools = {};

      for (const part of wanted) {
        const words = fs.readFileSync(path.join(root, "data", "words", `${part}.txt`), "utf8")
          .split("\n").map((s) => s.trim()).filter(Boolean);
        pools[part] = words.length;
        const picks = new Set();
        // Draw without replacement; the pools are thousands of words deep so this converges immediately.
        while (picks.size < Math.min(n, words.length)) picks.add(words[rand(words.length)]);
        drawn[part] = [...picks];
      }

      return {
        ...drawn,
        pool_sizes: pools,
        detail: wanted.map((p) => `${p}: ${drawn[p].join(", ")}`).join(" | "),
      };
---

## Spark

Left to itself a model reaches for the same handful of ideas — the cursed blade, the lost crown, the mirror that
shows the truth. `spark` exists to break that. It draws real random English words from a
[word list](../../../data/words/README.md) shipped with the repository, so the seed of an idea comes from outside
the model's habits rather than from inside them.

### How to use it

1. **Call `spark` before you decide what to make.** Not after. If you already have the idea, the words become
   decoration and you have wasted the tool.
2. **Throw most of them away.** You get ten of each; the majority will be useless, anachronistic, or dead flat in
   this world. Discard those without ceremony — that is expected, and it is why you draw ten.
3. **Pick from what survives** with `draw_lots`, one draw per part of speech you are keeping. Do not just take the
   most appealing word; that puts you straight back in the habits you were trying to escape.
4. **Use at least one.** You do not have to use all three, and you should not force a fit.

### Using a word is not putting the word in the file

The words are a *prompt*, not vocabulary. `pressure`, `brittle`, `borrow` might become a glassblower's debt that
comes due, not a thing called the Brittle Borrowed Pressure. If a drawn word is anachronistic — anything technical,
modern, or scientific — the *idea* under it may still be usable even though the word itself can never appear in the
Codex. Translate it into this world; never import it.

Record the words you drew and the ones you chose in your `.commit-msg`, not in the Codex file. The commit history is
outside the world; the Codex is inside it.
