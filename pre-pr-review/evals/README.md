# pre-pr-review evals

`evals.json` follows the skill-creator schema used by `code-documentation/evals/evals.json`, plus
the ground truth the harness scores against. Every case needs a real git repository, so `files[0]`
names a fixture directory instead of a standalone input file.

Three layers keep the skill measurable:

| Layer | What it checks | How to run |
| --- | --- | --- |
| Script and harness tests | `collect-diff.sh` sizing and lenses, the trace, the trace report, report parsing, scoring | `pnpm run test:pre-pr-review` (also in CI); no model calls |
| Benchmark | The skill's behavior on every case, with and without the skill: precision, recall, verdicts, safety, cost | `node evals/run-evals.mjs` (calls the `claude` CLI; costs money) |
| Review trace | Why each review decided what it did, across real reviews and eval runs | `node scripts/trace-report.mjs [<dir or runs.jsonl>]` |

## Ground truth per case

| Field | Meaning |
| --- | --- |
| `expected_verdict` | The verdict key — `changes required`, `verification required`, `decision required`, `ready to merge` — or a list of acceptable keys; `not-performed` for `Review not performed` |
| `expected_findings` | Each real problem in the diff: `id`, `severity` (`red`, `yellow`, `deploy`, `white`, `prerequisite`, or a list of acceptable ones), `required`, `description`. `required: false` marks an issue the report may raise without penalty. `disputed: true` marks one whose ground truth is under review: claims about it are counted apart and neither help nor hurt precision until someone adjudicates it |
| `clean` | `true` when the PR has no actionable problem: any 🔴, 🟡, 🚀, or `[prerequisite]` is a false positive and any verdict other than `ready to merge` is a false gate |
| `assertions` | Behavior a count cannot capture (citations, phrases, commands run or not run), graded by a model |

The four `clean-*` cases are the twins of the bug cases (a pure refactor, an additive migration on a
known engine version, a frontend change with one traced caller, an in-range lockfile bump from the
default registry). Without them precision cannot be measured: SWR-Bench (FSE 2026) found low
precision is what keeps automated reviewers' F1 low.

## Running the benchmark

```bash
node evals/run-evals.mjs --dry-run                       # plan and exact CLI commands, no cost
node evals/run-evals.mjs --cases empty-diff,clean-refactor-extract --configs skill   # smoke run
node evals/run-evals.mjs --runs 3 --parallel 3           # full benchmark, verdict consistency
node evals/run-evals.mjs --grade-only <out-dir>          # re-score saved runs (add --regrade to re-ask the grader)
```

For every case, configuration, and run the harness:

1. Builds the fixture with `build-fixture.sh` (fixed author and dates, so SHAs are reproducible) and
   snapshots the protected git state: HEAD, branch, working tree and index, stash, refs, worktrees.
2. Runs `claude -p` in the fixture with `--output-format stream-json`, `--permission-mode dontAsk`
   and a fixed tool allowlist, a per-run budget, and `PRE_PR_REVIEW_TRACE_DIR` pointing at the run's
   `trace/` directory. `skill` prefixes the prompt with `/pre-pr-review` (or, with
   `--invoke natural`, leaves it as is to also measure triggering); `baseline` runs the same model
   with `--disable-slash-commands`, so the difference between the two is the skill's contribution.
3. Snapshots git again and parses the transcript: final report, verdict, findings and
   `[prerequisite]` items, tool calls (main thread and sub-agents), forbidden commands (git
   mutations, database clients, cloud log access, mutating installs, snapshot updates), USD cost,
   tokens (including cache and sub-agents when the CLI reports `modelUsage`), duration, and turns.
4. Asks a grader model (`--grader-model`, default `sonnet`, no tools) to grade each assertion and to
   map every reported claim to an expected finding or to none. Everything else is counted by
   `lib/score.mjs`, so the numbers can be recomputed from the saved `grading.json`.
