#!/usr/bin/env node
// A report on the Codex, for the Custodian to work from. Finds the things agents get wrong most often — dead
// links and anchors, unindexed files, files that outgrew the Split Rule — so the Custodian can spend its run on
// judgement instead of hunting.
//
// It reports; it does not judge. There is no error/warning split and it always exits 0, because none of this is
// the kind of thing worth stopping the world over. A missing frontmatter line is untidy, not broken — the Codex
// is prose read by language models, and they cope with untidy far better than the world copes with a gate that
// refuses to let anyone write. Findings are a to-do list, not a verdict.
//
//   node scripts/check-codex.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CODEX = join(ROOT, "codex");
const MAX_LINES = 150;

const TYPES = ["region", "settlement", "site", "era", "event", "faction", "creature", "npc", "item", "spell",
  "rule", "character", "quest", "log", "index"];

// Content ripens: stub -> sketch -> detailed -> canon. Quests and characters run on their own lifecycles.
// Statuses are checked *per type* because they are not interchangeable: a quest wearing a content status
// (`status: sketch`) would slip past the turn-baton rule below, which only fires on `active`.
const CONTENT_STATUSES = ["stub", "sketch", "detailed", "canon"];
const STATUS_BY_TYPE = {
  quest: ["active", "resolved", "failed", "abandoned"],
  character: [...CONTENT_STATUSES, "dead"],
};
const STATUSES = [...new Set([...CONTENT_STATUSES, ...Object.values(STATUS_BY_TYPE).flat()])];

// Whose move it is lives in codex/quests/TURN.txt, deliberately outside the Codex file format: it is a plain
// board an agent rewrites one line of, not a document. Its *contents* are prose and are not validated here —
// an LLM reads them, and inventing a schema would only give agents something new to get subtly wrong. The one
// thing worth checking mechanically is that no active quest has fallen off the board entirely, because a quest
// nobody is holding the baton for is a quest that silently stops.
const TURN_FILE = join(CODEX, "quests", "TURN.txt");
const activeQuests = [];

