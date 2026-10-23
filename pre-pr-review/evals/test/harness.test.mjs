// Tests for the eval harness: report and transcript parsing, scoring, aggregation, CLI arguments,
// and the ground truth in evals.json. They never call the `claude` CLI.
// Run: node --test pre-pr-review/evals/test/harness.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { claimKey, forbiddenCommands, isTemplateCompliant, parseReport, parseTranscript, parseVerdict, totalTokens } from "../lib/report.mjs";
import { aggregate, scoreRun } from "../lib/score.mjs";
import { benchmarkMarkdown, claudeArgs, parseArgs } from "../run-evals.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVALS = path.resolve(HERE, "..");

const REPORT = `Scope: repo \`x\` · entry point \`A pre-PR\` · base \`main (confirmed via user)\` · merge-base \`a1\` · head \`b2\` · PR \`none\`

Verdict: **changes required**

Next: **author** — restore the admin guard (F-1) and re-run the review.

Unblocks when: F-1 fixed → ready to merge.

Reason: the admin guard is gone.

## Blockers

### 🔴 F-1 — DELETE /users/:id no longer requires admin

Location: \`src/routes/users.js:13 @ abc1234 (head)\`

Certainty: Fact

## Open Decisions

### 🟡 F-2 — Mocked middleware hides the guard

Certainty: Fact

Options:
- A: keep the mocks → no change → verdict \`ready to merge\`
- B: test real middleware → new test → verdict \`changes required\`

## Non-Blocking

### 🚀 F-3 — Run the migration after the rollout

Certainty: Fact

### ⚪ F-4 — Tests mock both middlewares

Certainty: Fact

## Ruled Out

### ✅ F-5 — Another admin check in services

## Still Open

- [prerequisite] pg version (owner: **operations**): I could not verify the production PostgreSQL version — run \`SHOW server_version;\`. Outcomes: ≥ 11 → ready to merge; < 11 → changes required.
- Not a prerequisite item
`;

test("parseVerdict reads the bold verdict key in any report language", () => {
  assert.equal(parseVerdict(REPORT), "changes required");
  assert.equal(parseVerdict("Veredicto: **decision required**"), "decision required");
  assert.equal(parseVerdict("Verdict: **ready to merge**"), "ready to merge");
  // Reports from the earlier verdict set still map where the meaning is unambiguous.
  assert.equal(parseVerdict("Veredicto: **do not approve until production PostgreSQL version is verified**"), "verification required");
  assert.equal(parseVerdict("Verdict: **approve**"), "ready to merge");
  assert.equal(parseVerdict("Verdict: **approve with conditions**"), null);
  assert.equal(parseVerdict("Review not performed: no commits. Needed: a branch."), "not-performed");
  assert.equal(parseVerdict("no verdict here"), null);
  // A report that drifts from the template is still scored.
  assert.equal(parseVerdict("**Verdict: ready to merge.** The refactor keeps behavior."), "ready to merge");
  assert.equal(parseVerdict("Veredicto — changes required, por F-1"), "changes required");
});

test("claimKey keys a grader mapping by the claim id even when the title is echoed", () => {
  assert.equal(claimKey("F-1 SQL injection through the sort parameter"), "F-1");
  assert.equal(claimKey(" P-2 "), "P-2");
  assert.equal(claimKey("X-3: drop before rollout"), "X-3");
  assert.equal(claimKey("other"), "other");
});

test("isTemplateCompliant is the skill's own pre-emit check", () => {
  assert.equal(isTemplateCompliant(REPORT), true);
  assert.equal(isTemplateCompliant("# Pre-PR review\n\n**Verdict: ready to merge.** Looks fine.\n"), false);
  assert.equal(isTemplateCompliant("Review not performed: empty diff. Needed: commits."), true);
});

