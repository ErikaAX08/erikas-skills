// Tests for the run log: log-event.mjs, the scripts' --log, and run-report.mjs.
// Run: node --test spec-kit-shared/scripts/test/runlog.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { logEvent } from "../log-event.mjs";
import { readLog, redact } from "../lib/runlog.mjs";
import { buildReport, toMarkdown } from "../run-report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.resolve(HERE, "..");
const BASE = path.resolve(HERE, "../../evals/base-feature");

// A .speckit tree with one or more feature directories copied from the base fixture.
function project(features = ["001-a"], { runLog } = {}) {
  const root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "runlog-")), ".speckit");
  for (const f of features) fs.cpSync(BASE, path.join(root, "specs", f), { recursive: true });
  if (runLog) fs.writeFileSync(path.join(root, "init-options.json"), JSON.stringify({ run_log: runLog }));
  return { root, feature: (f = features[0]) => path.join(root, "specs", f) };
}

const start = (dir, skill = "spec-kit-execute-tasks") => logEvent([dir, "run.start", "--skill", skill, "mode=execute"]).run;
const log = (dir, run, event, ...pairs) => logEvent([dir, event, "--run", run, "--skill", "spec-kit-execute-tasks", ...pairs]);
const cli = (script, ...args) => spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8" });

test("run.start prints a run ID and events are appended as valid JSON lines", () => {
  const dir = project().feature();
  const r = logEvent([dir, "run.start", "--skill", "spec-kit-amend-artifacts", "mode=amend", "inputs=spec.md,plan.md"]);
  assert.equal(r.status, 0);
  assert.match(r.lines[0], /^RUN_ID=r-\d{8}T\d{6}Z-[0-9a-f]{4}$/);
  assert.equal(log(dir, r.run, "decision", "kind=layer", "value=plan", "rationale=PL-D02 changes, no R-AC does", "ids=PL-D02,T004").status, 0);
  assert.equal(log(dir, r.run, "run.end", "status=done", "next=spec-kit-execute-tasks").status, 0);
  const { events, malformed } = readLog(dir);
  assert.deepEqual(malformed, []);
  assert.deepEqual(events.map((e) => e.event), ["run.start", "decision", "run.end"]);
  assert.deepEqual(events[0].data.inputs, ["spec.md", "plan.md"]);
  assert.deepEqual(events[1].data.ids, ["PL-D02", "T004"]);
});

test("invalid events are rejected and nothing is written", () => {
  const dir = project().feature();
  const run = start(dir);
  assert.equal(log(dir, run, "decision", "kind=nope", "value=x", "rationale=y").status, 1);
  assert.equal(log(dir, run, "decision", "kind=layer", "value=plan").status, 1, "missing rationale");
  assert.equal(log(dir, run, "telemetry", "x=1").status, 1, "unknown event");
  assert.equal(logEvent([dir, "phase", "--skill", "s", "name=Fase 0", "outcome=done"]).status, 64, "missing --run");
  assert.equal(readLog(dir).events.length, 1);
});

test("redaction masks phone numbers, e-mails, and tokens, and keeps dates, counts, hashes, and IDs", () => {
  assert.equal(redact("log had +52 55 1234 1234 and a@b.co"), "log had <number> and <email>");
  assert.equal(redact("key sk-abcdef1234567890"), "key <token>");
  assert.equal(redact("re-walked 2026-10-21; 219 tests"), "re-walked 2026-10-21; 219 tests");
  const hash = "sha256:001530cc93e875618a27481db122262f8a2358320aa3b917acfe7843f40cfffa";
  assert.deepEqual(redact({ hash_after: hash, ids: ["T0012345678"], summary: "+5215512341234" }), { hash_after: hash, ids: ["T0012345678"], summary: "<number>" });
});

test("run_log off writes nothing and still succeeds", () => {
  const { feature } = project(["001-a"], { runLog: "off" });
  const r = logEvent([feature(), "run.start", "--skill", "s", "mode=x"]);
  assert.equal(r.status, 0);
  assert.match(r.lines[0], /RUN_LOG: off/);
  assert.equal(fs.existsSync(path.join(feature(), "runs.jsonl")), false);
});

