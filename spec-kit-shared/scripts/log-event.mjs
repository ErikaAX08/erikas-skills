#!/usr/bin/env node
// Appends one event to a spec-kit run log (spec-kit-shared/artifact-conventions.md § Run Log).
//
//   node log-event.mjs <dir> run.start --skill <name> [key=value…]   prints RUN_ID=<id>
//   node log-event.mjs <dir> <event> --run <id> --skill <name> [key=value…] [--data '<json>']
//
// <dir> is a feature directory (.speckit/specs/<feature>) or, for project-wide runs, .speckit.
// Values of ids=, evidence=, and inputs= are comma-separated lists. Exit 0 = written (or logging
// is off: RUN_LOG: off), 1 = invalid event (nothing written), 64 = usage.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendEvent, EVENTS, newRunId } from "./lib/runlog.mjs";

const LIST_KEYS = new Set(["ids", "evidence", "inputs", "codes"]);

export function parseArgs(argv) {
  const [dir, event, ...rest] = argv;
  const opts = { dir, event, run: null, skill: null, data: {} };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--run") opts.run = rest[++i];
    else if (a === "--skill") opts.skill = rest[++i];
    else if (a === "--data") Object.assign(opts.data, JSON.parse(rest[++i]));
    else if (a.includes("=")) {
      const k = a.slice(0, a.indexOf("="));
      const v = a.slice(a.indexOf("=") + 1);
      opts.data[k] = LIST_KEYS.has(k) ? v.split(",").map((x) => x.trim()).filter(Boolean) : /^-?\d+$/.test(v) ? Number(v) : v;
    }
  }
  return opts;
}

export function logEvent(argv, { now = new Date() } = {}) {
  const opts = parseArgs(argv);
  if (!opts.dir || !opts.event || !opts.skill) return { status: 64, lines: ["usage: log-event.mjs <dir> <event> --skill <name> [--run <id>] [key=value…]", `events: ${Object.keys(EVENTS).join(", ")}`] };
  if (opts.event === "run.start") opts.run = opts.run ?? newRunId(now);
  if (!opts.run) return { status: 64, lines: [`${opts.event} needs --run <id> (the RUN_ID printed by run.start)`] };
  const result = appendEvent(opts.dir, { run: opts.run, skill: opts.skill, event: opts.event, data: opts.data }, { now });
  if (result.disabled) return { status: 0, lines: ["RUN_LOG: off (init-options.json run_log)"], run: opts.run };
  if (result.errors.length) return { status: 1, lines: result.errors.map((e) => `INVALID: ${e}`) };
  return { status: 0, lines: opts.event === "run.start" ? [`RUN_ID=${opts.run}`] : [`LOGGED: ${opts.event}`], run: opts.run };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  try {
    result = logEvent(process.argv.slice(2));
  } catch (err) {
    result = { status: 64, lines: [`ERROR: ${err.message}`] };
  }
  for (const l of result.lines) (result.status === 0 ? console.log : console.error)(l);
  process.exit(result.status);
}
