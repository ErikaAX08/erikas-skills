---
name: spec-kit-generate-tasks
description: Decompose an approved technical plan (plan.md) into an executable, user-story-organized task list (tasks.md) — Setup, Foundational, one phase per user story in priority order with a mandatory closure checkpoint, then Polish. Enforces the Safe Deferral rule from spec-kit-generate-plan and traceability to spec.md/plan.md; when a task-decomposer agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Generate Tasks — Task Decomposition Skill

## Purpose

Turn an approved technical plan (`plan.md`) into `tasks.md`: an ordered, dependency-aware,
user-story-organized task list that `spec-kit-execute-tasks` can run — without writing product code here.
This skill is the third link in the `spec-kit` chain (`spec-kit-generate-spec` → `spec-kit-generate-plan` →
`spec-kit-generate-tasks`): it does not redesign the plan, it decomposes an already-approved plan into
atomic, independently verifiable work.

The output is `tasks.md` plus `checklists/tasks-quality.md`. It does **not** implement product
code, and it does **not** validate cross-artifact consistency in depth — that deeper check is
`spec-kit-analyze-consistency`'s job, when that skill is invoked.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common input is a
reference to an existing feature directory or `plan.md`, with optional constraints ("only generate
tasks for the MVP story", "skip test tasks").

## Core Principle

**Organize by user story, not by technical layer. A story is only complete when its checkpoint
holds — closure is structural, not an afterthought.**

- `tasks.md` is grouped by user story (`R-US##`, in `Priority` order `P1 → P2 → P3`), so each
  story is independently implementable, testable, and deliverable as an MVP increment.
- Every story's closing checkpoint is the mechanism that enforces "cierre de ciclos": a story only
  counts as done when it is functional and verifiable on its own — which excludes, by
  construction, leaving the system broken.
- Every task traces back to an operation in `plan.md` and a requirement/acceptance criterion in
  `spec.md`.

## Non-Negotiable Rules

1. **Do not invent facts.** Never fabricate a file path, an existing helper, or a test framework
   convention not already verified in `plan.md`'s Technical Context or Project Structure. Use
   `verify-before-implement` when a task needs a fact `plan.md` didn't already establish.
2. **Preserve plan intent.** Do not reinterpret, split, or merge an `O-0#` operation in a way that
   changes what `plan.md` decided. Decomposing into smaller tasks is expected; changing the
   approach is not.
3. **Separate facts from assumptions.** A task whose exact file path isn't yet verifiable is
   marked `nuevo: <proposed path>`, never presented as if the path is confirmed.
4. **Surface conflicts.** If decomposing an operation reveals it doesn't actually match
   `spec.md`/`plan.md` cleanly, report the mismatch — do not silently resolve it by picking
   whichever task shape is easiest to write.
5. **Organize by user story — never a flat generic task list.** Structure is always Setup →
   Foundational → one phase per `R-US##` in `Priority` order → Polish. An operation that doesn't
   belong cleanly to one story is assigned to the story that needs it first, with a forward
   dependency noted — never placed in an ad hoc "misc" phase.
6. **No code before approval.** `tasks.md` describes work; it does not contain product code.
7. **No hollow tasks.md.** Every task states a concrete action, a file (verified or explicitly
   proposed), a dependency (or "ninguna"), and an observable validation criterion. "Improve X" or
   "handle edge cases" without specifics is not a valid task.
8. **Use verified project context.** Reuse `plan.md`'s Technical Context and Project Structure
   directly — do not re-derive the project's layout independently and risk disagreeing with it.
9. **Keep scope controlled.** No task introduces work absent from `plan.md`/`spec.md`. A gap found
   during decomposition is reported, not quietly filled with a "nice to have" task.
10. **The Closure Rule is mandatory, not optional polish.** Every user-story phase — and
    Setup/Foundational when it gates the whole feature — ends with an explicit `[CIERRE]` task
    (§ Closure Rule below). It is never omitted, never merged into a regular task, and never
    marked done by inference.
11. **Safe Deferral consistency is enforced during decomposition.** If `plan.md`'s Safe Deferral
    table marks an operation `Dormant` for a later story, no task in an earlier story may invoke
    that deferred code path — doing so silently invalidates the `Dormant` classification. If this
    happens, report it as a conflict with `plan.md`, do not silently write the task anyway.
12. **Every task is traceable.** Each task cites the `R-FR##`/`R-AC##`/`O-0#` it satisfies.
13. **Never claim readiness without validation.** `tasks.md` is `READY` only after
    `checklists/tasks-quality.md` passes.
14. **Generate portable agent pairs.** If this workflow creates a `task-decomposer` (or other
    support agent), it must generate and validate both a Kiro CLI and a Claude Code definition per
    the shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md` (same document
`spec-kit-generate-spec` and `spec-kit-generate-plan` use). Before generating, validating, or reporting on the
`task-decomposer` role — or any other agent this skill materializes — read that file completely
and follow it exactly. If the active host cannot resolve the reference, follow its fallback
section.

`task-decomposer` is the standard role for this skill: decomposing a disproportionately large plan
operation or user story into atomic tasks, to keep the main context light. Do not invent a
different name or redefine it for another purpose.

## Artifact Conventions

The `.speckit/` layout (including `.speckit/specs/<feature-dir>/`), `feature.json`, `state.json`, and the Content
Fingerprint Convention all live in `spec-kit-shared/artifact-conventions.md`. Read it before Fase 0
below and follow it exactly.

## Input Contract

### Resolving the Target Plan

1. If the user gave an explicit `plan.md` path or feature directory, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves to a readable `plan.md`, stop and ask:

   > Provide the feature directory or `plan.md` path to decompose into tasks. If you haven't
   > generated a plan yet, run `spec-kit-generate-plan` first.

4. Read `plan.md`, `spec.md`, and `checklists/plan-quality.md` completely.

### Readiness Gate

- If `plan-quality.md`'s `STATUS` is `READY`, proceed.
- If it is `DRAFT — NEEDS CLARIFICATION`, stop and ask the user to either resolve the blocking
  items in `spec-kit-generate-plan` first, or explicitly confirm decomposing a draft plan into tasks. If
  confirmed, proceed but record `DECOMPOSED_FROM_DRAFT_PLAN: true` in `tasks.md`'s header and
  repeat the warning in the Completion Report.
- If `spec.md`'s own `STATUS` is not `READY` either, surface both — a plan built on a draft spec
  compounds the risk of a draft plan.

### New vs. Update Mode

- **New mode**: no `tasks.md` exists yet. Proceed through all phases below in order.
- **Update mode**: `tasks.md` already exists. Run Fase 0 below first; follow
  § Updating an Existing Task List rather than regenerating from scratch.

## Fase 0 — Staleness Check (every invocation, new or update)

1. If `.speckit/specs/<feature-dir>/state.json` does not exist, or has no `artifacts.tasks` entry yet, this
   is the first task list for this plan — skip straight to Phase 1, and create/update
   `state.json` at the end.
2. Otherwise, read `spec-kit-sync-artifacts/SKILL.md` and follow its Phase 1/2 mechanical
   detection procedure against `artifacts.tasks.based_on_plan_hash` vs. `plan.md`'s current
   content hash — do not re-derive the hashing/comparison mechanism independently.
3. If `spec-kit-sync-artifacts` reports a match, `plan.md` hasn't changed since the last task generation —
   proceed normally.
4. If it reports drift, this skill does the classification `spec-kit-sync-artifacts` leaves to the
   consuming skill: identify which `O-0#`/`A-D0#`/Safe-Deferral entries actually changed (using
   `spec-kit-sync-artifacts`'s best-effort localization, or a direct diff if it couldn't resolve one), and
   classify each as functionally material (a new/changed/removed operation, a changed Safe
   Deferral condition) or non-material (wording). Only material changes make `tasks.md` stale with
   impact.
   - Report the affected IDs and which task phases they touch before proceeding. If
     `spec-kit-sync-artifacts` flagged any already-`[x]` task as potentially affected, treat that with the
     same non-negotiable caution as § Updating an Existing Task List step 3 below.
