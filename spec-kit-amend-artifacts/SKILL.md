---
name: spec-kit-amend-artifacts
description: Apply an already-decided change — a pre-pr-review finding, a refuted [SONDA] premise, or unplanned scope the user resolved — to spec.md/plan.md/tasks.md in one confirmed pass, starting at the lowest artifact that owns the change and propagating only downward, by running each generating skill's own "Updating an Existing X" procedure with scoped validation. Records every decision in amendments.md before editing (write-ahead, so a stopped amendment can be resumed or undone), reworks closed tasks only through the Task Lifecycle, lets each owning procedure refresh its state.json entry, and hands off to spec-kit-execute-tasks. Never decides a change for the user and never writes product code. When an artifact-amender agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Amend Artifacts — Decided-Change Skill

## Purpose

Give a decided change a short, governed path into the artifacts. Without it, every review finding
costs the full chain — `spec-kit-generate-spec` → `spec-kit-generate-plan` →
`spec-kit-generate-tasks` → `spec-kit-analyze-consistency` → `spec-kit-execute-tasks`, one
confirmed hop at a time, each re-running its full checklist — even when the change is one line in
`plan.md` and the spec has nothing to say about it.

This skill keeps the chain's guarantees — no decision only in chat, no silent edit of closed work,
no implementation against stale intent — and removes the overhead that does not buy safety:

- It writes the change in the **lowest** artifact that owns it
  (`spec-kit-shared/artifact-conventions.md` § Layer Ownership), so a technical change never forces
  a spec version.
- It applies every affected layer in **one pass**, after **one** confirmation of a concrete
  amendment plan.
- It validates **what changed**, not the whole artifact again.

It does not replace the chain: a change that adds a story or an entity, changes a Safe Deferral
condition, needs a new dependency, or can flip a Constitution gate goes through the generating
skills (§ Escalation).

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common inputs are: a
`pre-pr-review` report or finding IDs plus the user's decision for each, a refuted `[SONDA]` result,
or a short description of a change the user already decided.

## Core Principle

**Decided changes only. Lowest layer first, downward only. One plan, one confirmation, one pass.**

- The decision belongs to the user (or to whoever the review named as decider). This skill turns a
  decision into artifact edits; it never chooses between options.
- The layer is the one that owns everything the change touches. When unsure, the higher layer —
  skipping a cascade is the goal, hiding a behavior change from the spec is never acceptable.
- Every edit runs through the owning skill's own update procedure, so the rules for each artifact
  stay defined in one place.

## Non-Negotiable Rules

1. **Only decided changes.** If a finding has no recorded decision, stop and present it with its
   options; do not pick one. A `pre-pr-review` `🟡` reads "This requires a … decision" for a reason.
2. **Lowest affected layer, propagating downward only.** Classify per
   `artifact-conventions.md` § Layer Ownership. A change that touches no requirement, entity,
   invariant, safeguard, or scope does not touch `spec.md`.
3. **Delegate the edits.** Apply each layer through its owner's update procedure —
   `spec-kit-generate-spec/references/updating.md`, `spec-kit-generate-plan/references/updating.md`,
   `spec-kit-generate-tasks/references/updating.md` — reading only that file (and the checklist
   template it validates against), not the whole skill, and following it inline. Never
   reimplement their rules here.
4. **Never edit a closed task.** Rework follows the Task Lifecycle in `artifact-conventions.md`:
   `[ENMIENDA T0XX]` tasks, a `Superada por:` line only when a task is replaced, and a new
   `[CIERRE]` only when the story's `R-AC` set changes.
5. **One confirmation, then one pass.** Present the full amendment plan (§ Phase 3) once. After
   confirmation, apply every layer without asking again, unless a step's validation fails.
6. **Write ahead, stop cleanly, resume mechanically.** The `amendments.md` entry is written with
   `Status: planned` and the base hashes **before** any artifact is edited, and updated after each
   layer validates. If a validation fails, stop, set `Status: stopped` with `Stopped at`, and do not
   refresh `state.json` for any artifact that did not validate. A later invocation resumes or undoes
   that entry from its record (§ Resuming or Undoing an Open Amendment) — never by guessing what
   was already done.
7. **No runtime premise at `read`.** If the change rests on runtime behavior of a library or the
   project's wiring, obtain `executed` evidence (a scratch probe, `verify-before-implement` §6.9)
   before writing it into `plan.md`, or record it as `assumption` with a `[SONDA]` task.