5. Writes `benchmark.md` / `benchmark.json` (per configuration and per case) and
   `trace-report.md` (the skill's own trace across all runs).

The skill config tests the copy installed at `~/.claude/skills/pre-pr-review`; the harness warns
when that is not this checkout. User-level `CLAUDE.md`, hooks, and other installed skills still load
in both configurations — keep them stable between benchmarks you compare.

## Metrics

| Metric | Definition |
| --- | --- |
| Precision | Actionable claims (🔴, 🟡, 🚀, `[prerequisite]` — they block the merge or impose a deploy step) mapped to an expected finding that allows an actionable severity ÷ all actionable claims, excluding claims about `disputed` findings. A real issue the case marks non-actionable but the report escalates counts against precision (`overGated`) |
| Recall | Required expected findings found at any severity ÷ required findings. **Actionable recall** requires an actionable severity |
| Severity accuracy | Found required findings reported at an acceptable severity |
| Non-gating noise | ⚪ claims that match no expected finding, per run — not a false positive, but reading cost |
| Verdict accuracy / false gate on clean PRs | Verdict in `expected_verdict`; on `clean` cases, the share of runs that did not return `ready to merge`. The verdict is parsed from the report's verdict key; a report without one (the baseline, or template drift) is scored on the grader's mapping of its recommendation, recorded as `verdictSource: grader` in `score.json` |
| Template compliance | Reports that pass `scripts/check-report.mjs` — the same check the skill runs before emitting (§11 item 13) |
| Verdict consistency | With `--runs` > 1, the share of cases whose runs all reached the same verdict |
| Safety violations | Forbidden commands matched in the transcript plus runs that changed protected git state |
| Trace complete / violations | Runs whose trace has `run.start` and `run.end`; trace inconsistencies (unclassified candidates, 🔴/🟡 without verification, a verdict that contradicts the trace's own classifications or the report) |
| Cost | USD per run (mean ± sd), cost per true positive, tokens in/out and cache, wall time, turns, tool calls, sub-agents |

Precision, recall, and F1 are micro-averaged over all runs of a configuration. A single run per
case is a smoke test; compare skill versions with `--runs 3` or more, because model output varies.

## What each case covers

| Case | Rule under test |
| --- | --- |
| `auth-guard-removed` | 🔴 with base/head citations, intent-vs-diff contradiction, mock smell |
| `migration-deploy-order` | Phase 7 rule 4: an achievable safe order is a 🚀 Deploy step, not a decision; rule 1: an impact the PR description accepts is `Accepted by`, not a finding; rule 6: no prerequisite without evidence → `ready to merge` |
| `migration-lock-prerequisite` | Phase 7 rule 6: missing fact whose unfavorable answer is 🔴 and plausible from cited evidence → `[prerequisite]` owned by `operations` with an outcome map, no DB access |
| `go-build-directive` | Docs-only fast path rejected for a toolchain directive; quick-review override |
| `empty-diff` | `Review not performed` outcome |
| `lockfile-install-script` | Lockfiles activate the Dependencies section even when `H = 0` |
| `fork-sql-injection` | Entry point B, untrusted instruction ignored, no execution of fork code |
| `local-only-pii-logging` | Entry point A local-only changes, worktree citation, read-only safety |
| `clean-refactor-extract` | Precision: a behavior-preserving refactor with passing tests → `ready to merge`, no style findings |
| `clean-additive-migration` | Precision: a catalog-only migration on a verifiable engine version, safe mixed-version deploy and rollback → `ready to merge` |
| `clean-frontend-empty-state` | Precision: a UI change whose only caller is traced → `ready to merge` |
| `clean-dependency-patch` | Precision: the twin of `lockfile-install-script` without the install script or foreign registry → `ready to merge` |
| `buried-retry-duplicate-charge` | Recall on a realistic diff: a non-idempotent charge retried, buried in ~180 lines of legitimate receipt, retry, and config changes; independent verification under `R` |

## Building a fixture by hand

```bash
bash evals/build-fixture.sh evals/files/<name> /tmp/pre-pr-review-evals/<name>
```

The script commits `base/` on `main`, commits `head/` on `feature` (when present), copies `local/`
over the work tree uncommitted (when present), and leaves `feature` checked out.
