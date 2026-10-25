---
name: spec-kit-generate-spec
description: Generate or update a governed, implementation-ready specification from a PRD, document, file reference, or free-form text using SPDD and the REASONS Canvas; when support agents are requested, generate compatible definitions for both Kiro CLI and Claude Code.
license: Apache-2.0
---

# Generate Spec — SPDD REASONS Specification Skill

## Purpose

Turn business input into one governed, versionable specification that can be reviewed before code is generated. The input may be:

- Free-form text written by the user.
- One or more PRDs, user stories, RFCs, briefs, diagrams, contracts, or other documents.
- File or folder references, including `@path` references when the host supports them.
- A combination of text and referenced documents.
- An existing specification plus requested changes.

The output is a **REASONS Canvas**: Requirements, Entities, Approach, Structure, Operations, Norms, and Safeguards. It must capture intent, design, execution, and governance in a single artifact.

This skill generates or updates the specification and its quality checklist. It does **not** implement product code.

## User Input

```text
$ARGUMENTS
```

Always consider the complete user message and any files or attachments available in the current conversation, even when `$ARGUMENTS` appears literally or is empty.

## Core Principle

**Align intent, establish abstractions, and define boundaries before generating code.**

Treat the specification as a first-class delivery artifact:

- Keep it in version control with the code.
- Review intent before implementation details.
- Trace meaningful decisions to their source.
- When a requirement or observable behavior changes, update the specification first.
- When behavior-preserving code refactoring changes the documented structure, synchronize the specification afterward.
- Never allow chat history to become the only record of a decision.

## Non-Negotiable Rules

1. **Do not invent facts.** Never fabricate business rules, domain entities, fields, APIs, file paths, dependencies, architecture, compliance obligations, metrics, or code signatures.
2. **Preserve source intent.** Read referenced sources before deriving requirements from them. Do not silently weaken, expand, or reinterpret their meaning.
3. **Separate facts from assumptions.** Every unsupported but reasonable choice must be recorded explicitly as an assumption or proposed decision.
4. **Surface conflicts.** If sources disagree, report the conflict and its impact. Do not silently select the most convenient interpretation.
5. **One bounded specification per invocation.** A PRD may describe many independently deliverable capabilities. Do not compress unrelated features into one Canvas merely because they share a document.
6. **Abstraction before operations.** Complete and validate Requirements, Entities, Approach, and Structure before deriving Operations.
7. **No code before approval.** Do not implement, refactor, or generate product code as part of this skill.
8. **No hollow Canvas.** All seven REASONS sections must contain specific, useful content. Do not leave placeholders, `TODO`s, or template instructions in a final specification.
9. **Use verified project context.** In an existing codebase, inspect relevant implementation and contracts before naming concrete components or signatures.
10. **Keep scope controlled.** Do not add adjacent features, speculative extensibility, or unnecessary refactors.
11. **Make every requirement verifiable.** Requirements, acceptance criteria, operations, and safeguards must have observable completion conditions.
12. **Never claim readiness without validation.** A specification is `READY` only after its checklist passes and no blocking decisions remain.
13. **Generate portable agent pairs.** If this workflow creates a support agent, it must generate and validate both a Kiro CLI JSON definition and a Claude Code Markdown definition with equivalent intent and least-privilege capabilities.
14. **Stay at the behavior layer.** The spec owns what the system must do and must never do — behavior, rules, entities, invariants, safeguards — and describes Approach, Structure, and Operations at the capability level. Library choices, file-level change lists, wiring points, concrete values that satisfy a stated `R-QR`, and runtime premises belong to `plan.md` (`spec-kit-shared/artifact-conventions.md` § Layer Ownership). A spec that pins file-level detail forces a new spec version for every technical fix.

## Shared Files