8. **Every decision is written down.** In `spec.md` (`R-D##` plus an Evidence Catalog row for the
   decision text) for a spec-layer change, in `plan.md` (`PL-D##`) for a plan-layer change, and
   always in `amendments.md` — including `Layer: none` (`Status: accepted`) for a `🟡` accepted
   without changes. Because the entry is written ahead (Rule 6), a decision is recorded even when
   applying it fails.
9. **No product code.** This skill changes artifacts only; implementation is
   `spec-kit-execute-tasks`'s job.
10. **Escalate what does not fit.** Changes listed in § Escalation go through the regular chain,
    with this skill only recording the decision.
11. **Generate portable agent pairs.** If this workflow creates an `artifact-amender` (or other
    support agent), it must generate and validate both a Kiro CLI and a Claude Code definition per
    the shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md`. Before
generating, validating, or reporting on the `artifact-amender` role — or any other agent this skill
materializes — read that file completely and follow it exactly. If the active host cannot resolve
the reference, follow its fallback section.

`artifact-amender` is the standard role for this skill: applying one confirmed amendment plan
across spec/plan/tasks in isolation. Do not invent a different name or redefine it for another
purpose.

## Artifact Conventions

The `.speckit/` layout, `state.json`, the Content Fingerprint Convention, Stable ID Namespaces,
Layer Ownership, Evidence Levels, Task Lifecycle, and the `amendments.md` format all live in
`spec-kit-shared/artifact-conventions.md`. Read it before Fase 0 below.

## Run Log

Record this run per `spec-kit-shared/artifact-conventions.md` § Run Log (`<dir>` is the feature directory): start with
`node spec-kit-shared/scripts/log-event.mjs <dir> run.start --skill spec-kit-amend-artifacts mode=<mode>` and pass the printed `RUN_ID` to every
later call; end with a `run.end` event (`status`, `reason` when it stops, `next`), also when the run stops early.
Pass `--log <RUN_ID> --skill spec-kit-amend-artifacts` to `fingerprint.mjs --record` (through the owning procedures), `fingerprint.mjs --state`, and `lint-artifacts.mjs` so they record their own results.
Record these decisions, each with a one- or two-sentence `rationale` citing its IDs:

- `layer` — the layer chosen for each `AM-##` and why, citing the IDs it changes
- `escalation` — when a change goes to the regular chain instead, and which rule triggered it
- `user` — the single amendment-plan confirmation

If logging is off (`RUN_LOG: off`), continue normally.

## Input Contract

### Resolving the Target Feature

1. If the user gave an explicit feature directory, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory the change applies to, and the decided change (or the review
   > findings plus your decision for each).

4. Read `spec.md`, `plan.md`, `tasks.md` (whichever exist), their checklists, `amendments.md` if
   present, and `state.json`.
5. If `amendments.md` has an entry with `Status: planned` or `stopped`, handle it first
   (§ Resuming or Undoing an Open Amendment) — a new amendment never starts on top of a half-applied
   one.

### Resuming or Undoing an Open Amendment

An open entry (`planned` or `stopped`) records its decision, its plan, the layers already done,
and the `state.json` hashes it started from. Compare each artifact's current hash
(`fingerprint.mjs`) with the entry's **Base hashes**:

- Equal → that artifact was not touched by the amendment.
- Different and listed in `Layers done` → applied and validated by the amendment; keep it.
- Different and not in `Layers done` → the edit at the stopped layer, or an edit made outside the
  kit. Show the diff; never assume which.

Then offer exactly two options:

1. **Resume** — after the user fixes or confirms the cause in `Stopped at`, continue Phase 4 from
   the first layer not in `Layers done`, re-validating the stopped layer from scratch. Fase 0
   treats drift on artifacts this entry touched as expected; any other drift still stops it.
2. **Undo** — restore every artifact the entry touched to its base version (for example
   `git restore` when the base version is committed — only with the user's confirmation, since it
   discards edits), confirm with `fingerprint.mjs` that each one matches its base hash again, and
   set `Status: abandoned` with the reason. The decision stays recorded.

### Resolving the Decision

For each change to apply, establish: **origin** (finding ID and head SHA, `[SONDA]` task, or user
request), **decision** (the exact change chosen), and **decider**. A review report with several
findings becomes one `AM-##` per root cause — not one per finding, not one for everything.

