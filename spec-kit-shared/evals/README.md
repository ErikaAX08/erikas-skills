# Spec Kit evals

Two layers of checks keep the kit's contract honest:

| Layer | What it checks | How to run |
| --- | --- | --- |
| Script tests | Every mechanical rule in `fingerprint.mjs` and `lint-artifacts.mjs` (hashing, schema versions, per-ID localization, checks L01–L21) | `pnpm run test:spec-kit` (also in CI) |
| Skill evals | Behavior a script cannot decide: semantic contradictions, verdict routing, amendment classification, probes | Per-skill `evals/evals.json`, graded by hand or by an eval runner |

`base-feature/` is a small but complete feature (spec, plan, research, tasks) that lints clean. The
script tests mutate it; every skill eval starts from it.

## Running a skill eval

1. Build the case into a fresh directory outside this repository:

   ```bash
   bash spec-kit-shared/evals/build-fixture.sh <skill>/evals/files/<case> /tmp/spec-kit-evals/<case>
   ```

   The script places `base-feature/` at `.speckit/specs/001-sms-allow-list`, overlays the case's
   `feature/` files, writes READY checklists and `.speckit/feature.json`, records `state.json` with
   `fingerprint.mjs --record`, overlays `after-state/` (later progress, an earlier report), copies
   `repo/` to the repository root, and commits everything with a fixed author and date so SHAs are
   reproducible.

2. Run the case's `prompt` with the built repository as the working directory and the whole kit
   installed (`npx erikas-skills install --skills spec-kit`).

3. Grade the final answer and the transcript against `assertions`. Several assertions concern the
   order of actions (a probe before a task, an amendment entry before an edit) or files that must
   stay unchanged, so the grader needs the transcript and `git status`, not only the final answer.

Every built case lints clean on purpose: the cases test what the skills must catch beyond the
mechanical checks.

## What each case covers

| Skill | Case | Rule under test |
| --- | --- | --- |
| `spec-kit-analyze-consistency` | `ac-contradicts-invariant` | Phase 9.1: an acceptance criterion that makes an ambiguous outcome terminal contradicts an invariant |
| `spec-kit-analyze-consistency` | `open-task-contradicts-plan` | Phase 9.2: an open task whose validation the current plan makes impossible; implementation-shaped validation |
| `spec-kit-analyze-consistency` | `superseded-closures-quiet` | Task lifecycle: superseded history is not a finding; Previously Reported |
| `spec-kit-amend-artifacts` | `plan-layer-premise` | Lowest-layer rule, executed evidence, write-ahead entry, `[ENMIENDA]` without a new closure, `--record` |
| `spec-kit-amend-artifacts` | `accepted-yellow` | `Layer: none` / `accepted` with no artifact change |
| `spec-kit-amend-artifacts` | `structural-escalation` | A new user story is escalated, not amended |
| `spec-kit-execute-tasks` | `approve-with-conditions` | Literal verdict routing; an undecided `🟡` keeps the feature open |
| `spec-kit-execute-tasks` | `sonda-refuted` | A `[SONDA]` runs before its dependents and a refuted premise stops execution |