test("parseReport extracts findings by severity and prerequisite items as claims", () => {
  const r = parseReport(REPORT);
  assert.deepEqual(r.findings.map((f) => [f.id, f.severity]), [["F-1", "red"], ["F-2", "yellow"], ["F-3", "deploy"], ["F-4", "white"], ["F-5", "ruled-out"]]);
  assert.match(r.findings[0].excerpt, /src\/routes\/users\.js:13/);
  assert.deepEqual(r.claims.map((c) => [c.id, c.severity]), [["F-1", "red"], ["F-2", "yellow"], ["F-3", "deploy"], ["F-4", "white"], ["P-1", "prerequisite"]]);
});

test("scoreRun counts TP, FP, over-gating, noise, recall, and verdict", () => {
  const testCase = {
    expected_verdict: "changes required",
    expected_findings: [
      { id: "guard", severity: "red", required: true },
      { id: "mocks", severity: ["white"], required: false },
      { id: "pg", severity: "prerequisite", required: true },
      { id: "order", severity: "deploy", required: false, disputed: true },
    ],
    assertions: ["a", "b"],
  };
  const report = parseReport(REPORT);
  // F-2 is an unrelated 🟡 (FP); F-3 is about a disputed finding (not scored); F-4 is the optional ⚪; P-1 is the prerequisite.
  const s = scoreRun({ testCase, report, mapping: { "F-1": "guard", "F-2": null, "F-3": "order", "F-4": "mocks", "P-1": "pg" }, assertions: [{ passed: true }, { passed: false }] });
  assert.equal(s.disputed, 1);
  assert.deepEqual(
    { tp: s.tp, fp: s.fp, overGated: s.overGated, noise: s.nonGatingNoise, found: s.found, required: s.required, precision: s.precision, recall: s.recall, verdict: s.verdictCorrect, asserts: [s.assertionsPassed, s.assertionsTotal] },
    { tp: 2, fp: 1, overGated: 0, noise: 0, found: 2, required: 2, precision: 2 / 3, recall: 1, verdict: true, asserts: [1, 2] },
  );
  // A real but non-gating issue reported as 🟡 is a false gate, not a true positive.
  const over = scoreRun({ testCase, report, mapping: { "F-1": "guard", "F-2": "mocks", "F-3": "order", "F-4": null, "P-1": null } });
  assert.deepEqual({ tp: over.tp, fp: over.fp, overGated: over.overGated, noise: over.nonGatingNoise, missed: over.missed }, { tp: 1, fp: 2, overGated: 1, noise: 1, missed: ["pg"] });
});

test("scoreRun on a clean case: any gating claim is a false positive and the verdict decides the false gate", () => {
  const clean = { clean: true, expected_verdict: "ready to merge", expected_findings: [], assertions: [] };
  const s = scoreRun({ testCase: clean, report: parseReport(REPORT), mapping: {} });
  assert.deepEqual([s.tp, s.fp, s.nonGatingNoise, s.recall, s.verdictCorrect], [0, 4, 1, null, false], "🔴, 🟡, 🚀, and the prerequisite are all actionable");
  const ok = scoreRun({ testCase: clean, report: parseReport("Verdict: **ready to merge**\n\n### ⚪ F-1 — paginate later\n"), mapping: { "F-1": null } });
  assert.deepEqual([ok.fp, ok.nonGatingNoise, ok.precision, ok.verdictCorrect], [0, 1, null, true]);
});

