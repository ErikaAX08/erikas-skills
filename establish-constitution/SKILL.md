---
name: establish-constitution
description: Create or update .specify/memory/constitution.md — a project's non-negotiable architecture, security, and quality principles — from explicit documentation and/or by mining consistent patterns across existing code. Every mined principle carries evidence, coverage, and confidence, and none becomes binding without explicit user confirmation. Optional, and re-invocable to check whether current code has drifted from an existing constitution. When a pattern-miner agent is requested, generates compatible definitions for both Kiro CLI and Claude Code.
license: MIT
---

# Establish Constitution — Project Convention Skill

## Purpose

Make a project's real conventions explicit — the ones already written down, and the ones that
exist only as a consistent pattern across the code nobody documented — so every other `spec-kit`
skill can follow them "al pie de la letra" instead of guessing or reinventing them per feature.
This is the one skill in the kit that is genuinely optional: every other skill already handles a
missing `constitution.md` as `N/A`, not an error. This skill is what a project runs when it wants
that `N/A` to become real, cited principles instead.

This skill produces a **governance document**. It does not implement or refactor code to match
the constitution — that enforcement happens downstream, in `generate-plan`'s Convention
Enforcement and `execute-tasks`'s adherence to active architecture skills.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current
conversation, even when `$ARGUMENTS` appears literally or is empty. Common inputs: "establish a
constitution for this project," a specific area to focus on ("just the data access layer"), or a
request to re-check the existing constitution against current code.

## Core Principle

**Explicit conventions are cited, not authored. Inferred conventions are mined with evidence, and
never binding until the user confirms them.**

- A principle sourced from a README/ADR/architecture skill is quoted and cited — this skill does
  not paraphrase it into something subtly different.
- A principle mined from code is a *claim about the code as it exists today*, not a value
  judgment about whether that pattern is good. Low coverage or real inconsistency means "report a
  mixed pattern," not "declare a winner."
- Nothing mined is written into `constitution.md` as binding without the user explicitly
  confirming it — the code being consistent today doesn't make a pattern intentional, and a
  project mid-migration can look "consistent" in exactly the wrong direction.

## Non-Negotiable Rules

1. **Do not invent principles.** Every principle traces to an explicit document citation or a
   mined code pattern with concrete evidence (file examples) — never to "how projects like this
   usually work."
2. **Explicit and Inferred are always labeled separately**, never blended into one undifferentiated
   list — a reader must be able to tell which principles are sourced from documentation and which
   were mined from code.
3. **A mined principle requires real coverage and confidence**, computed from actually sampling
   every relevant instance (or a stated, representative subset for a very large codebase) — not
   from the first two files that happened to agree.
4. **Low coverage or real inconsistency blocks promotion to a binding principle.** Report it as a
   "mixed pattern detected" finding instead, and let the user decide the standard — do not average,
   round up, or otherwise force a verdict the evidence doesn't support.
5. **No mined principle is written into `constitution.md` as binding without explicit user
   confirmation.** Present every candidate for confirm/reject first; an unconfirmed candidate does
   not get saved as a "draft binding" principle — it's simply not in the file yet.
6. **If neither explicit documentation nor a consistent pattern exists for an area, that section
   stays empty.** Never fill it with generic "best practice" from memory to make the document look
   complete.
7. **This skill does not implement or refactor code.** It documents; `generate-plan` and
   `execute-tasks` are what actually enforce a constitution during real feature work.
8. **Reuse `verify-before-implement`** to inspect the project before citing anything — explicit or
   inferred — as "existing."
9. **`constitution.md` is versioned with a changelog.** Every update states what changed and why;
   nothing is silently overwritten.
10. **This skill is optional and re-invocable, not "run once."** It can be invoked again
    specifically to check whether current code has drifted from an already-established
    constitution — a mismatch is reported, not silently resolved in either direction.
11. **Sampling must be representative.** Do not declare a pattern "dominant" from one or two
    examples — state how many instances of the category exist and how many were actually sampled.
12. **A single documented, legitimate exception does not make a pattern "mixed."** If 9 of 10
    instances agree and the 10th is an explained special case, that is still high confidence — do
    not manufacture false inconsistency out of one reasonable outlier, any more than Rule 4 allows
    forcing a verdict out of real inconsistency.
