# Updating an Existing Specification

The update procedure of `spec-kit-generate-spec` (`SKILL.md` Phase 5, update mode). `spec-kit-amend-artifacts` runs this same procedure for a spec-layer amendment.

When the user supplies an existing REASONS specification:

1. Read the entire current artifact and its checklist.
2. Reuse its parent feature directory as `SPECIFY_FEATURE_DIRECTORY`, keep that file as `SPEC_FILE`, and keep `.speckit/feature.json` pointed to the same directory; do not create a replacement feature directory.
3. Treat the requested change as a delta, not permission to regenerate unrelated sections. First apply the lowest-affected-layer rule (`spec-kit-shared/artifact-conventions.md` § Layer Ownership): if the change touches no requirement, entity, invariant, safeguard, or scope, it is not a spec change — say so and route it to `spec-kit-generate-plan` (or `spec-kit-amend-artifacts` for a decided change) instead of producing a spec version with nothing to say.
4. Identify affected requirement IDs and propagate the change through Entities, Approach, Structure, Operations, Norms, Safeguards, and traceability.
5. Preserve stable IDs where semantics remain the same; add new IDs for new semantics; never silently reuse an ID for a different requirement.
6. Update the persisted Evidence Catalog for new, removed, or superseded evidence, recomputing the source fingerprint for every row whose underlying source was re-read as part of this update — a stale fingerprint left over from a prior version defeats the purpose of recording one. If `.speckit/specs/<feature-dir>/state.json` exists (see `spec-kit-shared/artifact-conventions.md`), refresh its `source_documents.<ID>.fingerprint`/`read_at` entries to match at the same time — the Evidence Catalog table inside `spec.md` and `state.json`'s copy must never be left pointing at two different fingerprints for the same source, or the next `spec-kit-sync-artifacts` check will report a already-resolved drift as if it were still open.
7. Record superseded decisions and migration/compatibility consequences where relevant.
8. Re-run the complete checklist — except when `spec-kit-amend-artifacts` invokes this procedure for a bounded amendment: then validate the scope `spec-kit-shared/artifact-conventions.md` § Scoped Validation defines for `spec.md`.
9. Summarize exactly which REASONS sections changed and why.

Follow the SPDD direction rule:

- **Behavior or requirement change**: requirements → specification update → implementation.
- **Behavior-preserving refactor already made in code**: code inspection → specification synchronization.
