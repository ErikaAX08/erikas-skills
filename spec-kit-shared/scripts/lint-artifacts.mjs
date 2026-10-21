#!/usr/bin/env node
// Mechanical checks over a spec-kit feature directory (spec-kit-shared/artifact-conventions.md).
//
//   node lint-artifacts.mjs <feature-dir> [--json]
//     exit 0 = no BLOCKING finding, 1 = BLOCKING findings, 2 = not a feature directory,
//     3 = state.json newer than this contract
//
// Every finding has a stable check code (L01…). Semantic judgments (does an acceptance criterion
// contradict an invariant?) stay with spec-kit-analyze-consistency; this script only reports what
// can be decided from the text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTRACT_VERSION, loadFeature, idsIn } from "./lib/artifacts.mjs";

const AMENDMENT_STATUSES = ["planned", "applied", "stopped", "escalated", "accepted", "abandoned", "executed", "verified"];
const SPEC_FILES = ["spec.md"];
const PLAN_FILES = ["plan.md", "research.md"];

export function lint(dir) {
  const findings = [];
  const notChecked = [];
  const add = (severity, code, check, file, line, message) => findings.push({ severity, code, check, file, line, message });

  if (!fs.existsSync(path.join(dir, "spec.md"))) return { status: 2, findings, notChecked: ["no spec.md — not a feature directory"] };
  const feature = loadFeature(dir);
  const version = feature.state?.schema_version ?? (feature.state ? 1 : null);
  if (version !== null && version > CONTRACT_VERSION) {
    return { status: 3, version, findings, notChecked: [`state.json schema_version ${version} is newer than contract ${CONTRACT_VERSION}`] };
  }
  const files = feature.files;
  const tasksFile = files["tasks.md"];
  const amendFile = files["amendments.md"];

  // L01/L03 — definitions index.
  const defined = new Map();
  for (const [name, parsed] of Object.entries(files)) {
    const seen = new Map();
    for (const d of parsed.defs) {
      if (seen.has(d.id) && !(name === "amendments.md")) {
        add("BLOCKING", "L01", "duplicate-definition", name, d.line, `${d.id} is defined twice in ${name} (also line ${seen.get(d.id)})`);
      }
      seen.set(d.id, d.line);
      if (!defined.has(d.id)) defined.set(d.id, []);
      defined.get(d.id).push({ file: name, line: d.line, def: d });
    }
  }
  for (const [id, where] of defined) {
    const inSpec = where.some((w) => SPEC_FILES.includes(w.file));
    const inPlan = where.find((w) => PLAN_FILES.includes(w.file));
    if (inSpec && inPlan) {
      add("ADVISORY", "L03", "namespace-collision", inPlan.file, inPlan.line, `${id} is defined in spec.md and in ${inPlan.file}; plan entries use PL-D/PL-O/RS (legacy plans excepted)`);
    }
  }

  // L02 — broken citations. amendments.md is a historical log and may cite removed IDs; task and
  // amendment references are reported by their specific checks (L07, L11, L12) instead.
  for (const [name, parsed] of Object.entries(files)) {
    if (name === "amendments.md") continue;
    for (const c of parsed.cites) {
      if (/^(T\d|AM-)/.test(c.id)) continue;
      if (!defined.has(c.id)) add("BLOCKING", "L02", "broken-citation", name, c.line, `${c.id} is cited but defined nowhere`);
    }
  }

  // Plan data: decisions, operations, research entries.
  const planDefs = (files["plan.md"]?.defs ?? []).concat(files["research.md"]?.defs ?? []);
  const isLegacyPlan = files["plan.md"] && !planDefs.some((d) => /^PL-/.test(d.id));
  const decisions = planDefs.filter((d) => /^PL-D\d+$/.test(d.id));
  const operations = planDefs.filter((d) => /^PL-O\d+$/.test(d.id));
  const research = planDefs.filter((d) => /^RS-\d+$/.test(d.id));
  const level = (d) => {
    const raw = d.row ? d.row.get(/^Evidence level$/i) : (d.block.match(/\*\*Evidence level\*\*:\s*([^\n]+)/i) ?? [])[1];
    if (raw === undefined) return undefined;
    const m = raw.toLowerCase().match(/executed|read|assumption/);
    return m ? m[0] : "";
  };
  const runtime = (d) => {
    const raw = d.row ? d.row.get(/^Runtime premise$/i) : (d.block.match(/\*\*Runtime premise\*\*:\s*([^\n]+)/i) ?? [])[1];
    return raw ? /^\s*yes\b/i.test(raw) : false;
  };

  if (isLegacyPlan) {
    notChecked.push("legacy plan (A-D0#/O-0#): evidence levels, probes, and operation links not checked (L13–L17)");
  } else if (files["plan.md"]) {
    // L15/L16 — evidence levels and runtime premises.
    for (const d of [...decisions, ...research]) {
      const file = defined.get(d.id)[0].file;
      const lv = level(d);
      if (!lv) add("ADVISORY", "L16", "evidence-level-missing", file, d.line, `${d.id} has no evidence level (executed / read / assumption)`);
      if (/^RS-/.test(d.id) && runtime(d) && lv === "read") {
        add("BLOCKING", "L15", "unexecuted-runtime-premise", file, d.line, `${d.id} is a runtime premise verified only by reading; it needs executed evidence or must be an assumption with a [SONDA]`);
      }
    }
    for (const d of decisions) {
      for (const rs of idsIn(d.block).filter((id) => /^RS-/.test(id))) {
        const r = research.find((x) => x.id === rs);
        if (r && runtime(r) && level(r) !== "executed" && level(d) !== "assumption") {
          add("BLOCKING", "L15", "unexecuted-runtime-premise", "plan.md", d.line, `${d.id} rests on runtime premise ${rs} (${level(r) || "no level"}) without being marked assumption`);
        }
      }
    }
    // L17 — operation links both ways.
    const specOps = (files["spec.md"]?.defs ?? []).filter((d) => /^O-\d+$/.test(d.id));
    const realized = new Set();
    for (const op of operations) {
      const cell = op.row ? op.row.get(/^Realizes/i) ?? "" : op.block;
      const cited = idsIn(cell).filter((id) => /^O-\d+$/.test(id));
      cited.forEach((id) => realized.add(id));
      if (cited.length === 0) add("ADVISORY", "L17", "unlinked-operation", "plan.md", op.line, `${op.id} cites no spec O-## it realizes`);
    }
    if (operations.length > 0) {
      for (const o of specOps) {
        if (!realized.has(o.id)) add("ADVISORY", "L17", "unlinked-operation", "spec.md", o.line, `${o.id} is realized by no PL-O## in plan.md`);
      }
    }
  }

  // L18 — sensitive data by channel.
  for (const table of files["spec.md"]?.tables ?? []) {
    if (!table.cols.some((c) => /^Channel$/i.test(c)) || !table.cols.some((c) => /^Safeguard$/i.test(c))) continue;
    for (const row of table.rows) {
      const sg = row.get(/^Safeguard$/i) ?? "";
      if (!sg || /^\[.*\]$/.test(sg) || /^\.{3}$|^…$/.test(sg)) {
        add("BLOCKING", "L18", "unenumerated-sensitive-channel", "spec.md", row.line, `channel "${row.cells[0]}" has no safeguard or N/A reason`);
      }
    }
  }

  // Tasks.
  if (!tasksFile) {
    notChecked.push("no tasks.md: task checks (L06–L14, L21) not run");
  } else {
    const tasks = tasksFile.tasks;
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const amendIds = new Set((amendFile?.defs ?? []).filter((d) => /^AM-\d+$/.test(d.id)).map((d) => d.id));

    for (const t of tasks) {
      // L06 — required fields per task kind.
      const required = t.cierre ? ["Verifica", "Validación"]
        : t.isEnmienda ? ["Enmienda", "Traza a", "Validación"]
        : t.sonda ? ["Traza a", "Validación"]
        : ["Traza a", "Archivo(s)", "Depende de", "Validación"];
      for (const f of required) {
        if (!t.fields[f]?.trim()) {
          add(f === "Validación" ? "BLOCKING" : "ADVISORY", "L06", "missing-field", "tasks.md", t.line, `${t.id} has no \`${f}:\``);
        }
      }
      // L07 — dependencies exist.
      for (const dep of idsIn(t.fields["Depende de"] ?? "").filter((id) => /^T\d+$/.test(id))) {
        if (!byId.has(dep)) add("BLOCKING", "L07", "unknown-dependency", "tasks.md", t.fieldLines["Depende de"] ?? t.line, `${t.id} depends on ${dep}, which does not exist`);
      }
      // L11 — superseded tasks.
      if (t.fields["Superada por"] !== undefined) {
        if (!t.done) add("BLOCKING", "L11", "superseded-task", "tasks.md", t.line, `${t.id} carries \`Superada por:\` but is not closed; only closed tasks are superseded`);
        if (!t.supersededBy || !byId.has(t.supersededBy)) add("BLOCKING", "L11", "superseded-task", "tasks.md", t.fieldLines["Superada por"], `${t.id} is superseded by ${t.supersededBy ?? "(no task ID)"}, which does not exist`);
        const am = (t.fields["Superada por"].match(/AM-\d+/) ?? [])[0];
        if (am && !amendIds.has(am)) add("BLOCKING", "L12", "amendment-link", "tasks.md", t.fieldLines["Superada por"], `${t.id} cites ${am}, which is not in amendments.md`);
      }
      // L12 — amendment tasks.
      if (t.isEnmienda) {
        if (t.enmiendaOf && !byId.has(t.enmiendaOf)) add("BLOCKING", "L12", "amendment-link", "tasks.md", t.line, `${t.id} amends ${t.enmiendaOf}, which does not exist`);
        const am = (t.fields["Enmienda"]?.match(/AM-\d+/) ?? [])[0];
        if (!am || !amendIds.has(am)) add("BLOCKING", "L12", "amendment-link", "tasks.md", t.fieldLines["Enmienda"] ?? t.line, `${t.id} cites ${am ?? "no AM-##"}, which is not in amendments.md`);
      }
    }

    // L08/L09/L10 — one active [CIERRE] per story, last except amendment tasks, covering its R-AC.
    const stories = new Map();
    for (const t of tasks) {
      if (!t.story) continue;
      if (!stories.has(t.story)) stories.set(t.story, []);
      stories.get(t.story).push(t);
    }
    for (const [story, list] of stories) {
      const active = list.filter((t) => t.cierre && !t.supersededBy);
      if (active.length !== 1) {
        add("BLOCKING", "L08", "closure-count", "tasks.md", (active[1] ?? list[0]).line, `${story} has ${active.length} active [CIERRE] tasks${active.length ? ` (${active.map((t) => t.id).join(", ")})` : ""}; exactly one is required`);
        continue;
      }
      const closure = active[0];
      const idx = list.indexOf(closure);
      for (const t of list.slice(idx + 1)) {
        if (!t.isEnmienda && !t.supersededBy) add("BLOCKING", "L09", "closure-position", "tasks.md", t.line, `${t.id} comes after ${story}'s active [CIERRE] ${closure.id} but is not an [ENMIENDA] task`);
      }
      const listed = new Set(idsIn(closure.block).filter((id) => /^R-AC/.test(id)));
      const claimed = new Set(list.filter((t) => t !== closure).flatMap((t) => idsIn(t.fields["Traza a"] ?? "")).filter((id) => /^R-AC/.test(id)));
      if (listed.size === 0) {
        if (claimed.size) add("ADVISORY", "L10", "closure-coverage", "tasks.md", closure.line, `${closure.id} lists no R-AC IDs, so its coverage of ${[...claimed].join(", ")} cannot be checked mechanically`);
      } else {
        const missing = [...claimed].filter((id) => !listed.has(id));
        if (missing.length) add("BLOCKING", "L10", "closure-coverage", "tasks.md", closure.line, `${closure.id} does not cover ${missing.join(", ")}, which ${story}'s tasks claim`);
      }
    }

    // L13/L14 — assumption decisions need a [SONDA] ahead of every task built on them.
    if (!isLegacyPlan) {
      const closureOf = (start) => {
        const seen = new Set();
        const stack = [start];
        while (stack.length) {
          const t = byId.get(stack.pop());
          if (!t) continue;
          for (const dep of idsIn(t.fields["Depende de"] ?? "").filter((id) => /^T\d+$/.test(id))) {
            if (!seen.has(dep)) { seen.add(dep); stack.push(dep); }
          }
        }
        return seen;
      };
      for (const d of decisions.filter((x) => level(x) === "assumption")) {
        const probes = tasks.filter((t) => t.sonda && idsIn(t.fields["Traza a"] ?? "").includes(d.id));
        if (probes.length === 0) {
          add("BLOCKING", "L13", "probe-missing", "plan.md", d.line, `${d.id} is an assumption with no [SONDA] task citing it`);
          continue;
        }
        const opsApplying = operations.filter((op) => idsIn(op.row ? op.row.get(/^Applies$/i) ?? "" : op.block).includes(d.id)).map((op) => op.id);
        for (const t of tasks) {
          if (t.sonda || t.supersededBy) continue;
          const traces = idsIn(t.fields["Traza a"] ?? "");
          if (!traces.includes(d.id) && !traces.some((id) => opsApplying.includes(id))) continue;
          const deps = closureOf(t.id);
          if (!probes.some((p) => deps.has(p.id))) {
            add("BLOCKING", "L14", "probe-order", "tasks.md", t.line, `${t.id} is built on assumption ${d.id} but does not depend on its [SONDA] (${probes.map((p) => p.id).join(", ")})`);
          }
        }
      }
    }

    // L21 — non-canonical grammar tokens.
    for (const w of tasksFile.tokenWarnings) {
      add("ADVISORY", "L21", "grammar-token", "tasks.md", w.line, `\`${w.found}:\` should be the fixed token \`${w.expected}:\``);
    }
  }

  // L19/L20 — amendment entries.
  for (const d of (amendFile?.defs ?? []).filter((x) => /^AM-\d+$/.test(x.id))) {
    const status = (d.block.match(/\*\*Status\*\*:\s*([a-z]+)/i) ?? [])[1]?.toLowerCase();
    if (!status || !AMENDMENT_STATUSES.includes(status)) {
      add("ADVISORY", "L20", "amendment-status", "amendments.md", d.line, `${d.id} has status "${status ?? "(none)"}", not one of ${AMENDMENT_STATUSES.join(", ")}`);
    } else if (status === "planned" || status === "stopped") {
      add("BLOCKING", "L19", "open-amendment", "amendments.md", d.line, `${d.id} is ${status}: resume or undo it before executing (spec-kit-amend-artifacts)`);
    }
  }

  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "BLOCKING" ? -1 : 1));
  const blocking = findings.filter((f) => f.severity === "BLOCKING").length;
  return { status: blocking ? 1 : 0, version, findings, notChecked };
}

function printReport(dir, result) {
  console.log(`LINT ${dir}`);
  if (result.version !== undefined && result.version !== null) console.log(`SCHEMA_VERSION: ${result.version}`);
  for (const severity of ["BLOCKING", "ADVISORY"]) {
    const list = result.findings.filter((f) => f.severity === severity);
    console.log(`\n${severity} (${list.length})`);
    for (const f of list) console.log(`  ${f.code} ${f.check}  ${f.file}:${f.line ?? "-"}  ${f.message}`);
  }
  if (result.notChecked.length) {
    console.log("\nNOT CHECKED");
    for (const n of result.notChecked) console.log(`  - ${n}`);
  }
  const b = result.findings.filter((f) => f.severity === "BLOCKING").length;
  console.log(`\nRESULT: BLOCKING_COUNT=${b} ADVISORY_COUNT=${result.findings.length - b}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("usage: lint-artifacts.mjs <feature-dir> [--json]");
    process.exit(64);
  }
  const result = lint(dir);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else printReport(dir, result);
  process.exit(result.status);
}
