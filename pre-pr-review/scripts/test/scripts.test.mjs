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

// A two-commit repo: `base` files on main, `head` files on feature (checked out).
function miniRepo(base, head) {
  const dir = tmp("ppr-mini-");
  const git = (...a) => assert.equal(spawnSync("git", a, { cwd: dir, encoding: "utf8" }).status, 0, a.join(" "));
  const write = (files) => Object.entries(files).forEach(([f, c]) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c); });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.invalid");
  git("config", "user.name", "t");
  write(base);
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("switch", "-q", "-c", "feature");
  write(head);
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  return dir;
}

test("collect-diff: an environment-variable read activates release-and-ops by content", () => {
  const base = { "src/pay.js": "export const pay = () => 1;\n" };
  const env = collect(miniRepo(base, { "src/pay.js": "const url = process.env.PAYMENTS_URL;\nexport const pay = () => url;\n" }));
  assert.ok(env.lenses.includes("release-and-ops"), env.out);
  assert.match(env.out, /release-and-ops: src\/pay\.js \(content\)/);
  const py = collect(miniRepo({ "app/pay.py": "def pay():\n    return 1\n" }, { "app/pay.py": "import os\ndef pay():\n    return os.getenv('PAYMENTS_URL')\n" }));
  assert.match(py.out, /release-and-ops: app\/pay\.py \(content\)/);
  const plain = collect(miniRepo(base, { "src/pay.js": "export const pay = () => 2;\n" }));
  assert.ok(!plain.lenses.includes("release-and-ops"), "no env read, no lens");
});

test("collect-diff: content signals keep an early match in a large file and cover more env reads (AM-06)", () => {
  const big = `const url = process.env.PAYMENTS_URL;\n${Array.from({ length: 6000 }, (_, i) => `const v${i} = "aaaaaaaaaaaaaaaaaaaa";`).join("\n")}\n`;
  const large = collect(miniRepo({ "src/keep.js": "export const k = 1;\n" }, { "src/big.js": big }));
  assert.match(large.out, /release-and-ops: src\/big\.js \(content\)/, "a match on line 1 of >64 KB of changed text is not lost");
  const reads = collect(miniRepo({ "src/keep.js": "export const k = 1;\n" }, { "cmd/main.go": "package main\nimport \"os\"\nvar u = os.Getenv(\"PAYMENTS_URL\")\n", "web/api.ts": "export const base = import.meta.env.VITE_API_URL;\n" }));
  assert.match(reads.out, /release-and-ops: .*cmd\/main\.go \(content\)/, reads.out);
  assert.match(reads.out, /web\/api\.ts \(content\)/, reads.out);
});

