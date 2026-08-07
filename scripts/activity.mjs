#!/usr/bin/env node
// Renders the log — what every agent has done, and what broke.
//
// Two sources, because neither is sufficient alone:
//
//   git log       what changed. Every agent records itself when it commits: an in-voice subject, a note, an
//                 `Agent:` trailer and a link to its run.
//   Actions API   what *ran*. A failed run commits nothing, so a git-only log is a log in which nothing ever goes
//                 wrong — exactly the opposite of what you want to read when something has.
//
// The log is derived, never written. Having thirteen agents append to a shared file would put all of them on the
// same lines of the same file, which is the one merge conflict the commit step's rebase loop cannot resolve.
//
// Output follows the Codex hub-and-spoke rule: an index, and one spoke per ISO week.
//
//   node scripts/activity.mjs                 # this week, to stdout
//   node scripts/activity.mjs --out log       # write log/README.md + log/YYYY-Www.md
//   node scripts/activity.mjs --weeks 8 --out log

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const WEEKS = Number(arg("weeks", 8));
const OUT = arg("out", null);

const sh = (cmd, args, quiet = false) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", quiet ? "ignore" : "inherit"],
  });

const git = (...args) => sh("git", args);

const repo =
  process.env.GITHUB_REPOSITORY ||
  (git("remote", "get-url", "origin").match(/github\.com[:/](.+?)(?:\.git)?\s*$/)?.[1] ?? null);
const server = process.env.GITHUB_SERVER_URL || "https://github.com";
const base = repo ? `${server}/${repo}` : null;

// --- time ------------------------------------------------------------------------------------------------------
// Everything displayed is Pacific. Runners work in UTC and git stores instants, but nobody reads this in UTC, and
// a log whose timestamps need mental arithmetic is a log you stop checking. America/Los_Angeles rather than a
// fixed -08:00 so the switch to and from daylight time is handled rather than quietly wrong for half the year.

const TZ = "America/Los_Angeles";
const fmtDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtTime = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const fmtZone = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "short" });

const day = (iso) => fmtDay.format(new Date(iso));
const time = (iso) => fmtTime.format(new Date(iso));
const zoneNow = fmtZone.formatToParts(new Date()).find((p) => p.type === "timeZoneName").value;

// --- ISO weeks -------------------------------------------------------------------------------------------------
// Chunked by week, not by a rolling window, so a regenerated file is always a *whole* week and never truncates
// itself. Weeks that age out are simply never rewritten again. Weeks are Pacific weeks: they take a local
// `YYYY-MM-DD` produced above, not an instant, so a Monday-morning-UTC run lands in the week you saw it happen.

const asUTC = (localDay) => new Date(`${localDay}T00:00:00Z`);

