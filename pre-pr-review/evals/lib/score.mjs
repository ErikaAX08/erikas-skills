// Scores one eval run against its case's ground truth, and aggregates runs per configuration.
// Pure functions: the grader supplies the semantic mapping (reported claim → expected finding),
// everything else is counted here so the numbers are reproducible from the saved grading files.

// Actionable claims: the ones that block the merge or impose a deploy step. A wrong one costs the
// author or operations real work, so precision is computed over them.
const GATING = new Set(["red", "yellow", "prerequisite", "deploy"]);

const asList = (x) => (Array.isArray(x) ? x : [x]);

export function verdictMatches(expected, actual) {
  return asList(expected).includes(actual);
}

// claims: [{ id, severity }] from parseReport; mapping: { [claimId]: expectedId | null };
// expected: case.expected_findings ([{ id, severity, required }]).
export function scoreRun({ testCase, report, mapping, assertions = [], safety = {} }) {
  const expected = testCase.expected_findings ?? [];
  const byId = new Map(expected.map((e) => [e.id, e]));
  const hits = new Map(); // expected id → claims mapped to it
  let fp = 0;
  let overGated = 0; // a real issue the case says must not gate the merge, reported as gating
  let nonGatingNoise = 0;
  let disputed = 0; // claims about a finding whose ground truth is under review: neither TP nor FP
  for (const c of report.claims) {
    const target = mapping[c.id] ?? null;
    const e = target ? byId.get(target) : null;
    if (e?.disputed) {
      disputed++;
      continue;
    }
    if (e && GATING.has(c.severity) && !asList(e.severity).some((s) => GATING.has(s) || s === "any")) {
      fp++;
      overGated++;
    } else if (e) {
      if (!hits.has(target)) hits.set(target, []);
      hits.get(target).push(c);
    } else if (GATING.has(c.severity)) fp++;
    else nonGatingNoise++;
  }
  let tp = 0;
  let duplicates = 0;
  for (const claims of hits.values()) {
    const gating = claims.filter((c) => GATING.has(c.severity)).length;
    if (gating) tp++;
    duplicates += Math.max(0, gating - 1);
  }
  const required = expected.filter((e) => e.required !== false && !e.disputed);
  const requiredGating = required.filter((e) => asList(e.severity).some((s) => GATING.has(s)));
  const found = required.filter((e) => hits.has(e.id));
  const foundGating = requiredGating.filter((e) => (hits.get(e.id) ?? []).some((c) => GATING.has(c.severity)));
  const severityCorrect = found.filter((e) => (hits.get(e.id) ?? []).some((c) => asList(e.severity).includes(c.severity) || asList(e.severity).includes("any")));
  const passed = assertions.filter((a) => a.passed).length;
  return {
    verdictExpected: testCase.expected_verdict,
    verdict: report.verdict,
    verdictCorrect: verdictMatches(testCase.expected_verdict, report.verdict),
    clean: Boolean(testCase.clean),
    tp,
    fp,
    overGated,
    disputed,
    duplicates,
    nonGatingNoise,
    required: required.length,
    found: found.length,
    requiredGating: requiredGating.length,
    foundGating: foundGating.length,
    severityCorrect: severityCorrect.length,
    missed: required.filter((e) => !hits.has(e.id)).map((e) => e.id),
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: required.length ? found.length / required.length : null,
    assertionsPassed: passed,
    assertionsTotal: assertions.length,
    safetyViolations: (safety.forbidden?.length ?? 0) + (safety.gitChanged ? 1 : 0),
  };
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const std = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const round = (x, d = 3) => (x === null || x === undefined ? null : Math.round(x * 10 ** d) / 10 ** d);
const nums = (runs, f) => runs.map(f).filter((x) => typeof x === "number" && !Number.isNaN(x));

// runs: [{ config, case, score, metrics }] where metrics carries cost, tokens, duration, etc.
export function aggregate(runs) {
  const sum = (f) => runs.reduce((a, r) => a + (f(r) ?? 0), 0);
  const tp = sum((r) => r.score?.tp);
  const fp = sum((r) => r.score?.fp);
  const required = sum((r) => r.score?.required);
  const found = sum((r) => r.score?.found);
  const requiredGating = sum((r) => r.score?.requiredGating);
  const foundGating = sum((r) => r.score?.foundGating);
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = required ? found / required : null;
  const f1 = precision !== null && recall !== null && precision + recall ? (2 * precision * recall) / (precision + recall) : null;
  const scored = runs.filter((r) => r.score);
  const clean = scored.filter((r) => r.score.clean);
  const cost = nums(runs, (r) => r.metrics?.costUsd);
  const byCase = groupBy(scored, (r) => r.case);
  const consistent = Object.values(byCase).filter((rs) => rs.length > 1);
  return {
    runs: runs.length,
    scored: scored.length,
    errors: runs.filter((r) => r.metrics?.isError).length,
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    gatingRecall: round(requiredGating ? foundGating / requiredGating : null),
    tp,
    fp,
    missed: required - found,
    overGated: sum((r) => r.score?.overGated),
    disputed: sum((r) => r.score?.disputed),
    duplicates: sum((r) => r.score?.duplicates),
    nonGatingNoisePerRun: round(mean(nums(scored, (r) => r.score.nonGatingNoise)), 2),
    severityAccuracy: round(found ? sum((r) => r.score?.severityCorrect) / found : null),
    verdictAccuracy: round(mean(scored.map((r) => (r.score.verdictCorrect ? 1 : 0)))),
    cleanFalseGateRate: round(clean.length ? mean(clean.map((r) => (r.score.verdictCorrect ? 0 : 1))) : null),
    assertionPassRate: round(sum((r) => r.score?.assertionsTotal) ? sum((r) => r.score?.assertionsPassed) / sum((r) => r.score?.assertionsTotal) : null),
    verdictConsistency: round(consistent.length ? mean(consistent.map((rs) => (new Set(rs.map((r) => r.score.verdict)).size === 1 ? 1 : 0))) : null),
    safetyViolations: sum((r) => r.score?.safetyViolations),
    reportCheckedRate: round(mean(runs.map((r) => (r.metrics?.reportChecked ? 1 : 0)))),
    templateComplianceRate: round(mean(runs.map((r) => (r.metrics?.templateCompliant ? 1 : 0)))),
    skillUsedRate: round(mean(runs.map((r) => (r.metrics?.skillUsed ? 1 : 0)))),
    traceCompleteRate: round(mean(runs.map((r) => (r.metrics?.trace?.complete ? 1 : 0)))),
    traceViolations: sum((r) => r.metrics?.trace?.violations?.length),
    costUsd: { mean: round(mean(cost), 4), std: round(std(cost), 4), total: round(cost.reduce((a, b) => a + b, 0), 4) },
    costPerTruePositive: round(tp ? cost.reduce((a, b) => a + b, 0) / tp : null, 4),
    durationSec: { mean: round(mean(nums(runs, (r) => r.metrics?.durationMs / 1000)), 1), std: round(std(nums(runs, (r) => r.metrics?.durationMs / 1000)), 1) },
    tokens: {
      input: round(mean(nums(runs, (r) => r.metrics?.tokens?.input)), 0),
      output: round(mean(nums(runs, (r) => r.metrics?.tokens?.output)), 0),
      cacheRead: round(mean(nums(runs, (r) => r.metrics?.tokens?.cacheRead)), 0),
      cacheCreation: round(mean(nums(runs, (r) => r.metrics?.tokens?.cacheCreation)), 0),
    },
    turns: round(mean(nums(runs, (r) => r.metrics?.turns)), 1),
    toolCalls: round(mean(nums(runs, (r) => r.metrics?.toolCallCount)), 1),
    subagents: round(mean(nums(runs, (r) => r.metrics?.subagents)), 1),
  };
}

function groupBy(list, key) {
  return list.reduce((acc, x) => ((acc[key(x)] ??= []).push(x), acc), {});
}

export function perCase(runs) {
  return Object.entries(groupBy(runs, (r) => `${r.config}\u0000${r.case}`)).map(([k, rs]) => {
    const [config, name] = k.split("\u0000");
    return { config, case: name, ...aggregate(rs), verdicts: rs.map((r) => r.score?.verdict ?? "error") };
  });
}
