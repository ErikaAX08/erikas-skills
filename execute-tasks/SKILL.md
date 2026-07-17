---
name: execute-tasks
description: Execute tasks.md in dependency order, producing real code — delegating implementation discipline to verify-before-implement, commit messages to git-commits, and a final safety-net review to pre-pr-review, instead of reimplementing any of their rules. Runs stories sequentially by default, or in parallel across independent stories/tasks via task-executor subagents when the story boundaries genuinely allow it. Never invents scope beyond tasks.md/plan.md/spec.md, never silently re-touches a task already marked done, and never skips a story's closure checkpoint. When a task-executor agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Execute Tasks — Implementation Orchestration Skill

## Purpose

Turn an approved `tasks.md` into real, working code — the only skill in `spec-kit` that writes
product code. It is the last link in the chain (`generate-spec` → `generate-plan` →
`generate-tasks` → [`analyze-consistency`] → `execute-tasks`), and it earns that position by
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
   without reading its actual definition first — apply `verify-before-implement`'s matching §6
   template for the category of change (contract, model, type, endpoint integration, state/enum,
   config, library API, CLI) before writing the corresponding code.
2. **Preserve task and plan intent.** Implement exactly what a task describes. If the real code
   makes the task's description stop making sense, surface the conflict (§ Handling Unplanned
   Scope) — do not quietly reinterpret the task to fit what's convenient.
3. **A task is marked `[x]` only after its `Validación` criterion actually ran and was observed to
   pass** — never by inference, never because the code compiles/type-checks, never because it
   "should work." Running a test means executing it and reading the output.
4. **Never silently re-touch a task already marked `[x]` from a prior run.** Re-invoking this
   skill skips already-closed tasks unless the user explicitly asks to redo/rework a specific one
   — this mirrors `sync-artifacts`'/`generate-tasks`'s "closed work" rule, applied at execution
   time.
5. **Fase 0's staleness check is mandatory before touching any code.** If it reports drift with
   material impact anywhere in the chain, stop and require resolution before implementing — do not
   implement against a `tasks.md` that might already be stale.
6. **A story's `[CIERRE]` task is executed for real, not skipped.** Its `Verifica` conditions
   (no dangling references, no half-wired paths, full `R-AC` coverage) are walked explicitly
   before the story's checkpoint is considered held.
7. **No new scope.** If execution reveals a gap `tasks.md` doesn't cover, stop and report it — do
   not silently add a task, an endpoint, or a field to "make it work." (§ Handling Unplanned
   Scope.)
8. **Respect the project's active architecture/convention skills as binding constraints**, not
   suggestions — `frontend-architecture`, `backend-api-standards`, or an equivalent project-
   specific skill, when active, governs how code is written; this skill does not override them.
9. **Commit messages follow `git-commits` exactly.** Never invent a commit message format or
   skip that skill's conventions because "it's just a small change."
10. **`pre-pr-review` runs at the end over the accumulated diff, always** — not skipped even when
    every individual task's validation passed. It is the last safety net, not the first place a
    gap should be discovered (§ Final Gate).
11. **Parallelism is a capability, applied only when genuinely safe** — independent stories or
    `[P]` tasks with no shared file/state. Default to sequential execution; do not force
    parallelism where dependencies or shared files make it unsafe.
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

The `.specify/`/`specs/<feature-dir>/` layout and `state.json` schema live in
`spec-kit-shared/artifact-conventions.md`. Read it before Fase 0 below.

## Skill Delegation Map

This skill does not reimplement any of the following — it invokes them (or, on a host without
nested skill invocation, follows their documented procedure directly, citing them, per the same
pattern `generate-spec` uses for its Extension Hooks):

| Concern | Delegate to | When |
| --- | --- | --- |
| Implementation verification discipline | `verify-before-implement` | Before writing any task's code |
| Project architecture/conventions | `frontend-architecture` / `backend-api-standards` / project-specific equivalent | Whenever the project has one active |
| Commit messages | `git-commits` | After closing a cohesive group of tasks |
| Documentation for new code | `code-documentation` | When a task or the project's own convention requires it |
| Final safety-net review | `pre-pr-review` | Once, at the end, over the accumulated diff (§ Final Gate) |

