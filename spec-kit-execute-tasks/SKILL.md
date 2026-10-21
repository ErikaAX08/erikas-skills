---
name: spec-kit-execute-tasks
description: Execute tasks.md in dependency order, producing real code — delegating implementation discipline to verify-before-implement, commit messages to git-commits, and a final safety-net review to pre-pr-review, instead of reimplementing any of their rules. Runs stories sequentially by default, or in parallel across independent stories/tasks via task-executor subagents when the story boundaries genuinely allow it. Never invents scope beyond tasks.md/plan.md/spec.md, never silently re-touches a task already marked done, and never skips a story's closure checkpoint. When a task-executor agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Execute Tasks — Implementation Orchestration Skill

## Purpose

Turn an approved `tasks.md` into real, working code — the only skill in `spec-kit` that writes
product code. It is the last link in the chain (`spec-kit-generate-spec` → `spec-kit-generate-plan` →
`spec-kit-generate-tasks` → [`spec-kit-analyze-consistency`] → `spec-kit-execute-tasks`), and it earns that position by
delegating, not reimplementing: implementation discipline comes from `verify-before-implement`,
commit messages from `git-commits`, architectural constraints from whatever architecture skills
the project already has active, and a final safety-net review from `pre-pr-review`. This skill's
own job is orchestration — sequencing, parallelism where it's genuinely safe, and enforcing that a
story is never reported done unless its closure checkpoint actually holds.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common inputs are: a
feature directory or `tasks.md` path, optionally scoped to a single story ("just execute US1") or
a single task ("redo T004").

## Core Principle

**Delegate discipline, don't reimplement it. A task is done when its own validation ran and
passed — not when the code looks right. A story is done when its checkpoint holds, for real.**

- Every category of change this skill touches (a contract, a model, a config value, a library
  call) already has a verification template in `verify-before-implement` — use it, don't write a
  weaker inline version.
- `[x]` is not a formatting convention, it's a claim: "this was verified, for real, right now."
- A story's `[CIERRE]` task is not skipped, inferred, or rubber-stamped — its `Verifica` block is
  walked explicitly before the story is reported complete.

## Non-Negotiable Rules

1. **Do not invent facts.** Never write a field, endpoint, signature, config key, or library call
   without reading its actual definition first — apply the matching `verify-before-implement` §6
   template for the category of change (contract, model, type, endpoint integration, state/enum,
   config, library API, CLI, runtime behavior) before writing the corresponding code.
2. **Preserve task and plan intent.** Implement exactly what a task describes. If the real code
   makes the task's description stop making sense, surface the conflict (§ Handling Unplanned
   Scope) — do not quietly reinterpret the task to fit what's convenient.
3. **A task is marked `[x]` only after its `Validación` criterion actually ran and was observed to
   pass** — never by inference, never because the code compiles/type-checks, never because it
   "should work." Running a test means executing it and reading the output.
4. **Never silently re-touch a task already marked `[x]` from a prior run.** Re-invoking this
   skill skips already-closed tasks unless the user explicitly asks to redo/rework a specific one
   — this mirrors `spec-kit-sync-artifacts`'/`spec-kit-generate-tasks`'s "closed work" rule, applied at execution
   time.
5. **Fase 0's staleness check is mandatory before touching any code.** If it reports drift with
   material impact anywhere in the chain, stop and require resolution before implementing — do not
   implement against a `tasks.md` that might already be stale.
6. **A story's `[CIERRE]` task is executed for real, not skipped.** Its `Verifica` conditions
   (no dangling references, no half-wired paths, full `R-AC` coverage) are walked explicitly
   before the story's checkpoint is considered held.
7. **No new scope.** If execution reveals a gap `tasks.md` doesn't cover, stop and report it — do
   not silently add a task, an endpoint, or a field to "make it work." (§ Handling Unplanned
   Scope.) Once the user has decided the change, it enters through `spec-kit-amend-artifacts`,
   never as an edit made here.
8. **Respect the project's active architecture/convention skills as binding constraints**, not
   suggestions — `frontend-architecture`, `backend-api-standards`, or an equivalent project-
   specific skill, when active, governs how code is written; this skill does not override them.
9. **Commit messages follow `git-commits` exactly.** Never invent a commit message format or
   skip that skill's conventions because "it's just a small change."
