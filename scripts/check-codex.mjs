#!/usr/bin/env node
// Mechanical checks on the Codex. Catches the failures agents make most often — dead links and anchors, unindexed
// files, missing frontmatter, files that outgrew the Split Rule — so the Loremaster can spend its run on meaning
// instead of bookkeeping.
//
//   node scripts/check-codex.mjs          fail on errors
//   node scripts/check-codex.mjs --strict fail on warnings too

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CODEX = join(ROOT, "codex");
const STRICT = process.argv.includes("--strict");
const MAX_LINES = 150;

const TYPES = ["region", "settlement", "site", "era", "event", "faction", "creature", "item", "spell",
  "rule", "character", "quest", "log", "index"];
const STATUSES = ["stub", "sketch", "detailed", "canon", "active", "resolved", "failed", "abandoned", "dead"];

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

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
        err(id, `broken link -> ${href}`);
        continue;
      }
      linkTargets.add(resolve(target));
    }
    // Anchors are silently dead on GitHub, so they have to be checked here or not at all.
    if (anchor && target.endsWith(".md") && !headingsOf(target).has(anchor)) {
      err(id, `broken anchor -> ${spec} (no heading '#${anchor}' in ${rel(target)})`);
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
    err(id, "missing frontmatter block");
  } else {
    const fields = Object.fromEntries(
      fm[1]
        .split("\n")
        .map((l) => l.split(/:\s*/))
        .filter((p) => p.length >= 2)
        .map(([k, ...v]) => [k.trim(), v.join(": ").trim()])
    );
    if (!fields.type) err(id, "frontmatter missing `type`");
    else if (!TYPES.includes(fields.type)) warn(id, `unknown type '${fields.type}'`);
    if (!fields.status) err(id, "frontmatter missing `status`");
    else if (!STATUSES.includes(fields.status)) warn(id, `unknown status '${fields.status}'`);
    if (!fields.updated) err(id, "frontmatter missing `updated`");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.updated)) err(id, `updated '${fields.updated}' is not YYYY-MM-DD`);
  }

  // --- structure ---
  if (!raw.match(/^---[\s\S]*?---\s*\r?\n\s*# /)) warn(id, "no H1 immediately after the frontmatter");
  if (lines.length > MAX_LINES) {
    err(id, `${lines.length} lines exceeds the Split Rule limit of ${MAX_LINES} — split into a directory + index`);
  } else if (lines.length > MAX_LINES * 0.85) {
    warn(id, `${lines.length} lines, approaching the ${MAX_LINES}-line Split Rule limit`);
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
    if (sections.has(resolve(dir))) err(rel(dir), "section has no README.md index");
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
    if (!linkTargets.has(resolve(e))) err(rel(e), "orphan — nothing links to it");
  }
}

for (const required of ["codex/state.md", "codex/README.md"]) {
  if (!existsSync(join(ROOT, required))) err(required, "required file is missing");
}

const stubs = files.filter((f) => /status:\s*stub/.test(readFileSync(f, "utf8"))).length;

console.log(`Checked ${files.length} Codex files across ${dirs.length} directories (${stubs} stubs open).`);
for (const w of warnings) console.log(`  warn   ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
if (STRICT && warnings.length) {
  console.log(`\n${warnings.length} warning(s), --strict.`);
  process.exit(1);
}
console.log(warnings.length ? `\nOK with ${warnings.length} warning(s).` : "\nCodex is consistent.");