const findings = [];
const note = (file, msg) => findings.push(`${file}: ${msg}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith(".md") ? [full] : [];
  });

if (!existsSync(CODEX)) {
  console.error("No codex/ directory found.");
  process.exit(1);
}

const files = walk(CODEX);
const rel = (f) => relative(ROOT, f).split(sep).join("/");
const linkTargets = new Set();

// Links inside code fences and inline code are illustrations, not references.
const stripCode = (s) => s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

// GitHub's heading slugger: lowercase, drop punctuation, replace *each* space with a hyphen.
// Whitespace is not collapsed, so "A — B" becomes "a--b". Short, plain headings are safest.
const slug = (h) => h.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s/g, "-");

const headingCache = new Map();
const headingsOf = (file) => {
  const key = resolve(file);
  if (!headingCache.has(key)) {
    const src = existsSync(key) ? stripCode(readFileSync(key, "utf8")) : "";
    headingCache.set(key, new Set([...src.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1]))));
  }
  return headingCache.get(key);
};

const checkLinks = (file, raw) => {
  const id = rel(file);
  for (const m of stripCode(raw).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const spec = m[1].trim();
    if (/^(https?:|mailto:)/.test(spec)) continue;
    const hash = spec.indexOf("#");
    const href = (hash === -1 ? spec : spec.slice(0, hash)).trim();
    const anchor = hash === -1 ? "" : spec.slice(hash + 1).trim();

    const target = href ? resolve(dirname(file), href) : resolve(file);
    if (href) {
      if (!existsSync(target)) {
        note(id, `broken link -> ${href}`);
        continue;
      }
      linkTargets.add(resolve(target));
    }
    // Anchors are silently dead on GitHub, so they have to be checked here or not at all.
    if (anchor && target.endsWith(".md") && !headingsOf(target).has(anchor)) {
      note(id, `broken anchor -> ${spec} (no heading '#${anchor}' in ${rel(target)})`);
    }
  }
};

for (const file of files) {
  const id = rel(file);
  const raw = readFileSync(file, "utf8");
  const lines = raw.split("\n");

  // --- frontmatter ---
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    note(id, "missing frontmatter block");
  } else {
    const fields = Object.fromEntries(
      fm[1]
        .split("\n")
        .map((l) => l.split(/:\s*/))
        .filter((p) => p.length >= 2)
        .map(([k, ...v]) => [k.trim(), v.join(": ").trim()])
    );
    if (!fields.type) note(id, "frontmatter missing `type`");
    else if (!TYPES.includes(fields.type)) note(id, `unknown type '${fields.type}'`);
    if (!fields.status) note(id, "frontmatter missing `status`");
    else if (!STATUSES.includes(fields.status)) note(id, `unknown status '${fields.status}'`);
    else if (TYPES.includes(fields.type)) {
      const allowed = STATUS_BY_TYPE[fields.type] ?? CONTENT_STATUSES;
      if (!allowed.includes(fields.status)) {
        note(id, `status '${fields.status}' is not valid for a ${fields.type} (expected: ${allowed.join(", ")})`);
      }
    }
    if (!fields.updated) note(id, "frontmatter missing `updated`");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.updated)) note(id, `updated '${fields.updated}' is not YYYY-MM-DD`);

    if (fields.turn) {
      note(id, "`turn` no longer lives in frontmatter — whose move it is belongs in codex/quests/TURN.txt");
    }
    if (fields.type === "quest" && fields.status === "active") activeQuests.push(id);
  }

  // --- structure ---
  if (!raw.match(/^---[\s\S]*?---\s*\r?\n\s*# /)) note(id, "no H1 immediately after the frontmatter");
  if (lines.length > MAX_LINES) {
    note(id, `${lines.length} lines exceeds the Split Rule limit of ${MAX_LINES} — split into a directory + index`);
  } else if (lines.length > MAX_LINES * 0.85) {
    note(id, `${lines.length} lines, approaching the ${MAX_LINES}-line Split Rule limit`);
  }

  // --- links ---
  checkLinks(file, raw);
}

// --- docs and agent prompts link into the Codex too; a stale path there misleads every future run ---
const docs = [
  join(ROOT, "README.md"),
  join(ROOT, "AGENTS.md"),
  ...(existsSync(join(ROOT, "docs")) ? walk(join(ROOT, "docs")) : []),
  ...(existsSync(join(ROOT, ".github")) ? walk(join(ROOT, ".github")) : []),
].filter(existsSync);
for (const doc of docs) checkLinks(doc, readFileSync(doc, "utf8"));

// --- indexes: sections need an index; everything must be reachable ---
const dirs = [...new Set(files.map((f) => dirname(f)))];
const sections = new Set([CODEX, ...readdirSync(CODEX)
  .filter((n) => statSync(join(CODEX, n)).isDirectory())
  .map((n) => join(CODEX, n))].map((d) => resolve(d)));

for (const dir of dirs) {
  const index = join(dir, "README.md");
  // Deeper directories inherit their parent's index until the Split Rule gives them their own.
  if (!existsSync(index)) {
    if (sections.has(resolve(dir))) note(rel(dir), "section has no README.md index");
  }
  const expected = [
    ...readdirSync(dir)
      .filter((n) => n.endsWith(".md") && n !== "README.md")
      .map((n) => join(dir, n)),
    ...readdirSync(dir)
      .filter((n) => statSync(join(dir, n)).isDirectory())
      .map((n) => join(dir, n, "README.md"))
      .filter(existsSync),
  ];
  for (const e of expected) {
    if (!linkTargets.has(resolve(e))) note(rel(e), "orphan — nothing links to it");
  }
}

for (const required of ["codex/state.md", "codex/README.md"]) {
  if (!existsSync(join(ROOT, required))) note(required, "required file is missing");
}

// A quest that is active but absent from the board has no baton, so no agent will ever pick it up. Matched by
// filename substring rather than by parsing, so the board stays free to say it however it likes.
if (activeQuests.length) {
  if (!existsSync(TURN_FILE)) {
    note("codex/quests/TURN.txt", `missing, but ${activeQuests.length} quest(s) are active — nobody holds a baton`);
  } else {
    const board = readFileSync(TURN_FILE, "utf8");
    for (const q of activeQuests) {
      if (!board.includes(q.split("/").pop())) {
        note("codex/quests/TURN.txt", `no entry for active quest ${q} — nobody's move, so it will never advance`);
      }
    }
  }
}

const stubs = files.filter((f) => /status:\s*stub/.test(readFileSync(f, "utf8"))).length;

console.log(`Checked ${files.length} Codex files across ${dirs.length} directories (${stubs} stubs open).`);
for (const f of findings) console.log(`  - ${f}`);
console.log(findings.length ? `\n${findings.length} thing(s) to tidy.` : "\nNothing to tidy.");