10. **`pre-pr-review` runs at the end over the accumulated diff, always** — not skipped even when
    every individual task's validation passed. It is the last safety net, not the first place a
    gap should be discovered (§ Final Gate). A per-story review (§ Story Review Gate) is allowed
    in addition, never instead.
11. **Parallelism is a capability, applied only when genuinely safe** — independent stories or
    `[P]` tasks with no shared file/state. Default to sequential execution; do not force
    parallelism where dependencies or shared files make it unsafe. Parallel stories each run in
    their own git worktree and are integrated and re-validated one at a time (Phase 3).
12. **Every `task-executor` subagent gets scoped context** — its task or story, plus the relevant
    `plan.md`/`spec.md` excerpts — never the full parent conversation history.
13. **Never claim something was tested, verified, or committed when it wasn't actually done.**
    "Tests pass" means they were run and their output was read.
14. **Generate portable agent pairs.** If this workflow creates a `task-executor` (or other
    support agent), it must generate and validate both a Kiro CLI and a Claude Code definition per
    the shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md`. Before
generating, validating, or reporting on the `task-executor` role — or any other agent this skill
materializes — read that file completely and follow it exactly. If the active host cannot resolve
the reference, follow its fallback section.

`task-executor` is the standard role for this skill: executing one independent task or user story
in parallel with others. Do not invent a different name or redefine it for another purpose.

## Artifact Conventions

The `.speckit/` layout (including `.speckit/specs/<feature-dir>/`) and `state.json` schema live in
`spec-kit-shared/artifact-conventions.md`. Read it before Fase 0 below.

## Skill Delegation Map

This skill does not reimplement any of the following — it invokes them (or, on a host without
nested skill invocation, follows their documented procedure directly, citing them, per the same
pattern `spec-kit-generate-spec` uses for its Extension Hooks):

| Concern | Delegate to | When |
| --- | --- | --- |
| Implementation verification discipline | `verify-before-implement` | Before writing any task's code |
| Project architecture/conventions | `frontend-architecture` / `backend-api-standards` / project-specific equivalent | Whenever the project has one active |
| Commit messages | `git-commits` | After closing a cohesive group of tasks |
| Documentation for new code | `code-documentation` | When a task or the project's own convention requires it |
| Final safety-net review | `pre-pr-review` | Always at the end over the accumulated diff (§ Final Gate); optionally per story (§ Story Review Gate) |
| Applying a decided change to spec/plan/tasks | `spec-kit-amend-artifacts` | A review finding, refuted `[SONDA]`, or unplanned scope the user has decided |

## Run Log

Record this run per `spec-kit-shared/artifact-conventions.md` § Run Log (`<dir>` is the feature directory): start with
`node spec-kit-shared/scripts/log-event.mjs <dir> run.start --skill spec-kit-execute-tasks mode=<mode>` and pass the printed `RUN_ID` to every
later call; end with a `run.end` event (`status`, `reason` when it stops, `next`), also when the run stops early.
Pass `--log <RUN_ID> --skill spec-kit-execute-tasks` to `lint-artifacts.mjs` and `fingerprint.mjs --state` (readiness and Fase 0) so they record their own results.
Record these decisions, each with a one- or two-sentence `rationale` citing its IDs:

- `readiness` — proceed, stop, or execute against a draft (the last one also as a `deviation`)
- `parallelism` — sequential or parallel, and which stories, with the independence evidence
- `probe` — each `[SONDA]`: `value` confirmed / refuted, `ids` the task and `PL-D##`/`RS-##`
- `closure` — each active `[CIERRE]` walk or re-walk: held / failed
- `verdict-route` — each review gate: `value` the literal verdict key, `rationale` how each item was routed; plus a `finding` per `🔴`/`🟡`
- a `check` with `tool: validation` for every `Validación` that failed (passes are already recorded as `[x]`)

If logging is off (`RUN_LOG: off`), continue normally.

## Input Contract

### Resolving the Target Tasks

1. If the user gave an explicit feature directory, `tasks.md` path, story, or task ID, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory, or a specific story/task, to execute. If you haven't generated
   > tasks yet, run `spec-kit-generate-tasks` first.

4. Read `tasks.md`, `plan.md`, `spec.md`, and `checklists/tasks-quality.md` completely.

### Readiness Gate