const weekId = (localDay) => {
  const t = asUTC(localDay);
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); // the Thursday that names the week
  const jan1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - jan1) / 86400000 + 1) / 7)).padStart(2, "0")}`;
};

const weekStart = (localDay) => {
  const t = asUTC(localDay);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() || 7) - 1));
  return t;
};

const since = weekStart(day(new Date()));
// One extra day of slack: the queries below are UTC, and a Pacific week begins seven or eight hours into one.
since.setUTCDate(since.getUTCDate() - (WEEKS - 1) * 7 - 1);
const sinceISO = since.toISOString().slice(0, 10);

// --- what changed ----------------------------------------------------------------------------------------------

const RS = "\x1e";
const US = "\x1f";

const commits = git(
  "log",
  `--since=${sinceISO}`,
  "--no-merges",
  // This job's own commits are not activity; leaving them in would fill the log with itself.
  "--invert-grep",
  "--grep=^Render the log$",
  "--grep=^Render the activity log$",
  "--name-only",
  `--format=${RS}%H${US}%aI${US}%s${US}%b${US}`,
)
  .split(RS)
  .slice(1)
  .map((chunk) => {
    const [hash, date, subject, body, files] = chunk.split(US);
    const agent = body.match(/^Agent:\s*(.+)$/m)?.[1]?.trim();
    const runUrl = body.match(/^Run:\s*(\S+)$/m)?.[1];
    // Commits arrive from runners in UTC and from humans in local time; normalise or the days interleave.
    const at = new Date(date).toISOString();
    // Trailers are for machines. What is left is what the agent chose to say, clipped so the log stays scannable.
    let note = body
      .split("\n")
      .filter((l) => l.trim() && !/^(Agent|Run|Co-authored-by|Copilot-Session):/.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (note.length > 320) note = `${note.slice(0, 317).replace(/\s+\S*$/, "")}…`;
    return {
      hash,
      at,
      subject,
      note,
      run: runUrl,
      agent: agent && agent !== "unknown" ? agent : runUrl ? "an agent" : "by hand",
      // Lock files are compiled output, not a change anyone made; listing them buries the real files.
      files: (files ?? "").split("\n").map((f) => f.trim()).filter((f) => f && !f.endsWith(".lock.yml")),
    };
  })
  .sort((a, b) => b.at.localeCompare(a.at));

// --- what ran --------------------------------------------------------------------------------------------------
// Needs `gh` auth and `actions: read`. Without them the log degrades to commits only rather than failing: a
// partial log is worth reading, and a renderer that dies is not.

let runs = [];
let runsAvailable = false;
if (repo) {
  try {
    runs = sh(
      "gh",
      [
        "api",
        "--paginate",
        `repos/${repo}/actions/runs?per_page=100&created=%3E%3D${sinceISO}`,
        "--jq",
        ".workflow_runs[] | [.name, .status, .conclusion, .created_at, .html_url] | @tsv",
      ],
      true,
    )
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [name, status, conclusion, at, url] = l.split("\t");
        return { name, status, conclusion, at: new Date(at).toISOString(), url };
      })
      // Everything is included, deliberately. An earlier version filtered the CI checks out as "meta-workflows
      // that report on the world rather than being part of it" — and then hid six hours of red `Check the Codex`
      // caused by an agent eating state.md's frontmatter. A check that fails means the world is malformed, which
      // is the single most important thing this file can tell you.
      .sort((a, b) => b.at.localeCompare(a.at));
    runsAvailable = true;
  } catch {
    console.error("warn: could not read workflow runs (needs gh auth + `actions: read`) — rendering commits only.");
  }
}

const BROKE = new Set(["failure", "timed_out", "startup_failure", "cancelled", "action_required"]);
const broken = runs.filter((r) => BROKE.has(r.conclusion));

// Every workflow that *should* be running. An agent that has never run at all produces no rows in the API and
// would otherwise be invisible here — which is the single most useful thing this file can tell you.
const declared = existsSync(".github/workflows")
  ? readdirSync(".github/workflows")
      .filter((f) => f.endsWith(".lock.yml") || f.endsWith(".yml"))
      .map((f) => readFileSync(join(".github/workflows", f), "utf8").match(/^name:\s*"?(.+?)"?\s*$/m)?.[1])
      .filter(Boolean)
  : [];

// --- assemble --------------------------------------------------------------------------------------------------

const link = (text, href) => (href ? `[${text}](${href})` : text);

const weeks = new Map();
const bucket = (iso) => {
  const local = day(iso);
  const id = weekId(local);
  if (!weeks.has(id)) weeks.set(id, { commits: [], runs: [], days: new Set() });
  weeks.get(id).days.add(local);
  return weeks.get(id);
};

for (const c of commits) bucket(c.at).commits.push(c);
for (const r of runs) bucket(r.at).runs.push(r);
for (const w of weeks.values()) w.days = [...w.days].sort().reverse();

const weekIds = [...weeks.keys()].sort().reverse();

const fmtDate = (s) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const span = (id) => {
  const d = weeks.get(id).days;
  return d.length ? (d.length === 1 ? fmtDate(d[0]) : `${fmtDate(d[d.length - 1])} – ${fmtDate(d[0])}`) : "";
};

function renderWeek(id) {
  const { commits: cs, runs: rs } = weeks.get(id);
  const trouble = rs.filter((r) => BROKE.has(r.conclusion));

  const out = ["---", `title: Log — ${id}`, "---", "", `# ${id}`, ""];
  out.push(
    `${span(id)} · ${cs.length} change${cs.length === 1 ? "" : "s"} to the world` +
      (runsAvailable ? ` · ${rs.length} run${rs.length === 1 ? "" : "s"}, ${trouble.length} not ok` : "") +
      ` · times ${zoneNow} · [← all weeks](README.md)`,
    "",
  );

  if (trouble.length) {
    out.push("## Trouble", "");
    for (const r of trouble) {
      out.push(`- \`${day(r.at)} ${time(r.at)}\` **${r.name}** — ${r.conclusion} · ${link("run", r.url)}`);
    }
    out.push("");
  }

  out.push("## Changes", "");
  if (!cs.length) out.push("_Nothing was written this week._", "");

  let d = null;
  for (const c of cs) {
    if (day(c.at) !== d) {
      d = day(c.at);
      out.push(`### ${d}`, "");
    }
    const refs = [link(`\`${c.hash.slice(0, 7)}\``, base && `${base}/commit/${c.hash}`)];
    if (c.run) refs.push(link("run", c.run));
    out.push(`**${time(c.at)} · ${c.agent}** — ${c.subject}  `);
    out.push(refs.join(" · "));
    if (c.note) out.push("", c.note);
    if (c.files.length) {
      const shown = c.files.slice(0, 8).map((f) => link(`\`${f}\``, base && `${base}/blob/main/${f}`));
      if (c.files.length > 8) shown.push(`_+${c.files.length - 8} more_`);
      out.push("", shown.join(" · "));
    }
    out.push("");
  }
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function renderIndex(archived) {
  const out = ["---", "title: Log", "---", "", "# Log", ""];
  out.push(
    "What the agents have actually been doing: every run, what it changed, and what broke. Generated from the",
    "commit history and the Actions API by [`scripts/activity.mjs`](../scripts/activity.mjs) — **do not edit**.",
    "",
    "For the world's own account of the same events, in the fiction and in world-time, read the",
    "[Chronicle](../codex/chronicle/README.md). This is the machine's account of the agents that wrote it.",
    "",
    `All times **Pacific** (${zoneNow}). The runners work in UTC; this does the arithmetic so you don't.`,
    "",
  );

  if (runsAvailable) {
    const last7 = new Date(Date.now() - 7 * 86400000).toISOString();
    const recent = runs.filter((r) => r.at >= last7);
    const bad7 = recent.filter((r) => BROKE.has(r.conclusion)).length;

    out.push("## Health", "");
    out.push(
      `**${recent.length}** runs in the last 7 days, **${bad7 || "none"}** not ok. ` +
        `Live view in [Actions](${base}/actions).`,
      "",
    );
    out.push("| Workflow | Last run | | 7d | Not ok |", "| --- | --- | --- | --: | --: |");
    for (const name of [...new Set([...declared, ...runs.map((r) => r.name)])].sort()) {
      const mine = runs.filter((r) => r.name === name);
      const last = mine[0];
      if (!last) {
        out.push(`| ${name} | never | **never run** | 0 | — |`);
        continue;
      }
      const mark =
        last.status !== "completed" ? "running" : BROKE.has(last.conclusion) ? `**${last.conclusion}**` : "ok";
      const bad = mine.filter((r) => r.at >= last7 && BROKE.has(r.conclusion)).length;
      const gone = declared.includes(name) ? "" : " _(retired)_";
      out.push(
        `| ${name}${gone} | ${link(`${day(last.at)} ${time(last.at)}`, last.url)} | ${mark} | ` +
          `${mine.filter((r) => r.at >= last7).length} | ${bad || "—"} |`,
      );
    }
    out.push("");

    out.push("## Recent trouble", "");
    if (!broken.length) {
      out.push("Nothing has failed in this window.", "");
    } else {
      for (const r of broken.slice(0, 12)) {
        out.push(`- \`${day(r.at)} ${time(r.at)}\` **${r.name}** — ${r.conclusion} · ${link("run", r.url)}`);
      }
      if (broken.length > 12) out.push(`- _…and ${broken.length - 12} more, in the weeks below._`);
      out.push("");
    }
  }

  out.push("## Weeks", "");
  out.push("| Week | | Changes | Runs | Not ok |", "| --- | --- | --: | --: | --: |");
  for (const id of weekIds) {
    const w = weeks.get(id);
    const bad = w.runs.filter((r) => BROKE.has(r.conclusion)).length;
    out.push(
      `| [${id}](${id}.md) | ${span(id)} | ${w.commits.length} | ${runsAvailable ? w.runs.length : "—"} | ` +
        `${bad || "—"} |`,
    );
  }
  for (const id of archived) out.push(`| [${id}](${id}.md) | _archived_ | | | |`);
  out.push("");
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

if (!OUT) {
  process.stdout.write(weekIds.length ? renderWeek(weekIds[0]) : "# Log\n\n_Nothing yet._\n");
} else {
  mkdirSync(OUT, { recursive: true });
  for (const id of weekIds) writeFileSync(join(OUT, `${id}.md`), renderWeek(id));
  // Weeks that have aged out keep whatever an earlier run wrote. The archive grows by accretion and old weeks are
  // never rewritten, which is the entire point of chunking by week.
  const archived = existsSync(OUT)
    ? readdirSync(OUT)
        .filter((f) => /^\d{4}-W\d{2}\.md$/.test(f))
        .map((f) => f.replace(/\.md$/, ""))
        .filter((id) => !weeks.has(id))
        .sort()
        .reverse()
    : [];
  writeFileSync(join(OUT, "README.md"), renderIndex(archived));
  console.error(
    `Wrote ${OUT}/ — ${weekIds.length} week(s), ${commits.length} change(s), ` +
      (runsAvailable ? `${runs.length} run(s), ${broken.length} not ok.` : "runs unavailable."),
  );
}