5. This Fase 0 does not depend on `spec-kit-sync-artifacts` being invoked as a separate conversational step
   — apply its documented procedure directly, inline, as part of this phase.

## Workflow

### Phase 1 — Determine Story Order

Read every `R-US##` in `spec.md`'s Actors and Scenarios, with its `Priority` (`P1`/`P2`/`P3`).
Order user-story phases `P1 → P2 → P3`; within the same priority, preserve `spec.md`'s original
order. If a story has no assigned priority (an older `spec.md` predating the priority field),
treat it as `P1` and flag this in the Completion Report rather than silently guessing an order.

Cross-check every `O-0#` in `plan.md` against which `R-US##`/`R-FR##` it satisfies, so each
operation can be placed in the correct story phase in Phase 4 below.

### Phase 2 — Setup Tasks

Shared, low-risk project setup: creating the structure `plan.md`'s Project Structure describes,
initializing dependencies from Technical Context. No story-specific logic here.

If the existing project structure and dependencies already satisfy everything Technical
Context/Project Structure need — a small feature added to an already-scaffolded project — state
that explicitly ("No setup tasks required — structure and dependencies already match plan.md")
instead of manufacturing a task to fill the phase. An empty phase with a stated reason is honest;
a busywork task is not (Rules 7, 9).