test("aggregate computes micro precision/recall, clean false-gate rate, cost per TP, and consistency", () => {
  const run = (k, score, cost) => ({ config: "skill", case: k, score, metrics: { costUsd: cost, durationMs: 60_000, tokens: { input: 10, output: 5, cacheRead: 0, cacheCreation: 0 }, turns: 4, toolCallCount: 9, subagents: 0, skillUsed: true, trace: { complete: true, violations: [] } } });
  const base = { tp: 0, fp: 0, overGated: 0, duplicates: 0, nonGatingNoise: 0, required: 0, found: 0, requiredGating: 0, foundGating: 0, severityCorrect: 0, assertionsPassed: 1, assertionsTotal: 1, safetyViolations: 0 };
  const a = aggregate([
    run("bug", { ...base, tp: 1, fp: 1, required: 1, found: 1, requiredGating: 1, foundGating: 1, severityCorrect: 1, verdict: "changes required", verdictCorrect: true, clean: false }, 2),
    run("bug", { ...base, tp: 1, required: 1, found: 1, requiredGating: 1, foundGating: 1, severityCorrect: 1, verdict: "changes required", verdictCorrect: true, clean: false }, 2),
    run("clean", { ...base, fp: 1, verdict: "decision required", verdictCorrect: false, clean: true }, 1),
  ]);
  assert.deepEqual(
    { p: a.precision, r: a.recall, f1: a.f1, clean: a.cleanFalseGateRate, va: a.verdictAccuracy, cpt: a.costPerTruePositive, consistency: a.verdictConsistency, cost: a.costUsd.total },
    { p: 0.5, r: 1, f1: 0.667, clean: 1, va: 0.667, cpt: 2.5, consistency: 1, cost: 5 },
  );
  assert.match(benchmarkMarkdown({ meta: { date: "d", model: "m", graderModel: "g", invoke: "slash", runs: 2, skillDir: "/s", skillCommit: "abc", graderCostUsd: 0.1 }, configs: { skill: a }, perCase: [], runs: [] }), /\| Precision \(actionable claims: 🔴 🟡 🚀 \[prerequisite\]\) \| 50% \|/);
});

test("parseTranscript reads cost, usage, tool calls, sub-agents, and skill use from stream-json", () => {
  const lines = [
    { type: "system", subtype: "init", model: "claude-opus-5-5" },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Skill", input: { skill: "pre-pr-review" } }] } },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "git stash list" } }, { type: "tool_use", name: "Agent", input: { description: "lens" } }] } },
    { type: "assistant", parent_tool_use_id: "t1", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "git checkout main" } }] } },
    { type: "result", subtype: "success", result: "Verdict: **approve**", total_cost_usd: 1.25, duration_ms: 90_000, num_turns: 7, usage: { input_tokens: 100, output_tokens: 50 }, modelUsage: { a: { inputTokens: 300, outputTokens: 80, cacheReadInputTokens: 1000, cacheCreationInputTokens: 20 } } },
  ].map((m) => JSON.stringify(m));
  const t = parseTranscript(lines);
  assert.deepEqual(
    { model: t.model, text: t.finalText, cost: t.costUsd, turns: t.turns, sub: t.subagents, skill: t.skillToolInvoked, calls: t.toolCalls.length, err: t.isError },
    { model: "claude-opus-5-5", text: "Verdict: **approve**", cost: 1.25, turns: 7, sub: 1, skill: true, calls: 4, err: false },
  );
  assert.deepEqual(totalTokens(t), { input: 300, output: 80, cacheRead: 1000, cacheCreation: 20 });
  assert.deepEqual(forbiddenCommands(t.toolCalls).map((f) => f.category), ["git-mutation"]);
  assert.equal(parseTranscript([]).isError, true);
  // A later turn can end with an empty or failed result; the answer is the last non-empty one,
  // a result inside a sub-agent stream is ignored, and cost is the session maximum.
  const multi = parseTranscript([
    { type: "result", parent_tool_use_id: "t9", result: "sub-agent text", total_cost_usd: 0.1 },
    { type: "result", subtype: "success", result: "Verdict: **ready to merge**", total_cost_usd: 1.5, duration_ms: 80_000 },
    { type: "result", subtype: "success", result: "", total_cost_usd: 1.6, duration_ms: 81_000 },
    { type: "result", subtype: "success", result: "limit", api_error: "usage_limit_reached", total_cost_usd: 1.6 },
  ].map((m) => JSON.stringify(m)));
  assert.deepEqual([multi.finalText, multi.costUsd, multi.durationMs, multi.isError, multi.apiErrors], ["Verdict: **ready to merge**", 1.6, 81_000, false, ["usage_limit_reached"]]);
  const limited = parseTranscript([JSON.stringify({ type: "result", result: "You've hit your limit", api_error: "usage_limit_reached" })]);
  assert.equal(limited.isError, true);
});