test("lint and fingerprint record their own results with --log", () => {
  const dir = project().feature();
  const run = start(dir);
  assert.equal(cli("fingerprint.mjs", "--record", dir, "spec", "--log", run, "--skill", "spec-kit-generate-spec").status, 0);
  assert.equal(cli("lint-artifacts.mjs", dir, "--log", run, "--skill", "spec-kit-analyze-consistency").status, 0);
  assert.equal(cli("fingerprint.mjs", "--state", dir, "--log", run, "--skill", "spec-kit-sync-artifacts").status, 0);
  const events = readLog(dir).events;
  const artifact = events.find((e) => e.event === "artifact");
  assert.equal(artifact.data.path, "spec.md");
  assert.match(artifact.data.hash_after, /^sha256:[0-9a-f]{64}$/);
  const checks = events.filter((e) => e.event === "check").map((e) => [e.data.tool, e.data.exit]);
  assert.deepEqual(checks, [["lint", 0], ["fingerprint", 0]]);
});

test("run-report aggregates runs and raises each signal from its evidence", () => {
  const { root, feature } = project(["001-a", "002-b"]);
  const a = feature("001-a");
  const r1 = start(a, "spec-kit-generate-spec");
  for (let i = 0; i < 4; i++) cli("fingerprint.mjs", "--record", a, "spec", "--log", r1, "--skill", "spec-kit-generate-spec");
  log(a, r1, "run.end", "status=done");
  for (let i = 0; i < 2; i++) {
    const r = start(a, "spec-kit-analyze-consistency");
    fs.appendFileSync(path.join(a, "runs.jsonl"), JSON.stringify({ v: 1, ts: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), run: r, skill: "spec-kit-analyze-consistency", event: "check", data: { tool: "lint", exit: 1, blocking: 1, advisory: 0, codes: ["L08"] } }) + "\n");
    log(a, r, "run.end", "status=stopped", "reason=lint BLOCKING");
  }
  const r2 = start(a);
  log(a, r2, "decision", "kind=probe", "value=refuted", "rationale=probe printed captured=start", "ids=T009,PL-D02");
  log(a, r2, "deviation", "rule=Readiness Gate", "reason=user executed a draft", "approved_by=user");
  log(a, r2, "decision", "kind=verdict-route", "value=request changes", "rationale=F-1 to amend");
  log(a, r2, "decision", "kind=verdict-route", "value=request changes", "rationale=F-2 to amend");
  start(feature("002-b"));
  fs.appendFileSync(path.join(feature("002-b"), "runs.jsonl"), "not json\n");
  fs.writeFileSync(path.join(a, "amendments.md"), "# Amendments\n\n## AM-01 — x\n\n- **Origin**: pre-pr-review F-1\n- **Layer**: spec\n- **Status**: verified\n\n## AM-02 — y\n\n- **Origin**: pre-pr-review F-4\n- **Layer**: spec\n- **Status**: applied\n");

  const report = buildReport(root);
  assert.equal(report.runs.total, 5);
  assert.equal(report.runs.bySkill["spec-kit-analyze-consistency"], 2);
  assert.equal(report.records["spec.md"], 4);
  assert.deepEqual(report.amendments.byLayer, { spec: 2 });
  assert.deepEqual(report.signals.map((s) => s.id).sort(), [
    "late-spec-defects", "malformed-log", "open-runs", "recurring-blocking", "refuted-premise", "review-churn", "rule-deviations", "spec-churn",
  ]);
  const md = toMarkdown(report);
  assert.match(md, /^# Run Report/);
  assert.match(md, /\*\*recurring-blocking\*\* — lint L08 was BLOCKING in 2 runs/);
});

test("run-report on a feature without a log exits 2", () => {
  const dir = project().feature();
  assert.equal(buildReport(dir), null);
  assert.equal(cli("run-report.mjs", dir).status, 2);
});
