---
name: spec-kit-analyze-consistency
description: Read-only cross-artifact consistency check across spec.md, plan.md, and tasks.md — coverage gaps, orphan tasks, unsafe deferrals, incomplete story checkpoints, and unverified safeguards. Produces checklists/consistency-report.md and a READY_FOR_EXECUTION verdict; never modifies spec.md, plan.md, tasks.md, or state.json. When a spec-analyzer agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Analyze Consistency — Cross-Artifact Verification Skill

## Purpose

Answer one question honestly, with evidence: **is it safe to move from `tasks.md` to
`spec-kit-execute-tasks`?** This skill cross-checks `spec.md`, `plan.md`, and `tasks.md` against each other
— coverage, traceability, Safe Deferral consistency, and story-closure completeness — and reports
findings. It is the fourth link in the `spec-kit` chain, and the only one that is purely
read-only: it never edits `spec.md`, `plan.md`, `tasks.md`, or `state.json`. If something is
wrong, the fix happens back in `spec-kit-generate-spec`, `spec-kit-generate-plan`, or `spec-kit-generate-tasks` — this skill
only surfaces what needs fixing and how urgently.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common input is a
reference to a feature directory; this skill checks whatever subset of `spec.md`/`plan.md`/
`tasks.md` actually exists there.

## Core Principle

**Every finding is a citation, not an impression. Every finding is classified as `BLOCKING` or
`ADVISORY` — never left ambiguous about how urgent it is.**

- A finding without a concrete ID (an `R-FR##`, `PL-O##`, `T0##`, file/line) is not a finding, it's a
  hunch — do not report one.
- `BLOCKING` findings are the ones that mean `spec-kit-execute-tasks` would build on a gap that can break
  something (an unverified safeguard, an unsafe deferral, an incomplete story closure, a task with
  no traceable scope). `ADVISORY` findings are real but not urgent enough to halt on their own
  (an uncovered nice-to-have requirement, terminology drift, an operation without a task in a
  feature that intentionally stops short of full coverage this release).
- This skill does not decide *how* to fix anything — that is the job of whichever upstream skill
  owns the artifact with the gap.

## Non-Negotiable Rules

1. **Read-only, always.** This skill never writes to `spec.md`, `plan.md`, `tasks.md`, or
   `state.json`. Its only output is `checklists/consistency-report.md`.
2. **Do not invent facts.** Every finding cites the exact ID(s) and artifact(s) involved. Do not
   report "the plan seems incomplete" — report which `R-FR##` has no `PL-O##` citing it.
3. **Classify every finding as `BLOCKING` or `ADVISORY`.** Never leave a finding's severity
   implicit or "up to the reader."
4. **Unsafe deferrals and incomplete story checkpoints are always `BLOCKING`.** These are not
   judgment calls — an operation marked `Dormant` that a task actually invokes, or a story with no
   active `[CIERRE]` task, is a defect by definition (§ Safe Deferral Consistency, § Checkpoint
   Completeness below).
5. **Unverified safeguards are always `BLOCKING`.** `spec.md`'s Safeguards section states
   non-negotiable boundaries; a safeguard with zero corresponding verification anywhere in
   `tasks.md` is a boundary nobody will actually check.
6. **Report what could not be checked, do not skip it silently.** If `tasks.md` doesn't exist yet,
   every check that needs it is explicitly listed as "not checked — no `tasks.md`" in the report,
   not omitted.
7. **Distinguish a genuine gap from an intentionally deferred one.** An operation with no task
   because it belongs to a `Safe Deferral` entry correctly not yet scheduled is not the same defect
   as an operation nobody ever accounted for — report them differently (§ Coverage Checks).