test("forbiddenCommands flags mutations and external access but not read-only commands", () => {
  const bash = (command) => ({ name: "Bash", input: { command } });
  const flagged = forbiddenCommands([
    bash("git diff main...HEAD | sort -u"),
    bash("git rev-parse HEAD main; git merge-base main HEAD"),
    bash("git worktree add --detach /tmp/w abc"),
    bash("npm ci && npm test"),
    bash("pnpm install --frozen-lockfile"),
    bash("git reset --hard"),
    bash("psql $DATABASE_URL -c 'select 1'"),
    bash("npx jest -u"),
    bash("npm install left-pad"),
    bash("which postgres psql pg_ctl; cat > packet.md <<'EOF'\nno psql access here\nEOF"),
    bash("echo ok && psql -h prod -c 'select 1'"),
  ]).map((f) => f.category);
  assert.deepEqual(flagged, ["git-mutation", "database", "snapshot-update", "mutating-install", "database"]);
});

test("claudeArgs: the skill config invokes the skill; the baseline disables skills", () => {
  const opts = parseArgs(["--model", "opus", "--max-budget-usd", "3"]);
  const skill = claudeArgs("skill", opts, "Review feature vs main.");
  assert.equal(skill[1], "/pre-pr-review Review feature vs main.");
  assert.ok(skill.includes("stream-json") && skill.includes("dontAsk") && skill.includes("opus") && skill.includes("--strict-mcp-config"));
  assert.ok(!skill.includes("--disable-slash-commands"));
  const baseline = claudeArgs("baseline", opts, "Review feature vs main.");
  assert.equal(baseline[1], "Review feature vs main.");
  assert.ok(baseline.includes("--disable-slash-commands") && baseline.includes("Skill"));
  assert.equal(claudeArgs("skill", parseArgs(["--invoke", "natural"]), "p")[1], "p");
  assert.throws(() => parseArgs(["--configs", "other"]), /unknown config/);
});

test("evals.json: every case has ground truth and a fixture", () => {
  const spec = JSON.parse(fs.readFileSync(path.join(EVALS, "evals.json"), "utf8"));
  const verdicts = ["changes required", "verification required", "decision required", "ready to merge", "not-performed"];
  const severities = ["red", "yellow", "deploy", "white", "prerequisite", "any"];
  const ids = new Set();
  for (const e of spec.evals) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    ids.add(e.id);
    assert.ok(fs.existsSync(path.join(EVALS, "files", e.name, "base")), `${e.name}: fixture`);
    for (const v of [].concat(e.expected_verdict)) assert.ok(verdicts.includes(v), `${e.name}: verdict ${v}`);
    assert.ok(Array.isArray(e.expected_findings), `${e.name}: expected_findings`);
    for (const f of e.expected_findings) {
      assert.ok(f.id && f.description, `${e.name}: finding id/description`);
      for (const s of [].concat(f.severity)) assert.ok(severities.includes(s), `${e.name}/${f.id}: severity ${s}`);
    }
    if (e.clean) {
      assert.equal(e.expected_verdict, "ready to merge", `${e.name}: a clean case expects ready to merge`);
      assert.ok(e.expected_findings.every((f) => f.required === false), `${e.name}: clean cases have only optional findings`);
    }
  }
  assert.ok(spec.evals.filter((e) => e.clean).length >= 4, "at least four clean cases measure false positives");
  for (const e of spec.evals) for (const f of e.expected_findings) if (f.disputed) assert.equal(f.required, false, `${e.name}/${f.id}: a disputed finding cannot be required`);
});
