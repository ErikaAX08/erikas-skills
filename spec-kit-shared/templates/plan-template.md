# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: `specs/[###-feature-name]/spec.md`

**Input**: Feature specification from `specs/[###-feature-name]/spec.md` (must be `READY`, or
`DRAFT` with the user's explicit confirmation to plan against a draft — see `generate-plan/SKILL.md`).

**Note**: This template is filled in by the `generate-plan` skill; its `SKILL.md` describes the
execution workflow. Adapted from a general-purpose spec-kit plan template to this repo's REASONS
vocabulary (`R-FR##`, `R-AC##`, `E-##`, `O-##`) and its Constitution Check / Complexity Tracking /
Safe Deferral mechanics.

## Summary

[One paragraph: the primary requirement(s) this plan satisfies (cite `R-G0#`/`R-FR0#`) and the
technical approach in one sentence, once Technical Context and Constitution Gate 1 below are
resolved.]

## Technical Context

<!--
  ACTION REQUIRED: every field is either a verified fact (a dependency confirmed in the actual
  lockfile/manifest, a target confirmed with the user, a metric taken from spec.md) or explicitly
  `NEEDS CLARIFICATION`. Never fill a field with a plausible-sounding guess — that is exactly the
  failure mode verify-before-implement exists to prevent.
-->

**Language/Version**: [verified in manifest/lockfile, or NEEDS CLARIFICATION]
**Primary Dependencies**: [verified against what's installed, or NEEDS CLARIFICATION]
**Storage**: [if applicable, verified; otherwise N/A]
**Testing**: [framework/runner verified, or NEEDS CLARIFICATION]
**Target Platform**: [verified or agreed with the user]
**Project Type**: [single project / web app / mobile+api — see Project Structure below]
**Performance Goals**: [from spec.md `R-QR##`, or NEEDS CLARIFICATION if no measurable target exists]
**Constraints**: [from spec.md `R-QR##` / Safeguards]
**Scale/Scope**: [from spec.md or direct project inspection]

Any `NEEDS CLARIFICATION` above is resolved through `generate-spec`'s Clarification Policy (max 3
blocking questions per round) before continuing to Phase 0.

## Constitution Check — Gate 1 (before Phase 0)

*Evaluated against `.specify/memory/constitution.md`, if it exists, before investing in research.*

| Principle | PASS / FAIL | Notes |
| --------- | ----------- | ----- |
| [principle ID from constitution.md] | [...] | [...] |

If `.specify/memory/constitution.md` does not exist yet: report `N/A — sin constitución` here
rather than omitting the gate silently, and note whether `establish-constitution` should run first
given the scope of this plan.

## Phase 0: Research

**Output**: `research.md`

[Directed technical research — library/version decisions, always verified against what is
actually installed, never against memory. Resolve every `NEEDS CLARIFICATION` left over from
Technical Context here, or escalate it explicitly.]

## Phase 1: Design

### Data Model

**Output**: `data-model.md`

[Only entities already present in `spec.md` §E — Entities. This phase does not invent new domain
concepts; if one seems necessary, that is a gap to report back to the spec, not to fill here.]

### Contracts

**Output**: `contracts/`

[If the spec implies an API, follow `backend-api-standards`. If frontend with
`frontend-architecture` active, respect its layers. State the contract source verified for each
endpoint/schema.]

### Project Structure

#### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # generate-tasks output — NOT created by generate-plan
```

#### Source Code (repository root)

<!--
  ACTION REQUIRED: in a project that already has structure, this is a verified snapshot of the
  real layout (via verify-before-implement), not a free choice between generic options. Only a
  genuinely greenfield project selects between single-project / web-app / mobile+api shapes, and
  that selection is itself recorded as a decision below. Delete unused options; the delivered plan
  must not contain unresolved "Option N" labels.
-->

```text
[Real tree for this project, with concrete paths this feature will touch or create.]
```

**Structure Decision**: [One sentence referencing the real tree above — never left as a template
placeholder.]

### Quickstart

**Output**: `quickstart.md`

[Concrete manual steps to validate this feature once implemented.]

## Constitution Check — Gate 2 (re-check after Phase 1)

*Re-evaluated with `data-model.md`, `contracts/`, and Project Structure now concrete — a design
choice can introduce a violation the original intent did not have.*

| Principle | PASS / FAIL | Notes |
| --------- | ----------- | ----- |
| [principle ID] | [...] | [...] |

## Complexity Tracking

> Fill ONLY if a Constitution Check gate above has a FAIL that must be justified to proceed. A row
> without a concrete, verifiable need is not a valid justification — it is a signal the approach
> should change instead.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------- |
| [principle ID violated] | [concrete, current need] | [why the compliant alternative does not work] |

## Convention Enforcement (Structure)

For every new or modified component in this plan's Structure (`S-C0#`):

| Component (S-C0#) | Pattern Followed | Evidence / Constitution Reference | Deviation |
| ------------------ | ----------------- | ----------------------------------- | ---------- |
| [component] | [existing pattern name, or "new"] | [file example or constitution principle ID] | [none, or → A-D0#] |

Any deviation from the dominant pattern or the constitution is recorded as an explicit decision in
`A-D0#` below (or, if it violates a `FAIL` principle, in Complexity Tracking) — never as a silent
omission.

## Key Decisions and Trade-offs

| ID | Decision | Alternatives Considered | Rationale | Consequences | Evidence |
| -- | -------- | ------------------------ | --------- | ------------- | -------- |
| A-D01 | [...] | [...] | [...] | [...] | [S#/P#] |

## Safe Deferral (only if this plan proposes phases / user stories spanning multiple increments)

| Operation (O-0#) | Deferred To | Condition | Justification |
| ------------------ | ------------ | ---------- | --------------- |
| [operation] | [user story / phase] | Dormant / Flagged / Additive | [why this condition genuinely holds] |

An operation with no valid condition here is **not** deferred — it is completed in the current
phase, or the phases are reordered until it is safe. See `plan-spec-kit.md` §3 "Cierre de ciclos"
and §7.3 for the full rule.

## Traceability

[Confirm every entry above cites the `R-FR##`/`R-AC##`/`E-##` it satisfies. Optional summary table
of requirement → plan-section coverage.]

## Compatibility and Evolution

[Backward compatibility, rollout, or migration strategy — cite the Safe Deferral table above when
this plan spans multiple phases.]

---

`NEXT`: generate `tasks.md` with `generate-tasks`, organized by user story per `spec.md`'s
`R-US##` priorities.
