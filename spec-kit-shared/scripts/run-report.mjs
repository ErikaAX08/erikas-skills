#!/usr/bin/env node
// Summarizes spec-kit run logs (spec-kit-shared/artifact-conventions.md § Run Log) into the numbers a
// retrospective needs, plus "signals": recurring patterns that point at a skill or rule to improve.
//
//   node run-report.mjs <feature-dir | .speckit-dir> [--json]
//     a feature directory reports that feature; a .speckit directory aggregates every feature
//     under specs/ plus project-wide runs. Exit 0 = report written, 2 = no run log found.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArtifact } from "./lib/artifacts.mjs";
import { readLog } from "./lib/runlog.mjs";

function sources(dir) {
  const abs = path.resolve(dir);
  if (path.basename(abs) !== ".speckit") return [abs];
  const specs = path.join(abs, "specs");
  const features = fs.existsSync(specs)
    ? fs.readdirSync(specs, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(specs, e.name))
    : [];
  return [abs, ...features];
}

const count = (list, key) => list.reduce((acc, x) => ((acc[key(x)] = (acc[key(x)] ?? 0) + 1), acc), {});

export function buildReport(dir) {
  const events = [];
  const malformed = [];
  const amendments = [];
  for (const src of sources(dir)) {
    const log = readLog(src);
    const feature = path.basename(src);
    events.push(...log.events.map((e) => ({ ...e, feature })));
    malformed.push(...log.malformed.map((m) => ({ ...m, feature })));
    const amendFile = path.join(src, "amendments.md");
    if (fs.existsSync(amendFile)) {
      for (const d of parseArtifact(amendFile).defs.filter((x) => /^AM-\d+$/.test(x.id))) {
        const field = (name) => (d.block.match(new RegExp(`\\*\\*${name}\\*\\*:\\s*([^\\n]+)`, "i")) ?? [])[1]?.trim();
        amendments.push({ feature, id: d.id, layer: (field("Layer") ?? "").split(/\s/)[0], status: (field("Status") ?? "").split(/\s/)[0], origin: field("Origin") ?? "" });
      }
    }
  }
  if (events.length === 0 && malformed.length === 0) return null;
  events.sort((a, b) => a.ts.localeCompare(b.ts));

  const runs = new Map();
  for (const e of events) {
    if (!runs.has(e.run)) runs.set(e.run, { run: e.run, skill: e.skill, feature: e.feature, start: null, end: null, events: [] });
    const r = runs.get(e.run);
    r.events.push(e);
    if (e.event === "run.start") r.start = e;
    if (e.event === "run.end") r.end = e;
  }
  const runList = [...runs.values()];
  const of = (type) => events.filter((e) => e.event === type);
  const decisions = of("decision");
  const lintChecks = of("check").filter((e) => e.data.tool === "lint");
  const records = of("artifact").filter((e) => e.data.action === "record");

  const report = {
    scope: path.resolve(dir),
    period: { from: events[0]?.ts, to: events.at(-1)?.ts },
    runs: {
      total: runList.length,
      bySkill: count(runList, (r) => r.skill),
      byStatus: count(runList, (r) => r.end?.data.status ?? "open"),
      stoppedReasons: count(runList.filter((r) => r.end?.data.status === "stopped"), (r) => r.end.data.reason ?? "(no reason)"),
      open: runList.filter((r) => !r.end).map((r) => `${r.run} (${r.skill})`),
    },
    decisions: Object.fromEntries(Object.entries(groupBy(decisions, (d) => d.data.kind)).map(([k, list]) => [k, count(list, (d) => String(d.data.value))])),
    lint: {
      runs: lintChecks.length,
      last: lintChecks.at(-1) ? { blocking: lintChecks.at(-1).data.blocking, advisory: lintChecks.at(-1).data.advisory, at: lintChecks.at(-1).ts } : null,
      blockingRunsByCode: count(lintChecks.filter((c) => c.data.blocking > 0).flatMap((c) => c.data.codes ?? []).map((code) => ({ code })), (x) => x.code),
    },
    findings: count(of("finding"), (f) => `${f.data.origin} ${f.data.severity}`),
    records: count(records, (r) => r.data.path),
    user: count(of("user"), (u) => u.data.kind),
    deviations: of("deviation").map((d) => ({ at: d.ts, skill: d.skill, rule: d.data.rule, reason: d.data.reason, approved_by: d.data.approved_by ?? null })),
    amendments: { total: amendments.length, byLayer: count(amendments, (a) => a.layer || "(none)"), byStatus: count(amendments, (a) => a.status || "(none)") },
    malformed,
    timeline: runList.map((r) => ({ at: r.start?.ts ?? r.events[0].ts, run: r.run, feature: r.feature, skill: r.skill, status: r.end?.data.status ?? "open", decisions: r.events.filter((e) => e.event === "decision").length, next: r.end?.data.next ?? "" })),
  };
  report.signals = signals(report, decisions, lintChecks, amendments);
  return report;
}