`spec-kit-shared/…` paths resolve against `<skills-root>`, the parent of this skill's own
directory: `.claude/skills/` or the host's equivalent once installed, the repository root in a
checkout of the kit. Run shared scripts from the project root as
`node <skills-root>/spec-kit-shared/scripts/<script>.mjs`, with `<skills-root>` written out as an
absolute path; a bare `spec-kit-shared/…` script path resolves against the project and fails.

## Cross-Platform Agent Compatibility

The complete portability contract — Kiro CLI + Claude Code file requirements, naming rules, the
capability-to-tool mapping table, both agent templates, required prompt content, the generation
procedure, and the completion report format — lives in the shared, canonical document
`spec-kit-shared/agent-portability.md`.

**Before generating, validating, or reporting on any support agent** (`spec-clarifier`,
`spec-planner`, or any other role this skill materializes), read that file completely and follow
it exactly as if it were inline here. Do not paraphrase it from memory or apply a partial or
out-of-date recollection of it. If the active host cannot resolve that file reference, follow the
"Fallback for hosts that cannot follow a file reference" section at the end of that same document
— do not silently skip agent generation or invent the contract.

## Run Log

Record this run per `spec-kit-shared/artifact-conventions.md` § Run Log (`<dir>` is the feature directory): start with
`node <skills-root>/spec-kit-shared/scripts/log-event.mjs <dir> run.start --skill spec-kit-generate-spec mode=<mode>` and pass the printed `RUN_ID` to every
later call; end with a `run.end` event (`status`, `reason` when it stops, `next`), also when the run stops early.
Pass `--log <RUN_ID> --skill spec-kit-generate-spec` to `fingerprint.mjs --record … spec` so they record their own results.
Record these decisions, each with a one- or two-sentence `rationale` citing its IDs:

- `readiness` — `READY` or `DRAFT — NEEDS CLARIFICATION`, citing the blocking items
- `scope` — the bounded scope, or the decomposition proposed when the input held several features
- `user` events for every clarification round (`question`) and answer (`decision`)

If logging is off (`RUN_LOG: off`), continue normally.

## Input Contract

### Accepted Input Forms

Examples:

```text
Generate a specification for users exporting their invoices as CSV.
```

```text
@docs/product/invoice-export-prd.md
```

```text
@docs/product/invoice-export-prd.md
The first release is limited to account administrators in Mexico.
```

```text
@docs/prd/ @contracts/billing-api.yaml
Generate the specification only for invoice export, not invoice generation.
```

### Missing Input

If no usable requirement or document is provided, stop and ask:

> Provide the requirement as text, a PRD/document path, an attachment, or a combination of these. If the source covers multiple features, identify the feature you want specified first.

Do not create a speculative specification from an empty request.

### Supported Sources

Use the host's available file-reading or document-extraction capabilities. Relevant sources may include Markdown, plain text, PDF, DOCX, YAML, JSON, CSV, images containing requirements, issue descriptions, and source code.

- Read every explicitly referenced file completely when technically possible.
- For a referenced folder, enumerate it and read all files relevant to the requested scope; ignore binaries and clearly unrelated generated/vendor content.
- If a source cannot be opened, parsed, or extracted reliably, identify it and ask for an accessible alternative. Do not pretend it was read.
- Never upload project files or user documents to an external service unless the user explicitly requests and authorizes it.

## Source-of-Truth and Conflict Rules

First classify source statements into two groups:

- **Non-overridable governance**: project constitutions, machine-enforced contracts or schemas, approved security/privacy/compliance controls, and other constraints whose own governance process defines them as mandatory.
- **Product intent and implementation evidence**: user instructions, PRDs, acceptance criteria, supporting documents, tests, and current code behavior.

Non-overridable governance is a hard boundary, not merely another item in an intent-priority list. A conversational instruction cannot silently waive it. If requested intent conflicts with one of these constraints, stop, explain the conflict, and require the governing source to be changed or an authorized exception to be supplied through the project's process.