### Phase 3 — Foundational Tasks (Blocking Prerequisites)

Infrastructure genuinely required by **every** user story (shared auth, shared schema setup,
shared routing/middleware) — not just infrastructure convenient for one story. If in doubt whether
something is Foundational or belongs to a specific story, prefer assigning it to the first story
that actually needs it; an oversized Foundational phase delays every story's start unnecessarily.

Same rule as Setup: if no shared prerequisite work is actually needed beyond what already exists,
say so explicitly rather than inventing a task.

Ends with a checkpoint statement: foundation ready, user stories may start.

### Phase 4 — One Phase per User Story (in Priority order)

For each `R-US##`, in the order from Phase 1:

1. State the **Goal** (from `R-US##`) and **Independent test** (from its `R-AC##`).
2. **Tests** (optional — only if `spec.md` explicitly requests tests): write them first; they must
   fail before implementation exists.
3. **Implementation tasks**: decompose every `O-0#` this plan assigned to this story into atomic
   tasks. Use the task format below.
4. **Closure task** (§ Closure Rule): always the last task of the phase.
5. **Checkpoint** statement: the story works and is independently verifiable.

#### Task Format

```markdown
- [ ] T0XX [P?] [USn] Description
      Traza a: R-FR0#, O-0#
      Archivo(s): ruta verificada, o "nuevo: ruta propuesta"
      Depende de: ninguna | T0YY
      Validación: comando o criterio observable
```

- `[P]`: parallelizable — different files, no cross-dependency with other `[P]` tasks in the same
  phase.
- `[USn]`: which user story. Setup/Foundational tasks carry no story tag.
- Sequential numbering (`T001`, `T002`, ...) continues across the whole document — do not restart
  numbering per phase.

#### Closure Rule (mandatory — see Non-Negotiable Rule 10)

```markdown
- [ ] T0XX [USn] [CIERRE] Verificar consistencia de cierre de USn
      Verifica:
        - Ninguna referencia colgante a código de una historia futura no marcada Dormant/Flagged/Aditiva
        - Ninguna rama/ruta alcanzable queda a medio conectar
        - Todo R-AC de esta historia está satisfecho o formalmente reclasificado como aplazamiento seguro (ver plan.md Safe Deferral)
      Validación: recorrido explícito de las condiciones anteriores, no una inferencia
```