test("collect-diff: pull_request_target raises R even outside CI paths", () => {
  const r = collect(miniRepo({ "tools/ci-template.yml": "on: [pull_request]\n" }, { "tools/ci-template.yml": "on: [pull_request_target]\n" }));
  assert.match(r.R, /^yes \(deploy-coordination\)/, r.out);
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

test("trace: a supplied finding enters as a candidate with origin external", () => {
  const dir = tmp("ppr-trace-");
  const env = { PRE_PR_REVIEW_TRACE_DIR: dir };
  const run = traceEvent(["run.start", "entry=B"], { env }).run;
  const candidate = (origin) => traceEvent(["candidate", "--run", run, "id=ext-1", "lens=release-and-ops", "proposed=red", "summary=x", `origin=${origin}`], { env }).status;
  assert.equal(candidate("external"), 0);
  assert.equal(candidate("caller"), 1, "origin enum");
  assert.equal(traceEvent(["classification", "--run", run, "id=ext-1", "category=🔴", "rule=2", "finding=F-1", "severity=Critical"], { env }).status, 0);
  const { events } = readTrace(tracePath(dir));
  assert.deepEqual(events.map((e) => [e.event, e.data.origin ?? e.data.severity ?? null]), [["run.start", null], ["candidate", "external"], ["classification", "Critical"]]);
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
// Adds the checklist items C01 requires for the body's findings and prerequisites, unless the body has its own.
const checklistFor = (body) => {
  if (body.includes("## Checklist")) return "";
  const merge = [...body.matchAll(/^### (?:🔴|🟡) (F-\d+)/gmu)].map((m) => `- [ ] [before-merge] resolve ${m[1]} — anchor: ${m[1]}`);
  const pre = [...body.matchAll(/\[prerequisite\]\s*([^(:]+?)\s*(?:\(|:)/g)].map((m) => `- [ ] [before-merge] close ${m[1]} — anchor: still-open ${m[1]}`);
  const deploy = [...body.matchAll(/^### 🚀 (F-\d+)/gmu)].map((m) => `- [ ] [before-deploy] run ${m[1]} — anchor: ${m[1]}`);
  const all = [...merge, ...pre, ...deploy];
  return all.length ? `\n## Checklist\n\n${all.join("\n")}\n` : "";
};
const report = (verdict, owner, unblocks, body = "", changes = "Changes: moves auth to the router. [risks: none]") => `${SCOPE}\n\n${changes}\n\nVerdict: **${verdict}**\n\nNext: **${owner}** — act.\n\nUnblocks when: ${unblocks}\n\nReason: r.\n\n${body}${checklistFor(body)}`;
const red = "### 🔴 F-1 — guard removed\n\nSeverity: Critical\n\nCertainty: Fact\n";
const yellow = (n) => `### 🟡 F-${n} — breaking validation\n\nSeverity: High\n\nCertainty: Fact\n\nOptions:\nproduct — merging picks one.\n- A: version the endpoint → no client breaks → verdict \`changes required\`\n- B: accept the break → old clients get 400 → verdict \`ready to merge\`\n`;
const codes = (r) => r.errors.map((e) => e.code);

test("check-report: a well-formed report passes and returns verdict and owner", () => {
  const r = checkReport(report("changes required", "author", "F-1 fixed → ready to merge", `## Blockers\n\n${red}\n## Open Decisions\n\n${yellow(2)}`));
  assert.deepEqual([r.ok, r.verdict, r.owner, r.findings.length], [true, "changes required", "author", 2], JSON.stringify(r.errors));
  assert.equal(checkReport(report("ready to merge", "merger", "Merge now; deploy with the Deploy Plan (1 steps).", "### 🚀 F-1 — migrate after rollout\n\nSeverity: Medium\n\nCertainty: Fact\n")).ok, true);
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
  const bad = report("changes required", "author", "F-1 → ready to merge", "### ⚪ F-2 — later\n\nSeverity: Medium\n\nCertainty: Fact\n\n### 🔴 F-1 — first\n\nSeverity: Critical\n\nCertainty: Conditional risk\n\n### 🟡 F-3 — choose\n\nSeverity: High\n\nCertainty: Fact\n- A: one\n");
  assert.deepEqual(codes(checkReport(bad)).sort(), ["F02", "F02", "F03", "F05", "F06"]);
  assert.ok(codes(checkReport(`# Pre-PR review\n\n${report("ready to merge", "merger", "Merge now.")}`)).includes("H01"));
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "You named the base, so your branch is fine."))), ["S01"]);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "Tú nombraste la base."))), ["S01"]);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "The test asserts `you` in a code span."))), []);
  assert.deepEqual(codes(checkReport("I didn't review anything. Review not performed: empty.")), ["R01"]);
});

test("check-report: the change summary with [risks: …] must precede the verdict (H02)", () => {
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "", "Changes: moves auth to the router."))), ["H02"]);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "", "Sources consulted beyond the diff: none."))), ["H02"]);
  assert.deepEqual(codes(checkReport(report("changes required", "author", "F-1 fixed → ready to merge", red, "Cambios: mueve auth al router. [risks: F-1]"))), []);
});