8. **Terminology findings are `ADVISORY` by default**, unless the drift actually breaks
   traceability (e.g. a task cites an entity name that resolves to nothing in `spec.md` — that
   escalates to a traceability finding, `BLOCKING` per Rule 2's citation requirement).
9. **Never claim `READY_FOR_EXECUTION: YES` while a `BLOCKING` finding exists.** The verdict is a
   direct function of the findings list, not a separate judgment call.
10. **This skill does not implement fixes.** It recommends which upstream skill should be
    re-invoked for each `BLOCKING` finding — it does not edit the artifact itself.
11. **Generate portable agent pairs.** If this workflow creates a `spec-analyzer` (or other
    support agent), it must generate and validate both a Kiro CLI and a Claude Code definition per
    the shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md`. Before
generating, validating, or reporting on the `spec-analyzer` role — or any other agent this skill
materializes — read that file completely and follow it exactly. If the active host cannot resolve
the reference, follow its fallback section.

`spec-analyzer` is the standard role for this skill: running this consistency check in isolation,
read-only. Do not invent a different name or redefine it for another purpose.

## Artifact Conventions

The `.speckit/` layout (including `.speckit/specs/<feature-dir>/`) and `state.json` schema live in
`spec-kit-shared/artifact-conventions.md`. Read it before Phase 1 below. This skill reads
`state.json` for context (e.g. whether `tasks.md` is stale relative to `plan.md`) but never writes
to it — that remains `spec-kit-sync-artifacts`'/the generating skill's responsibility.

## Input Contract

### Resolving the Target Feature

1. If the user gave an explicit feature directory, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory to analyze. It should contain at least `spec.md`.

### Partial Availability

This skill runs on whatever subset of `spec.md` / `plan.md` / `tasks.md` exists:

- `spec.md` only: run only the checks that don't require `plan.md`/`tasks.md` — Phase 2's
  broken-citation check and Phase 9 checks 1 and 4 (the sensitive-data table only, not its
  downstream coverage); every other check is listed as skipped. Report this plainly rather than
  fabricating findings against artifacts that don't exist.
- `spec.md` + `plan.md`, no `tasks.md`: run § Coverage Checks (spec → plan) and note every
  plan-to-tasks and Safe-Deferral-consistency check as "not checked — no `tasks.md`".
- All three present: run every check below.

Never present a partial run as if it were complete — the report's header states exactly which
artifacts were found and which checks were consequently skipped.

## Workflow

### Phase 1 — Load and Resolve Artifacts

Read every artifact that exists: `spec.md`, `plan.md`, `tasks.md`, their respective checklists
(`requirements.md`, `plan-quality.md`, `tasks-quality.md`), and `state.json` if present. Record
each artifact's own reported `STATUS` — this skill does not re-derive readiness itself, it reads
what the generating skill already concluded and checks *consistency*, not re-litigate each
artifact's own internal validation.

### Phase 1.5 — Mechanical Checks

Run `node spec-kit-shared/scripts/lint-artifacts.mjs <feature-dir>` `--json` (`artifact-conventions.md` § Mechanical Checks). Every finding it returns
goes into the report with its code (`L02`, `L08`, …), file, line, and the severity the script
assigned — they are already classified per this skill's rules, so do not re-derive or re-grade
them. The script covers the mechanical part of Phases 2, 3 (operation links), 6, and 9 (checks 3
and 4); the phases below still run, but only for what the script cannot decide, and never report
the same defect twice. Exit 3 (state newer than the contract) stops the analysis.

If Node is unavailable, say so in the report header (`LINT: not run — <reason>`) and perform those
checks by hand following § Artifact Grammar.

### Phase 2 — Build the Traceability Index

Extract every stable ID from each artifact into one index:

- From `spec.md`: `R-G##`, `R-US##` (with `Priority`), `R-FR##`, `R-QR##`, `R-AC##`, `R-AS##`,
  `R-D##`, `R-DEP##`, `R-RISK##`, `E-##`, `E-I##`, `E-DL##`, `A-##`/`A-D##`/`A-E##`/`A-C##`,
  `S-C##`/`S-CS##`, `O-##`, `N-##`, `S-SG##`, and the Sensitive Data by Channel rows.
- From `plan.md` / `research.md`: `PL-D##` (Key Decisions, with evidence level), `PL-O##`
  (Operations), `RS-##` (research, with evidence level and runtime-premise flag), `S-C0#`
  (Convention Enforcement), Safe Deferral entries (`PL-O##` → deferred-to story + condition),
  Constitution Check gate results. A legacy plan's `A-D0#`/`O-0#` are indexed as plan IDs, per
  `artifact-conventions.md` § Stable ID Namespaces; an ID defined in both artifacts is reported as
  an `ADVISORY` namespace collision.
- From `tasks.md`: every task's ID, `[P]`/`[USn]`/`[CIERRE]`/`[SONDA]`/`[ENMIENDA T0XX]` tags,
  `Superada por:` lines, `Enmienda: AM-##` lines, and its `Traza a` citations.
- From `amendments.md` (if present): every `AM-##` with its layer, IDs changed, and status.

An ID referenced anywhere that doesn't resolve to a definition in its source artifact is itself a
`BLOCKING` finding (a broken citation) — record it before running the checks below, since it would
otherwise silently corrupt every check that relies on it.

### Phase 3 — Coverage Checks (spec → plan)

*Skipped, and reported as skipped, if `plan.md` doesn't exist.*

- Every `R-FR##` has ≥1 `PL-O##` in `plan.md` citing it, **or** is explicitly covered by a Safe
  Deferral entry (deferred by product decision, not forgotten) → otherwise `ADVISORY`: "uncovered
  functional requirement." **Exception**: if `plan.md` itself documents the requirement as
  blocked (a decision entry explaining why it cannot yet be planned — e.g. a missing verified data
  source — distinct from a Safe Deferral entry, which defers by choice rather than by inability),
  escalate to `BLOCKING`: "requirement blocked, not merely uncovered" — the plan is telling you
  this isn't an oversight, and `spec.md`'s own status is very likely `DRAFT` over the same root
  cause, which makes this a confirmed gap, not a candidate for a coverage nudge.
- Every `R-AC##` has ≥1 `PL-O##` or explicit verification path → otherwise `ADVISORY`.
- The two operation layers link both ways (`artifact-conventions.md` § Stable ID Namespaces): every
  `PL-O##` cites ≥1 spec `O-##`, and every spec `O-##` is realized by ≥1 `PL-O##` or covered by a
  Safe Deferral entry → otherwise `ADVISORY`: "unlinked operation" (a legacy plan's `O-0#` entries
  are exempt).
- Every `S-SG##` (Safeguard) has ≥1 downstream verification anywhere in `tasks.md` (if it exists;
  otherwise checked against `plan.md`'s stated Validation/Constraints) → otherwise `BLOCKING`
  (Rule 5).

### Phase 4 — Coverage Checks (plan → tasks)

*Skipped, and reported as skipped, if `tasks.md` doesn't exist.*

- Every `PL-O##` in `plan.md` has ≥1 task in `tasks.md` citing it, **or** is the target of a Safe
  Deferral entry not yet scheduled (expected, not a defect — Rule 7) → otherwise `ADVISORY`:
  "operation without a task."
- Every task's `Traza a` citation resolves to a real ID in `plan.md`/`spec.md` → otherwise
  `BLOCKING`: "orphan task — scope not present in plan.md/spec.md" (this is the escalation from
  Rule 8: a broken citation is a traceability break, not mere terminology drift).

### Phase 5 — Safe Deferral Consistency

*Skipped, and reported as skipped, if `plan.md` has no Safe Deferral table or `tasks.md` doesn't
exist.*

For every `plan.md` Safe Deferral entry (`PL-O##` → story, condition):

- If the condition is `Dormant`: confirm no task in an earlier-priority story invokes that
  operation's code path (by file/route/function reference in the task's `Archivo(s)`/description).
  A match → `BLOCKING`: "unsafe deferral — Dormant operation is actually invoked."
- If `Flagged`: confirm no task removes or defaults-on the flag before the target story. A match →
  `BLOCKING`.
- If `Additive`: confirm no earlier task modifies the existing behavior the Additive operation was
  supposed to leave untouched. A match → `BLOCKING`.
- If the deferred operation has no task anywhere yet (not even in a future story phase already
  present in `tasks.md`): this is expected when the deferred work belongs to a future release with
  no plan of its own yet — report as `ADVISORY`, informational, not `BLOCKING` (Rule 7).

### Phase 6 — Checkpoint Completeness

*Skipped, and reported as skipped, if `tasks.md` doesn't exist.*

For every user-story phase in `tasks.md`, applying the Task Lifecycle in
`artifact-conventions.md`:

- Exactly one **active** `[CIERRE]` (no `Superada por:` line) exists, and it is the last task of the
  phase except for `[ENMIENDA]` tasks under `#### Enmiendas` → otherwise `BLOCKING`: "missing or
  duplicated active story closure checkpoint." `[CIERRE]` tasks carrying `Superada por:` are
  history: they are neither counted nor reported, not even as `ADVISORY`.
- The active `[CIERRE]`'s `Verifica` block covers every `R-AC##` this story's operations claim to
  satisfy (cross-referenced via Phase 2's index) → otherwise `BLOCKING`: "incomplete closure
  checkpoint — does not cover R-AC##."
- Every `[ENMIENDA]` task cites an `AM-##` that exists in `amendments.md`, and every `Superada por:`
  line names a task that exists → otherwise `BLOCKING` (broken citation).

### Phase 7 — Terminology Consistency

Compare entity/component/concept names across all present artifacts. A name used differently for
what appears to be the same concept (not merely a synonym in prose, but a naming inconsistency
that could confuse traceability) → `ADVISORY`, unless it manifests as a broken citation, in which
case it was already captured as `BLOCKING` in Phase 2/4.

### Phase 8 — Downstream Clarification Consistency

If any artifact's own `STATUS` is `READY` but its content still contains an unresolved
`NEEDS CLARIFICATION` marker or an unaddressed blocking assumption — a contradiction between the
artifact's declared status and its actual content — report `BLOCKING`: "artifact marked READY
despite an unresolved open question." If an artifact is already honestly marked
`DRAFT — NEEDS CLARIFICATION`, that is consistent, not a new finding here — just carry it forward
in the report's summary so it isn't lost, without duplicating it as a fresh finding.

### Phase 9 — Targeted Semantic Checks

ID coverage cannot see a contradiction between two IDs that both resolve. These checks are
bounded — each compares specific IDs against specific IDs, and each finding still cites both sides
(Rule 2). They are not an open-ended re-review of the artifacts.

1. **Terminal state vs. invariants** (`spec.md`): for every `R-AC##` that leaves an entity in a
   terminal or persistent state, compare it with every `E-I##` constraining that entity, under the
   definitive outcome and under each ambiguous outcome the flow can produce (timeout, network
   error, 5xx, exhausted retries). A combination where the `R-AC` result violates the `E-I` →
   `BLOCKING`: "acceptance criterion contradicts invariant" (fix in `spec-kit-generate-spec` or via
   `spec-kit-amend-artifacts`).
2. **Open tasks vs. current decisions** (`tasks.md` × `plan.md`): for every open (`[ ]`) task,
   compare its description and `Validación` with the current `PL-D##`/`PL-O##` it depends on. A
   task asserting something the current plan contradicts (e.g. "file X unchanged" while a `PL-O##`
   changes X, or a value the current `PL-D##` replaced) → `BLOCKING`: "open task contradicts
   current plan decision" — it could not be closed honestly. A `Validación` that depends on
   implementation shape (parameter or variable names, hunk or line counts, a file that must stay
   untouched) without restating an `S-SG##` → `ADVISORY`: "validation tied to implementation shape."
3. **Runtime premises** (`plan.md`/`research.md` × `tasks.md`): every `PL-D##` resting on a runtime
   premise must cite an `executed` `RS-##`, or be `assumption` with a `[SONDA]` that precedes every
   task citing that decision. A runtime premise at `read` level, or an `assumption` with no
   preceding `[SONDA]` → `BLOCKING`: "unexecuted runtime premise." A claim labeled only "Verified",
   with no evidence level → `ADVISORY`.
4. **Sensitive data by channel** (`spec.md` × `tasks.md`): when the feature handles sensitive data,
   the Sensitive Data by Channel table must exist with every row filled, and every non-`N/A` row's
   `S-SG##` falls under Rule 5 (verified downstream). A missing table or an empty row → `BLOCKING`:
   "unenumerated sensitive-data channel."

## Previously Reported Findings

Before writing the new report, read the existing `checklists/consistency-report.md` if there is
one. A finding whose category, cited IDs, and evidence are unchanged since that report is listed
once in a compact **Previously Reported** table (ID, one-line summary, first reported on) instead
of being rewritten in full; new or changed findings keep the full format. This changes only the
presentation: a previously reported `BLOCKING` finding still counts toward the verdict, and a
finding that no longer reproduces is simply absent — never carried forward on memory.

## Consistency Report

Write `checklists/consistency-report.md`:

```markdown
# Consistency Report: [Feature Name]

**Feature**: [Relative link to spec.md]
**Artifacts found**: spec.md [status] | plan.md [status/absent] | tasks.md [status/absent]
**Checks skipped**: [list, with reason — "no tasks.md" etc., or "none"]

## BLOCKING Findings

### B1 — [Category: unverified safeguard / unsafe deferral / incomplete checkpoint / orphan task / broken citation / status contradiction / AC contradicts invariant / open task contradicts plan / unexecuted runtime premise / unenumerated sensitive-data channel]

**Artifact(s)**: [spec.md / plan.md / tasks.md, with IDs]
**Evidence**: [exact IDs and citations]
**Why it's blocking**: [one sentence]
**Recommended fix**: [which upstream skill to re-invoke, and on what]

[repeat per finding]

## ADVISORY Findings

### A1 — [Category: uncovered requirement / operation without task / terminology drift / expected-but-unscheduled deferral / namespace collision / validation tied to implementation shape / evidence level missing]

**Artifact(s)**: [...]
**Evidence**: [...]
**Risk if left unresolved**: [...]

[repeat per finding]

## Previously Reported

| ID | Severity | Summary | First reported |
| -- | -------- | ------- | -------------- |
| [B#/A#] | BLOCKING / ADVISORY | [one line] | [date of the earlier report] |

## Carried-Forward Status Notes

[Any artifact already honestly marked DRAFT — NEEDS CLARIFICATION upstream — not a new finding,
just preserved context.]

## Verdict

**READY_FOR_EXECUTION**: YES / NO

[NO if any BLOCKING finding exists. State exactly which BLOCKING findings must be resolved and in
which upstream skill.]
```

## Validate and Iterate

Before finalizing:

- Re-confirm every finding still cites a real, resolvable ID (Phase 2's index) — a finding based
  on a misread citation is worse than a missed one, because it wastes the upstream skill's next
  invocation on a non-issue.
- Re-confirm every `BLOCKING`/`ADVISORY` classification against the rules above — do not downgrade
  an unsafe deferral or incomplete checkpoint to `ADVISORY` even if it looks minor in context
  (Rule 4/5 are not case-by-case judgment calls).
- Re-confirm `READY_FOR_EXECUTION` is mechanically derived from the findings list, not a separate
  narrative judgment.

## Pre/Post-Execution Extension Hooks

This skill is read-only and has no natural "before/after" side effect to gate — `extensions.yml`
support is intentionally not defined for it. If a future need arises, add
`hooks.before_analyze`/`hooks.after_analyze` to `spec-kit-shared/artifact-conventions.md` first, so
the schema stays centrally defined rather than invented ad hoc here.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `ARTIFACTS_FOUND`: which of spec.md/plan.md/tasks.md existed.
- `CHECKS_SKIPPED`: list with reasons, or "none".
- `REPORT_FILE`: `checklists/consistency-report.md` path.
- `LINT`: `lint-artifacts.mjs` exit code and its BLOCKING/ADVISORY counts, or `not run — <reason>`.
- `BLOCKING_COUNT` / `ADVISORY_COUNT`: totals (new or changed / previously reported).
- `SEMANTIC_CHECKS`: Phase 9 checks run, each with its finding count, or skipped with a reason.
- `READY_FOR_EXECUTION`: `YES` / `NO`.
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: if `NO`, name each `BLOCKING` finding's recommended upstream skill; if `YES`, recommend
  `spec-kit-execute-tasks`.

## Done When

- [ ] The target feature directory was resolved and every existing artifact was read completely.
- [ ] Every check applicable to the artifacts present was run; every skipped check is listed with
      its reason, not silently omitted.
- [ ] The traceability index covers every stable ID from every present artifact, including
      `R-D`, `E-I`, `E-DL`, `PL-*`, `RS-##`, and `AM-##`.
- [ ] `lint-artifacts.mjs` ran (Phase 1.5) and its findings are in the report with their codes,
      not re-derived by hand — or the report says why it could not run.
- [ ] Phase 9's targeted semantic checks ran (or are listed as skipped with a reason).
- [ ] Findings unchanged since the previous report are in the Previously Reported table, not
      rewritten — and still counted in the verdict.
- [ ] Every finding cites concrete IDs and is classified `BLOCKING` or `ADVISORY` per the rules
      above, with no ambiguous severity.
- [ ] Unsafe deferrals, incomplete checkpoints, unverified safeguards, and broken citations are all
      `BLOCKING` — never downgraded.
- [ ] `checklists/consistency-report.md` was written with a mechanically-derived
      `READY_FOR_EXECUTION` verdict.
- [ ] No artifact (`spec.md`, `plan.md`, `tasks.md`, `state.json`) was modified.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
