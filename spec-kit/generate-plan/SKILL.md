---
name: generate-plan
description: Generate or update a technical implementation plan (plan.md) from an approved REASONS specification, enforcing verified project context, two-gate Constitution Check, convention enforcement, and the Safe Deferral rule for phased work; when a plan-reviewer agent is requested, generate compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Generate Plan — Technical Planning Skill

## Purpose

Turn an approved REASONS specification (`spec.md`) into one concrete, technically verified plan
that `generate-tasks` can decompose into executable work — without writing product code. This
skill sits between `generate-spec` and `generate-tasks` in the `spec-kit` chain: it does not
reinterpret business intent, it translates already-approved intent into a design that fits the
real project.

The output is `plan.md` plus its Phase 0/1 companions (`research.md`, `data-model.md`,
`contracts/`, `quickstart.md`) and `checklists/plan-quality.md`. It does **not** implement product
code, and it does **not** generate `tasks.md` — that is `generate-tasks`'s job.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common input is a
reference to an existing feature directory or `spec.md`, with optional constraints ("use
PostgreSQL", "keep it in the existing monolith", "split into two phases").

## Core Principle

**Verify the real project before designing on top of it. Gate every design against the
constitution before it's built, not after.**

Treat the plan as the bridge between approved intent and executable work:

- Never propose a technical approach without checking whether the project already has one.
- Run the Constitution Check before investing in research, and again after the design is concrete
  — a design can introduce a violation the original intent didn't have.
- Every plan entry traces back to a requirement or acceptance criterion in `spec.md`.
- When `spec.md` changes after a plan exists, update the plan; never let the plan silently drift
  from the specification it claims to implement.

## Non-Negotiable Rules

1. **Do not invent facts.** Never fabricate installed dependencies, versions, file paths, existing
   components, database schemas, or library signatures. Verify per `verify-before-implement`
   before writing them into the plan.
2. **Preserve spec intent.** Do not reinterpret, narrow, or expand a requirement from `spec.md`
   while translating it into a technical approach. If the spec is ambiguous at the technical
   level, that is a clarification to raise, not a decision to make silently.
3. **Separate facts from assumptions.** Every unverified technical choice is marked
   `NEEDS CLARIFICATION` in Technical Context or recorded as an explicit assumption — never
   written as settled fact.
4. **Surface conflicts.** If the spec's requirements conflict with the real project (an existing
   contract, an installed dependency's actual capabilities, a constitution principle), report the
   conflict; do not silently pick the path of least resistance.
5. **Abstraction before operations.** Complete Technical Context, both Constitution Check gates,
   Data Model, and Contracts before drafting `plan.md`'s strategy and decisions section.
6. **No code before approval.** Do not implement, scaffold, or generate product code as part of
   this skill. Code samples inside `plan.md` (contract shapes, signatures) illustrate a decision;
   they are not committed source.
7. **No hollow plan.** Every section of `plan.md` must contain specific, verified content. Do not
   leave `[NEEDS CLARIFICATION]` markers, template placeholders, or unresolved `Option N` labels
   in a plan reported as complete.
8. **Use verified project context.** Inspect the actual codebase for existing patterns, contracts,
   and structure before naming concrete components — never assume a pattern exists because it's
   common elsewhere.
9. **Keep scope controlled.** Do not add operations, components, or dependencies beyond what
   `spec.md` requires. A plan that "future-proofs" beyond the approved spec is scope creep, not
   thoroughness.
10. **Constitution Check gates are mandatory, not advisory.** Both gates run and are reported as
    `PASS`/`FAIL` per principle — including `N/A — sin constitución` when no constitution exists.
    A `FAIL` only proceeds with a justified row in Complexity Tracking; skipping a gate silently is
    never acceptable, even under time pressure.
11. **Safe Deferral is enforced, not suggested.** An operation pushed to a future phase must
    satisfy `Dormant`, `Flagged`, or `Additive` (§ Safe Deferral below). If none applies, the
    operation is completed in the current phase or the phases are reordered — it is never marked
    deferrable "because it's documented as future work."
12. **Every plan entry is traceable.** Each `plan.md` decision, component, and operation cites the
    `R-FR##`/`R-AC##`/`E-##`/`R-QR##` it satisfies.
13. **Never claim readiness without validation.** A plan is `READY` only after
    `checklists/plan-quality.md` passes and no blocking `NEEDS CLARIFICATION` remains.
14. **Generate portable agent pairs.** If this workflow creates a `plan-reviewer` (or other support
    agent), it must generate and validate both a Kiro CLI and a Claude Code definition per the
    shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in the shared, canonical document
`spec-kit/shared/agent-portability.md` (same document `generate-spec` uses). Before generating,
validating, or reporting on the `plan-reviewer` role — or any other agent this skill materializes
— read that file completely and follow it exactly. Do not paraphrase it from memory. If the active
host cannot resolve that file reference, follow its "Fallback for hosts that cannot follow a file
reference" section.

`plan-reviewer` is the standard role for this skill: validating architectural trade-offs before a
plan is approved. Do not invent a different name for this role or redefine it for another purpose.

## Artifact Conventions

The `.specify/` and `specs/<feature-dir>/` layout, `feature.json`, `state.json`, and the Content
Fingerprint Convention used for staleness detection all live in the shared, canonical document
`spec-kit/shared/artifact-conventions.md`. Read it before Phase 0 below and follow it exactly —
this skill does not redefine its own file layout or hashing scheme.

## Input Contract

### Resolving the Target Specification

1. If the user gave an explicit `spec.md` path or feature directory, use it.
2. Otherwise, read `.specify/feature.json` for the active feature directory.
3. If neither resolves to a readable `spec.md`, stop and ask:

   > Provide the feature directory or `spec.md` path to plan against. If you haven't generated a
   > specification yet, run `generate-spec` first.

4. Read `spec.md` completely, along with `checklists/requirements.md` for its `STATUS`.

### Readiness Gate

- If `STATUS` is `READY`, proceed.
- If `STATUS` is `DRAFT — NEEDS CLARIFICATION`, stop and ask the user to either resolve the
  blocking clarifications in `generate-spec` first, or explicitly confirm planning against a
  draft. If the user confirms, proceed but record `PLANNED_AGAINST_DRAFT: true` in `plan.md`'s
  header and repeat the warning in the Completion Report — never silently treat a draft as ready.

### New vs. Update Mode

- **New mode**: no `plan.md` exists yet in the feature directory. Proceed through all phases below
  in order.
- **Update mode**: `plan.md` already exists. Read it completely, along with its
  `checklists/plan-quality.md` and `state.json`. Run the Fase 0 Staleness Check below before doing
  anything else — an update is a delta against what changed in `spec.md`, not a reason to
  regenerate unrelated sections. Follow § Updating an Existing Plan.

## Fase 0 — Staleness Check (every invocation, new or update)

1. `generate-spec` initializes `state.json`'s `artifacts.spec`/`source_documents` entries itself
   (see its own "Initialize or Refresh `state.json`" step), so it should already exist. If it
   genuinely does not — an older `spec.md` predating that step, or it was manually removed — skip
   straight to Phase 1 and create it (with a fresh `artifacts.spec` entry too) at the end of
   Phase 5, alongside this skill's own `artifacts.plan` entry.
2. Otherwise, read `spec-kit/sync-artifacts/SKILL.md` and follow its Phase 1/2 mechanical
   detection procedure against `artifacts.plan.based_on_spec_hash` vs. `spec.md`'s current content
   hash — do not re-derive the hashing/comparison mechanism independently; that definition lives
   there so it stays identical across every skill that needs it.
3. If `sync-artifacts` reports a match, `spec.md` has not changed since the last plan — proceed
   normally.
4. If it reports drift, this skill (not `sync-artifacts`) does the classification `sync-artifacts`
   deliberately leaves to the consuming skill: identify which `R-FR##`/`R-AC##`/`E-##`/`R-QR##`
   IDs actually changed (using `sync-artifacts`'s best-effort localization, or a direct diff if
   its localization couldn't resolve one), and classify each as functionally material (scope,
   acceptance criteria, entities, safeguards) or non-material (wording, formatting). Only material
   changes make the plan stale with impact.
   - Report the affected IDs and which `plan.md` sections they touch before proceeding — do not
     silently regenerate the whole plan, and do not silently ignore the drift either.
5. This Fase 0 does not depend on `sync-artifacts` being invoked as a separate conversational
   step — apply its documented procedure directly, inline, as part of this phase.

## Workflow

### Phase 1 — Inspect Real Context → Technical Context

Reuse `verify-before-implement` §4 (Pre-Implementation verification sequence): read the actual
manifest/lockfile, existing architecture, and any active architecture skills in this project
(`frontend-architecture`, `backend-api-standards`, or equivalent) before writing anything.

Produce the `Technical Context` block of `plan.md` (see
`spec-kit/shared/templates/plan-template.md`): Language/Version, Primary Dependencies, Storage,
Testing, Target Platform, Project Type, Performance Goals, Constraints, Scale/Scope. Every field is
either a verified fact or `NEEDS CLARIFICATION` — never a plausible guess.

Performance Goals and Constraints come from `spec.md`'s `R-QR##` (Quality Requirements) and
Safeguards when present; do not invent a numeric target `spec.md` never stated.

#### Clarification Policy (Technical Context)

Ask only questions whose answers materially change the technical approach, storage model,
platform, or a measurable constraint.

- Ask at most **3 blocking questions per round**, same format as `generate-spec`'s Clarification
  Policy (context, why it matters, 2–3 options with implications, a custom option).
- Do not ask about something derivable from the manifest/lockfile or from `spec.md` directly.
- If the user explicitly requests a draft plan without answering, produce
  `plan.md` marked `DRAFT — NEEDS CLARIFICATION` and do not report it as ready.

### Gate — Constitution Check 1 (before Phase 2)

1. Read `.specify/memory/constitution.md` if it exists.
2. For each applicable principle, evaluate the proposed technical direction (informed by Technical
   Context, not yet by detailed research) as `PASS` or `FAIL`.
3. Report as a table, per `plan-template.md`'s "Constitution Check — Gate 1" section — never as a
   prose summary like "reviewed, looks fine."
4. If `constitution.md` does not exist, report `N/A — sin constitución` for this gate rather than
   omitting it, and note whether the scope of this plan is broad enough that
   `establish-constitution` should run first.
5. A `FAIL` here is not fatal by itself — it must be tracked into Complexity Tracking (Phase 5) or
   resolved by changing the proposed direction before Phase 2 starts.

### Phase 2 — Research (`research.md`)

Directed technical research: library/version decisions, verified against what is actually
installed — never against memory of "how this library usually works." Resolve every
`NEEDS CLARIFICATION` left from Technical Context here, or escalate per the Clarification Policy
above.

For a dependency not currently installed, state that explicitly ("not installed — proposed
addition") rather than treating a proposed library the same as a verified one.

### Phase 3 — Data Model (`data-model.md`)

Only entities already present in `spec.md` §E — Entities. Do not invent new domain concepts here;
if the design seems to need one `spec.md` doesn't have, that is a gap to report back — via a
clarification round, or by flagging it for a `generate-spec` update — not something to add
silently at the planning layer.

### Phase 4 — Contracts (`contracts/`)

If the spec implies an API, follow `backend-api-standards` when the project is backend. If
frontend with `frontend-architecture` active, respect its layers. State the verification source
for each endpoint/schema (existing contract file, or "new — proposed").

### Phase 4.5 — Project Structure

Document per `plan-template.md`'s Project Structure section:

- **Documentation (this feature)**: the fixed `specs/<feature-dir>/` tree (see
  `artifact-conventions.md`).
- **Source Code (repository root)**: in a project that already has structure, this is a
  **verified snapshot of the real layout** (via `verify-before-implement`), not a free choice
  between single-project/web-app/mobile+API templates. Those generic shapes only apply when the
  project is genuinely greenfield and has no structure to inspect yet — in that case, the choice
  itself is recorded as a decision in Key Decisions and Trade-offs, not left as an unresolved
  template option.
- Close with **Structure Decision**: one sentence referencing the real tree — never delivered with
  an unresolved `Option N` label.

### Phase 5 — `plan.md`: Strategy, Decisions, and Gates

Assemble `plan.md` from `spec-kit/shared/templates/plan-template.md`, filling every section with
the verified output of Phases 1–4.5, then complete the following in order:

#### Constitution Check — Gate 2 (re-check)

Re-evaluate the same principles now that `data-model.md`, `contracts/`, and Project Structure are
concrete — a specific design choice can introduce a violation the original direction didn't have.
Report as a `PASS`/`FAIL` table, same format as Gate 1.

#### Complexity Tracking

Fill **only** if a gate (1 or 2) has a `FAIL` that must be justified to proceed:

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------- |
| [principle ID] | [concrete, current need] | [why the compliant alternative doesn't work] |

A row without a concrete, verifiable need is not a valid justification — it is a signal the
approach must change, not that the table should be filled in anyway. Do not proceed past a `FAIL`
without either a valid row here or a revised, now-compliant direction.

#### Convention Enforcement (Structure)

For every new or modified component in `S-C0#` (from `spec.md`'s Structure section, refined here):

| Component (S-C0#) | Pattern Followed | Evidence / Constitution Reference | Deviation |
| ------------------ | ----------------- | ----------------------------------- | ---------- |
| [component] | [existing pattern name, or "new"] | [file example or constitution principle ID] | [none, or → A-D0#] |

A component must reference a concrete existing pattern (a file example already inspected, or a
confirmed constitution principle) — never a generic claim like "follows best practices." A
deviation from the dominant pattern or the constitution is recorded as an explicit decision in Key
Decisions and Trade-offs (or, if it's a constitution `FAIL`, in Complexity Tracking above) — never
as a silent omission.

If `.specify/memory/constitution.md` does not exist and the project has relevant prior code,
perform an equivalent targeted inspection (via `verify-before-implement`) scoped only to the
components this plan touches or extends — and state plainly that this was a targeted inspection,
not a full constitution, suggesting `establish-constitution` if the detected pattern should apply
project-wide.

#### Key Decisions and Trade-offs

Standard REASONS-style decision table: alternatives considered, rationale, consequences, evidence
(`S#`/`P#` from `spec.md`, or a freshly verified project fact).

#### Safe Deferral

Fill **only** if this plan proposes phases or maps to multiple user stories that will ship
incrementally. For every operation (`O-0#`) pushed to a later phase or story:

| Operation (O-0#) | Deferred To | Condition | Justification |
| ------------------ | ------------ | ---------- | --------------- |
| [operation] | [user story / phase] | Dormant / Flagged / Additive | [why this condition genuinely holds] |

- **Dormant**: the new code exists but nothing on an active, reachable path invokes it yet.
- **Flagged**: it sits behind a feature flag/toggle that defaults off.
- **Additive**: it adds fields/tables/endpoints without modifying or depending on existing
  behavior.

An operation with none of these three conditions is **not** deferred: it is completed in the
current phase, or the phases are reordered until it genuinely is safe. This is not a preference —
a plan that defers unsafe work is not `READY` regardless of what its checklist otherwise shows.
When `generate-tasks` later organizes work by user story (see its `SKILL.md`), each story's closing
checkpoint verifies this classification held in practice.

#### Compatibility and Evolution

Backward compatibility, rollout, or migration strategy — cite the Safe Deferral table above when
relevant.

### Phase 6 — Quickstart (`quickstart.md`)

Concrete, manual, step-by-step validation instructions for this feature once implemented — commands
to run, expected observable results. Not a copy of the acceptance criteria; a runnable recipe.

## Traceability Consistency Checks

Before validating the checklist:

- Every entry in `plan.md`'s Strategy, Data Model, Contracts, and Operations cites at least one
  `R-FR##`/`R-AC##`/`E-##`/`R-QR##` from `spec.md`.
- No component or operation in the plan is absent from `spec.md`'s scope — if the design genuinely
  needs something outside it, that's a gap to report, not to add silently.
- Terminology (entity names, component names) matches `spec.md` exactly; if the plan needs to
  introduce a new technical term (e.g. a library-specific concept), it's clearly distinguished from
  domain vocabulary.
- Every `Safe Deferral` entry references a real `O-0#` that also appears in Operations/Strategy.

## Validate and Iterate

Create `checklists/plan-quality.md`:

```markdown
# Plan Quality Checklist: [Feature Name]

**Purpose**: Validate technical soundness, constitution compliance, and traceability before task decomposition
**Plan**: [Relative link to plan.md]
**Status**: [READY / DRAFT — NEEDS CLARIFICATION]

## Technical Context

- [ ] Every Technical Context field is verified or explicitly `NEEDS CLARIFICATION`
- [ ] No field contains a plausible-sounding guess unsupported by a manifest/lockfile/spec citation

## Constitution

- [ ] Gate 1 and Gate 2 are both reported as PASS/FAIL tables (or `N/A — sin constitución`)
- [ ] Every Gate FAIL has a corresponding Complexity Tracking row with a concrete justification
- [ ] No gate was skipped or merged into a vague summary

## Design

- [ ] Data Model entities all trace to `spec.md` §E — no invented entities
- [ ] Contracts cite a verified source or are explicitly marked "new — proposed"
- [ ] Project Structure documents the real, verified tree (or a justified greenfield choice)
- [ ] Structure Decision references the actual tree, with no unresolved Option labels

## Convention Enforcement

- [ ] Every new/modified component cites a concrete existing pattern or constitution principle
- [ ] Every deviation is recorded as an explicit decision, not a silent omission

## Safe Deferral

- [ ] Every deferred operation has a valid Dormant/Flagged/Additive justification
- [ ] No operation is deferred without one of the three conditions holding

## Traceability

- [ ] Every plan entry cites its source requirement/acceptance criterion/entity
- [ ] No component or operation introduces scope absent from `spec.md`

## Governance

- [ ] The plan contains no TODOs, placeholders, or unresolved template labels
- [ ] `state.json` was created/updated with this plan's content hash and `based_on_spec_hash`

## Agent Portability

- [ ] If a `plan-reviewer` (or other agent) was generated, both Kiro and Claude definitions exist and validated per `spec-kit/shared/agent-portability.md`, or `AGENTS: none` is reported

## Notes

[Specific failures, evidence, and remaining decisions]
```

Validate item by item, fix non-blocking failures, re-run up to three iterations. If a blocking gap
remains (an unresolved `FAIL` with no valid Complexity Tracking row, or a `NEEDS CLARIFICATION`
the user hasn't answered), set `STATUS` to `DRAFT — NEEDS CLARIFICATION` and do not report the plan
as ready. Set `READY` only when every checklist item passes.

## Updating an Existing Plan

When `spec.md` changed since the last `plan.md` (Fase 0 detected material drift):

1. Identify affected requirement/entity IDs from the diff.
2. Propagate only through the `plan.md` sections those IDs touch — Technical Context if a
   `R-QR##` constraint changed, Data Model if an `E-##` changed, Operations/Strategy if an
   `R-FR##`/`R-AC##` changed.
3. Re-run both Constitution Check gates only if the changed sections could plausibly affect them
   (a new dependency, a new component) — otherwise note that the gates are unaffected and why.
4. Preserve stable IDs (`A-D0#`, `S-C0#`, `O-0#`) where semantics are unchanged; add new ones for
   new semantics.
5. Update `state.json`'s `artifacts.plan.content_hash` and `based_on_spec_hash` only after the
   targeted regeneration validates.
6. Re-run the full `plan-quality.md` checklist regardless of how small the change was.
7. Summarize exactly which `plan.md` sections changed and why.

If `spec.md` drifted in a way that invalidates a decision already consumed by an existing
`tasks.md` (i.e. `tasks.md` exists and cites the changed `O-0#`), state this plainly in the
Completion Report — this plan does not update `tasks.md` itself; that is `generate-tasks`'s job,
triggered separately.

## Pre-Execution Extension Hooks

Before planning work, check for `.specify/extensions.yml` per
`spec-kit/shared/artifact-conventions.md`'s schema, reading the `hooks.before_plan` key. Follow
the same enablement/condition/mandatory-vs-optional rules `generate-spec` uses for its own hooks —
do not reinterpret them differently for this skill.

## Mandatory Post-Execution Hooks

After planning work, process `hooks.after_plan` the same way, using the same emit-then-execute
format `generate-spec` uses for its own post-hooks.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `PLAN_FILE`, `RESEARCH_FILE`, `DATA_MODEL_FILE`, `CONTRACTS_DIR`, `QUICKSTART_FILE`: paths
  written.
- `CHECKLIST_FILE`: `checklists/plan-quality.md` path.
- `STATUS`: `READY` or `DRAFT — NEEDS CLARIFICATION`.
- `PLANNED_AGAINST_DRAFT`: `true` if `spec.md` was not `READY` when this plan was generated.
- `CONSTITUTION`: `Gate 1: PASS/FAIL/N/A`, `Gate 2: PASS/FAIL/N/A`, count of Complexity Tracking
  rows if any.
- `SAFE_DEFERRAL`: count of deferred operations and their conditions, or `N/A — single phase`.
- `VALIDATION`: passed/total checklist items and unresolved failures.
- `TRACEABILITY`: requirement/entity/operation counts covered.
- `CHANGES`: for updates, the `plan.md` sections changed.
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: clarification if blocked; otherwise `generate-tasks` to decompose this plan by user
  story.

## Done When

- [ ] `spec.md` was resolved, read, and confirmed `READY` (or draft planning was explicitly
      confirmed by the user).
- [ ] Fase 0 Staleness Check ran and any material drift was reported before proceeding.
- [ ] Technical Context is fully verified or explicitly marked `NEEDS CLARIFICATION`.
- [ ] Both Constitution Check gates ran and are reported as tables, including `N/A` when
      applicable.
- [ ] Any gate `FAIL` has a valid Complexity Tracking justification.
- [ ] Data Model, Contracts, and Project Structure reflect verified project reality, not
      invented facts or unresolved template options.
- [ ] Convention Enforcement covers every new/modified component with a concrete pattern
      reference.
- [ ] Safe Deferral covers every operation pushed to a future phase, with a valid condition.
- [ ] `plan.md`, its Phase 0/1 companions, and `checklists/plan-quality.md` were written.
- [ ] `state.json` was created or updated with accurate content hashes.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
- [ ] No product code was generated.
