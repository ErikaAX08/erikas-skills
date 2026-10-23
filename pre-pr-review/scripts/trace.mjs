#!/usr/bin/env node
// Appends one event to the review trace (SKILL.md §12).
//
//   node trace.mjs run.start entry=<A|B> [key=value…]          prints RUN_ID=<id>
//   node trace.mjs <event> --run <id> [key=value…] [--data '<json>']
//
// The trace lives in $PRE_PR_REVIEW_TRACE_DIR/runs.jsonl, or ~/.local/state/pre-pr-review/runs.jsonl;
// --dir <path> overrides both. PRE_PR_REVIEW_TRACE=off disables it. Values of lenses=, high_risk=,
// evidence=, and ids= are comma-separated lists; integers are stored as numbers.
// Exit 0 = written (or tracing is off: TRACE: off), 1 = invalid event (nothing written), 64 = usage.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendEvent, EVENTS, newRunId, traceDir, tracePath } from "./lib/trace.mjs";

const LIST_KEYS = new Set(["lenses", "high_risk", "evidence", "ids"]);

export function parseArgs(argv) {
  const [event, ...rest] = argv;
  const opts = { event, run: null, dir: null, data: {} };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--run") opts.run = rest[++i];
    else if (a === "--dir") opts.dir = rest[++i];
    else if (a === "--data") Object.assign(opts.data, JSON.parse(rest[++i]));
    else if (a.includes("=")) {
      const k = a.slice(0, a.indexOf("="));
      const v = a.slice(a.indexOf("=") + 1);
      opts.data[k] = LIST_KEYS.has(k) ? v.split(",").map((x) => x.trim()).filter(Boolean) : /^-?\d+$/.test(v) ? Number(v) : v;
    }
  }
  return opts;
}

export function traceEvent(argv, { now = new Date(), env = process.env } = {}) {
  const opts = parseArgs(argv);
  if (!opts.event) return { status: 64, lines: ["usage: trace.mjs <event> [--run <id>] [--dir <path>] [key=value…]", `events: ${Object.keys(EVENTS).join(", ")}`] };
  if (opts.event === "run.start") {
    if (opts.run) return { status: 64, lines: ["run.start generates the run ID itself; call it without --run and pass the printed RUN_ID to later events"] };
    opts.run = newRunId(now);
  }
  if (!opts.run) return { status: 64, lines: [`${opts.event} needs --run <id> (the RUN_ID printed by run.start)`] };
  const dir = opts.dir ? path.resolve(opts.dir) : traceDir(env);
  const result = appendEvent(dir, { run: opts.run, event: opts.event, data: opts.data }, { now, env });
  if (result.disabled) return { status: 0, lines: ["TRACE: off (PRE_PR_REVIEW_TRACE)"], run: opts.run };
  if (result.errors.length) return { status: 1, lines: result.errors.map((e) => `INVALID: ${e}`) };
  return { status: 0, lines: opts.event === "run.start" ? [`RUN_ID=${opts.run}`] : [`TRACED: ${opts.event}`], note: opts.event === "run.start" ? `trace: ${tracePath(dir)}` : null, run: opts.run };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  try {
    result = traceEvent(process.argv.slice(2));
  } catch (err) {
    result = { status: 64, lines: [`ERROR: ${err.message}`] };
  }
  for (const l of result.lines) (result.status === 0 ? console.log : console.error)(l);
  if (result.note) console.error(result.note); // stdout stays a single RUN_ID= line
  process.exit(result.status);
}
