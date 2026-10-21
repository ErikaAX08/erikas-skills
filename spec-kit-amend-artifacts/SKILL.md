---
name: spec-kit-amend-artifacts
description: Apply an already-decided change — a pre-pr-review finding, a refuted [SONDA] premise, or unplanned scope the user resolved — to spec.md/plan.md/tasks.md in one confirmed pass, starting at the lowest artifact that owns the change and propagating only downward, by running each generating skill's own "Updating an Existing X" procedure with scoped validation. Records every decision in amendments.md, reworks closed tasks only through the Task Lifecycle, refreshes state.json, and hands off to spec-kit-execute-tasks. Never decides a change for the user and never writes product code. When an artifact-amender agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
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
3. **Delegate the edits.** Apply `spec.md` changes through `spec-kit-generate-spec`'s "Updating an
   Existing Specification", `plan.md` changes through `spec-kit-generate-plan`'s "Updating an
   Existing Plan", and `tasks.md` changes through `spec-kit-generate-tasks`'s "Updating an Existing
   Task List" — read each procedure and follow it inline. Never reimplement their rules here.
4. **Never edit a closed task.** Rework follows the Task Lifecycle in `artifact-conventions.md`:
   `[ENMIENDA T0XX]` tasks, a `Superada por:` line only when a task is replaced, and a new
   `[CIERRE]` only when the story's `R-AC` set changes.
5. **One confirmation, then one pass.** Present the full amendment plan (§ Phase 3) once. After
   confirmation, apply every layer without asking again, unless a step's validation fails.
6. **Stop on a failed step, never paper over it.** Each layer is validated before the next one is
   touched. If a validation fails, stop, report where, and do not refresh `state.json` for any
   artifact that did not validate — Fase 0 of the next skill must see the inconsistency.
7. **No runtime premise at `read`.** If the change rests on runtime behavior of a library or the
   project's wiring, obtain `executed` evidence (a scratch probe, `verify-before-implement` §6.9)
   before writing it into `plan.md`, or record it as `assumption` with a `[SONDA]` task.
8. **Every decision is written down.** In `spec.md` (`R-D##` plus an Evidence Catalog row for the
   decision text) for a spec-layer change, in `plan.md` (`PL-D##`) for a plan-layer change, and
   always in `amendments.md` — including `Layer: none` for a `🟡` accepted without changes.
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

## Input Contract

### Resolving the Target Feature

1. If the user gave an explicit feature directory, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory the change applies to, and the decided change (or the review
   > findings plus your decision for each).

4. Read `spec.md`, `plan.md`, `tasks.md` (whichever exist), their checklists, `amendments.md` if
   present, and `state.json`.

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
- Any other drift → stop and recommend the one-hop fix `spec-kit-sync-artifacts` names.

## Workflow

### Phase 1 — Classify Each Change

For each `AM-##`, using § Layer Ownership:

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

### Phase 4 — Apply, Top-Down

After confirmation, for each layer the change touches, highest first:

1. **`spec.md`** — follow `spec-kit-generate-spec` § Updating an Existing Specification. Record the
   decision as `R-D##` and add an Evidence Catalog row for the decision text (fingerprint: SHA-256 of
   the exact text, per the convention). Validate with that skill's scoped validation for
   amendments.
2. **`plan.md`** — follow `spec-kit-generate-plan` § Updating an Existing Plan. Record a technical
   decision as a `PL-D##` with its evidence level (Rule 7). If the spec changed but the plan needs
   no edit, say so explicitly ("plan reviewed for AM-NN: no change") — the plan's
   `based_on_spec_hash` is refreshed only after that review. Validate with the scoped validation.
3. **`tasks.md`** — follow `spec-kit-generate-tasks` § Updating an Existing Task List and the Task
   Lifecycle (Rule 4). Every new task carries `Enmienda: AM-NN`. Validate with the scoped
   validation.

Stop at the first failed validation (Rule 6).

### Phase 5 — Record and Refresh State

1. Write the `AM-NN` entry in `amendments.md` (format in `artifact-conventions.md`), `Status:
   applied`.
2. Refresh `state.json` only for artifacts that changed and validated, in chain order: `spec`
   `content_hash`; `plan` `content_hash` and `based_on_spec_hash`; `tasks` `content_hash` and
   `based_on_plan_hash`. Compute every hash with `spec-kit-shared/scripts/fingerprint.mjs`.
3. Confirm the chain: `node spec-kit-shared/scripts/fingerprint.mjs --state <feature-dir>` must
   report `ARTIFACT_DRIFT: NO`.

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

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `AMENDMENTS`: each `AM-##` with origin, layer, and status (`applied` / `escalated` / `stopped at
  <layer>`).
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

- [ ] Every applied change had a recorded decision and decider; none was decided here.
- [ ] Fase 0 confirmed the chain consistent before any edit (or the drift was part of this change).
- [ ] Each change was classified to its lowest owning layer; escalation conditions were checked.
- [ ] The amendment plan was confirmed once, with any needed probe already run.
- [ ] Every edit went through the owning skill's update procedure, validated before the next layer.
- [ ] No closed task was edited beyond an appended `Superada por:` line.
- [ ] Every decision is recorded in the owning artifact and in `amendments.md`.
- [ ] `state.json` was refreshed only for validated artifacts, and `fingerprint.mjs --state`
      reports no drift.
- [ ] `spec-kit-analyze-consistency` returned `READY_FOR_EXECUTION: YES` before hand-off.
- [ ] No product code was written.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