This task is marked `[x]` only when it actively confirmed nothing was left half-done — never for
merely producing code. Cross-reference `plan.md`'s Safe Deferral table: if this story is the
target of a deferred operation from an earlier story, the closure task also confirms that
operation genuinely remains `Dormant`/behind its `Flag`/purely `Additive` and hasn't been
accidentally activated by this story's own work.

### Phase 5 — Polish & Cross-Cutting Concerns

Work that spans multiple stories: documentation (delegate to `code-documentation` when
applicable), cleanup, running `quickstart.md` as final validation. Depends on all targeted stories
being complete.

### Phase 6 — Closing Sections (always generated)

- **Dependencies & Execution Order**: phase dependencies (Setup → Foundational → stories →
  Polish) and, within each story, task-level order (tests before implementation, models before
  services, `[CIERRE]` always last).
- **Parallel Example**: one concrete block showing `[P]` tasks from the `P1` story launchable
  together.
- **Implementation Strategy**: MVP-first (Setup + Foundational + the `P1` story only, stop and
  validate its checkpoint), incremental delivery (one story at a time, each deployable), and
  parallel execution strategy (once Foundational is done, independent stories may go to separate
  `task-executor` agents in `spec-kit-execute-tasks` — the story boundary is the primary parallelism unit).

## Traceability and Safe Deferral Consistency Checks

Before validating the checklist:

- Every task cites at least one `R-FR##`/`R-AC##` and the `O-0#` it decomposes.
- Every `O-0#` in `plan.md` appears in at least one task, in the story `plan.md` assigned it to.
- Every user-story phase ends with exactly one `[CIERRE]` task covering all of that story's
  `R-AC##`.
- No task in a story earlier than a `Dormant`-deferred operation's target story invokes that
  operation's code path (Non-Negotiable Rule 11).
- Task IDs are sequential and unique across the whole document.

## Validate and Iterate

Create `checklists/tasks-quality.md`:

```markdown
# Tasks Quality Checklist: [Feature Name]

**Purpose**: Validate internal consistency and traceability of tasks.md before execution
**Tasks**: [Relative link to tasks.md]
**Status**: [READY / DRAFT — NEEDS CLARIFICATION]

## Structure

- [ ] Phases follow Setup → Foundational → one phase per R-US## (Priority order) → Polish
- [ ] No task sits outside this structure (no ad hoc "misc" phase)
- [ ] Task IDs are sequential and unique
- [ ] An empty Setup/Foundational phase states a reason instead of a filler task

## Task Quality

- [ ] Every task has Traza a / Archivo(s) / Depende de / Validación
- [ ] No task uses a vague description without a concrete action and file
- [ ] Every file path is verified, or explicitly marked "nuevo: <proposed path>"

## Closure Rule

- [ ] Every user-story phase ends with exactly one [CIERRE] task
- [ ] Every [CIERRE] task's Verifica block covers dangling references, half-wired paths, and R-AC coverage
- [ ] Foundational's checkpoint is present if it gates all stories

## Safe Deferral Consistency

- [ ] No earlier-story task invokes a later story's Dormant-deferred operation
- [ ] Deferred operations from plan.md's Safe Deferral table are each covered by exactly one later task/story

## Traceability

- [ ] Every O-0# from plan.md appears in at least one task
- [ ] Every task's R-FR##/R-AC## citation exists in spec.md

## Governance

- [ ] tasks.md contains no TODOs, placeholders, or unresolved template labels
- [ ] state.json was created/updated with this task list's content hash and based_on_plan_hash

## Agent Portability

- [ ] If a task-decomposer (or other agent) was generated, both Kiro and Claude definitions exist and validated per spec-kit-shared/agent-portability.md, or AGENTS: none is reported

## Notes

[Specific failures, evidence, and remaining decisions]
```