13. **Generate portable agent pairs.** If this workflow creates a `pattern-miner` (or other
    support agent), it must generate and validate both a Kiro CLI and a Claude Code definition per
    the shared portability contract.

## Cross-Platform Agent Compatibility

The complete portability contract lives in `spec-kit-shared/agent-portability.md`. Before
generating, validating, or reporting on the `pattern-miner` role — or any other agent this skill
materializes — read that file completely and follow it exactly. If the active host cannot resolve
the reference, follow its fallback section.

`pattern-miner` is the standard role for this skill: sampling every instance of one component
category to determine its dominant pattern, in parallel with mining other categories. Do not
invent a different name or redefine it for another purpose.

## Artifact Conventions

`.specify/memory/constitution.md`'s location and the `extensions.yml` hook keys
(`before_constitution`/`after_constitution`) live in `spec-kit-shared/artifact-conventions.md`.
Read it before Phase 1 below.

## Input Contract

### New vs. Update vs. Drift-Check Mode

1. **New mode**: `.specify/memory/constitution.md` does not exist. Proceed through Phases 1–6.
2. **Update mode**: it exists and the user wants to add/revise principles (e.g. a new area of the
   codebase, or a principle that's changed). Read the existing file and its changelog first;
   treat the request as a delta, per § Updating an Existing Constitution.
3. **Drift-check mode**: the user explicitly wants to check current code against the existing
   constitution, not add to it. Skip straight to § Drift-Check Mode.

If the user's intent is ambiguous between these, ask which one before proceeding — they have very
different scopes.

## Workflow (New and Update Modes)

### Phase 1 — Load Explicit Sources

Read, in order: README(s), ADRs, style guides, and any project-specific architecture skill already
active in this project (`frontend-architecture`, `backend-api-standards`, or an equivalent). Cite
each as an `Explicit` source with its path — quote the relevant statement, do not paraphrase it
into something subtly different. If `constitution.md` already exists (update mode), read it and
its changelog completely first.

### Phase 2 — Determine Mining Scope

Do not mine the entire codebase blindly. Scope to what's relevant:

- If the user named an area ("just the data access layer"), mine only that.
- Otherwise, identify the component categories with more than one existing instance (repositories,
  controllers/routes, service classes, UI components at the same level, test files) — these are
  the categories where a "dominant pattern" claim is even possible. A category with only one
  instance has nothing to mine a pattern from; note it as "insufficient instances to mine," not as
  a failure.

### Phase 3 — Mine Patterns Per Category

For each category in scope, via `verify-before-implement`'s inspection discipline:

1. Enumerate every instance (or, for a very large codebase, a stated representative subset — name
   the sampling method, e.g. "every instance under `src/services/`, 14 files").
2. Identify the dominant structural pattern: folder/file structure, layering, error-handling
   convention, naming convention, dependency-injection style, testing convention — whichever are
   observable and relevant to the category.
3. Compute **coverage** (how many instances match the dominant pattern out of how many sampled)
   and **confidence**:
   - **High**: coverage is near-total, and any exception is a documented, explainable special case
     (Rule 12).
   - **Low**: real, unexplained inconsistency exists across a meaningful fraction of instances
     (Rule 4) — report as a mixed pattern, do not promote.
4. This category-by-category mining is naturally independent per category — when there are several
   categories to mine, delegate each to a separate `pattern-miner` subagent in parallel, each
   scoped only to its own category's files (not the whole codebase or the parent conversation).

### Phase 4 — Draft Candidates

- **Explicit** sources become cited principles directly — no coverage/confidence computation
  needed; they're already authoritative for what they state.
- **High-confidence mined patterns** become draft `Inferred` principle candidates, each with its
  evidence (concrete file examples) and coverage stat.
- **Low-confidence/mixed findings** become open questions for the user, not draft principles —
  presented as "category X shows pattern A in N files and pattern B in M files; which should be
  the standard going forward?"

### Phase 5 — User Confirmation (mandatory gate)

Present every `Inferred` candidate and every mixed-pattern question to the user. Nothing `Inferred`
is written into `constitution.md` until explicitly confirmed or resolved here (Rule 5). A
candidate the user rejects, or a mixed-pattern question left unanswered, is simply not written —
it does not get saved as a pending/draft entry inside the file.

### Phase 6 — Write `constitution.md`

Structure principles by area (e.g. Architecture, Data Access, API/Contracts, Error Handling,
Testing, Security) — only sections with real content, per Rule 6. Each principle is tagged
`Explicit` or `Inferred`, with its source or evidence:

```markdown
# Project Constitution

**Version**: [N] | **Last updated**: [date]

## Changelog

- **vN** ([date]): [what changed and why]

## [Area, e.g. Data Access]

- **C-01** (`Explicit`, source: `docs/architecture.md`): [quoted/cited principle].
- **C-02** (`Inferred`, coverage: 12/13 services, confidence: high — evidence:
  `src/services/orderService.js`, `src/services/userService.js`, ...): [principle statement].
```

## Updating an Existing Constitution

1. Read the entire current file and changelog.
2. Treat the request as a delta — mine or cite only the new/changed area, do not re-derive
   unrelated sections.
3. Preserve existing principle IDs where semantics are unchanged; add new IDs for new principles;
   never silently reuse an ID for a different principle.
4. Bump the version and add a changelog entry describing exactly what changed and why.
5. If updating a principle contradicts a decision already made in an existing `plan.md`/`spec.md`
   elsewhere in the project, surface that conflict explicitly — do not silently supersede prior
   work.

## Drift-Check Mode

When explicitly invoked to check code against an existing constitution, without adding to it:

1. Read `constitution.md` completely.
2. For each principle (`Explicit` or `Inferred`), re-inspect the relevant code the same way Phase
   3 does.
3. Report each principle as holding, drifted, or now-mixed (some instances still comply, others
   don't).
4. **Do not auto-fix either direction.** A drifted principle is a decision point: either the code
   needs to be brought back in line (a job for `execute-tasks`/`generate-plan` on a future
   feature, not this skill), or the constitution itself needs updating because the project's
   real direction changed. Present both options; let the user decide.
5. This is a read-only mode with one exception: if the user explicitly asks to update the
   constitution as a result of this check, that becomes an Update-mode invocation (§ above), not
   an automatic side effect of the drift check itself.

## Pre-Execution Extension Hooks

Before inspecting the project, check `.specify/extensions.yml` per
`spec-kit-shared/artifact-conventions.md`'s schema, reading `hooks.before_constitution`. Follow
the same enablement/condition/mandatory-vs-optional rules the other `spec-kit` skills use.

## Mandatory Post-Execution Hooks

After writing/updating `constitution.md`, process `hooks.after_constitution` the same way.

## Completion Report

Report:

- `MODE`: New / Update / Drift-Check.
- `CONSTITUTION_FILE`: `.specify/memory/constitution.md` path.
- `VERSION`: current version after this run.
- `EXPLICIT_PRINCIPLES` / `INFERRED_PRINCIPLES`: counts, each with a one-line list.
- `MIXED_PATTERNS_REPORTED`: count and areas, or "none".
- `REJECTED_CANDIDATES`: count of `Inferred` candidates the user did not confirm, or "none".
- `DRIFT_FOUND` (Drift-Check mode only): principles that no longer hold, or "none".
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: if mixed patterns remain unresolved, name them; otherwise recommend the constitution is
  now available to `generate-spec`/`generate-plan` as governing context.

## Done When

- [ ] The mode (New/Update/Drift-Check) was determined, explicitly if ambiguous.
- [ ] Explicit sources were read and cited, not paraphrased.
- [ ] Mining scope was determined deliberately, not applied blindly to the whole codebase.
- [ ] Every mined category's coverage and confidence were computed from actually sampling
      instances, with the sampling method stated.
- [ ] Low-confidence/mixed patterns were reported as open questions, never promoted to binding
      principles.
- [ ] No `Inferred` principle was written without explicit user confirmation.
- [ ] `constitution.md` (if written/updated) is versioned with an accurate changelog entry.
- [ ] No product code was implemented or refactored by this skill.
- [ ] Every generated support agent has a validated Kiro/Claude pair, or `AGENTS: none` is
      reported.