- Run `node spec-kit-shared/scripts/lint-artifacts.mjs <feature-dir>` first. A `BLOCKING` finding — an open amendment (L19), a story without one
  active closure (L08), a task built on an unprobed assumption (L14), a task with no
  `Validación` (L06) — stops execution until the owning skill fixes it, whatever `STATUS` says.
- If `tasks-quality.md`'s `STATUS` is `READY`, proceed.
- If it is `DRAFT — NEEDS CLARIFICATION`, stop and ask the user to either resolve the blocking
  items upstream first, or explicitly confirm executing against a draft. Writing real code against
  an unresolved gap (as opposed to planning or task-listing against one) is the highest-risk point
  in this chain — if the user confirms anyway, record `EXECUTED_FROM_DRAFT_TASKS: true` and repeat
  the warning prominently in the Completion Report, and skip any task whose `Validación` or
  `Archivo(s)` depends directly on the unresolved item, reporting exactly which tasks were skipped
  and why, rather than implementing on top of a known-unresolved assumption.

## Fase 0 — Staleness Check (every invocation)

Read `spec-kit-sync-artifacts/SKILL.md` and follow its full Phase 1/2 procedure across the whole
chain: source documents → `spec.md` → `plan.md` → `tasks.md`. If it reports any drift:

1. If the drift is upstream of `tasks.md` (a source, `spec.md`, or `plan.md` changed since
   `tasks.md` was generated), stop — do not execute against a `tasks.md` that might not reflect
   current intent. Recommend the nearest upstream skill per `spec-kit-sync-artifacts`'s one-hop
   recommendation.
2. If `spec-kit-sync-artifacts` flagged any task as "closed work potentially affected," treat that exactly
   as Rule 4 requires — it does not get silently re-executed just because this run touches nearby
   work.
3. `tasks.md`'s own hash is progress-insensitive (`spec-kit-shared/artifact-conventions.md`), so
   the `[x]` marks of previous runs are never drift and need no explanation. A mismatch on
   `artifacts.tasks.content_hash` means `tasks.md` was edited by hand: stop and recommend
   `spec-kit-generate-tasks` (update mode) or `spec-kit-amend-artifacts` (if the edit was a decided
   change) so the edit is validated and recorded. A legacy raw hash that differs only in checkbox
   state is upgraded per the convention, not treated as drift.
4. Only proceed once the chain is confirmed consistent (or the user explicitly accepts executing
   against a known, described gap — same discipline as the Readiness Gate above).

## Workflow

### Phase 1 — Determine Execution Order

Read `tasks.md`'s phase structure: Setup → Foundational → one phase per user story (priority
order) → Polish. Respect explicit `Depende de` citations within that order. If the user scoped
this invocation to one story or task, still verify its dependencies (Setup/Foundational, and any
earlier story it explicitly depends on) are already complete — do not execute a scoped task whose
prerequisites were never done.

### Phase 2 — Per-Task Execution

For each task, in order:

1. Read its `Traza a` / `Archivo(s)` / `Depende de` / `Validación` line completely. Skip tasks
   carrying a `Superada por:` line — they are history, not open work.
2. **Verify before implementing**: identify which `verify-before-implement` §6 category this task
   falls into (contract, model/schema, type/interface, endpoint integration, state/enum, config,
   library API, CLI, runtime behavior) and complete that category's verification checklist
   against the actual codebase — not from memory, not from the task description alone.
3. If the project has an active architecture/convention skill relevant to this file, follow it as
   a binding constraint (Rule 8).
4. Implement the change.
5. **Run the task's `Validación` criterion for real** — execute the test/command/manual check it
   names, and read the actual output. Do not infer a pass from the code looking correct.
6. Mark the task `[x]` only after step 5 actually passed. If it didn't, do not mark it done — fix
   the implementation and re-run, or stop and report the specific failure if it can't be resolved
   within this task's own scope.

**`[SONDA]` tasks** (probes for a runtime premise recorded as `assumption`): run the probe, cite the
command and its observed output, and compare it to the premise the plan states.

- Premise confirmed → mark `[x]`; the dependent tasks proceed.
- Premise refuted → do not mark it `[x]` and do not start any task that depends on it. Stop and
  report the observed behavior; the change goes to `spec-kit-amend-artifacts` at the `plan` layer.
  Implementing around a refuted premise is exactly the rework this probe exists to prevent.