Validate item by item, fix non-blocking failures, re-run up to three iterations. If a blocking gap
remains, set `STATUS` to `DRAFT — NEEDS CLARIFICATION`. Set `READY` only when every item passes.

## Updating an Existing Task List

When `plan.md` changed materially since the last `tasks.md` (Fase 0 detected drift):

1. Identify affected `O-0#`/story IDs from the diff.
2. Propagate only through the story phases those IDs touch — add/modify/remove tasks within the
   affected story phase(s); do not regenerate unrelated stories.
3. **Never silently modify a task already marked `[x]`.** If a completed task is affected by the
   change, flag it explicitly as "closed task affected by plan change — needs review" rather than
   editing or unmarking it automatically. This is the same non-negotiable `spec-kit-sync-artifacts` carries
   in the design doc: work already done on an assumption that just changed is a risk to surface,
   not silently paper over.
4. Preserve task IDs where semantics are unchanged; append new IDs (continuing the sequence) for
   new tasks — never renumber existing tasks.
5. Re-verify the affected story's `[CIERRE]` task still covers the right `R-AC##` set.
6. Update `state.json`'s `artifacts.tasks.content_hash` and `based_on_plan_hash` only after the
   targeted regeneration validates.
7. Re-run the full `tasks-quality.md` checklist regardless of how small the change was.
8. Summarize exactly which task phases changed and why.

## Pre-Execution Extension Hooks

Before task decomposition, check `.speckit/extensions.yml` per
`spec-kit-shared/artifact-conventions.md`'s schema, reading `hooks.before_tasks`. Follow the same
enablement/condition/mandatory-vs-optional rules `spec-kit-generate-spec` and `spec-kit-generate-plan` use for their
own hooks.

## Mandatory Post-Execution Hooks

After task decomposition, process `hooks.after_tasks` the same way, using the same
emit-then-execute format the other `spec-kit` skills use.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `TASKS_FILE`: `tasks.md` path.
- `CHECKLIST_FILE`: `checklists/tasks-quality.md` path.
- `STATUS`: `READY` or `DRAFT — NEEDS CLARIFICATION`.
- `DECOMPOSED_FROM_DRAFT_PLAN`: `true` if `plan.md` was not `READY` when tasks were generated.
- `STORIES`: count of user-story phases and their priorities, in the order generated.
- `SAFE_DEFERRAL`: confirmation that every plan.md Safe Deferral entry maps to exactly one later
  task/story, or the mismatches found.
- `VALIDATION`: passed/total checklist items and unresolved failures.
- `TRACEABILITY`: operation/requirement coverage counts.
- `CHANGES`: for updates, the story phases changed, and any closed tasks flagged for review.
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: clarification if blocked; otherwise recommend `spec-kit-analyze-consistency` (optional deeper
  cross-artifact check) and then `spec-kit-execute-tasks`, starting with the `P1` story as the MVP.

## Done When

- [ ] `plan.md` was resolved, read, and confirmed `READY` (or draft decomposition was explicitly
      confirmed by the user).
- [ ] Fase 0 Staleness Check ran and any material drift was reported before proceeding.
- [ ] Every `R-US##`'s `Priority` was read and used to order the story phases (or the missing-
      priority fallback was flagged).
- [ ] `tasks.md` follows Setup → Foundational → one phase per story (priority order) → Polish,
      with no task outside that structure.
- [ ] Every user-story phase ends with a `[CIERRE]` task covering that story's full `R-AC##` set.
- [ ] No task violates a `Dormant`/`Flagged`/`Additive` classification from `plan.md`'s Safe
      Deferral table.
- [ ] Every task is traceable to `plan.md`'s `O-0#` and `spec.md`'s `R-FR##`/`R-AC##`.
- [ ] Dependencies & Execution Order, Parallel Example, and Implementation Strategy sections were
      generated.
- [ ] `tasks.md` and `checklists/tasks-quality.md` were written.
- [ ] `state.json` was created or updated with accurate content hashes.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
- [ ] No product code was generated.
