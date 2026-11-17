#!/usr/bin/env node
// Mechanical check of a review response, run by the skill before it emits it (SKILL.md §11 item 13).
// A response is the author report (assets/author-report-template.md) followed by the audit report
// (assets/review-template.md) inside <details>; `checkReport` checks the audit against SKILL.md Phase 7–8,
// `checkResponse` checks both and that the author report agrees with the audit. Only what is invariant
// across report languages is checked: verdict and owner keys, severity markers and values, finding IDs,
// certainty labels, the [prerequisite] tag, section numbers, review-format verdict labels, the
// `Review not performed:` form — plus a second-person scan in English and Spanish.
//
//   node check-report.mjs <response.md | -> [--trace <runs.jsonl> --run <RUN_ID>] [--external <findings.json>] [--json]
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
// A whole line `<label>: <value>` (an optional final period allowed), so prose such as "Impact: High traffic…"
// or "Impact: High (3 tenants)" is never read as a severity. The template shows the value alone for that reason.
const SEVERITY = /^[^:\n]{1,30}:\s*\**\s*(Critical|High|Medium|Low)\s*\**\s*\.?\s*$/m;
const SEVERITY_FOR = { "🔴": ["Critical", "High"], "🟡": ["High", "Medium"], "🚀": ["High", "Medium"], "⚪": ["Medium"] };
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

// Indices of lines inside a matched code fence, markers included: an opener of three or more backticks or
// tildes (a backtick opener's info string has no backtick) and a later closer of the same character, at least
// as long, with nothing after it. An opener without a closer fences nothing, so it cannot hide what follows.
export function fenceRanges(lines, unclosed = []) {
  const ranges = [];
  for (let i = 0; i < lines.length; i++) {
    const o = lines[i].match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!o || (o[1][0] === "`" && o[2].includes("`"))) continue;
    const close = new RegExp(`^\\s*\\${o[1][0]}{${o[1].length},}\\s*$`);
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j])) j++;
    if (j === lines.length) {
      unclosed.push(i);
      continue;
    }
    ranges.push([i, j]);
    i = j;
  }
  return ranges;
}

export function fencedLines(lines) {
  const inside = new Set();
  for (const [i, j] of fenceRanges(lines)) for (let k = i; k <= j; k++) inside.add(k);
  return inside;
}

// The supplied findings' IDs (assets/supplied-findings.md) as text, for E01; shared with the eval harness.
export function suppliedFindingIds(json) {
  const found = json?.findings;
  return (Array.isArray(found) ? found : []).map((f) => String(f?.id ?? "").trim()).filter(Boolean);
}

export function expectedVerdict({ red, prerequisites, yellow }) {
  if (red) return "changes required";
  if (prerequisites) return "verification required";
  if (yellow) return "decision required";
  return "ready to merge";
}