**Runtime facts while implementing**: if a task's code depends on *when/in what order/how often* a
library or framework does something, and neither the plan nor a `[SONDA]` gives `executed`
evidence for it, run a scratch probe before writing the code (`verify-before-implement` §6.9).
Never record "verified" for a behavior that was only read.

### Phase 3 — Parallel Execution (two levels)

Applied only where Rule 11's safety condition genuinely holds:

1. **Between stories** (primary parallelism unit): once Foundational's checkpoint holds,
   independent story phases — no integration declared between them in `tasks.md`, no shared files
   — may be delegated to separate `task-executor` subagents in parallel, each scoped (Rule 12) to
   its own story plus the relevant `plan.md`/`spec.md` excerpts, and each in **its own git
   worktree** (§ Isolated Story Worktrees below). Parallel executors never share a working tree.
2. **Within a story** (secondary, finer-grained): `[P]`-tagged tasks with no cross-dependency and
   no shared file may be parallelized inside that story's worktree; their validations then run one
   after another, never concurrently, so one test run cannot disturb another.
3. Tasks that share a file, or have a real dependency between them, always execute sequentially in
   the same thread — parallelism is never forced onto a boundary that isn't actually independent.
4. A `task-executor` implements and runs its tasks' validations, then reports results; it never
   writes `tasks.md`, `amendments.md`, or a commit. This orchestrating run is the only writer of
   checkbox state, amendment status, and commits (`artifact-conventions.md` § Write Ownership), and
   marks `[x]` only from a pass it observed itself in the integrated tree (step 4 of the procedure
   below).

#### Isolated Story Worktrees

The orchestrating run manages the worktrees with plain git, so the procedure is the same on every
host (it does not depend on a platform-specific subagent isolation setting):

1. **Clean base.** The orchestrating branch has no uncommitted changes to files the stories may
   touch — commit them (Phase 5) or stop. Every worktree starts from the same `HEAD`.
2. **One worktree per story**, outside the repository (scratchpad or temp directory):
   `git worktree add <scratch>/speckit-<feature>-<USn> -b speckit/<feature>/<USn> HEAD`. The
   executor receives that path and works only inside it; `.speckit/` stays with the orchestrator
   and is never edited in a worktree.
3. **Integrate one story at a time.** For each finished story: review the worktree's diff against
   the executor's report, commit it inside the worktree with a `git-commits` message, then
   `git cherry-pick` that commit onto the orchestrating branch. A conflict means the stories were
   not independent after all: `git cherry-pick --abort`, report it, and re-run that story
   sequentially on the integrated tree — never resolve a cross-story conflict by guessing.
4. **Validate the integrated tree.** After every parallel story is integrated, re-run each
   integrated task's `Validación` in the orchestrating tree. Only those passes count: mark `[x]`
   from them, then walk each story's active `[CIERRE]` (Phase 4). A pass seen only inside a worktree
   is provisional.
5. **Clean up.** Once a story's commit is on the orchestrating branch, `git worktree remove` its
   worktree and delete its temporary branch. Report every worktree created and its outcome.

### Phase 4 — Story Closure

When all of a story's implementation tasks are `[x]`, execute its **active** `[CIERRE]` task (the
one without `Superada por:`) for real (Rule 6): walk each condition in its `Verifica` block against
the actual current state of the code — not the task list — and only then mark `[CIERRE]` `[x]` and
treat the story's checkpoint as held.

**Amendment tasks after a closed `[CIERRE]`** (`[ENMIENDA T0XX]` under `#### Enmiendas`): after the
story's last open amendment task passes, re-walk the active `[CIERRE]`'s `Verifica` block against
the current code. Do not edit or un-check the closed `[CIERRE]`; record the re-walk result in the
amendment's `Closure re-walk` field in `amendments.md` and set its `Status` to `executed`. A
failing re-walk means the story's checkpoint no longer holds — stop and report it.

### Phase 5 — Commit

When a cohesive group of tasks closes (typically: one story, or a clearly self-contained subset),
use `git-commits` for the commit message — this skill never invents its own commit message
format or convention.

### Phase 6 — Story Review Gate (optional, per story)

A story is a deployable increment, so it may get its own `pre-pr-review` right after its
`[CIERRE]` holds, over the diff since the previous review gate (or since the merge base for the
first one). It is optional — run it when the user asks for it or when the story touches auth,
PII, money, migrations, or an external integration — and it never replaces the Final Gate. Its
verdict is handled exactly like the Final Gate's (§ Review Verdict Handling).