Within **product intent**, use this priority unless the user explicitly establishes another valid order:

1. The user's latest explicit instruction in the current request.
2. Approved requirements and acceptance criteria in the identified primary source.
3. Other supporting documents.
4. Existing tests and implementation as evidence of current behavior.
5. Industry conventions, only as labeled assumptions.

Existing code is authoritative for **current implementation**, but not automatically for desired behavior. A PRD is authoritative for **desired product intent**, but not automatically for current technical facts. Governed contracts remain authoritative for their contract surface even when code or requested intent disagrees.

When sources conflict:

1. Record the conflicting claims and their source IDs.
2. Classify the conflict as governance-vs-intent, intent-vs-intent, or desired-vs-current behavior.
3. For governance-vs-intent conflicts, block and escalate; do not resolve by ranking the user's message higher.
4. For material intent conflicts affecting scope, security/privacy, data integrity, observable behavior, or architecture, ask the user unless an approved source clearly and legitimately resolves the decision.
5. For non-material conflicts, apply the applicable priority and record the resolution and rationale in Requirements.

## Pre-Execution Extension Hooks

Before specification work, check for `.speckit/extensions.yml` in the project root.

- If it is missing, continue silently.
- If it is invalid, continue silently without extension hooks.
- Read entries under `hooks.before_specify`.
- Ignore entries with `enabled: false`; missing `enabled` means enabled.
- Do not evaluate non-empty `condition` expressions; leave those to the host HookExecutor.
- Execute enabled, unconditional mandatory hooks and wait for completion.
- Present enabled, unconditional optional hooks without executing them automatically.
- A hook may create or switch branches, but the hook never creates the feature specification directory.
- If the user supplied `GIT_BRANCH_NAME`, pass it unchanged to the applicable branch hook.

For a mandatory hook, emit and then execute:

```text
## Extension Hooks

**Automatic Pre-Hook**: {extension}
Executing: `/{command}`
EXECUTE_COMMAND: {command}
```

For an optional hook, emit:

```text
## Extension Hooks

**Optional Pre-Hook**: {extension}
Command: `/{command}`
Description: {description}
Prompt: {prompt}
To execute: `/{command}`
```

## Workflow

Follow these phases in order. Do not jump directly from raw input to Operations.

### Phase 1 — Ingest and Register Sources

1. Parse direct user text, attachments, and references.
2. Resolve and read all explicit references.
3. Create a source register using stable IDs:
   - `[S1]`, `[S2]`, and so on for user-provided text and documents.
   - `[P1]`, `[P2]`, and so on for verified project/codebase evidence.
4. For each source, record its name or path, type, role, read status, and a **source fingerprint** (see the Source Fingerprint Policy below).
5. Persist this register in the specification's `R — Requirements` Evidence Catalog so every citation remains resolvable after the conversation ends.
6. Consolidate the sources without discarding details relevant to the requested scope.
7. Distinguish direct statements, derived implications, and missing information.

Do not paste complete source documents into the final spec. Preserve them through the concise Evidence Catalog and inline traceability references. Never cite an ID that is absent from the persisted catalog.

#### Source Fingerprint Policy

Record a fingerprint for every `[S#]`/`[P#]` row so a later re-run of this skill (update mode) or a companion drift-detection skill (`spec-kit-sync-artifacts`) can tell, without re-reading and re-comparing full documents by hand, whether the underlying source changed since this specification was generated.

**Read `spec-kit-shared/artifact-conventions.md`'s "Content Fingerprint Convention" section and follow it exactly** — it defines the per-source-type hashing rules (versioned file, non-versioned file, pasted text, URL, attachment) and the "never leave blank" rule. Do not paraphrase it from memory or apply a partial recollection. If the active host cannot resolve that file reference, state plainly that the fingerprint convention could not be loaded rather than inventing one, following the same fallback discipline as the Cross-Platform Agent Compatibility section above.

