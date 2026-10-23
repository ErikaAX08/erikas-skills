#!/usr/bin/env node
// Mechanical check of a review report against assets/review-template.md and SKILL.md Phase 7–8,
// run by the skill before it emits the report (SKILL.md §11 item 13). It checks only what is
// invariant across report languages: verdict and owner keys, severity markers, finding IDs,
// certainty labels, the [prerequisite] tag, the `Review not performed:` form — plus a
// second-person scan in English and Spanish.
//
//   node check-report.mjs <report.md | -> [--trace <runs.jsonl> --run <RUN_ID>] [--json]
//     Exit 0 = no ERROR, 1 = at least one ERROR (each printed with its code), 64 = usage.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace } from "./lib/trace.mjs";

export const VERDICTS = ["changes required", "verification required", "decision required", "ready to merge"];
export const OWNERS = ["author", "merger", "product", "operations", "architecture"];
const LEGACY = /\*\*\s*(request changes|approve with conditions|approve|do not approve until [^*]+ is verified)\s*\*\*/i;
const MARKERS = ["🔴", "🟡", "🚀", "⚪", "✅"];
const CERTAINTY = /:\s*\**\s*(Fact|Inference|Conditional risk|Open question)\b/;
const OWNER_FOR = {
  "changes required": ["author"],
  "verification required": ["author", "operations"],
  "decision required": ["product", "operations", "architecture"],
  "ready to merge": ["merger"],
};

// Prose without code, quotes, or citations, for the second-person scan.
function prose(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/"[^"\n]*"|“[^”\n]*”|«[^»\n]*»/g, " ")
    .split("\n")
    .filter((l) => !/^\s*>/.test(l))
    .join("\n");
}

export function expectedVerdict({ red, prerequisites, yellow }) {
  if (red) return "changes required";
  if (prerequisites) return "verification required";
  if (yellow) return "decision required";
  return "ready to merge";
}