## Review Context (every `pre-pr-review` this skill runs)

Build the review's objective from the artifacts, freshly, at every gate — never by appending to
a previous gate's packet or notes:

- **Objective and acceptance criteria**: the reviewed stories' `R-US##` and `R-AC##` from
  `spec.md`, cited by ID.
- **Invariants and boundaries**: every `S-SG##` and `E-I##` the reviewed stories touch, plus the
  spec's sensitive-data-per-channel table rows for them.
- **Technical decisions under test**: the current `PL-D##` entries those stories rely on, each
  with its evidence level (`executed`/`read`/`assumption`). Flag every `read` or `assumption`
  runtime premise so the reviewers and verifiers know it needs an executed probe.
- **Out of scope**: `spec.md` Out of Scope, plus later stories not yet implemented.
- **Already decided**: `amendments.md` entries with `Layer: none`, so an accepted risk is not
  re-raised as new.

Pass this to `pre-pr-review` in the shape of its declared-objective contract
(`pre-pr-review/assets/declared-objective.md`): `R-US##` → Objective, `R-AC##` → Acceptance
criteria, `S-SG##`/`E-I##` → Invariants and boundaries, the channel table rows → Sensitive data by
channel, `PL-D##` with its level → Technical decisions under test, out-of-scope items → Out of
scope, `Layer: none` amendments → Already decided. `pre-pr-review` knows nothing about spec-kit;
this mapping is the only coupling, and it lives here. Regenerating it each time keeps it as long as
the stories under review need, not as long as the history of previous gates.

## Review Verdict Handling

`pre-pr-review` emits exactly one of these verdict keys, byte-identical in every language (only
`X` varies) — match them literally:

| Verdict | What this skill does |
| --- | --- |
| `approve` | The gate passes. Every `amendments.md` entry in `executed` status whose tasks this gate covered becomes `verified`. |
| `approve with conditions` | Each `🟡` needs a recorded decision before the gate counts as passed. Present the `🟡` items together; for each, the user either accepts it as-is (→ `spec-kit-amend-artifacts` records it with `Layer: none`, `Status: accepted`) or decides a change (→ `spec-kit-amend-artifacts` applies it). Never leave a `🟡` decided only in chat. Once every `🟡` is decided, covered `executed` entries become `verified`, as for `approve`. |
| `do not approve until X is verified` | Obtain the named verification (a probe, a test, an authorized read). If it settles the item, re-run the gate; if it reveals a defect, treat it as `request changes`. |
| `request changes` | Each `🔴` is a change to decide and apply through `spec-kit-amend-artifacts`, then execute the resulting tasks and re-run the gate. |

Feedback upstream, in every case: if a finding shows a feature is incomplete or a deferral is
unsafe, report it as a Safe Deferral misclassification toward `spec-kit-generate-plan` (an
operation that looked `Dormant`/`Flagged`/`Additive` turned out not to be, in practice). If a
finding refutes a premise the plan recorded as verified, report which `PL-D##` it was and its
evidence level — a `read` runtime premise refuted by execution is feedback that the plan's
evidence rule was not applied.

## Final Gate (before reporting done — always, in this order)

1. **Closure re-verification**: for every story completed in this run, re-confirm its active
   `[CIERRE]` task's conditions still hold against the final code state (Rule 6).
2. **`pre-pr-review`** over the accumulated diff — the last safety net, run unconditionally (Rule
   10), with the § Review Context above. Handle its verdict per § Review Verdict Handling; the
   feature is not done while a `🔴`, an unverified `X`, or an undecided `🟡` remains.
3. **Run report**: when the feature is complete, run
   `node spec-kit-shared/scripts/run-report.mjs <feature-dir>` and carry its Signals into the
   Completion Report. They are feedback about the kit's behavior on this feature — which skill or
   rule to improve — not new work for the feature itself.

## Handling Unplanned Scope Discovered Mid-Execution

If implementing a task reveals a real requirement `tasks.md` doesn't cover (Rule 7):

1. Stop implementing that specific thread — do not improvise a fix for scope that was never
   planned.