test("check-report: every actionable finding carries a severity consistent with its marker (F07)", () => {
  const f = (marker, severity, n = 1) => `### ${marker} F-${n} — x\n\n${severity === null ? "" : `Severity: ${severity}\n\n`}Certainty: Fact\n`;
  const ready = (body) => checkReport(report("ready to merge", "merger", "Merge now.", body));
  const blocked = (body) => checkReport(report("changes required", "author", "F-1 fixed → ready to merge", body));
  assert.deepEqual(codes(blocked(f("🔴", "Medium"))), ["F07"]);
  assert.deepEqual(codes(ready(f("⚪", "Critical"))), ["F07"]);
  assert.deepEqual(codes(ready(f("⚪", "Low"))), ["F07"]);
  assert.deepEqual(codes(ready(f("⚪", null))), ["F07"]);
  assert.deepEqual(codes(blocked(f("🔴", "Critical"))), []);
  assert.deepEqual(codes(blocked(f("🔴", "High"))), []);
  assert.deepEqual(codes(ready(f("🚀", "High"))), []);
  assert.deepEqual(codes(ready(f("🚀", "Medium"))), []);
  assert.deepEqual(codes(ready(f("⚪", "Medium"))), []);
  assert.deepEqual(codes(ready("### ⚪ F-1 — x\n\nCertainty: Fact\n\nBounded risk or improvement: High traffic on /orders.\n\nSeverity: Medium\n")), [], "prose like `…: High traffic` is not a severity");
  assert.deepEqual(codes(ready("### ✅ F-1 — refuted\n\nOriginal hypothesis: x\n")), [], "✅ carries no severity");
});

test("check-report: F07 reads only a severity value that stands alone on its line (AM-11)", () => {
  const blocked = (body) => codes(checkReport(report("changes required", "author", "F-1 fixed → ready to merge", `### 🔴 F-1 — x\n\n${body}\n\nCertainty: Fact\n`)));
  const ready = (body) => codes(checkReport(report("ready to merge", "merger", "Merge now.", `### ⚪ F-1 — x\n\n${body}\n\nCertainty: Fact\n`)));
  assert.deepEqual(blocked("Severity: High."), [], "a final period is allowed");
  assert.deepEqual(blocked("Severity: **Critical**"), []);
  assert.deepEqual(blocked("Impact: High (3 tenants)"), ["F07"], "prose with a count is not a severity");
  assert.deepEqual(blocked("Impact: High (all tenants)"), ["F07"], "prose with an annotation is not a severity");
  assert.deepEqual(blocked("Exposure: High — public endpoint\n\nSeverity: Medium"), ["F07"], "the real Severity line is read");
  assert.deepEqual(blocked("Severity: Critical (impact class 3)"), ["F07"], "annotated values are not accepted; the template shows the value alone");
  assert.deepEqual(ready("Likelihood: Medium — rare"), ["F07"], "⚪ without a Severity line");
  assert.deepEqual(ready("Impact: High (logs)\n\nSeverity: Medium"), [], "prose above a valid Severity line");
});

test("check-report: the template's Severity placeholders produce a passing report when filled", () => {
  const tpl = fs.readFileSync(path.join(SKILL, "assets", "review-template.md"), "utf8");
  const values = [...tpl.matchAll(/^Severity: <([^>]+)>$/gm)].map((m) => m[1]);
  assert.deepEqual(values, ["Critical | High", "High | Medium", "High | Medium"], "placeholders list bare values only");
});