### Phase 2 — Bound the Work

Determine whether the input represents one cohesive, independently reviewable change.

A suitable scope has:

- One primary problem or outcome.
- Identifiable actors or consumers.
- Coherent business rules.
- Testable completion criteria.
- Boundaries that allow Operations to be ordered and validated.

If the input contains multiple independent features:

1. Propose a concise decomposition with the goal and dependency of each candidate specification.
2. Ask which feature to generate first, unless the user already selected one.
3. Do not create multiple feature directories or multiple Canvases in this invocation.

Generate a 2–4 word kebab-case short name, preferably action–noun, while preserving established acronyms and domain terms.

### Phase 3 — Inspect Governing Project Context

When operating inside a project, inspect only the context relevant to the bounded scope:

1. Read `/memory/constitution.md` or `.speckit/memory/constitution.md` if either exists.
2. Read project instructions, architecture standards, ADRs, contracts, schemas, and active spec templates that govern the change.
3. Search for related entities, components, services, interfaces, tests, and prior specifications.
4. Verify exact names, paths, signatures, data shapes, and dependencies before using them as facts.
5. Record discrepancies between desired behavior and current behavior.

For a greenfield request or when no codebase is available:

- Model domain and logical component boundaries.
- Do not invent repository paths, existing classes, framework choices, or method signatures.
- Mark unapproved architecture choices as proposals or assumptions.
- Keep Operations executable at the capability/component level until concrete technical context exists.

### Phase 4 — Analyze and Align Intent

Build an internal analysis across these dimensions before drafting the Canvas:

- Problem, users, and expected value.
- In-scope and out-of-scope behavior.
- Existing and new domain concepts.
- Business rules, state transitions, and invariants.
- Acceptance criteria and definition of done.
- Dependencies, integrations, and migration concerns.
- Security, privacy, compliance, accessibility, reliability, and performance concerns.
- Edge cases and failure modes.
- Architectural fit, alternatives, risks, and trade-offs.
- Evidence gaps and source conflicts.

#### Clarification Policy

Ask only questions whose answers materially change scope, security/privacy, data integrity, user-visible behavior, or irreversible architecture.

- Ask at most **3 blocking questions per round**.
- Prefer one consolidated round over fragmented questioning.
- For each question, provide context, why it matters, 2–3 concrete options with implications, and a custom option.
- Do not ask for details that can be safely derived from verified project conventions.
- Do not convert a plausible industry convention into a fact; record it as an assumption.
- If the user explicitly requests a draft without answering, produce `DRAFT — NEEDS CLARIFICATION`, preserve the unresolved decisions, and do not call it implementation-ready.

Use this format:

```markdown
## Question [N]: [Decision]

**Context**: [Relevant source-backed statement]
**Why it matters**: [Scope, behavior, risk, or architecture impact]

| Option | Answer                 | Implications                          |
| ------ | ---------------------- | ------------------------------------- |
| A      | [Choice]               | [Effect]                              |
| B      | [Choice]               | [Effect]                              |
| C      | [Choice]               | [Effect]                              |
| Custom | Provide another answer | Describe the desired rule or boundary |

**Your choice**: _Awaiting response_
```

### Phase 5 — Resolve the Feature Directory

First determine the mode:

- **Update mode**: the user explicitly supplied an existing REASONS `spec.md`, or explicitly requested an update to the active feature identified by `.speckit/feature.json`. Validate that the target is the intended specification, set `SPEC_FILE` to that existing file, set `SPECIFY_FEATURE_DIRECTORY` to its parent feature directory, and reuse its checklist. Do not create a new directory or copy a fresh template.
- **New mode**: no existing specification is explicitly targeted. Resolve a new feature directory as described below.

For **new mode**, specifications live under `.speckit/specs/` unless the user explicitly supplies `SPECIFY_FEATURE_DIRECTORY`:

