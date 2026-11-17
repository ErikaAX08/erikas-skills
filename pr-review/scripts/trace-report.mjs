#!/usr/bin/env node
// Summarizes review traces (SKILL.md §12) into the numbers needed to judge the skill: the candidate
// funnel (raised → verified → classified), per-lens yield and refutation rate, sizing and mode,
// checks run, agent failures, internal-consistency violations, and "signals" that point at the rule
// or lens to improve.
//
//   node trace-report.mjs [<runs.jsonl | dir>…] [--json]
//     A directory is searched recursively for runs.jsonl (an eval output directory works).
//     No path = the default trace directory. Exit 0 = report written, 2 = no trace found.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace, traceDir, tracePath } from "./lib/trace.mjs";

export function findTraceFiles(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [abs];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      out.push(...findTraceFiles(p));
    } else if (entry.name === "runs.jsonl") out.push(p);
  }
  return out;
}

const count = (list, key) => list.reduce((acc, x) => ((acc[key(x)] = (acc[key(x)] ?? 0) + 1), acc), {});
const ratio = (a, b) => (b ? Math.round((a / b) * 1000) / 1000 : null);

// The verdict Phase 8 of SKILL.md requires for a run's classifications.
export function expectedVerdict(classifications) {
  const cats = classifications.map((c) => c.data.category);
  if (cats.includes("🔴")) return "changes required";
  if (classifications.some((c) => c.data.category === "still-open" && (c.data.prerequisite === true || c.data.prerequisite === "true"))) return "verification required";
  if (cats.includes("🟡")) return "decision required";
  return "ready to merge";
}

export function summarizeRun(events) {
  const of = (type) => events.filter((e) => e.event === type);
  const start = of("run.start")[0] ?? null;
  const end = of("run.end").at(-1) ?? null;
  const sizing = of("sizing").at(-1) ?? null;
  const candidates = of("candidate");
  const verifications = of("verification");
  const classifications = of("classification");
  const decisions = of("decision");
  const mode = decisions.filter((d) => d.data.kind === "mode").at(-1)?.data.value ?? null;
  const sizeDecision = decisions.filter((d) => d.data.kind === "size").at(-1)?.data.value ?? null;
  const verifiedIds = new Set(verifications.map((v) => v.data.id));
  const classifiedIds = new Set(classifications.map((c) => c.data.id));
  const violations = [];
  for (const c of candidates) if (!classifiedIds.has(c.data.id)) violations.push({ kind: "unclassified-candidate", id: c.data.id });
  const verifyCount = verifications.reduce((acc, v) => ((acc[v.data.id] = (acc[v.data.id] ?? 0) + 1), acc), {});
  const independent = sizing?.data.verification === "independent";
  for (const c of classifications) {
    // A candidate deduplicated into another is verified through the survivor.
    const target = c.data.merged_into || c.data.id;
    if (["🔴", "🟡"].includes(c.data.category) && !verifiedIds.has(target)) violations.push({ kind: "unverified-gating", id: c.data.id });
    // Under R, SKILL.md §4 requires two independent verifications for every 🔴.
    else if (independent && c.data.category === "🔴" && !c.data.merged_into && (verifyCount[target] ?? 0) < 2) violations.push({ kind: "single-verifier-red", id: c.data.id });
  }
  if (end?.data.status === "done") {
    const expected = expectedVerdict(classifications);
    if (end.data.verdict && end.data.verdict !== expected) violations.push({ kind: "verdict-mismatch", id: `${end.data.verdict} ≠ ${expected}` });
    if (!end.data.verdict) violations.push({ kind: "missing-verdict", id: "run.end" });
    const reportChecks = events.filter((e) => e.event === "check" && e.data.tool === "report");
    if (!reportChecks.length) violations.push({ kind: "report-unchecked", id: "run.end" });
    else if (reportChecks.at(-1).data.exit !== 0) violations.push({ kind: "report-check-failed", id: `exit ${reportChecks.at(-1).data.exit}` });
  }
  const ms = start && end ? Date.parse(end.ts) - Date.parse(start.ts) : null;
  return {
    run: events[0].run,
    file: events[0].file,
    entry: start?.data.entry ?? null,
    status: end?.data.status ?? "open",
    verdict: end?.data.verdict ?? null,
    size: sizing?.data.size ?? null,
    sizeDecision,
    H: sizing?.data.H ?? null,
    N: sizing?.data.N ?? null,
    lenses: sizing?.data.lenses ?? [],
    mode,
    candidates: candidates.length,
    verifications: verifications.length,
    agents: of("agent").length,
    checks: of("check").map((c) => ({ tool: c.data.tool, exit: c.data.exit })),
    categories: count(classifications, (c) => c.data.category),
    durationSec: ms === null ? null : Math.round(ms / 1000),
    violations,
  };
}