2. Report exactly what was found and why it wasn't anticipated.
3. Recommend the correct upstream response: `spec-kit-amend-artifacts` once the user has decided
   what to do about it (it picks the lowest affected layer), `spec-kit-generate-tasks` (if
   `plan.md` already covers it and only the task decomposition missed it), or
   `spec-kit-analyze-consistency` (if it's unclear whether `plan.md`/`spec.md` cover it at all).
4. Continue with other, unaffected tasks in the meantime if they don't depend on resolving this.

## Re-invocation and Idempotency

Re-running this skill on a `tasks.md` with some tasks already `[x]`:

- Skips every `[x]` task by default (Rule 4).
- If the user explicitly names a closed task to redo, treat it as a fresh execution of that one
  task (Phase 2 in full), and note in the Completion Report that previously-closed work was
  intentionally revisited, and why.
- Re-runs Fase 0 regardless — a re-invocation is exactly when drift is most likely to have
  accumulated since the last run.

## Pre-Execution Extension Hooks

Before execution, check `.speckit/extensions.yml` per
`spec-kit-shared/artifact-conventions.md`'s schema, reading `hooks.before_execute`. Follow the
same enablement/condition/mandatory-vs-optional rules the other `spec-kit` skills use.

## Mandatory Post-Execution Hooks

After execution, process `hooks.after_execute` the same way, using the same emit-then-execute
format the other `spec-kit` skills use.

## Completion Report

Report:

- `RUN_ID`: this run's log ID, or `off`.
- `RUN_SIGNALS`: the run report's signals when the feature completed (`none`, or each signal ID with
  its evidence), or `not run — feature not complete`.
- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `EXECUTED_FROM_DRAFT_TASKS`: `true` if `tasks.md` was not `READY` when execution started.
- `TASKS_COMPLETED` / `TASKS_SKIPPED` (already closed) / `TASKS_FAILED`: counts, with IDs for the
  latter two.
- `STORIES_CLOSED`: which story checkpoints were confirmed held this run.
- `PARALLELISM_USED`: `none` / `between-stories` / `within-story`, with which stories/tasks, each
  worktree created, how it was integrated (cherry-picked / conflict → re-run sequentially), and
  confirmation that it was removed.
- `COMMITS`: list of commits made, each with its `git-commits`-formatted message.
- `PRE_PR_REVIEW`: every gate run (story or final), its verdict key, how each `🔴`/`🟡`/`X` was
  routed (amendment ID or `Layer: none`), and any Safe Deferral misclassification or refuted
  `PL-D##` premise reported upstream.
- `PROBES`: `[SONDA]` tasks run, each confirmed or refuted, or "none".
- `AMENDMENTS`: amendment entries executed this run with their closure re-walk result, or "none".
- `UNPLANNED_SCOPE_FOUND`: any gaps reported per § Handling Unplanned Scope, or "none".
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: remaining stories/tasks if any, or "feature complete — ready for PR" if all closed and
  `pre-pr-review` raised no blockers.

## Done When

- [ ] The run was logged from `run.start` to `run.end` (or logging is off).
- [ ] `tasks.md` was resolved, read, and confirmed `READY` (or draft execution was explicitly
      confirmed, with affected tasks skipped and reported).
- [ ] `lint-artifacts.mjs` reported no BLOCKING finding before any code was written.
- [ ] Fase 0's staleness check ran across the full chain before any code was written.
- [ ] Every executed task's implementation was verified against real project facts
      (`verify-before-implement`), not invented.
- [ ] Every task marked `[x]` had its `Validación` criterion actually run and observed to pass.
- [ ] No task already `[x]` from a prior run was silently re-touched.
- [ ] Every closed story's `[CIERRE]` task was executed for real, not inferred.
- [ ] Any unplanned scope discovered mid-execution was reported, not silently implemented.
- [ ] Commit messages came from `git-commits`, not an invented format.
- [ ] `pre-pr-review` ran over the full accumulated diff, unconditionally, with a review context
      regenerated from the current artifacts, and its verdict was matched literally and routed.
- [ ] Every `[SONDA]` ran before its dependent tasks; no task was built on a refuted premise.
- [ ] Every parallel story ran in its own worktree, was integrated one at a time, and its tasks
      were marked `[x]` only from validations re-run in the integrated tree; no worktree is left.
- [ ] Every amendment task's story had its active `[CIERRE]` re-walked and recorded in
      `amendments.md`.
- [ ] Any `pre-pr-review` finding suggesting a Safe Deferral misclassification was reported as
      feedback toward `spec-kit-generate-plan`, not just silently fixed.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