## Input Contract

### Resolving the Target Tasks

1. If the user gave an explicit feature directory, `tasks.md` path, story, or task ID, use it.
2. Otherwise, read `.specify/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory, or a specific story/task, to execute. If you haven't generated
   > tasks yet, run `generate-tasks` first.

4. Read `tasks.md`, `plan.md`, `spec.md`, and `checklists/tasks-quality.md` completely.

### Readiness Gate

- If `tasks-quality.md`'s `STATUS` is `READY`, proceed.
- If it is `DRAFT — NEEDS CLARIFICATION`, stop and ask the user to either resolve the blocking
  items upstream first, or explicitly confirm executing against a draft. Writing real code against
  an unresolved gap (as opposed to planning or task-listing against one) is the highest-risk point
  in this chain — if the user confirms anyway, record `EXECUTED_FROM_DRAFT_TASKS: true` and repeat
  the warning prominently in the Completion Report, and skip any task whose `Validación` or
  `Archivo(s)` depends directly on the unresolved item, reporting exactly which tasks were skipped
  and why, rather than implementing on top of a known-unresolved assumption.

## Fase 0 — Staleness Check (every invocation)

Read `sync-artifacts/SKILL.md` and follow its full Phase 1/2 procedure across the whole
chain: source documents → `spec.md` → `plan.md` → `tasks.md`. If it reports any drift:

1. If the drift is upstream of `tasks.md` (a source, `spec.md`, or `plan.md` changed since
   `tasks.md` was generated), stop — do not execute against a `tasks.md` that might not reflect
   current intent. Recommend the nearest upstream skill per `sync-artifacts`'s one-hop
   recommendation.
2. If `sync-artifacts` flagged any task as "closed work potentially affected," treat that exactly
   as Rule 4 requires — it does not get silently re-executed just because this run touches nearby
   work.
3. Only proceed once the chain is confirmed consistent (or the user explicitly accepts executing
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

1. Read its `Traza a` / `Archivo(s)` / `Depende de` / `Validación` line completely.
2. **Verify before implementing**: identify which `verify-before-implement` §6 category this task
   falls into (contract, model/schema, type/interface, endpoint integration, state/enum, config,
   library API, CLI) and complete that category's verification checklist against the actual
   codebase — not from memory, not from the task description alone.
3. If the project has an active architecture/convention skill relevant to this file, follow it as
   a binding constraint (Rule 8).
4. Implement the change.
5. **Run the task's `Validación` criterion for real** — execute the test/command/manual check it
   names, and read the actual output. Do not infer a pass from the code looking correct.
6. Mark the task `[x]` only after step 5 actually passed. If it didn't, do not mark it done — fix
   the implementation and re-run, or stop and report the specific failure if it can't be resolved
   within this task's own scope.

### Phase 3 — Parallel Execution (two levels)

Applied only where Rule 11's safety condition genuinely holds:

1. **Between stories** (primary parallelism unit): once Foundational's checkpoint holds,
   independent story phases — no integration declared between them in `tasks.md`, no shared files
   — may be delegated to separate `task-executor` subagents in parallel, each scoped (Rule 12) to
   its own story plus the relevant `plan.md`/`spec.md` excerpts.
2. **Within a story** (secondary, finer-grained): `[P]`-tagged tasks with no cross-dependency and
   no shared file may be parallelized the same way, delegated or not.
3. Tasks that share a file, or have a real dependency between them, always execute sequentially in
   the same thread — parallelism is never forced onto a boundary that isn't actually independent.
4. After parallel branches complete, verify there is no cross-branch conflict (e.g. two branches
   editing overlapping code unexpectedly) before treating the batch as done.

### Phase 4 — Story Closure

When all of a story's implementation tasks are `[x]`, execute its `[CIERRE]` task for real (Rule
6): walk each condition in its `Verifica` block against the actual current state of the code —
not the task list — and only then mark `[CIERRE]` `[x]` and treat the story's checkpoint as held.

### Phase 5 — Commit

When a cohesive group of tasks closes (typically: one story, or a clearly self-contained subset),
use `git-commits` for the commit message — this skill never invents its own commit message
format or convention.

## Final Gate (before reporting done — always, in this order)

1. **Closure re-verification**: for every story completed in this run, re-confirm its `[CIERRE]`
   task's conditions still hold against the final code state (Rule 6).
2. **`pre-pr-review`** over the accumulated diff — the last safety net, run unconditionally (Rule
   10). If it surfaces a 🔴 Blocker or 🟠 Major categorized as "incomplete feature" or similar that
   the closure check in step 1 did not catch, that is not just a bug to patch — it is a signal
   that `generate-plan`'s Safe Deferral classification for the relevant operation was applied
   incorrectly (an operation that looked `Dormant`/`Flagged`/`Additive` turned out not to be, in
   practice). Report this explicitly as feedback toward `generate-plan`, in addition to fixing the
   immediate issue.

## Handling Unplanned Scope Discovered Mid-Execution

If implementing a task reveals a real requirement `tasks.md` doesn't cover (Rule 7):

1. Stop implementing that specific thread — do not improvise a fix for scope that was never
   planned.
2. Report exactly what was found and why it wasn't anticipated.
3. Recommend the correct upstream response: `generate-tasks` (if `plan.md` already covers it and
   only the task decomposition missed it) or `analyze-consistency` (if it's unclear whether
   `plan.md`/`spec.md` cover it at all).
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

Before execution, check `.specify/extensions.yml` per
`spec-kit-shared/artifact-conventions.md`'s schema, reading `hooks.before_execute`. Follow the
same enablement/condition/mandatory-vs-optional rules the other `spec-kit` skills use.

## Mandatory Post-Execution Hooks

After execution, process `hooks.after_execute` the same way, using the same emit-then-execute
format the other `spec-kit` skills use.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `EXECUTED_FROM_DRAFT_TASKS`: `true` if `tasks.md` was not `READY` when execution started.
- `TASKS_COMPLETED` / `TASKS_SKIPPED` (already closed) / `TASKS_FAILED`: counts, with IDs for the
  latter two.
- `STORIES_CLOSED`: which story checkpoints were confirmed held this run.
- `PARALLELISM_USED`: `none` / `between-stories` / `within-story`, with which stories/tasks.
- `COMMITS`: list of commits made, each with its `git-commits`-formatted message.
- `PRE_PR_REVIEW`: summary of `pre-pr-review`'s findings, and whether any indicated a Safe
  Deferral misclassification to report upstream.
- `UNPLANNED_SCOPE_FOUND`: any gaps reported per § Handling Unplanned Scope, or "none".
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: remaining stories/tasks if any, or "feature complete — ready for PR" if all closed and
  `pre-pr-review` raised no blockers.

## Done When

- [ ] `tasks.md` was resolved, read, and confirmed `READY` (or draft execution was explicitly
      confirmed, with affected tasks skipped and reported).
- [ ] Fase 0's staleness check ran across the full chain before any code was written.
- [ ] Every executed task's implementation was verified against real project facts
      (`verify-before-implement`), not invented.
- [ ] Every task marked `[x]` had its `Validación` criterion actually run and observed to pass.
- [ ] No task already `[x]` from a prior run was silently re-touched.
- [ ] Every closed story's `[CIERRE]` task was executed for real, not inferred.
- [ ] Any unplanned scope discovered mid-execution was reported, not silently implemented.
- [ ] Commit messages came from `git-commits`, not an invented format.
- [ ] `pre-pr-review` ran once over the full accumulated diff, unconditionally.
- [ ] Any `pre-pr-review` finding suggesting a Safe Deferral misclassification was reported as
      feedback toward `generate-plan`, not just silently fixed.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