export function checkReport(text, { traceEvents = null } = {}) {
  const errors = [];
  const err = (code, msg) => errors.push({ code, msg });
  const t = text.replace(/\r\n/g, "\n").trim();

  if (/^Review not performed:/.test(t)) {
    if (!/^Review not performed: .+\. Needed: .+\.$/.test(t) || t.includes("\n")) {
      err("R01", "`Review not performed` must be the whole output, one line: `Review not performed: <reason>. Needed: <input or action>.`");
    }
    return finish({ errors, verdict: "not-performed", owner: null, findings: [], traceEvents });
  }
  if (/Review not performed/i.test(t)) {
    err("R01", "`Review not performed:` must open the output and be its only line");
    return finish({ errors, verdict: "not-performed", owner: null, findings: [], traceEvents });
  }

  const lines = t.split("\n");
  const first = lines.find((l) => l.trim());
  if (!first || !/^[^\s#*>][^:\n]{0,30}:\s/.test(first) || (first.match(/·/g) ?? []).length < 4) {
    err("H01", "the report must open with the Scope header line (`Scope: repo … · entry point … · base … · …`), no preamble");
  }
  if (LEGACY.test(t)) err("V00", `legacy verdict key \`${t.match(LEGACY)[1]}\`; use one of: ${VERDICTS.join(", ")}`);

  const verdictLines = lines.map((l, i) => ({ l, i, m: l.match(/^[^:\n*]{1,30}:\s*\*\*\s*([a-z ]+?)\s*\*\*\s*$/) })).filter((x) => x.m && VERDICTS.includes(x.m[1]));
  let verdict = null;
  let owner = null;
  if (verdictLines.length !== 1) {
    err("V01", `expected exactly one verdict line \`<label>: **<${VERDICTS.join(" | ")}>**\`, found ${verdictLines.length}`);
  } else {
    verdict = verdictLines[0].m[1];
    const after = lines.slice(verdictLines[0].i + 1).filter((l) => l.trim());
    const next = after[0] ?? "";
    const m = next.match(/^[^:\n*]{1,30}:\s*\*\*\s*([a-z]+)\s*\*\*\s*[—–-]\s*\S/);
    if (!m || !OWNERS.includes(m[1])) err("V02", "the line after the verdict must be `<Next label>: **<owner>** — <one action>` with owner one of: " + OWNERS.join(", "));
    else {
      owner = m[1];
      if (!OWNER_FOR[verdict].includes(owner)) err("V03", `owner \`${owner}\` does not act on \`${verdict}\` (expected ${OWNER_FOR[verdict].join(" or ")})`);
    }
    const unblocks = after[1] ?? "";
    if (!/^[^:\n*]{1,30}:\s*\S/.test(unblocks)) err("V04", "the third header line must be `<Unblocks-when label>: <outcome map>`");
    else if (verdict !== "ready to merge" && !unblocks.includes("→")) err("V04", "a blocked verdict needs an outcome map: `<result> → <verdict>; …` for every blocking item");
  }

  // Findings: `### <marker> F-n — <title>`; the body runs to the next heading.
  const findings = [];
  lines.forEach((l, i) => {
    if (!/^#{2,5}\s/.test(l) || !MARKERS.some((mk) => l.includes(mk))) return;
    const m = l.match(/^###\s*(🔴|🟡|🚀|⚪|✅)\s*(F-(\d+))\s*—\s*\S/u);
    if (!m) {
      err("F01", `finding heading not in the form \`### <marker> F-n — <title>\`: ${l.trim().slice(0, 80)}`);
      return;
    }
    const body = [];
    for (let j = i + 1; j < lines.length && !/^#{1,5}\s/.test(lines[j]); j++) body.push(lines[j]);
    findings.push({ marker: m[1], id: m[2], n: Number(m[3]), line: i + 1, body: body.join("\n") });
  });
  findings.forEach((f, k) => {
    if (f.n !== k + 1) err("F02", `finding IDs must run F-1, F-2, … in report order; found ${f.id} at position ${k + 1}`);
    if (k && MARKERS.indexOf(f.marker) < MARKERS.indexOf(findings[k - 1].marker)) err("F03", `${f.id} (${f.marker}) is out of category order 🔴, 🟡, 🚀, ⚪, ✅`);
    if (f.marker !== "✅") {
      const c = f.body.match(CERTAINTY);
      if (!c) err("F04", `${f.id} has no certainty label (Fact | Inference | Conditional risk | Open question)`);
      else if (f.marker === "🔴" && !["Fact", "Inference"].includes(c[1])) err("F05", `${f.id} is 🔴 with certainty \`${c[1]}\`; a 🔴 requires Fact or Inference`);
    }
    if (f.marker === "🟡") {
      const options = f.body.split("\n").filter((l) => /^\s*[-*]\s*[A-Z]:/.test(l));
      if (options.length < 2) err("F06", `${f.id} (🟡) needs ≥2 options as \`- A: <option> → <consequence> → verdict \`<key>\`\``);
      else if (options.some((o) => !o.includes("→"))) err("F06", `${f.id} (🟡): every option must state its consequence and resulting verdict with →`);
    }
  });

  const prereqs = lines.filter((l) => l.includes("[prerequisite]") && /^\s*(?:[-*]|\d+[.)])\s+/.test(l));
  prereqs.forEach((l) => {
    if (!/\*\*(author|operations)\*\*/.test(l)) err("P01", `[prerequisite] without an owner (**author** or **operations**): ${l.trim().slice(0, 80)}`);
    if (!l.includes("→")) err("P02", `[prerequisite] without its outcome map (\`<result> → <verdict>\`): ${l.trim().slice(0, 80)}`);
  });

  const count = (mk) => findings.filter((f) => f.marker === mk).length;
  const expected = expectedVerdict({ red: count("🔴"), prerequisites: prereqs.length, yellow: count("🟡") });
  if (verdict && verdict !== expected) err("V05", `verdict \`${verdict}\` contradicts the findings (${count("🔴")} 🔴, ${prereqs.length} [prerequisite], ${count("🟡")} 🟡 → \`${expected}\`)`);

  const p = prose(t);
  const second = p.match(/\b(you|your|yours|you're|yourself)\b/i) ?? p.match(/(?<![\p{L}])(tú|tu|tus|usted|ustedes|contigo)(?![\p{L}])/iu);
  if (second) err("S01", `second-person address (\`${second[1]}\`): write about the PR and refer to people by role`);
  if (/\bLGTM\b/i.test(p)) err("S02", "`LGTM` and equivalents are forbidden");

  return finish({ errors, verdict, owner, findings, traceEvents });
}

function finish({ errors, verdict, owner, findings, traceEvents }) {
  if (traceEvents) {
    const end = traceEvents.filter((e) => e.event === "run.end").at(-1);
    if (!end) errors.push({ code: "T01", msg: "the trace has no run.end for this run" });
    else {
      const traced = end.data.status === "not-performed" ? "not-performed" : end.data.verdict;
      if (traced !== verdict) errors.push({ code: "T02", msg: `trace verdict \`${traced}\` ≠ report verdict \`${verdict}\`` });
      if (verdict !== "not-performed" && end.data.owner && end.data.owner !== owner) errors.push({ code: "T03", msg: `trace owner \`${end.data.owner}\` ≠ report owner \`${owner}\`` });
    }
  }
  return { ok: errors.length === 0, errors, verdict, owner, findings: findings.map(({ marker, id }) => ({ marker, id })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a, i) => !a.startsWith("--") && !["--trace", "--run"].includes(args[i - 1]));
  const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  if (!file) {
    console.error("usage: check-report.mjs <report.md | -> [--trace <runs.jsonl> --run <RUN_ID>] [--json]");
    process.exit(64);
  }
  const text = fs.readFileSync(file === "-" ? 0 : file, "utf8");
  let traceEvents = null;
  if (opt("--trace")) {
    const run = opt("--run");
    traceEvents = readTrace(opt("--trace")).events.filter((e) => !run || e.run === run);
  }
  const r = checkReport(text, { traceEvents });
  if (args.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    for (const e of r.errors) console.log(`ERROR ${e.code}: ${e.msg}`);
    console.log(r.ok ? `OK: verdict \`${r.verdict}\`, owner \`${r.owner ?? "-"}\`, ${r.findings.length} finding(s)` : `${r.errors.length} error(s) — fix them and re-run before emitting the report`);
  }
  process.exit(r.ok ? 0 : 1);
}