function groupBy(list, key) {
  return list.reduce((acc, x) => ((acc[key(x)] ??= []).push(x), acc), {});
}

// Each signal names the evidence that triggered it and where to look; none is a verdict.
function signals(report, decisions, lintChecks, amendments) {
  const out = [];
  const add = (id, evidence, look) => out.push({ id, evidence, look });
  for (const [file, n] of Object.entries(report.records)) {
    if (file === "spec.md" && n >= 4) add("spec-churn", `spec.md recorded ${n} times`, "Are these behavior changes? Check `layer` decisions against artifact-conventions § Layer Ownership; technical changes should not version the spec.");
  }
  const specFromReview = amendments.filter((a) => a.layer === "spec" && /pre-pr-review/i.test(a.origin));
  if (specFromReview.length >= 2) add("late-spec-defects", `${specFromReview.length} spec-layer amendments came from pre-pr-review (${specFromReview.map((a) => a.id).join(", ")})`, "Spec defects surface only at review: strengthen generate-spec Phase 7 checks and analyze-consistency Phase 9 for this kind of finding.");
  const refuted = decisions.filter((d) => d.data.kind === "probe" && /refuted/i.test(String(d.data.value)));
  if (refuted.length) add("refuted-premise", `${refuted.length} probe(s) refuted a planned premise (${refuted.flatMap((d) => d.data.ids ?? []).join(", ") || "no IDs"})`, "Check whether the plan recorded these premises as executed (L15, generate-plan Rule 4) or correctly as assumption.");
  const readEvidence = decisions.filter((d) => d.data.kind === "evidence" && String(d.data.value) === "read");
  if (readEvidence.length >= 3) add("read-only-evidence", `${readEvidence.length} evidence decisions settled at "read"`, "Runtime premises need executed evidence; review whether any of these were runtime claims.");
  for (const [code, n] of Object.entries(report.lint.blockingRunsByCode)) {
    if (n >= 2) add("recurring-blocking", `lint ${code} was BLOCKING in ${n} runs`, `The skill that writes the artifact behind ${code} is not preventing it; see artifact-conventions § Mechanical Checks.`);
  }
  const driftStops = Object.entries(report.runs.stoppedReasons).filter(([reason]) => /drift|stale|fase 0/i.test(reason)).reduce((n, [, c]) => n + c, 0);
  if (driftStops >= 2) add("repeated-drift-stops", `${driftStops} runs stopped on drift`, "Artifacts are being edited outside their owners, or decided changes are not going through spec-kit-amend-artifacts.");
  if (report.deviations.length) add("rule-deviations", `${report.deviations.length} rule deviation(s): ${[...new Set(report.deviations.map((d) => d.rule))].join(", ")}`, "A rule that is often overridden is either wrong for real situations or poorly explained; review it.");
  if (report.runs.open.length) add("open-runs", `${report.runs.open.length} run(s) have no run.end`, "A skill stopped without closing its log: look for failures or interrupted sessions.");
  if (report.malformed.length) add("malformed-log", `${report.malformed.length} malformed log line(s)`, "Events were written by hand instead of with log-event.mjs.");
  const reviewRoutes = decisions.filter((d) => d.data.kind === "verdict-route");
  const changes = reviewRoutes.filter((d) => /request changes/.test(String(d.data.value))).length;
  if (changes >= 2) add("review-churn", `${changes} review gates returned request changes`, "Compare the findings' origins: the earlier skill that should have caught them is the one to improve.");
  return out;
}

