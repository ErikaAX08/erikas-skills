// Tests for collect-diff.sh sizing, the review trace (trace.mjs), and trace-report.mjs.
// Run: node --test pre-pr-review/scripts/test/scripts.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readTrace, redact, tracePath } from "../lib/trace.mjs";
import { traceEvent } from "../trace.mjs";
import { buildReport, expectedVerdict, toMarkdown } from "../trace-report.mjs";
import { checkReport } from "../check-report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, "../..");
const COLLECT = path.join(SKILL, "scripts", "collect-diff.sh");

const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

function fixture(name) {
  const dest = path.join(tmp("ppr-fx-"), name);
  const r = spawnSync("bash", [path.join(SKILL, "evals", "build-fixture.sh"), path.join(SKILL, "evals", "files", name), dest], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return dest;
}

function collect(repo, args = ["main"], env = {}) {
  const r = spawnSync("bash", [COLLECT, ...args], { cwd: repo, encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(r.status, 0, r.stderr);
  const field = (k) => (r.stdout.match(new RegExp(`^${k}: (.*)$`, "m")) ?? [])[1];
  const lenses = (r.stdout.split("## Activated lenses")[1] ?? "").split("\n## ")[0].split("\n").slice(1).filter(Boolean).map((l) => l.split(":")[0]);
  return { out: r.stdout, stderr: r.stderr, verification: field("verification"), H: Number.parseInt(field("H"), 10), H_test: Number(field("H_test")), H_docs: Number(field("H_docs")), N: Number.parseInt(field("N"), 10), R: field("R"), size: field("size"), fastPath: field("fast path"), lenses };
}

test("collect-diff: untracked files count toward H in entry A", () => {
  const repo = fixture("local-only-pii-logging");
  const before = collect(repo);
  fs.writeFileSync(path.join(repo, "src", "export.js"), Array.from({ length: 300 }, (_, i) => `// line ${i}`).join("\n") + "\n");
  const after = collect(repo);
  assert.equal(after.H, before.H + 300);
  assert.match(after.out, /source\t300\tsrc\/export\.js \(local\)/);
  assert.match(after.out, /untracked files: 1/);
});

test("collect-diff: test and prose-doc lines are read but excluded from H", () => {
  const sql = collect(fixture("fork-sql-injection"));
  assert.deepEqual([sql.H, sql.H_test], [6, 9]);
  const go = collect(fixture("go-build-directive"));
  assert.deepEqual([go.H, go.H_docs], [4, 2]);
});

test("collect-diff: risk raises verification depth, not fan-out", () => {
  const m = collect(fixture("migration-deploy-order"));
  assert.deepEqual(m.lenses, ["contracts-and-access", "data-and-migrations", "async-and-integrations", "tests"]);
  assert.equal(m.N, 3);
  assert.match(m.R, /^yes \(.*migrations-and-schemas/);
  assert.equal(m.size, "M", "N = 3 with H = 13 is not worth a multi-agent fan-out");
  assert.match(m.verification, /^independent/);
  const refactor = collect(fixture("clean-refactor-extract"));
  assert.deepEqual([refactor.size, refactor.verification], ["S", "standard"]);
});

test("collect-diff: changed lines add lenses and raise R where the path cannot", () => {
  const auth = collect(fixture("auth-guard-removed"));
  assert.match(auth.R, /^yes \(auth-and-permissions\)/, "a removed requireAdmin guard in routes/ is high risk");
  const sql = collect(fixture("fork-sql-injection"));
  assert.deepEqual(sql.lenses, ["contracts-and-access", "data-and-migrations", "tests"]);
  assert.match(sql.out, /contracts-and-access: catalog\/search\.py \(content\)/);
  const go = collect(fixture("go-build-directive"));
  assert.match(go.out, /flow-and-state: validate\.go \(default\)/);
});

test("collect-diff: a lockfile-only change activates release-and-ops and is not noise-only", () => {
  const r = collect(fixture("lockfile-install-script"));
  assert.deepEqual([r.H, r.N, r.lenses, r.fastPath], [0, 1, ["release-and-ops"], "none"]);
  assert.match(r.out, /lockfile changed: yes/);
});

test("collect-diff: an empty diff has no size class", () => {
  assert.equal(collect(fixture("empty-diff")).size, "none (empty diff)");
});

test("collect-diff --trace records a sizing event without changing the inventory", () => {
  const repo = fixture("migration-lock-prerequisite");
  const dir = tmp("ppr-trace-");
  const plain = collect(repo);
  const traced = collect(repo, ["--trace", "pr-test-1", "main"], { PRE_PR_REVIEW_TRACE_DIR: dir });
  assert.equal(traced.out, plain.out);
  const { events, malformed } = readTrace(tracePath(dir));
  assert.deepEqual(malformed, []);
  assert.equal(events.length, 1);
  assert.deepEqual(
    { run: events[0].run, event: events[0].event, H: events[0].data.H, size: events[0].data.size, R: events[0].data.R, lenses: events[0].data.lenses },
    { run: "pr-test-1", event: "sizing", H: 9, size: "M", R: "yes", lenses: ["data-and-migrations", "tests"] },
  );
});

test("trace: run.start prints a run ID and events are validated", () => {
  const dir = tmp("ppr-trace-");
  const env = { PRE_PR_REVIEW_TRACE_DIR: dir };
  const start = traceEvent(["run.start", "entry=A", "request=default"], { env });
  assert.equal(start.status, 0);
  assert.match(start.lines[0], /^RUN_ID=pr-\d{8}T\d{6}Z-[0-9a-f]{4}$/);
  const run = start.run;
  assert.equal(traceEvent(["classification", "--run", run, "id=lead-1", "category=🔴", "rule=2", "finding=F-1"], { env }).status, 0);
  assert.equal(traceEvent(["classification", "--run", run, "id=lead-2", "category=red", "rule=2"], { env }).status, 1, "category enum");
  assert.equal(traceEvent(["classification", "--run", run, "id=lead-2", "category=🔴", "rule=9"], { env }).status, 1, "rule enum");
  assert.equal(traceEvent(["decision", "--run", run, "kind=size", "value=M"], { env }).status, 1, "missing rationale");
  assert.equal(traceEvent(["telemetry", "--run", run], { env }).status, 1, "unknown event");
  assert.equal(traceEvent(["run.start", "--run", "new", "entry=A"], { env }).status, 64, "run.start makes its own ID");
  assert.equal(traceEvent(["candidate", "id=x", "lens=tests", "proposed=red", "summary=s"], { env }).status, 64, "missing --run");
  const { events } = readTrace(tracePath(dir));
  assert.deepEqual(events.map((e) => e.event), ["run.start", "classification"]);
  assert.equal(events[1].data.rule, 2);
});

test("trace: PRE_PR_REVIEW_TRACE=off writes nothing and succeeds", () => {
  const dir = tmp("ppr-trace-");
  const r = traceEvent(["run.start", "entry=B"], { env: { PRE_PR_REVIEW_TRACE_DIR: dir, PRE_PR_REVIEW_TRACE: "off" } });
  assert.equal(r.status, 0);
  assert.equal(r.lines[0], "TRACE: off (PRE_PR_REVIEW_TRACE)");
  assert.equal(fs.existsSync(tracePath(dir)), false);
});

test("trace: redaction masks contact data, tokens, and connection strings, and keeps dates and SHAs", () => {
  assert.equal(redact("mail a@b.co or +52 55 1234 1234"), "mail <email> or <number>");
  assert.equal(redact("key ghp_abcdefghijklmnop1234"), "key <token>");
  assert.equal(redact("postgres://app:s3cret@db.internal:5432/orders"), "<connection-string>");
  assert.equal(redact("ran on 2026-10-22, 12 tests"), "ran on 2026-10-22, 12 tests");
  assert.deepEqual(redact({ head: "a1b2c3d4e5f6", summary: "x" }), { head: "a1b2c3d4e5f6", summary: "x" });
});

// The first event must be run.start; its generated RUN_ID is used for the rest.
function writeRun(dir, events) {
  const env = { PRE_PR_REVIEW_TRACE_DIR: dir };
  let run = null;
  for (const [event, ...pairs] of events) {
    const r = traceEvent(event === "run.start" ? [event, ...pairs] : [event, "--run", run, ...pairs], { env });
    run ??= r.run;
    assert.equal(r.status, 0, `${event}: ${r.lines.join("; ")}`);
  }
}

test("trace-report: funnel, per-lens rates, and consistency violations", () => {
  const dir = tmp("ppr-report-");
  writeRun(dir, [
    ["run.start", "entry=A"],
    ["sizing", "H=12", "N=1", "R=yes", "size=L", "lenses=data-and-migrations,tests"],
    ["decision", "kind=mode", "value=multi-agent", "rationale=size L from a migration"],
    ["candidate", "id=data-1", "lens=data-and-migrations", "proposed=red", "summary=drop before rollout"],
    ["candidate", "id=data-2", "lens=data-and-migrations", "proposed=yellow", "summary=lock"],
    ["candidate", "id=lead-1", "lens=tests", "proposed=white", "summary=flaky"],
    ["verification", "id=data-1", "status=CONFIRMED", "by=verifier"],
    ["verification", "id=data-2", "status=REFUTED", "by=verifier"],
    ["classification", "id=data-1", "category=🟡", "rule=4", "finding=F-1"],
    ["classification", "id=data-2", "category=✅", "rule=1", "finding=F-2"],
    ["check", "tool=test", "exit=0", "command=make test"],
    ["check", "tool=report", "exit=0"],
    ["run.end", "status=done", "verdict=ready to merge", "owner=merger"],
  ]);
  const r = buildReport([tracePath(dir)]);
  assert.equal(r.funnel.candidates, 3);
  assert.equal(r.funnel.refutationRate, 0.5);
  assert.deepEqual(r.lenses["data-and-migrations"], { candidates: 2, proposedGating: 2, confirmed: 1, refuted: 1, unresolved: 0, reported: 1, ruledOut: 1, discarded: 0, refutationRate: 0.5, yield: 0.5 });
  const kinds = r.violations.map((v) => v.kind).sort();
  assert.deepEqual(kinds, ["unclassified-candidate", "verdict-mismatch"]);
  const ids = r.signals.map((s) => s.id);
  assert.ok(ids.includes("fan-out-on-small-diff"));
  assert.ok(ids.includes("verdict-mismatch"));
  assert.match(toMarkdown(r), /\| data-and-migrations \| 2 \| 2 \| 1 \| 1 \| 0 \| 1 \| 1 \| 0 \| 50% \| 50% \|/);
});

test("trace-report: expected verdict follows Phase 8 precedence", () => {
  const c = (category, prerequisite) => ({ data: { category, prerequisite } });
  assert.equal(expectedVerdict([c("🟡"), c("🔴")]), "changes required");
  assert.equal(expectedVerdict([c("🟡"), c("still-open", true)]), "verification required");
  assert.equal(expectedVerdict([c("still-open", false), c("🟡")]), "decision required");
  assert.equal(expectedVerdict([c("🚀"), c("⚪"), c("✅"), c("accepted")]), "ready to merge");
});

test("trace-report: unverified gating findings and open runs become signals", () => {
  const dir = tmp("ppr-report-");
  writeRun(dir, [
    ["run.start", "entry=B"],
    ["candidate", "id=lead-1", "lens=contracts-and-access", "proposed=red", "summary=guard removed"],
    ["classification", "id=lead-1", "category=🔴", "rule=2", "finding=F-1"],
  ]);
  const r = buildReport([tracePath(dir)]);
  assert.deepEqual(r.violations.map((v) => v.kind), ["unverified-gating"]);
  assert.deepEqual(r.signals.map((s) => s.id).sort(), ["open-runs", "unverified-gating"]);
});

test("trace-report: under R a 🔴 needs two verifications", () => {
  const dir = tmp("ppr-report-");
  writeRun(dir, [
    ["run.start", "entry=A"],
    ["sizing", "H=12", "N=1", "R=yes", "size=M", "verification=independent"],
    ["candidate", "id=lead-1", "lens=contracts-and-access", "proposed=red", "summary=guard removed"],
    ["verification", "id=lead-1", "status=CONFIRMED", "by=verifier"],
    ["classification", "id=lead-1", "category=🔴", "rule=2", "finding=F-1"],
    ["candidate", "id=tests-1", "lens=tests", "proposed=red", "summary=same root cause"],
    ["classification", "id=tests-1", "category=🔴", "rule=2", "merged_into=lead-1"],
    ["run.end", "status=done", "verdict=changes required", "owner=author"],
  ]);
  const r = buildReport([tracePath(dir)]);
  assert.deepEqual(r.violations.map((v) => v.kind), ["single-verifier-red", "report-unchecked"], "the merged candidate is covered by its survivor");
});

const SCOPE = "Scope: repo `r` · entry point `A pre-PR` · base `main (confirmed via user)` · merge-base `a1` · head `b2` · PR `none` · date `2026-10-22`.";
const report = (verdict, owner, unblocks, body = "") => `${SCOPE}\n\nVerdict: **${verdict}**\n\nNext: **${owner}** — act.\n\nUnblocks when: ${unblocks}\n\nReason: r.\n\n${body}`;
const red = "### 🔴 F-1 — guard removed\n\nCertainty: Fact\n";
const yellow = (n) => `### 🟡 F-${n} — breaking validation\n\nCertainty: Fact\n\nOptions:\nproduct — merging picks one.\n- A: version the endpoint → no client breaks → verdict \`changes required\`\n- B: accept the break → old clients get 400 → verdict \`ready to merge\`\n`;
const codes = (r) => r.errors.map((e) => e.code);

test("check-report: a well-formed report passes and returns verdict and owner", () => {
  const r = checkReport(report("changes required", "author", "F-1 fixed → ready to merge", `## Blockers\n\n${red}\n## Open Decisions\n\n${yellow(2)}`));
  assert.deepEqual([r.ok, r.verdict, r.owner, r.findings.length], [true, "changes required", "author", 2], JSON.stringify(r.errors));
  assert.equal(checkReport(report("ready to merge", "merger", "Merge now; deploy with the Deploy Plan (1 steps).", "### 🚀 F-1 — migrate after rollout\n\nCertainty: Fact\n")).ok, true);
  assert.equal(checkReport("Review not performed: feature has no commits beyond main. Needed: commit the work on feature.").verdict, "not-performed");
});

test("check-report: verdict, owner, and outcome-map errors", () => {
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", red))), ["V05"]);
  assert.deepEqual(codes(checkReport(report("changes required", "merger", "x → y", red))), ["V03"]);
  assert.deepEqual(codes(checkReport(report("decision required", "product", "pending", yellow(1)))), ["V04"]);
  assert.ok(codes(checkReport(`${SCOPE}\n\nVerdict: **approve with conditions**\n`)).includes("V00"));
  assert.deepEqual(codes(checkReport(report("verification required", "operations", "≥ 11 → ready to merge", "## Still Open\n\n- [prerequisite] pg version: I could not verify it.\n"))), ["P01", "P02"]);
});

test("check-report: findings, preamble, voice, and not-performed form", () => {
  const bad = report("changes required", "author", "F-1 → ready to merge", "### ⚪ F-2 — later\n\nCertainty: Fact\n\n### 🔴 F-1 — first\n\nCertainty: Conditional risk\n\n### 🟡 F-3 — choose\n\nCertainty: Fact\n- A: one\n");
  assert.deepEqual(codes(checkReport(bad)).sort(), ["F02", "F02", "F03", "F05", "F06"]);
  assert.ok(codes(checkReport(`# Pre-PR review\n\n${report("ready to merge", "merger", "Merge now.")}`)).includes("H01"));
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "You named the base, so your branch is fine."))), ["S01"]);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "Tú nombraste la base."))), ["S01"]);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "The test asserts `you` in a code span."))), []);
  assert.deepEqual(codes(checkReport("I didn't review anything. Review not performed: empty.")), ["R01"]);
});

test("check-report: the trace must carry the report's verdict and owner", () => {
  const ev = (data) => [{ event: "run.end", data }];
  const text = report("changes required", "author", "F-1 → ready to merge", red);
  assert.equal(checkReport(text, { traceEvents: ev({ status: "done", verdict: "changes required", owner: "author" }) }).ok, true);
  assert.deepEqual(codes(checkReport(text, { traceEvents: ev({ status: "done", verdict: "ready to merge", owner: "author" }) })), ["T02"]);
  assert.deepEqual(codes(checkReport(text, { traceEvents: [] })), ["T01"]);
});