## Fase 0 — Staleness Check

Read `spec-kit-sync-artifacts/SKILL.md` and follow its Phase 1/2 procedure across the chain. An
amendment is a delta against artifacts that agree with each other; it cannot repair drift it did
not cause.

- Everything matches → proceed.
- Drift exists that the user explains as part of this same decided change (e.g. they already
  hand-edited `plan.md` for it) → include that edit in the amendment plan and validate it like any
  other change.
- Drift on an artifact touched by the open amendment being resumed → expected (§ Resuming or
  Undoing an Open Amendment).
- Any other drift → stop and recommend the one-hop fix `spec-kit-sync-artifacts` names.

## Workflow

### Phase 1 — Classify Each Change

For each `AM-##`, using `artifact-conventions.md` § Layer Ownership:

| Layer | When | Touches |
| --- | --- | --- |
| `spec` | Scope, observable behavior, a business rule, an `R-AC`, an entity, an invariant, a safeguard, a sensitive-data channel, a user-visible error or status | `spec.md` → `plan.md` → `tasks.md` |
| `plan` | A technical decision, a refuted or newly executed runtime premise, a library call, a wiring point or file, a concrete value still inside the stated `R-QR`/`S-SG` | `plan.md` → `tasks.md` |
| `tasks` | A task's wording or `Validación`, a file within an existing `PL-O##`, an extra task inside an existing `PL-O##`, rework of a closed task with no new `R-AC` | `tasks.md` |
| `none` | A `🟡` accepted as-is | `amendments.md` only |

List the exact IDs each layer will change, and every closed task (`[x]`) the change affects.

### Phase 2 — Escalation

Hand the change to the regular chain instead (record the decision in `amendments.md` with
`Status: escalated`, then recommend the nearest generating skill) when it:

- adds, removes, or re-prioritizes a user story (`R-US##`), or adds/removes an entity (`E-##`);
- changes a Safe Deferral entry's condition or target story;
- needs a dependency that is not installed;
- could change a Constitution Check gate result;
- changes the `R-AC` set of more than one story at once.

These change the shape of the plan or the task structure, which the full procedures exist for.

### Phase 3 — Amendment Plan (one confirmation)

Present everything before touching any file:

```markdown
## Amendment Plan: AM-NN — [title]

**Origin**: [...]   **Decision**: [...]   **Decider**: [...]
**Layer**: spec | plan | tasks | none

| Artifact | ID | Before | After |
| -------- | -- | ------ | ----- |
| spec.md | R-AC06 | "timeout → failed" | "definitive failure → failed; timeout/5xx → pending, retried by sweep" |
| plan.md | PL-D07 | [...] | [...] |
| tasks.md | T046 (new) | — | [ENMIENDA T018] [...] — Validación: [...] |

**Closed tasks affected**: T018 → `Superada por: T046 (AM-NN)` | T009 → re-walked via T047
**Closure**: R-AC set of US1 unchanged → no new [CIERRE]; T052's Verifica re-walked after T046
**Evidence still needed**: [probe to run before writing PL-D07, or "none"]
**Validation scope**: [checklist items per artifact that will be re-validated]
```

Run any probe listed under "Evidence still needed" now, before asking — the plan shown for
confirmation must state the observed result, not an expectation. Then ask once.

On confirmation, write the `AM-NN` entry in `amendments.md` **before editing anything** (Rule 6):
the confirmed plan's origin, decision, decider, layer, and IDs; **Base hashes** copied from the
current `state.json`; `Layers done: none yet`; `Status: planned`. For `Layer: none`, write it with
`Status: accepted` and stop here — there is nothing to apply.

### Phase 4 — Apply, Top-Down

For each layer the change touches, highest first. Each owning procedure refreshes its own
`state.json` entry after it validates — the update procedures already do so, and this skill never
writes `state.json` itself (`artifact-conventions.md` § Write Ownership):

1. **`spec.md`** — follow `spec-kit-generate-spec/references/updating.md`. Record the
   decision as `R-D##` and add an Evidence Catalog row for the decision text (fingerprint: SHA-256 of
   the exact text, per the convention). Validate with the `spec.md` scope of
   `artifact-conventions.md` § Scoped Validation.