test("check-report: the CLI rejects a malformed --external file with a usage error (AM-12)", () => {
  const dir = tmp("ppr-ext-");
  const rep = path.join(dir, "r.md");
  fs.writeFileSync(rep, report("changes required", "author", "F-1 fixed → ready to merge", red));
  const run = (json) => {
    const f = path.join(dir, `f${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(f, JSON.stringify(json));
    return spawnSync(process.execPath, [path.join(SKILL, "scripts", "check-report.mjs"), rep, "--external", f], { encoding: "utf8" }).status;
  };
  assert.equal(run([{ id: "EXT-1" }]), 64, "a bare array");
  assert.equal(run({ items: [{ id: "EXT-1" }] }), 64, "another key");
  assert.equal(run({ findings: [{ title: "t" }] }), 64, "an item without id");
  assert.equal(run({ findings: [{ id: "EXT-1" }] }), 1, "a well-formed file still reaches E01");
  assert.equal(run({ findings: [] }), 0, "an empty list has nothing to account for");
});

test("check-report: every supplied finding has a disposition line (E01)", () => {
  const provided = "## Provided Findings\n\n- EXT-1 → F-1\n- EXT-2 → discarded: generic what-if with no activating condition\n- EXT-3 → out of scope: style\n";
  const full = report("changes required", "author", "F-1 fixed → ready to merge", `${red}\n${provided}`);
  assert.deepEqual(codes(checkReport(full, { external: ["EXT-1", "EXT-2", "EXT-3"] })), []);
  const missing = checkReport(full.replace("- EXT-2 → discarded: generic what-if with no activating condition\n", ""), { external: ["EXT-1", "EXT-2", "EXT-3"] });
  assert.deepEqual(codes(missing), ["E01"]);
  assert.match(missing.errors[0].msg, /EXT-2/);
  assert.deepEqual(codes(checkReport(full, { external: ["EXT-1.a"] })), ["E01"], "IDs are matched literally, not as patterns");
  assert.deepEqual(codes(checkReport(full)), [], "without --external there is nothing to account for");
  assert.deepEqual(codes(checkReport(full.replace("- EXT-1 → F-1", "- **EXT-1** → F-1"), { external: ["EXT-1"] })), [], "a bold ID still counts (AM-05)");
});

test("check-report: the checklist covers every blocking item and every item has an anchor (C01, C02)", () => {
  const deploy = (n) => `### 🚀 F-${n} — step ${n}\n\nSeverity: Medium\n\nCertainty: Fact\n`;
  const body = (list) => `${red}\n${deploy(2)}\n${deploy(3)}\n## Checklist\n\n${list.join("\n")}\n`;
  const ok = ["- [ ] [before-merge] restore the guard — anchor: F-1", "- [ ] [before-deploy] migrate after rollout — anchor: F-2", "- [ ] [before-deploy] drop the column — anchor: F-3", "- [ ] [after-deploy] watch 403 rate on DELETE /users — anchor: flow delete-user"];
  const run = (list) => codes(checkReport(report("changes required", "author", "F-1 fixed → ready to merge", body(list))));
  assert.deepEqual(run(ok), []);
  assert.deepEqual(run(ok.filter((l) => !l.includes("F-1"))), ["C01"], "🔴 without a before-merge item");
  assert.deepEqual(run(ok.filter((l) => !l.includes("F-3"))), ["C01"], "🚀 without a before-deploy item");
  assert.deepEqual(run([ok[0], ok[2], ok[1], ok[3]]), ["C01"], "🚀 items out of ID order");
  assert.deepEqual(run([...ok, "- [ ] check the logs"]), ["C02"], "no group tag, no anchor");
  assert.deepEqual(run([...ok, "- [ ] [after-deploy] check the logs"]), ["C02"], "no anchor");
  const pre = report("verification required", "operations", "≥ 11 → ready to merge; < 11 → changes required", "## Still Open\n\n- [prerequisite] pg version (owner: **operations**): I could not verify it. Outcomes: ≥ 11 → ready to merge; < 11 → changes required.\n\n## Checklist\n\n- [ ] [before-merge] confirm the engine version — anchor: file infra/db.tf\n");
  assert.deepEqual(codes(checkReport(pre)), ["C01"], "[prerequisite] without a still-open anchor");
  assert.deepEqual(codes(checkReport(pre.replace("anchor: file infra/db.tf", "anchor: still-open pg version"))), []);
});

test("check-report: C01 and C02 accept emphasis, fenced evidence, and repeated deploy anchors (AM-05)", () => {
  const pre = (name) => report("verification required", "operations", "≥ 11 → ready to merge; < 11 → changes required", `## Still Open\n\n- [prerequisite] ${name} (owner: **operations**): I could not verify it. Outcomes: ≥ 11 → ready to merge; < 11 → changes required.\n\n## Checklist\n\n- [ ] [before-merge] confirm the engine version — anchor: still-open pg version\n`);
  assert.deepEqual(codes(checkReport(pre("**pg version**"))), [], "bold name");
  assert.deepEqual(codes(checkReport(pre("`pg version`"))), [], "backticked name");
  const fence = report("ready to merge", "merger", "Merge now.", "## Verified\n\n- The PR template gains a box:\n\n```md\n- [ ] I have tested this\n```\n");
  assert.deepEqual(codes(checkReport(fence)), [], "task-list lines inside fenced code are evidence, not checklist items");
  const open = report("ready to merge", "merger", "Merge now.", "## Verified\n\n- Evidence:\n\n```js\nconst x = 1;\n\n## Checklist\n\n- [ ] check the logs\n");
  assert.deepEqual(codes(checkReport(open)), ["C02"], "an unclosed fence does not hide later items (AM-09)");
  const inline = report("ready to merge", "merger", "Merge now.", "## Verified\n\n```foo``` is called twice.\n\n## Checklist\n\n- [ ] check the logs\n");
  assert.deepEqual(codes(checkReport(inline)), ["C02"], "inline triple-backtick code is not a fence (AM-09)");
  const after = (block) => codes(checkReport(report("ready to merge", "merger", "Merge now.", `## Checklist\n\n${block}\n\n- [ ] untagged\n`)));
  assert.deepEqual(after("```python\n# check\nprint(1)\n```"), ["C02"], "a # comment inside a closed fence does not hide later items (AM-11)");
  assert.deepEqual(after("```md\n## Steps\n- a\n```"), ["C02"], "a quoted heading inside a fence does not hide later items (AM-11)");
  const quoted = (block) => codes(checkReport(report("ready to merge", "merger", "Merge now.", `## Verified\n\n${block}\n`)));
  assert.deepEqual(quoted("````md\n```\n- [ ] I have tested this\n```\n````"), [], "four-backtick fence (AM-11)");
  assert.deepEqual(quoted("```diff {1}\n- [ ] x\n```"), [], "info string with attributes (AM-11)");
  const covered = report("changes required", "author", "F-1 fixed → ready to merge", "### 🔴 F-1 — x\n\nSeverity: High\n\nCertainty: Fact\n\n## Checklist\n\n```bash\n# reproduce\ncurl x\n```\n\n- [ ] [before-merge] fix — anchor: F-1\n");
  assert.deepEqual(codes(checkReport(covered)), [], "an item after a fenced # comment still covers its finding (AM-11)");
  const crossing = report("ready to merge", "merger", "Merge now.", "## Verified\n\n```diff\n+ x\n\n## Checklist\n\n- [ ] untagged\n\n## Operational Queries\n\n```sql\nselect 1;\n```\n");
  assert.deepEqual(codes(checkReport(crossing)), ["C03"], "a fence left open across sections is reported (AM-12)");
  assert.match(checkReport(crossing).errors[0].msg, /line \d+.*line \d+/);
  assert.deepEqual(codes(checkReport(report("ready to merge", "merger", "Merge now.", "## Verified\n\n```md\n## Steps\n- a\n```\n"))), [], "a quoted heading inside a closed fence is not C03 (AM-12)");
  const deploy = (n) => `### 🚀 F-${n} — step ${n}\n\nSeverity: Medium\n\nCertainty: Fact\n`;
  const steps = (list) => codes(checkReport(report("ready to merge", "merger", "Merge now; deploy with the Deploy Plan (2 steps).", `${deploy(1)}\n${deploy(2)}\n## Checklist\n\n${list.join("\n")}\n`)));
  assert.deepEqual(steps(["- [ ] [before-deploy] migrate — anchor: F-1", "- [ ] [before-deploy] roll out — anchor: F-2", "- [ ] [before-deploy] confirm DB_URL in production — anchor: F-1"]), [], "an environment check anchored to an earlier step");
  assert.deepEqual(steps(["- [ ] [before-deploy] roll out — anchor: F-2", "- [ ] [before-deploy] migrate — anchor: F-1"]), ["C01"], "steps still follow their ID order");
  assert.deepEqual(steps(["- [ ] [before-deploy] migrate — anchor: F-1"]), ["C01"], "a step without an item");
});

test("check-report: the trace must carry the report's verdict and owner", () => {
  const ev = (data) => [{ event: "run.end", data }];
  const text = report("changes required", "author", "F-1 → ready to merge", red);
  assert.equal(checkReport(text, { traceEvents: ev({ status: "done", verdict: "changes required", owner: "author" }) }).ok, true);
  assert.deepEqual(codes(checkReport(text, { traceEvents: ev({ status: "done", verdict: "ready to merge", owner: "author" }) })), ["T02"]);
  assert.deepEqual(codes(checkReport(text, { traceEvents: [] })), ["T01"]);
});