function table(obj, headers) {
  const rows = Object.entries(obj);
  if (rows.length === 0) return "_none_\n";
  return `| ${headers[0]} | ${headers[1]} |\n| --- | --- |\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}\n`;
}

export function toMarkdown(r) {
  const lines = [];
  lines.push(`# Run Report`, "", `**Scope**: \`${r.scope}\`  `, `**Period**: ${r.period.from ?? "-"} → ${r.period.to ?? "-"}  `, `**Runs**: ${r.runs.total}`, "");
  lines.push("## Signals", "");
  if (r.signals.length === 0) lines.push("_No pattern crossed a threshold._", "");
  for (const s of r.signals) lines.push(`- **${s.id}** — ${s.evidence}. ${s.look}`);
  if (r.signals.length) lines.push("");
  lines.push("## Runs", "", "### By skill", "", table(r.runs.bySkill, ["Skill", "Runs"]), "### By status", "", table(r.runs.byStatus, ["Status", "Runs"]));
  if (Object.keys(r.runs.stoppedReasons).length) lines.push("### Why runs stopped", "", table(r.runs.stoppedReasons, ["Reason", "Runs"]));
  lines.push("## Decisions", "");
  if (Object.keys(r.decisions).length === 0) lines.push("_none_", "");
  for (const [kind, values] of Object.entries(r.decisions)) lines.push(`### ${kind}`, "", table(values, ["Value", "Times"]));
  lines.push("## Checks", "", `Lint runs: ${r.lint.runs}${r.lint.last ? ` — last at ${r.lint.last.at}: ${r.lint.last.blocking} BLOCKING, ${r.lint.last.advisory} ADVISORY` : ""}`, "", "### Runs where a code was BLOCKING", "", table(r.lint.blockingRunsByCode, ["Code", "Runs"]));
  lines.push("## Findings", "", table(r.findings, ["Origin and severity", "Count"]));
  lines.push("## Artifact versions (records)", "", table(r.records, ["Artifact", "Records"]));
  lines.push("## Amendments", "", `Total: ${r.amendments.total}`, "", "### By layer", "", table(r.amendments.byLayer, ["Layer", "Count"]), "### By status", "", table(r.amendments.byStatus, ["Status", "Count"]));
  lines.push("## User interaction", "", table(r.user, ["Kind", "Count"]));
  lines.push("## Rule deviations", "");
  if (r.deviations.length === 0) lines.push("_none_", "");
  for (const d of r.deviations) lines.push(`- ${d.at} \`${d.skill}\` — **${d.rule}**: ${d.reason}${d.approved_by ? ` (approved by ${d.approved_by})` : ""}`);
  if (r.deviations.length) lines.push("");
  lines.push("## Timeline", "", "| Started | Feature | Skill | Status | Decisions | Next |", "| --- | --- | --- | --- | --- | --- |");
  for (const t of r.timeline) lines.push(`| ${t.at} | ${t.feature} | ${t.skill} | ${t.status} | ${t.decisions} | ${t.next} |`);
  if (r.malformed.length) {
    lines.push("", "## Malformed log lines", "");
    for (const m of r.malformed) lines.push(`- ${m.feature}/runs.jsonl:${m.line} — ${m.errors.join("; ")}`);
  }
  return lines.join("\n") + "\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("usage: run-report.mjs <feature-dir | .speckit-dir> [--json]");
    process.exit(64);
  }
  const report = buildReport(dir);
  if (!report) {
    console.log(`No run log under ${dir} — nothing to report.`);
    process.exit(2);
  }
  console.log(args.includes("--json") ? JSON.stringify(report, null, 2) : toMarkdown(report));
}
