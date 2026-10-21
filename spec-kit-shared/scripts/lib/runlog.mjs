// Run log (spec-kit-shared/artifact-conventions.md § Run Log): an append-only JSON Lines record of
// what each skill invocation did and decided, so behavior can be measured and improved over time.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const RUN_LOG_VERSION = 1;

// Required `data` keys per event type. Extra keys are allowed; missing ones are an error.
export const EVENTS = {
  "run.start": ["mode"],
  phase: ["name", "outcome"],
  decision: ["kind", "value", "rationale"],
  check: ["tool", "exit"],
  finding: ["origin", "severity", "summary"],
  artifact: ["path", "action"],
  user: ["kind", "summary"],
  deviation: ["rule", "reason"],
  "run.end": ["status"],
};
export const DECISION_KINDS = ["readiness", "drift", "layer", "escalation", "verdict-route", "severity", "parallelism", "probe", "closure", "scope", "evidence", "other"];
const ENUMS = {
  phase: { outcome: ["done", "skipped", "stopped"] },
  decision: { kind: DECISION_KINDS },
  finding: { severity: ["BLOCKING", "ADVISORY", "🔴", "🟡", "⚪", "info"] },
  artifact: { action: ["create", "update", "record", "read"] },
  user: { kind: ["question", "decision", "confirmation", "override"] },
  "run.end": { status: ["done", "stopped", "failed"] },
};
const MAX_STRING = 500;

// Logs must never carry secrets or personal data: long digit runs (phone numbers, IDs), e-mail
// addresses, and common token shapes are masked before anything is written. Keys that only ever
// hold hashes, stable IDs, or check codes are left as they are.
const STRUCTURED_KEYS = new Set(["hash_before", "hash_after", "ids", "codes"]);

export function redact(value, key) {
  if (STRUCTURED_KEYS.has(key)) return value;
  if (typeof value === "string") {
    return value
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
      .replace(/\b(?:sk|pk|ghp|gho|ghs|xox[abp]|AKIA)[-_A-Za-z0-9]{8,}\b/g, "<token>")
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

// A feature directory (.speckit/specs/<feature>) logs to its own runs.jsonl; the .speckit directory
// itself holds project-wide runs (spec-kit-establish-constitution).
export function logPath(dir) {
  return path.join(dir, "runs.jsonl");
}

function initOptionsPath(dir) {
  const abs = path.resolve(dir);
  return path.basename(abs) === ".speckit" ? path.join(abs, "init-options.json") : path.resolve(abs, "..", "..", "init-options.json");
}

export function isEnabled(dir) {
  const p = initOptionsPath(dir);
  if (!fs.existsSync(p)) return true;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")).run_log !== "off";
  } catch {
    return true;
  }
}

export function newRunId(now = new Date()) {
  return `r-${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${crypto.randomBytes(2).toString("hex")}`;
}

export function validateEvent(e) {
  const errors = [];
  if (e.v !== RUN_LOG_VERSION) errors.push(`v must be ${RUN_LOG_VERSION}`);
  for (const k of ["ts", "run", "skill", "event"]) if (typeof e[k] !== "string" || !e[k]) errors.push(`missing ${k}`);
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
export function appendEvent(dir, { run, skill, event, data = {} }, { now = new Date() } = {}) {
  if (!isEnabled(dir)) return { written: false, errors: [], disabled: true };
  const e = { v: RUN_LOG_VERSION, ts: now.toISOString().replace(/\.\d{3}Z$/, "Z"), run, skill, event, data: redact(data) };
  const errors = validateEvent(e);
  if (errors.length) return { written: false, errors };
  fs.appendFileSync(logPath(dir), JSON.stringify(e) + "\n");
  return { written: true, errors: [], event: e };
}

export function readLog(dir) {
  const p = logPath(dir);
  if (!fs.existsSync(p)) return { events: [], malformed: [] };
  const events = [];
  const malformed = [];
  fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
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

// Shared by lint-artifacts.mjs and fingerprint.mjs: `--log <run-id> --skill <name>` makes a script
// record its own result, so mechanical outcomes never depend on a skill reporting them.
export function logOption(args) {
  const i = args.indexOf("--log");
  if (i === -1) return null;
  const s = args.indexOf("--skill");
  return { run: args[i + 1], skill: s === -1 ? "unknown" : args[s + 1] };
}