1. If `SPECIFY_FEATURE_DIRECTORY` is explicit, use it unchanged.
2. Otherwise:
   1. Read `.speckit/init-options.json`.
   2. If `feature_numbering` is `timestamp`, use `YYYYMMDD-HHMMSS`.
   3. If `feature_numbering` is `sequential` or absent, scan `.speckit/specs/` and use the next three-digit number.
   4. If only deprecated `branch_numbering` exists, honor it and warn: `⚠️ branch_numbering is deprecated; rename it to feature_numbering.`
   5. Build `SPECIFY_FEATURE_DIRECTORY` as `.speckit/specs/<prefix>-<short-name>`.
3. Create the resolved directory.
4. Resolve the active `spec-template` through the Spec Kit preset/template stack when available.
5. Set `SPEC_FILE` to `<feature-directory>/spec.md`.

For both modes, persist the actual resolved feature directory in `.speckit/feature.json`:

```json
{
  "feature_directory": ".speckit/specs/003-example-feature"
}
```

In update mode, this value must point back to the reused directory. Never redirect the active feature to a newly generated directory during an incremental update. The branch name and feature directory are independent. Create at most one new feature directory in this invocation.

### Phase 6 — Construct the REASONS Canvas

Write the final specification to `SPEC_FILE`. If an active template exists, preserve required project metadata while replacing its specification body with the seven REASONS sections. The title plus all seven sections are mandatory.

The template and the per-section construction rules live in `references/reasons-canvas.md`. Read
it completely before writing the canvas, and follow it as if it were inline here.

### Phase 7 — Validate and Iterate

Create `<feature-directory>/checklists/requirements.md` from the template in `references/requirements-checklist.md`.

Before validating item by item, run `node <skills-root>/spec-kit-shared/scripts/lint-artifacts.mjs <feature-dir>`: a `BLOCKING` finding in `spec.md` (duplicate or broken ID, an unenumerated sensitive-data channel) is a failed checklist item.

Validate the specification item by item:

1. Mark each checklist item passed or failed.
2. Quote or link to concrete evidence for failures.
3. Fix non-blocking failures in the specification.
4. Re-run validation, up to three iterations.
5. If a blocking clarification remains, set status to `DRAFT — NEEDS CLARIFICATION`, ask the user, and do not report implementation readiness.
6. If failures remain after three iterations, document them in Notes and report the spec as not ready.
7. Set status to `READY` only when every checklist item passes.

Also perform these consistency checks:

- Every `R-FR` has at least one `R-AC`.
- Every `R-AC` is covered by an `O` operation or explicit verification task.
- Every entity and component named in Operations exists in Entities/Structure or is clearly introduced there.
- Operations do not introduce scope absent from Requirements.
- Safeguards do not contradict Approach or Acceptance Criteria.
- **Terminal-state check**: for every `R-AC` that leaves an entity in a terminal or persistent state, walk every `E-I` invariant that constrains that entity, once for a definitive outcome and once for each ambiguous outcome the flow can produce (timeout, network error, 5xx, a retry that exhausts). Any combination where the `R-AC` result violates an `E-I` is a blocking contradiction — resolve it (usually by splitting the `R-AC` into definitive vs. ambiguous cases) before `READY`.
- **Channel check**: every Sensitive Data by Channel row that is not `N/A` cites an `S-SG##` that exists and is verifiable.
- Terminology is consistent across all seven sections.
- Source IDs referenced in the spec exist in the persisted Evidence Catalog and resolve to a name/path, role, and read status.
- No generated agent is referenced without both platform files, matching semantics, and recorded validation status.
- Generated Kiro JSON does not contain Claude-only fields, and generated Claude frontmatter does not contain Kiro-only fields.

### Initialize or Refresh `state.json`