export function buildReport(files) {
  const events = [];
  const malformed = [];
  for (const f of files) {
    const t = readTrace(f);
    events.push(...t.events.map((e) => ({ ...e, file: f })));
    malformed.push(...t.malformed.map((m) => ({ ...m, file: f })));
  }
  if (events.length === 0 && malformed.length === 0) return null;
  events.sort((a, b) => a.ts.localeCompare(b.ts));
  const byRun = new Map();
  for (const e of events) {
    const key = `${e.file}#${e.run}`;
    if (!byRun.has(key)) byRun.set(key, []);
    byRun.get(key).push(e);
  }
  const runs = [...byRun.values()].map(summarizeRun);
  const of = (type) => events.filter((e) => e.event === type);

  // Candidate funnel and per-lens yield; a candidate is keyed by run + id.
  const key = (e) => `${e.file}#${e.run}#${e.data.id}`;
  const verification = new Map(of("verification").map((v) => [key(v), v.data.status]));
  const classification = new Map(of("classification").map((c) => [key(c), c.data]));
  const lenses = {};
  for (const c of of("candidate")) {
    const l = (lenses[c.data.lens] ??= { candidates: 0, proposedGating: 0, confirmed: 0, refuted: 0, unresolved: 0, reported: 0, ruledOut: 0, discarded: 0 });
    l.candidates++;
    if (["red", "yellow"].includes(c.data.proposed)) l.proposedGating++;
    const v = verification.get(key(c));
    if (v === "CONFIRMED") l.confirmed++;
    if (v === "REFUTED") l.refuted++;
    if (v === "UNRESOLVED") l.unresolved++;
    const cat = classification.get(key(c))?.category;
    if (["🔴", "🟡", "🚀", "⚪"].includes(cat)) l.reported++;
    if (cat === "✅") l.ruledOut++;
    if (cat === "discarded") l.discarded++;
  }
  for (const l of Object.values(lenses)) {
    l.refutationRate = ratio(l.refuted, l.confirmed + l.refuted + l.unresolved);
    l.yield = ratio(l.reported, l.candidates);
  }

  const verifs = of("verification");
  const report = {
    scope: files.length === 1 ? files[0] : `${files.length} trace files`,
    period: { from: events[0]?.ts, to: events.at(-1)?.ts },
    runs: {
      total: runs.length,
      byStatus: count(runs, (r) => r.status),
      byEntry: count(runs, (r) => r.entry ?? "?"),
      bySize: count(runs, (r) => r.size ?? "?"),
      byMode: count(runs, (r) => r.mode ?? "?"),
      byVerdict: count(runs.filter((r) => r.verdict), (r) => r.verdict),
      medianDurationSec: median(runs.map((r) => r.durationSec).filter((x) => x !== null)),
    },
    funnel: {
      candidates: of("candidate").length,
      proposed: count(of("candidate"), (c) => c.data.proposed),
      verifications: count(verifs, (v) => v.data.status),
      verifiedBy: count(verifs, (v) => v.data.by),
      refutationRate: ratio(verifs.filter((v) => v.data.status === "REFUTED").length, verifs.length),
      classified: count(of("classification"), (c) => c.data.category),
      byRule: count(of("classification"), (c) => `rule ${c.data.rule}`),
    },
    lenses,
    agents: count(of("agent"), (a) => `${a.data.role} ${a.data.status}`),
    checks: count(of("check"), (c) => `${c.data.tool} ${c.data.exit === 0 ? "pass" : "fail"}`),
    decisions: Object.fromEntries(Object.entries(groupBy(of("decision"), (d) => d.data.kind)).map(([k, list]) => [k, count(list, (d) => String(d.data.value))])),
    deviations: of("deviation").map((d) => ({ at: d.ts, run: d.run, rule: d.data.rule, reason: d.data.reason })),
    violations: runs.flatMap((r) => r.violations.map((v) => ({ run: r.run, ...v }))),
    malformed,
    timeline: runs,
  };
  report.signals = signals(report, runs);
  return report;
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

function groupBy(list, key) {
  return list.reduce((acc, x) => ((acc[key(x)] ??= []).push(x), acc), {});
}

// Each signal names the evidence that triggered it and where to look; none is a verdict.
function signals(report, runs) {
  const out = [];
  const add = (id, evidence, look) => out.push({ id, evidence, look });
  for (const [lens, l] of Object.entries(report.lenses)) {
    const wasted = l.refuted + l.discarded;
    if (l.candidates >= 4 && wasted / l.candidates >= 0.5) add("noisy-lens", `${lens}: ${wasted} of ${l.candidates} candidates refuted or discarded`, `Tighten that lens's checklist questions or the reviewer brief's drop rule (reviewer-brief.md Method step 4).`);
  }
  const smallFanOut = runs.filter((r) => /multi/i.test(r.mode ?? "") && r.H !== null && r.H <= 50);
  if (smallFanOut.length) add("fan-out-on-small-diff", `${smallFanOut.length} multi-agent run(s) with H ≤ 50 (${smallFanOut.map((r) => `${r.run}: H=${r.H}`).join(", ")})`, "SKILL.md §4 sends any high-risk file to size L; consider letting R raise verification depth instead of fan-out.");
  const byKind = count(report.violations, (v) => v.kind);
  if (byKind["verdict-mismatch"]) add("verdict-mismatch", `${byKind["verdict-mismatch"]} run(s) whose verdict does not follow Phase 8 from their own classifications`, "Phase 8 precedence or §11 self-check item 4 is not being applied.");
  if (byKind["unverified-gating"]) add("unverified-gating", `${byKind["unverified-gating"]} 🔴/🟡 classified without a verification event`, "Phase 5 refutation is mandatory for every 🔴/🟡; check whether it ran or was only not traced.");
  const unchecked = (byKind["report-unchecked"] ?? 0) + (byKind["report-check-failed"] ?? 0);
  if (unchecked) add("report-unchecked", `${unchecked} completed run(s) emitted a report without a passing check-report.mjs`, "SKILL.md §8 emit gate: the report must pass scripts/check-report.mjs before it is emitted.");
  if (byKind["single-verifier-red"]) add("single-verifier-red", `${byKind["single-verifier-red"]} 🔴 under R with fewer than two verifications`, "SKILL.md §4 independent verification: each 🔴 needs two verifiers that do not see each other.");
  if (byKind["unclassified-candidate"]) add("unclassified-candidates", `${byKind["unclassified-candidate"]} candidate(s) never classified`, "Phase 7 must classify every candidate (discarded ones included) — the stop condition was not met or the trace is incomplete.");
  const verifs = Object.values(report.funnel.verifications).reduce((a, b) => a + b, 0);
  const unresolved = report.funnel.verifications.UNRESOLVED ?? 0;
  if (verifs >= 5 && unresolved / verifs >= 0.3) add("high-unresolved", `${unresolved} of ${verifs} verifications UNRESOLVED`, "Verifiers lack access or context; check packet completeness (multi-agent-review.md §4).");
  const done = runs.filter((r) => r.status === "done");
  const noTests = done.filter((r) => !r.checks.some((c) => c.tool === "test"));
  if (done.length >= 3 && noTests.length / done.length >= 0.5) add("tests-rarely-run", `${noTests.length} of ${done.length} completed runs executed no test`, "Phase 6 execution policy may be too strict, or projects lack runnable tests; read the `test-execution` decisions.");
  const agentFailures = Object.entries(report.agents).filter(([k]) => /failed|timeout/.test(k)).reduce((n, [, c]) => n + c, 0);
  if (agentFailures) add("agent-failures", `${agentFailures} sub-agent failure(s) or timeout(s)`, "A failed lens is a coverage gap (SKILL.md §6); check brief size and packet paths.");
  const overridden = runs.filter((r) => r.sizeDecision && r.size && !String(r.sizeDecision).startsWith(r.size));
  if (overridden.length) add("size-overrides", `${overridden.length} run(s) chose a size different from collect-diff.sh`, "Read the `size` decisions' rationales: repeated overrides mean the path patterns or §4 thresholds are wrong.");
  if (report.deviations.length) add("rule-deviations", `${report.deviations.length} deviation(s): ${[...new Set(report.deviations.map((d) => d.rule))].join(", ")}`, "A rule that is often overridden is either wrong for real situations or poorly explained.");
  const open = runs.filter((r) => r.status === "open");
  if (open.length) add("open-runs", `${open.length} run(s) have no run.end`, "The review stopped without closing its trace: look for failures or interrupted sessions.");
  if (report.malformed.length) add("malformed-trace", `${report.malformed.length} malformed line(s)`, "Events were written by hand instead of with trace.mjs.");
  return out;
}

function table(obj, headers) {
  const rows = Object.entries(obj);
  if (rows.length === 0) return "_none_\n";
  return `| ${headers[0]} | ${headers[1]} |\n| --- | --- |\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}\n`;
}

export function toMarkdown(r) {
  const pct = (x) => (x === null ? "-" : `${Math.round(x * 100)}%`);
  const lines = [];
  lines.push("# Review Trace Report", "", `**Scope**: \`${r.scope}\`  `, `**Period**: ${r.period.from ?? "-"} → ${r.period.to ?? "-"}  `, `**Runs**: ${r.runs.total} · median duration ${r.runs.medianDurationSec ?? "-"} s`, "");
  lines.push("## Signals", "");
  if (r.signals.length === 0) lines.push("_No pattern crossed a threshold._", "");
  for (const s of r.signals) lines.push(`- **${s.id}** — ${s.evidence}. ${s.look}`);
  if (r.signals.length) lines.push("");
  lines.push("## Funnel", "", `Candidates raised: ${r.funnel.candidates} · verifier refutation rate: ${pct(r.funnel.refutationRate)}`, "");
  lines.push("### Proposed severity", "", table(r.funnel.proposed, ["Proposed", "Candidates"]), "### Verification", "", table(r.funnel.verifications, ["Status", "Count"]), "### Classification", "", table(r.funnel.classified, ["Category", "Count"]), "### Phase 7 rule applied", "", table(r.funnel.byRule, ["Rule", "Count"]));
  lines.push("## Lenses", "", "| Lens | Candidates | Proposed 🔴/🟡 | Confirmed | Refuted | Unresolved | Reported | Ruled out | Discarded | Refutation rate | Yield |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const [lens, l] of Object.entries(r.lenses)) lines.push(`| ${lens} | ${l.candidates} | ${l.proposedGating} | ${l.confirmed} | ${l.refuted} | ${l.unresolved} | ${l.reported} | ${l.ruledOut} | ${l.discarded} | ${pct(l.refutationRate)} | ${pct(l.yield)} |`);
  if (!Object.keys(r.lenses).length) lines.push("| _none_ | | | | | | | | | | |");
  lines.push("", "## Runs", "", "### By size", "", table(r.runs.bySize, ["Size", "Runs"]), "### By mode", "", table(r.runs.byMode, ["Mode", "Runs"]), "### By verdict", "", table(r.runs.byVerdict, ["Verdict", "Runs"]), "### By status", "", table(r.runs.byStatus, ["Status", "Runs"]));
  lines.push("## Agents", "", table(r.agents, ["Role and status", "Count"]), "## Checks", "", table(r.checks, ["Tool and result", "Count"]));
  lines.push("## Decisions", "");
  if (Object.keys(r.decisions).length === 0) lines.push("_none_", "");
  for (const [kind, values] of Object.entries(r.decisions)) lines.push(`### ${kind}`, "", table(values, ["Value", "Times"]));
  lines.push("## Consistency violations", "");
  if (r.violations.length === 0) lines.push("_none_", "");
  for (const v of r.violations) lines.push(`- \`${v.run}\` **${v.kind}**: ${v.id}`);
  if (r.violations.length) lines.push("");
  lines.push("## Timeline", "", "| Run | Entry | Size | H | N | Mode | Candidates | Verdict | Status | Seconds |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const t of r.timeline) lines.push(`| ${t.run} | ${t.entry ?? "-"} | ${t.size ?? "-"} | ${t.H ?? "-"} | ${t.N ?? "-"} | ${t.mode ?? "-"} | ${t.candidates} | ${t.verdict ?? "-"} | ${t.status} | ${t.durationSec ?? "-"} |`);
  if (r.malformed.length) {
    lines.push("", "## Malformed trace lines", "");
    for (const m of r.malformed) lines.push(`- ${m.file}:${m.line} — ${m.errors.join("; ")}`);
  }
  return lines.join("\n") + "\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const targets = args.filter((a) => !a.startsWith("--"));
  const files = (targets.length ? targets : [tracePath(traceDir())]).flatMap(findTraceFiles);
  const report = files.length ? buildReport(files) : null;
  if (!report) {
    console.log(`No review trace under ${targets.join(", ") || traceDir()} — nothing to report.`);
    process.exit(2);
  }
  console.log(args.includes("--json") ? JSON.stringify(report, null, 2) : toMarkdown(report));
}
