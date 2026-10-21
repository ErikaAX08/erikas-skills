# Updating an Existing Plan

The update procedure of `spec-kit-generate-plan` (`SKILL.md` § New vs. Update Mode). `spec-kit-amend-artifacts` runs this same procedure for a plan-layer amendment.

When `spec.md` changed since the last `plan.md` (Fase 0 detected material drift):

1. Identify affected requirement/entity IDs from the diff.
2. Propagate only through the `plan.md` sections those IDs touch — Technical Context if a
   `R-QR##` constraint changed, Data Model if an `E-##` changed, Operations/Strategy if an
   `R-FR##`/`R-AC##` changed.
3. Re-run both Constitution Check gates only if the changed sections could plausibly affect them
   (a new dependency, a new component) — otherwise note that the gates are unaffected and why.
4. Preserve stable IDs (`PL-D##`, `PL-O##`, `RS-##`, or a legacy plan's `A-D0#`/`O-0#`) where
   semantics are unchanged; add new `PL-` IDs for new semantics.
5. Update `state.json`'s `artifacts.plan.content_hash` and `based_on_spec_hash` only after the
   targeted regeneration validates. Write it with `node spec-kit-shared/scripts/fingerprint.mjs --record <feature-dir> plan`, which applies `artifact-conventions.md` § Schema Versions and Migrations — it refuses a state newer than the contract (exit 3: stop) and migrates a version-1 file, reporting `SCHEMA_MIGRATED: 1→2`.
6. Re-run the full `plan-quality.md` checklist regardless of how small the change was — except
   when `spec-kit-amend-artifacts` invokes this procedure for a bounded amendment: then re-validate
   the checklist items that touch the changed IDs plus the Evidence, Traceability, and Governance
   sections, and record `Scoped validation (AM-##)` in the checklist Notes.
7. Summarize exactly which `plan.md` sections changed and why.

A plan can also change **without** a spec change — a technical decision, a refuted runtime
premise, a different file or wiring point — per the lowest-affected-layer rule
(`artifact-conventions.md` § Layer Ownership). That is a plan update in its own right: Fase 0
finds no spec drift, and the spec stays untouched.

If `spec.md` drifted in a way that invalidates a decision already consumed by an existing
`tasks.md` (i.e. `tasks.md` exists and cites the changed `PL-O##`), state this plainly in the
Completion Report — this plan does not update `tasks.md` itself; that is `spec-kit-generate-tasks`'s job,
triggered separately.
