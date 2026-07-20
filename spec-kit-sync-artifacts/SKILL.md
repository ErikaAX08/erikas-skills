---
name: spec-kit-sync-artifacts
description: Detect drift between spec.md/plan.md/tasks.md and their recorded state.json fingerprints — mechanical hash comparison plus best-effort structural localization by stable ID — and recommend which upstream spec-kit skill to re-invoke, one hop at a time. Never edits spec.md, plan.md, or tasks.md itself; that stays each generating skill's own "Updating an Existing X" procedure. Invocable standalone after editing a source document, or as the Fase 0 staleness check inside spec-kit-generate-plan, spec-kit-generate-tasks, and spec-kit-execute-tasks. When a drift-watcher agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Sync Artifacts — Drift Detection Skill

## Purpose

Answer, with evidence, the question this whole kit exists to answer for the user: **did something
this specification/plan/tasks depended on change since it was generated, and if so, what needs to
be regenerated?** This is the mechanism behind "if the file a spec was generated from changes
importantly, the plan and tasks should be able to update accordingly."

This skill is deliberately narrow: it **detects and reports**, using the Content Fingerprint
Convention (`spec-kit-shared/artifact-conventions.md`). It does **not** regenerate anything itself
— that stays `spec-kit-generate-spec`'s, `spec-kit-generate-plan`'s, or `spec-kit-generate-tasks`'s own "Updating an Existing
X" procedure, each already written to propagate a change through only the sections it actually
touches. `spec-kit-sync-artifacts` is the shared, canonical definition of the mechanical comparison those
skills' own Fase 0 steps already rely on — they reference this file instead of each re-describing
hashing/comparison logic independently.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. The most common inputs are: a
feature directory to check, or an explicit note that a specific source document was just edited.

## Core Principle

**Detection is mechanical. Classification is semantic and stays with whoever regenerates.
Propagation is one hop at a time, and never silent.**

- A hash mismatch means "something changed" — not "this is a material change requiring a
  cascade." The consuming skill (`spec-kit-generate-spec`, `spec-kit-generate-plan`, `spec-kit-generate-tasks`) makes that
  judgment when it re-invokes its own "Updating an Existing X" procedure.
- After a source changes, recommend regenerating the *directly* dependent artifact first (the
  spec that cites it). Do not presume what the plan or tasks will need until the spec's actual,
  regenerated content is known — a cascade is a sequence of confirmed hops, not one leap.
- A task already marked `[x]` is never silently touched by anything this skill triggers — it is
  flagged for review instead.

## Non-Negotiable Rules

1. **Detection is purely mechanical.** Compare a current content hash/fingerprint against the
   value recorded in `state.json`. Report match or mismatch — do not judge whether a mismatch is
   "important" beyond the best-effort structural localization in Phase 3.
2. **Read-only on `spec.md`/`plan.md`/`tasks.md`.** This skill never edits any of them. Its only
   possible write is refreshing `state.json`'s own bookkeeping, and only for entries a generating
   skill hasn't already updated itself (§ Writing state.json).
3. **Use the Content Fingerprint Convention exactly as defined** in
   `spec-kit-shared/artifact-conventions.md` — never invent a different hashing rule or apply it
   inconsistently between a first check and a later one.