export function checkReport(text, { traceEvents = null, external = null } = {}) {
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
    const before = lines.slice(0, verdictLines[0].i).filter((l) => l.trim()).at(-1) ?? "";
    if (!/\[risks:\s*[^\]\n]+\]/.test(before)) err("H02", "the line right before the verdict must be the change summary ending in `[risks: F-n, …]` or `[risks: none]`");
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
    const text = body.join("\n");
    findings.push({ marker: m[1], id: m[2], n: Number(m[3]), line: i + 1, body: text, severity: (text.match(SEVERITY) ?? [])[1] ?? null });
  });
  findings.forEach((f, k) => {
    if (f.n !== k + 1) err("F02", `finding IDs must run F-1, F-2, … in report order; found ${f.id} at position ${k + 1}`);
    if (k && MARKERS.indexOf(f.marker) < MARKERS.indexOf(findings[k - 1].marker)) err("F03", `${f.id} (${f.marker}) is out of category order 🔴, 🟡, 🚀, ⚪, ✅`);
    if (f.marker !== "✅") {
      const c = f.body.match(CERTAINTY);
      if (!c) err("F04", `${f.id} has no certainty label (Fact | Inference | Conditional risk | Open question)`);
      else if (f.marker === "🔴" && !["Fact", "Inference"].includes(c[1])) err("F05", `${f.id} is 🔴 with certainty \`${c[1]}\`; a 🔴 requires Fact or Inference`);
      const s = f.body.match(SEVERITY);
      if (!s) err("F07", `${f.id} has no severity (${SEVERITY_FOR[f.marker].join(" | ")})`);
      else if (!SEVERITY_FOR[f.marker].includes(s[1])) err("F07", `${f.id} is ${f.marker} with severity \`${s[1]}\`; expected ${SEVERITY_FOR[f.marker].join(" or ")} (Low is never emitted)`);
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

  // Every supplied finding (assets/supplied-findings.md) needs a disposition line: `- <id> → …`.
  for (const id of external ?? []) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!lines.some((l) => new RegExp(`^\\s*[-*]\\s+(?:\\*\\*)?\`?${esc}\`?(?:\\*\\*)?\\s*→\\s*\\S`).test(l))) err("E01", `supplied finding \`${id}\` has no disposition line (\`- ${id} → F-n | discarded: <reason> | out of scope: style\`)`);
  }

  // Checklist: `- [ ] [before-merge|before-deploy|after-deploy] <action> — anchor: <F-n | still-open <name> | file <path> | flow <name>>`.
  // Task-list lines inside fenced code (quoted evidence) are not checklist items.
  const fenced = fencedLines(lines);
  const items = lines.filter((l, i) => !fenced.has(i) && /^\s*[-*]\s+\[[ xX]\]\s/.test(l));
  // A fence that is never closed renders every later section as code (CommonMark), including the Checklist.
  // A closed fence never raises C03, so quoting Markdown with headings stays valid; two fences that pair by
  // accident cannot be told apart from an intentional quote and are a known limit.
  const unclosed = [];
  fenceRanges(lines, unclosed);
  for (const i of unclosed) {
    const h = lines.findIndex((l, k) => k > i && /^##\s/.test(l));
    if (h >= 0) err("C03", `the code fence opened on report line ${i + 1} is never closed, so everything from the section heading on line ${h + 1} renders as code; close it`);
  }
  for (const l of items) {
    if (!/\[(before-merge|before-deploy|after-deploy)\]/.test(l) || !/anchor:\s*(F-\d+\b|still-open\s+\S|file\s+\S|flow\s+\S)/.test(l)) {
      err("C02", `checklist item without a group tag or an \`anchor:\` (F-n, still-open <name>, file <path>, flow <name>): ${l.trim().slice(0, 80)}`);
    }
  }
  const anchored = (group) => items.filter((l) => l.includes(`[${group}]`)).map((l) => (l.match(/anchor:\s*(.+)$/) ?? [])[1] ?? "");
  const merge = anchored("before-merge");
  const hasF = (list, id) => list.some((a) => new RegExp(`^${id}\\b`).test(a.trim()));
  for (const f of findings.filter((f) => f.marker === "🔴" || f.marker === "🟡")) {
    if (!hasF(merge, f.id)) err("C01", `${f.id} (${f.marker}) has no \`[before-merge]\` checklist item anchored to it`);
  }
  for (const l of prereqs) {
    const plain = (x) => x.replace(/[*`]/g, "").trim().toLowerCase();
    const name = (l.match(/\[prerequisite\]\s*([^(:]+?)\s*(?:\(|:)/) ?? [])[1];
    if (name && !merge.some((a) => /^still-open\s/.test(plain(a)) && plain(a).includes(plain(name)))) err("C01", `[prerequisite] \`${name}\` has no \`[before-merge]\` checklist item anchored as \`still-open ${name}\``);
  }
  const deploy = anchored("before-deploy").map((a) => (a.trim().match(/^F-(\d+)\b/) ?? [])[1]).filter(Boolean).map(Number);
  const steps = findings.filter((f) => f.marker === "🚀").map((f) => f.n);
  for (const n of steps) if (!deploy.includes(n)) err("C01", `F-${n} (🚀) has no \`[before-deploy]\` checklist item anchored to it`);
  // Order is checked on the first item anchored to each 🚀; later items for the same step (environment checks) may follow anywhere.
  const order = [...new Set(deploy.filter((n) => steps.includes(n)))];
  if (order.some((n, k) => k && n < order[k - 1])) err("C01", "`[before-deploy]` items for 🚀 steps must follow their ID order");

  const p = prose(t);
  const second = p.match(/\b(you|your|yours|you're|yourself)\b/i) ?? p.match(/(?<![\p{L}])(tú|tu|tus|usted|ustedes|contigo)(?![\p{L}])/iu);
  if (second) err("S01", `second-person address (\`${second[1]}\`): write about the PR and refer to people by role`);
  if (/\bLGTM\b/i.test(p)) err("S02", "`LGTM` and equivalents are forbidden");

  return finish({ errors, verdict, owner, findings, traceEvents });
}

// Review-format verdict labels printed by the author report (SKILL.md §2). `decision required` has no
// equivalent of its own: the merge waits on a decision, so it prints the pending-validation label.
export const LABELS = ["APPROVE", "APPROVE WITH SUGGESTIONS", "REQUEST CHANGES", "BLOCKED – PENDING VALIDATION"];
export function reviewLabel(verdict, findings = []) {
  if (verdict === "changes required") return "REQUEST CHANGES";
  if (verdict === "verification required" || verdict === "decision required") return "BLOCKED – PENDING VALIDATION";
  if (verdict === "ready to merge") return findings.some((f) => f.marker === "⚪") ? "APPROVE WITH SUGGESTIONS" : "APPROVE";
  return null;
}

// Checklist items outside fenced code, trimmed.
export function checklistItems(lines) {
  const fenced = fencedLines(lines);
  return lines.filter((l, i) => !fenced.has(i) && /^\s*[-*]\s+\[[ xX]\]\s/.test(l)).map((l) => l.trim());
}

// Splits a response into the author report and the audit report it carries in a <details> block: the first one
// after the author report's `## 6.` section, closed by the last `</details>`, so a <details> quoted inside the
// audit never splits it. A text without that block is all audit (an older report, or one without the author report).
export function splitResponse(text) {
  const t = text.replace(/\r\n/g, "\n");
  const lines = t.split("\n");
  const six = Math.max(0, lines.findIndex((l) => /^##\s+6\.\s+\S/.test(l)));
  const open = lines.findIndex((l, i) => i >= six && /^<details>$/.test(l.trim()));
  if (open < 0) return { author: null, audit: t, closed: false, trailing: "" };
  let k = open + 1;
  while (k < lines.length && !lines[k].trim()) k++;
  if (/^<summary>.*<\/summary>$/.test((lines[k] ?? "").trim())) k++;
  const close = lines.findLastIndex((l, i) => i > open && l.trim() === "</details>");
  return {
    author: lines.slice(0, open).join("\n"),
    audit: lines.slice(k, close < 0 ? undefined : close).join("\n").replace(/^(\s*<!--[\s\S]*?-->)+/, "").trim(),
    closed: close >= 0,
    trailing: close < 0 ? "" : lines.slice(close + 1).join("\n").trim(),
  };
}

// The author report's six numbered sections, in order; every one of them restates the audit, never adds to it.
export function checkAuthorReport(author, audit, { external = null } = {}) {
  const errors = [];
  const err = (code, msg) => errors.push({ code, msg });
  // HTML comments render as nothing; blank them out, keeping line numbers.
  const lines = author.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, "")).split("\n");
  const fenced = fencedLines(lines);
  const heads = lines.map((l, i) => ({ i, m: !fenced.has(i) && l.match(/^##\s+(\d+)\.\s+\S/) })).filter((x) => x.m);
  const first = lines.findIndex((l) => l.trim());
  if (!heads.length || heads[0].i !== first) err("A01", "the response must open with the author report's `## 1. <summary heading>`, no preamble");
  const numbers = heads.map((h) => Number(h.m[1]));
  if (numbers.join(",") !== "1,2,3,4,5,6") err("A01", `the author report needs sections \`## 1.\` … \`## 6.\` once each, in order; found ${numbers.join(", ") || "none"}`);
  const section = (n) => {
    const h = heads.find((x) => Number(x.m[1]) === n);
    if (!h) return [];
    const end = heads.find((x) => x.i > h.i)?.i ?? lines.length;
    return lines.slice(h.i + 1, end).map((l, k) => ({ l, i: h.i + 1 + k }));
  };

  // Section 2 lists every audit finding, ✅ included, with the audit's marker and severity: `### <marker> F-n · <severity> — <title>`.
  const listed = new Map();
  for (const { l, i } of section(2)) {
    if (fenced.has(i) || !/^#{3,5}\s/.test(l) || !/F-\d+/.test(l)) continue;
    const m = l.match(/^###\s*(🔴|🟡|🚀|⚪|✅)\s*(F-\d+)\s*(?:·\s*(Critical|High|Medium|Low)\s*)?—\s*\S/u);
    if (!m) err("A02", `author finding heading not in the form \`### <marker> F-n · <severity> — <title>\`: ${l.trim().slice(0, 80)}`);
    else if (listed.has(m[2])) err("A02", `${m[2]} is listed twice in section 2`);
    else listed.set(m[2], { marker: m[1], severity: m[3] ?? null });
  }
  for (const f of audit.findings) {
    const a = listed.get(f.id);
    if (!a) err("A02", `${f.id} (${f.marker}) from the audit report is missing from section 2`);
    else if (a.marker !== f.marker) err("A02", `${f.id} is ${a.marker} in section 2 but ${f.marker} in the audit report`);
    else if (f.marker !== "✅" && a.severity !== f.severity) err("A03", `${f.id} carries severity \`${a.severity ?? "none"}\` in section 2 but \`${f.severity}\` in the audit report`);
  }
  for (const id of listed.keys()) if (!audit.findings.some((f) => f.id === id)) err("A02", `${id} is in section 2 but not in the audit report`);
  for (const id of external ?? []) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!section(2).some(({ l }) => new RegExp(`^\\s*[-*]\\s+(?:\\*\\*)?\`?${esc}\`?(?:\\*\\*)?\\s*→\\s*\\S`).test(l))) err("A06", `supplied finding \`${id}\` has no disposition line in section 2`);
  }

  // Section 5 is the audit's Checklist, item for item.
  const mine = checklistItems(section(5).map(({ l }) => l)).sort();
  const theirs = checklistItems(audit.lines).sort();
  if (mine.join("\n") !== theirs.join("\n")) {
    const missing = theirs.filter((x) => !mine.includes(x)).length;
    const extra = mine.filter((x) => !theirs.includes(x)).length;
    err("A05", `section 5 must repeat the audit Checklist verbatim (${missing} item(s) missing, ${extra} not in the audit)`);
  }

  // Section 6 prints exactly one review-format label, mapped from the audit verdict, with the verdict key.
  const expected = reviewLabel(audit.verdict, audit.findings);
  const labelRe = /\*\*\s*(APPROVE WITH SUGGESTIONS|APPROVE|REQUEST CHANGES|BLOCKED\s*[–—-]\s*PENDING VALIDATION)\s*\*\*/;
  const labelled = section(6).filter(({ l }) => labelRe.test(l));
  let label = null;
  if (labelled.length !== 1) err("A04", `section 6 needs exactly one bold label (${LABELS.join(" | ")}); found ${labelled.length}`);
  else {
    label = labelled[0].l.match(labelRe)[1].replace(/\s*[–—-]\s*/, " – ");
    if (expected && label !== expected) err("A04", `label \`${label}\` does not match the audit verdict \`${audit.verdict}\` (expected \`${expected}\`)`);
    if (audit.verdict && !labelled[0].l.includes(`\`${audit.verdict}\``)) err("A04", `the label line must carry the verdict key in backticks: \`${audit.verdict}\``);
  }

  const p = prose(lines.join("\n"));
  const second = p.match(/\b(you|your|yours|you're|yourself)\b/i) ?? p.match(/(?<![\p{L}])(tú|tu|tus|usted|ustedes|contigo)(?![\p{L}])/iu);
  if (second) err("S01", `second-person address in the author report (\`${second[1]}\`): write about the PR and refer to people by role`);
  if (/\bLGTM\b/i.test(p)) err("S02", "`LGTM` and equivalents are forbidden");
  return { errors, label };
}

// The emitted response: author report + audit report in <details>, or the one-line `Review not performed:`.
export function checkResponse(text, opts = {}) {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (/^Review not performed/.test(t)) return checkReport(t, opts);
  const { author, audit, closed, trailing } = splitResponse(t);
  const r = checkReport(audit, opts);
  const extra = [];
  if (author === null) extra.push({ code: "A00", msg: "the response needs the author report (assets/author-report-template.md) followed by the audit report inside `<details>`" });
  else {
    if (!closed) extra.push({ code: "A07", msg: "the audit report's `<details>` block is never closed with `</details>`" });
    if (trailing) extra.push({ code: "A07", msg: "nothing may follow the closing `</details>` of the audit report" });
    const a = checkAuthorReport(author, { ...r, lines: audit.split("\n") }, opts);
    extra.push(...a.errors);
    r.label = a.label;
  }
  r.errors = [...extra, ...r.errors];
  r.ok = r.errors.length === 0;
  return r;
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
  return { ok: errors.length === 0, errors, verdict, owner, findings: findings.map(({ marker, id, severity }) => ({ marker, id, severity })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a, i) => !a.startsWith("--") && !["--trace", "--run", "--external"].includes(args[i - 1]));
  const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  if (!file) {
    console.error("usage: check-report.mjs <report.md | -> [--trace <runs.jsonl> --run <RUN_ID>] [--external <findings.json>] [--json]");
    process.exit(64);
  }
  const text = fs.readFileSync(file === "-" ? 0 : file, "utf8");
  let traceEvents = null;
  if (opt("--trace")) {
    const run = opt("--run");
    traceEvents = readTrace(opt("--trace")).events.filter((e) => !run || e.run === run);
  }
  let external = null;
  if (opt("--external")) {
    // The lead normalizes supplied findings to this shape (assets/supplied-findings.md); anything else is a usage error,
    // so a malformed file can never turn E01 into a silent pass.
    const json = JSON.parse(fs.readFileSync(opt("--external"), "utf8"));
    if (!Array.isArray(json?.findings) || json.findings.some((f) => !String(f?.id ?? "").trim())) {
      console.error('usage: --external needs {"findings": [{"id": "<id>", …}, …]} with an id on every item (assets/supplied-findings.md)');
      process.exit(64);
    }
    external = suppliedFindingIds(json);
  }
  const r = checkResponse(text, { traceEvents, external });
  if (args.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    for (const e of r.errors) console.log(`ERROR ${e.code}: ${e.msg}`);
    console.log(r.ok ? `OK: verdict \`${r.verdict}\`${r.label ? ` (${r.label})` : ""}, owner \`${r.owner ?? "-"}\`, ${r.findings.length} finding(s)` : `${r.errors.length} error(s) — fix them and re-run before emitting the response`);
  }
  process.exit(r.ok ? 0 : 1);
}
