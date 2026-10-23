// Review trace (SKILL.md §12): an append-only JSON Lines record of what each review did and
// decided — sizing, candidates, verification, classification, verdict — so the skill's reasoning,
// precision, and cost can be measured across runs. Observability only: nothing reads it to decide.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const TRACE_VERSION = 1;
export const SKILL = "pre-pr-review";

// Required `data` keys per event type. Extra keys are allowed; missing ones are an error.
export const EVENTS = {
  "run.start": ["entry"],
  sizing: ["H", "N", "R", "size"],
  decision: ["kind", "value", "rationale"],
  agent: ["role", "status"],
  candidate: ["id", "lens", "proposed", "summary"],
  verification: ["id", "status", "by"],
  classification: ["id", "category", "rule"],
  check: ["tool", "exit"],
  deviation: ["rule", "reason"],
  "run.end": ["status"],
};

export const VERDICTS = ["changes required", "verification required", "decision required", "ready to merge"];
export const OWNERS = ["author", "merger", "product", "operations", "architecture"];
export const DECISION_KINDS = ["entry", "base", "size", "mode", "lens", "fast-path", "noise-promotion", "test-execution", "probe", "data-access", "merge", "verdict", "other"];
export const CATEGORIES = ["🔴", "🟡", "🚀", "⚪", "✅", "accepted", "still-open", "discarded"];

const ENUMS = {
  "run.start": { entry: ["A", "B"] },
  sizing: { R: ["yes", "no"], size: ["S", "M", "L", "none", "docs-only", "noise-only"], verification: ["standard", "independent"] },
  decision: { kind: DECISION_KINDS },
  agent: { role: ["reviewer", "verifier"], status: ["ok", "failed", "timeout", "rerun", "covered-by-lead"] },
  candidate: { proposed: ["red", "yellow", "deploy", "white"], origin: ["reviewer", "lead", "out-of-lens", "side-note", "verifier"] },
  verification: { status: ["CONFIRMED", "REFUTED", "UNRESOLVED"], by: ["verifier", "lead"] },
  classification: { category: CATEGORIES, rule: [0, 1, 2, 3, 4, 5, 6], certainty: ["Fact", "Inference", "Conditional risk", "Open question"], rubric: ["no-exposure", "bounded", "irreversible"] },
  check: { tool: ["test", "build", "typecheck", "lint", "probe", "ci", "query", "report", "other"] },
  "run.end": { status: ["done", "not-performed", "failed"], verdict: VERDICTS, owner: OWNERS },
};
const MAX_STRING = 500;

// The trace never carries code, secrets, or personal data: long digit runs, e-mail addresses,
// common token shapes, and connection strings are masked before anything is written.
const STRUCTURED_KEYS = new Set(["head", "base", "merge_base"]);

export function redact(value, key) {
  if (STRUCTURED_KEYS.has(key)) return value;
  if (typeof value === "string") {
    return value
      .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@\S+/gi, "<connection-string>")
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
      .replace(/\b(?:sk|pk|ghp|gho|ghs|github_pat|xox[abp]|AKIA|ASIA)[-_A-Za-z0-9]{8,}\b/g, "<token>")
      .replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}\b/g, "<jwt>")
      .replace(/\+?\d[\d\s().:-]{6,}\d/g, (m) => {
        if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/.test(m.trim())) return m; // dates stay
        return m.replace(/\D/g, "").length >= 7 ? "<number>" : m;
      })
      .slice(0, MAX_STRING);
  }
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  return value;
}

// PRE_PR_REVIEW_TRACE_DIR wins (the eval runner points it at each run's directory); otherwise the
// user's state directory. Never inside the reviewed repository (SKILL.md §10).
export function traceDir(env = process.env) {
  if (env.PRE_PR_REVIEW_TRACE_DIR) return path.resolve(env.PRE_PR_REVIEW_TRACE_DIR);
  const state = env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state");
  return path.join(state, SKILL);
}

export function tracePath(dir) {
  return path.join(dir, "runs.jsonl");
}

export function isEnabled(env = process.env) {
  return !/^(off|0|false|no)$/i.test(env.PRE_PR_REVIEW_TRACE ?? "");
}

export function newRunId(now = new Date()) {
  return `pr-${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${crypto.randomBytes(2).toString("hex")}`;
}

export function validateEvent(e) {
  const errors = [];
  if (e.v !== TRACE_VERSION) errors.push(`v must be ${TRACE_VERSION}`);
  for (const k of ["ts", "run", "event"]) if (typeof e[k] !== "string" || !e[k]) errors.push(`missing ${k}`);
  const required = EVENTS[e.event];
  if (!required) {
    errors.push(`unknown event "${e.event}" (${Object.keys(EVENTS).join(", ")})`);
    return errors;
  }
  const data = e.data ?? {};
  for (const k of required) if (data[k] === undefined || data[k] === "") errors.push(`${e.event}: missing data.${k}`);
  for (const [k, allowed] of Object.entries(ENUMS[e.event] ?? {})) {
    if (data[k] !== undefined && !allowed.includes(data[k])) errors.push(`${e.event}: data.${k} "${data[k]}" not in ${allowed.join(", ")}`);
  }
  return errors;
}

// Appends one event. Returns { written, errors }; never rewrites or removes existing lines.
export function appendEvent(dir, { run, event, data = {} }, { now = new Date(), env = process.env } = {}) {
  if (!isEnabled(env)) return { written: false, errors: [], disabled: true };
  const e = { v: TRACE_VERSION, ts: now.toISOString().replace(/\.\d{3}Z$/, "Z"), run, skill: SKILL, event, data: redact(data) };
  const errors = validateEvent(e);
  if (errors.length) return { written: false, errors };
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(tracePath(dir), JSON.stringify(e) + "\n");
  return { written: true, errors: [], event: e };
}

export function readTrace(file) {
  if (!fs.existsSync(file)) return { events: [], malformed: [] };
  const events = [];
  const malformed = [];
  fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const e = JSON.parse(line);
      const errors = validateEvent(e);
      if (errors.length) malformed.push({ line: i + 1, errors });
      else events.push(e);
    } catch {
      malformed.push({ line: i + 1, errors: ["not JSON"] });
    }
  });
  return { events, malformed };
}