4. **One hop at a time by default.** Recommend re-invoking the *nearest* downstream skill first.
   Only recommend a full multi-hop cascade upfront if the user explicitly asked for it (e.g. "sync
   everything").
5. **Recommend, never force.** This skill does not invoke `spec-kit-generate-spec`/`spec-kit-generate-plan`/
   `spec-kit-generate-tasks` on the user's behalf without explicit confirmation — it reports and asks, the
   same way `spec-kit-generate-spec`'s Extension Hooks distinguish mandatory from optional actions.
6. **Report clean results too.** "Nothing changed" is a valid, useful, explicitly stated outcome —
   never silently produce no output when there's nothing to report.
7. **Every finding cites the exact artifact/source ID and both fingerprint values.** No vague
   "something seems out of date."
8. **If `state.json` doesn't exist for the target feature, say so and stop** — there is nothing to
   compare against; this is not the same as "no drift," and must not be reported as such.
9. **Structural localization (§ Phase 3) is best-effort, not a guarantee.** If a change can't be
   reliably localized to specific stable IDs (e.g. a source document spec-kit-sync-artifacts can't parse
   into a section structure), say so plainly rather than guessing which IDs are affected.
10. **Never silently touch a completed task.** If drift potentially affects a story whose
    `[CIERRE]` task (or any task) is already marked `[x]`, flag it explicitly as "closed work
    potentially affected by this change — needs review," and let the human or `spec-kit-generate-tasks`'s
    own update procedure decide, rather than un-checking or editing it.
11. **Generate portable agent pairs.** If this workflow creates a `drift-watcher` (or other support
    agent), it must generate and validate both a Kiro CLI and a Claude Code definition per the
    shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md`. Before
generating, validating, or reporting on the `drift-watcher` role — or any other agent this skill
materializes — read that file completely and follow it exactly. If the active host cannot resolve
the reference, follow its fallback section.

`drift-watcher` is the standard role for this skill: running a standalone drift check in
isolation, read-only, without the rest of a `spec-kit-generate-plan`/`spec-kit-generate-tasks` invocation's context.
Do not invent a different name or redefine it for another purpose.

## Artifact Conventions

The `.speckit/` layout (including `.speckit/specs/<feature-dir>/`), `state.json` schema, and Content Fingerprint
Convention live in `spec-kit-shared/artifact-conventions.md`. Read it before Phase 1 below — this
skill's entire mechanism is built directly on that document's schema.

## Input Contract

### Resolving the Target Feature

1. If the user gave an explicit feature directory, use it.
2. Otherwise, read `.speckit/feature.json` for the active feature directory.
3. If neither resolves, stop and ask:

   > Provide the feature directory to check for drift. If you just edited a source document, name
   > it and the feature it feeds.

### Missing State

If `.speckit/specs/<feature-dir>/state.json` does not exist, stop and report:

> No recorded state for this feature — nothing to compare against yet. This is expected before a
> first `plan.md`/`tasks.md` exists; it is not the same as confirming there's no drift.

Do not proceed past this point when state is missing (Rule 8).

## Workflow

### Phase 1 — Load State

Read `state.json` completely: `artifacts.spec`/`artifacts.plan`/`artifacts.tasks` (whichever
exist) and `source_documents`.

### Phase 2 — Recompute Fingerprints and Compare

For every entry in `state.json`, recompute its current fingerprint using the Content Fingerprint
Convention and compare:

- **Each `source_documents.<ID>`**: recompute per its recorded type (versioned file → current
  commit SHA touching that path; non-versioned file/pasted text/URL/attachment → current content
  hash). Compare to the recorded `fingerprint`. If the source no longer exists or can't be
  re-read, report that explicitly — a vanished source is itself a finding, not a silent skip.
- **`artifacts.spec.content_hash`**: recompute `spec.md`'s current hash. A mismatch here (with no
  corresponding update in `plan.md`'s `based_on_spec_hash`) means `spec.md` was hand-edited or
  regenerated since the plan was built.
- **`artifacts.plan.based_on_spec_hash`** vs. `artifacts.spec.content_hash` (current): the direct
  spec→plan staleness check `spec-kit-generate-plan`'s own Fase 0 relies on.
- **`artifacts.tasks.based_on_plan_hash`** vs. `artifacts.plan.content_hash` (current): the direct
  plan→tasks staleness check `spec-kit-generate-tasks`'s own Fase 0 relies on.

Every comparison is reported, matched or not — a full "everything matches" result is a valid
report (Rule 6).

### Phase 3 — Structural Localization (best-effort)

For every mismatch found in Phase 2, attempt to localize which stable IDs are involved:

- **Source drift**: which `[S#]`/`[P#]` row in `spec.md`'s Evidence Catalog cites this source, and
  which `R-G##`/`R-FR##`/`R-AC##`/etc. cite that same ID in turn (a simple citation-graph lookup,
  not a semantic reading of what changed in the source's prose).
- **Spec→plan drift**: if the previous `spec.md` version is available (git history, or the prior
  content implied by `plan.md`'s own traceability citations), identify which `R-FR##`/`R-AC##`/
  `E-##`/`R-QR##` IDs' surrounding text differs; otherwise, report "spec.md changed, could not
  localize which sections — recommend `spec-kit-generate-plan` review the full spec diff."
- **Plan→tasks drift**: same approach against `O-0#`/`A-D0#`/Safe Deferral entries.

State plainly when localization isn't possible (Rule 9) rather than asserting an ID list you
aren't confident in.

### Phase 4 — Drift Report and Cascade Recommendation

For each mismatch, in dependency order (source → spec → plan → tasks):

1. State what changed (fingerprints, and localized IDs when available).
2. Recommend the **nearest** downstream skill to re-invoke (Rule 4) — e.g. a source mismatch
   recommends `spec-kit-generate-spec` (update mode) first, not `spec-kit-generate-plan` directly, even if `plan.md`
   also looks stale — that staleness is a *consequence* to re-check after the spec is actually
   updated, not a parallel action to take now.
2. If any task in an affected story is already `[x]`, flag it explicitly per Rule 10.
3. Ask for confirmation before recommending more than one hop, unless the user already asked for
   the full cascade.

## Writing `state.json`

Each generating skill (`spec-kit-generate-spec`, `spec-kit-generate-plan`, `spec-kit-generate-tasks`) already writes its own
artifact's hash entries in `state.json` when it finishes regenerating. `spec-kit-sync-artifacts` does not
duplicate that write. The one exception: if the user asks `spec-kit-sync-artifacts` to simply **acknowledge**
a source change without regenerating anything yet (e.g. "yes, the PRD changed, but don't update
the spec right now") — in that case, and only with explicit confirmation, it may refresh
`source_documents.<ID>.fingerprint` and `read_at` to the current value, so the next check doesn't
re-report an already-acknowledged change as new. State plainly when this happens, since it means
the spec is now knowingly stale against its own source until someone regenerates it.

## Drift Report

```markdown
# Drift Report: [Feature Name]

**Checked**: [timestamp]
**state.json**: found / not found (stop here if not found)

## Source Documents

| ID | Path | Recorded Fingerprint | Current Fingerprint | Status |
| --- | --- | --- | --- | --- |
| S1 | ... | sha256:... | sha256:... | MATCH / DRIFT |

## Artifact Chain

| Artifact | Recorded Hash | Current Hash | Based-On Reference | Status |
| --- | --- | --- | --- | --- |
| spec.md | ... | ... | — | MATCH / DRIFT |
| plan.md | ... | ... | based_on_spec_hash: ... vs current spec: ... | MATCH / DRIFT |
| tasks.md | ... | ... | based_on_plan_hash: ... vs current plan: ... | MATCH / DRIFT |

## Findings

### F1 — [Source drift / Spec→Plan drift / Plan→Tasks drift]

**Evidence**: [fingerprints compared]
**Localized to**: [IDs, or "could not localize — recommend full diff review"]
**Closed work potentially affected**: [task IDs already [x], or "none"]
**Recommended next step**: [exact skill + mode, one hop]

## Verdict

**DRIFT_DETECTED**: YES / NO
**RECOMMENDED_NEXT_HOP**: [skill name, or "none — everything matches"]
```

## How Other `spec-kit` Skills Use This

`spec-kit-generate-plan`'s and `spec-kit-generate-tasks`'s own Fase 0 sections read this file's Phase 1/2 procedure
and apply it against their own specific `based_on_*` field — they do not re-describe the hashing
mechanism independently. If either skill's Fase 0 finds drift, it follows its own
"Updating an Existing Plan"/"Updating an Existing Task List" section to propagate the change — this
skill's job ends at the report and recommendation.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `STATE_FOUND`: `true`/`false`.
- `SOURCES_CHECKED` / `SOURCES_DRIFTED`: counts.
- `ARTIFACT_CHAIN_STATUS`: spec/plan/tasks each MATCH/DRIFT/absent.
- `CLOSED_WORK_FLAGGED`: task IDs already `[x]` potentially affected, or "none".
- `DRIFT_DETECTED`: `YES`/`NO`.
- `RECOMMENDED_NEXT_HOP`: the single nearest skill to re-invoke, or "none".
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.

## Done When

- [ ] The target feature's `state.json` was located, or its absence was reported and the skill
      stopped there.
- [ ] Every `source_documents` entry and every artifact hash was recomputed and compared.
- [ ] Every mismatch attempted structural localization, or explicitly reported that localization
      wasn't possible.
- [ ] Every finding cites concrete fingerprints and IDs.
- [ ] Any closed (`[x]`) task potentially affected by a finding was explicitly flagged.
- [ ] The recommendation followed the one-hop-at-a-time rule unless the user asked for the full
      cascade.
- [ ] No content was written to `spec.md`, `plan.md`, or `tasks.md`.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