2. **`plan.md`** — follow `spec-kit-generate-plan/references/updating.md`. Record a technical
   decision as a `PL-D##` with its evidence level (Rule 7). If the spec changed but the plan needs
   no edit, say so explicitly ("plan reviewed for AM-NN: no change") — the plan's
   `based_on_spec_hash` is refreshed only after that review. Validate with the `plan.md` scope of `artifact-conventions.md` § Scoped Validation.
3. **`tasks.md`** — follow `spec-kit-generate-tasks/references/updating.md` and the Task
   Lifecycle (Rule 4). Every new task carries `Enmienda: AM-NN`. Validate with the `tasks.md`
   scope of `artifact-conventions.md` § Scoped Validation.

After each layer validates, add it to the entry's `Layers done`. At the first failed validation,
set `Status: stopped` and `Stopped at: <layer> — <failed item>`, and stop (Rule 6).

### Phase 5 — Confirm State and Close the Entry

1. Confirm the chain: `node spec-kit-shared/scripts/fingerprint.mjs --state <feature-dir>` must
   report `ARTIFACT_DRIFT: NO`, and `node spec-kit-shared/scripts/lint-artifacts.mjs <feature-dir>` must report no `BLOCKING` finding other than
   L19 for this entry itself (still `planned` until step 2). Drift here means an owning procedure did not refresh its entry —
   stop with `Status: stopped` and `Stopped at: state — <artifact>` rather than writing the hash
   on its behalf.
2. Set the entry's `Status: applied`.

### Phase 6 — Consistency and Hand-Off

1. Run `spec-kit-analyze-consistency` (read-only). Its Previously Reported section keeps an
   unchanged history short; only `READY_FOR_EXECUTION: YES` lets the hand-off proceed.
2. Hand off to `spec-kit-execute-tasks` scoped to the new amendment tasks. If the user's
   confirmation in Phase 3 included "and continue", invoke it directly; otherwise recommend it.

## Pre-Execution Extension Hooks

Before Fase 0, check `.speckit/extensions.yml` per `spec-kit-shared/artifact-conventions.md`'s
schema, reading `hooks.before_amend`. Follow the same enablement/condition/mandatory-vs-optional
rules the other `spec-kit` skills use.

## Mandatory Post-Execution Hooks

After Phase 6, process `hooks.after_amend` the same way, using the same emit-then-execute format the
other `spec-kit` skills use.

## Completion Report

Report:

- `RUN_ID`: this run's log ID, or `off`.
- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `AMENDMENTS`: each `AM-##` with origin, layer, and status (`applied` / `accepted` / `escalated` /
  `stopped` with `Stopped at` / `abandoned`), and any open entry resumed or undone this run.
- `ARTIFACTS_CHANGED`: per artifact, the IDs changed, or "unchanged" (with "reviewed, no change"
  where applicable).
- `CLOSED_TASKS`: superseded tasks and re-walked `[CIERRE]` tasks, or "none".
- `EVIDENCE`: probes run for this amendment and their observed results, or "none".
- `VALIDATION`: scoped checklist results per artifact.
- `STATE`: `fingerprint.mjs --state` result.
- `CONSISTENCY`: `READY_FOR_EXECUTION` verdict and any `BLOCKING` finding.
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: `spec-kit-execute-tasks` scoped to the amendment tasks, or the escalation target.

## Done When

- [ ] The run was logged from `run.start` to `run.end` (or logging is off).
- [ ] Every applied change had a recorded decision and decider; none was decided here.
- [ ] Fase 0 confirmed the chain consistent before any edit (or the drift was part of this change).
- [ ] Each change was classified to its lowest owning layer; escalation conditions were checked.
- [ ] The amendment plan was confirmed once, with any needed probe already run.
- [ ] Every edit went through the owning skill's update procedure, validated before the next layer.
- [ ] No closed task was edited beyond an appended `Superada por:` line.
- [ ] Every decision is recorded in the owning artifact and in `amendments.md`, the entry having
      been written as `planned` before any edit.
- [ ] Any open (`planned`/`stopped`) entry was resumed or undone before new work started.
- [ ] `state.json` was refreshed only by the owning procedures, for validated artifacts, and
      `fingerprint.mjs --state` reports no drift.
- [ ] `spec-kit-analyze-consistency` returned `READY_FOR_EXECUTION: YES` before hand-off.
- [ ] No product code was written.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
