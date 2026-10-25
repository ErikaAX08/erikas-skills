# Updating an Existing Task List

The update procedure of `spec-kit-generate-tasks` (`SKILL.md` § New vs. Update Mode). `spec-kit-amend-artifacts` runs this same procedure for a tasks-layer amendment.

When `plan.md` changed materially since the last `tasks.md` (Fase 0 detected drift):

1. Identify affected `PL-O##`/story IDs from the diff.
2. Propagate only through the story phases those IDs touch — add/modify/remove tasks within the
   affected story phase(s); do not regenerate unrelated stories.
3. **Never silently modify a task already marked `[x]`.** If a completed task is affected by the
   change, flag it explicitly as "closed task affected by plan change — needs review" rather than
   editing or unmarking it automatically. This is the same non-negotiable `spec-kit-sync-artifacts` carries
   in the design doc: work already done on an assumption that just changed is a risk to surface,
   not silently paper over. Once the rework is decided, apply the Task Lifecycle (`SKILL.md` Rule 17): add an
   `[ENMIENDA T0XX]` task under the story's `#### Enmiendas`, append `Superada por:` to `T0XX` only
   if the new task replaces it, and create a new `[CIERRE]` only if the story's `R-AC` set
   changed — otherwise the amendment's `Validación` re-walks the active one.
4. Preserve task IDs where semantics are unchanged; append new IDs (continuing the sequence) for
   new tasks — never renumber existing tasks.
5. Re-verify the affected story's `[CIERRE]` task still covers the right `R-AC##` set.
6. Update `state.json`'s `artifacts.tasks.content_hash` and `based_on_plan_hash` only after the
   targeted regeneration validates. Write it with `node <skills-root>/spec-kit-shared/scripts/fingerprint.mjs --record <feature-dir> tasks`, which applies `artifact-conventions.md` § Schema Versions and Migrations — it refuses a state newer than the contract (exit 3: stop) and migrates a version-1 file, reporting `SCHEMA_MIGRATED: 1→2`.
7. Re-run the full `tasks-quality.md` checklist regardless of how small the change was — except
   when `spec-kit-amend-artifacts` invokes this procedure for a bounded amendment: then validate the
   scope `spec-kit-shared/artifact-conventions.md` § Scoped Validation defines for `tasks.md`.
8. Summarize exactly which task phases changed and why.