Per `spec-kit-shared/artifact-conventions.md`'s schema, write or update
`.speckit/specs/<feature-dir>/state.json`'s `artifacts.spec` entry — always with
`node <skills-root>/spec-kit-shared/scripts/fingerprint.mjs --record <feature-dir> spec`, which computes the content
hash and per-ID `sections` of the final `spec.md` — and its `source_documents` map (mirroring the Evidence Catalog's fingerprints exactly) — in both
new mode and update mode, whether or not a `plan.md` exists yet. This is what lets
`spec-kit-sync-artifacts` check a fresh specification against its sources standalone, before anyone has run
`spec-kit-generate-plan` — the mechanism this whole kit exists to support must work from the very first
spec, not only once a plan exists to have created `state.json` first.

`--record` creates a new `state.json` with `"schema_version": 2`, migrates a version-1 file (reporting `SCHEMA_MIGRATED: 1→2`), and refuses a state newer than the contract (exit 3: stop). The `source_documents` map is the one part written by hand, from the Evidence Catalog.

## Updating an Existing Specification

When the user supplies an existing REASONS specification, follow `references/updating.md`
completely — the delta procedure, ID preservation, Evidence Catalog and `state.json` refresh, and
the scoped validation used for amendments.

## Mandatory Post-Execution Hooks

Before reporting completion, inspect `.speckit/extensions.yml` again and process `hooks.after_specify` using the same enablement and condition rules as pre-hooks.

For each enabled, unconditional mandatory hook, emit and then execute:

```text
## Extension Hooks

**Automatic Hook**: {extension}
Executing: `/{command}`
EXECUTE_COMMAND: {command}
```

Wait for each mandatory hook to finish. Present optional hooks without executing them automatically. If the file is missing or invalid, continue silently.

## Completion Report

Report:

- `RUN_ID`: this run's log ID, or `off`.
- `SPECIFY_FEATURE_DIRECTORY`: resolved feature directory.
- `SPEC_FILE`: generated or updated specification path.
- `CHECKLIST_FILE`: quality checklist path.
- `STATUS`: `READY` or `DRAFT — NEEDS CLARIFICATION`.
- `SOURCES`: count of successfully read inputs and any inaccessible source.
- `SCOPE`: one-sentence bounded feature statement.
- `VALIDATION`: passed/total checks and unresolved failures.
- `TRACEABILITY`: requirement, acceptance criterion, and operation counts.
- `CHANGES`: for updates, the REASONS sections changed.
- `AGENTS`: `none`, or every generated Kiro/Claude path with validation and parity status.
- `NEXT`: clarification if blocked; otherwise review and proceed to technical planning. If a `spec-clarifier` or `spec-planner` pair was generated, name the role and list both platform files instead of assuming a platform-specific handoff.

Use a concise summary such as:

```text
Specification generated at: .speckit/specs/003-invoice-export/spec.md
Checklist: .speckit/specs/003-invoice-export/checklists/requirements.md
Status: READY
Sources: 2/2 read successfully
Validation: 32/32 checks passed
Traceability: 8 requirements → 10 acceptance criteria → 7 operations
Agents: none
Next: Review the REASONS Canvas, then proceed to technical planning.
```

## Done When

- [ ] The run was logged from `run.start` to `run.end` (or logging is off).
- [ ] All provided text and relevant documents were ingested or access failures were disclosed.
- [ ] The request was bounded to one coherent specification.
- [ ] Relevant project reality and governing standards were inspected.
- [ ] Blocking conflicts and decisions were resolved or explicitly reported.
- [ ] All seven REASONS sections were fully populated.
- [ ] Source, requirement, acceptance, operation, and safeguard traceability is coherent.
- [ ] `SPEC_FILE` and its separate checklist were written.
- [ ] Validation was run and the readiness status is truthful.
- [ ] Mandatory post-execution hooks were executed or correctly skipped.
- [ ] Every generated support agent has a validated Kiro JSON definition and an equivalent Claude Markdown definition, or `AGENTS: none` is reported.
- [ ] No product code was generated.
