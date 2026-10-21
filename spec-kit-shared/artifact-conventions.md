# Artifact Conventions

> Canonical, shared reference for the file layout and data formats every `spec-kit` skill reads
> from or writes to. Every artifact this kit generates — project-wide state and per-feature
> artifacts alike — lives under `.speckit/`, never scattered elsewhere in the project. Any skill
> that creates, reads, or updates something under `.speckit/` follows this document instead of
> inventing its own layout or hashing scheme.
>
> **Used by**: `spec-kit-generate-spec`, `spec-kit-establish-constitution`, `spec-kit-generate-plan`, `spec-kit-generate-tasks`,
> `spec-kit-analyze-consistency`, `spec-kit-sync-artifacts`, `spec-kit-execute-tasks`, `spec-kit-amend-artifacts`.
>
> **Contract version**: 2 — the value `state.json` records as `schema_version` (§ Schema Versions
> and Migrations).

## `.speckit/` — everything this kit generates

Every file this kit writes — project-wide state and per-feature artifacts alike — lives under
`.speckit/`. Nothing this kit generates is placed anywhere else in the project, so a project using
this kit never has spec-kit files scattered outside that one folder.

```text
.speckit/
├── memory/
│   └── constitution.md      # written by spec-kit-establish-constitution; read (optionally) by every other skill
├── extensions.yml           # optional hook definitions (see below); absence is not an error
├── init-options.json        # { "feature_numbering": "timestamp" | "sequential" }
├── feature.json             # pointer to the currently active feature directory
└── specs/
    └── <feature-dir>/       # per-feature artifacts — see below
```

The `memory/`, `extensions.yml`, `init-options.json`, and `feature.json` entries are project-wide —
one copy per project, not per feature.

### `feature.json`

Already used by `spec-kit-generate-spec`. A single pointer to whichever feature directory the active
conversation is working on, so a skill doesn't require the user to restate the path on every
invocation:

```json
{
  "feature_directory": ".speckit/specs/003-invoice-export"
}
```

Written by `spec-kit-generate-spec` when it creates or resumes a feature. Any skill that needs "the current
feature" and receives no explicit path reads this file first; if it's missing or the user gave an
explicit path, that explicit path wins.

### `init-options.json`

```json
{
  "feature_numbering": "timestamp" | "sequential"
}
```

`timestamp` → `YYYYMMDD-HHMMSS` feature directory names. `sequential` (default when absent) → next
three-digit number under `.speckit/specs/`. A deprecated `branch_numbering` key is honored with a warning if
`feature_numbering` is absent — see `spec-kit-generate-spec` Phase 5.

### `extensions.yml`

Optional. Missing or invalid → every skill continues silently, without hooks. Structure:

```yaml
hooks:
  before_specify: [] # spec-kit-generate-spec, before Phase 1
  after_specify: [] # spec-kit-generate-spec, after Phase 7
  before_plan: [] # spec-kit-generate-plan, before Technical Context / Constitution Gate 1
  after_plan: [] # spec-kit-generate-plan, after Constitution Gate 2
  before_tasks: [] # spec-kit-generate-tasks, before Phase 0 staleness check
  after_tasks: [] # spec-kit-generate-tasks, after the last user-story phase is written
  before_execute: [] # spec-kit-execute-tasks, before its own staleness check
  after_execute: [] # spec-kit-execute-tasks, after the closure check + pre-pr-review
  before_constitution: [] # spec-kit-establish-constitution, before inspecting the project
  after_constitution: [] # spec-kit-establish-constitution, after constitution.md is written/updated
  before_amend: [] # spec-kit-amend-artifacts, before its staleness check
  after_amend: [] # spec-kit-amend-artifacts, after the consistency check and hand-off
```

Each entry in a hook list:

```yaml
- extension: <human-readable name>
  command: <slash-command or CLI command the host executes>
  enabled: true # optional, default true
  mandatory: true # true = execute automatically and wait; false = present, don't auto-run
  condition: "<expression>" # optional; never evaluated by the calling skill itself — left to the host's HookExecutor
  description: "<shown for optional hooks>"
  prompt: "<shown for optional hooks>"
```

A skill only ever reads the hook list for its own key (a `spec-kit-generate-plan` invocation reads
`before_plan`/`after_plan`, never `before_specify`). Unknown keys are ignored, not treated as
errors — this keeps `extensions.yml` forward-compatible as new spec-kit skills are added.

A hook may create or switch branches, but a hook never creates the feature directory itself — that
stays the responsibility of the skill that owns this invocation.

## `.speckit/specs/<feature-dir>/` — per-feature artifacts

```text
.speckit/specs/003-invoice-export/
├── spec.md                 # spec-kit-generate-spec
├── plan.md                 # spec-kit-generate-plan
├── research.md              # spec-kit-generate-plan, Phase 0
├── data-model.md            # spec-kit-generate-plan, Phase 1
├── quickstart.md            # spec-kit-generate-plan, Phase 1
├── contracts/                # spec-kit-generate-plan, Phase 1
├── tasks.md                 # spec-kit-generate-tasks (checkboxes: spec-kit-execute-tasks)
├── amendments.md            # spec-kit-amend-artifacts — see § amendments.md
├── state.json                # one entry per generating skill — see § Write Ownership
└── checklists/
    ├── requirements.md      # spec-kit-generate-spec
    ├── plan-quality.md      # spec-kit-generate-plan
    ├── tasks-quality.md     # spec-kit-generate-tasks
    └── consistency-report.md # spec-kit-analyze-consistency
```

`state.json` lives inside the feature's own directory under `.speckit/specs/`, not alongside the
project-wide files at `.speckit/`'s top level (`memory/`, `feature.json`, etc.) — it describes that
one feature's artifacts, and a project can have multiple feature directories with independent state
at once. `feature.json` only tracks which one is "active"; it is not where per-feature state lives.

### Write Ownership

Every file, and every field that more than one skill touches, has exactly one writer. A skill
that runs another skill's procedure inline (as `spec-kit-amend-artifacts` does) writes through that
procedure, as that owner — it never gains write access of its own.

| Artifact / field | Written by | Notes |
| --- | --- | --- |
| `memory/constitution.md` | `spec-kit-establish-constitution` | |
| `feature.json` | `spec-kit-generate-spec` | |
| `spec.md`, `checklists/requirements.md` | `spec-kit-generate-spec` | |
| `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `checklists/plan-quality.md` | `spec-kit-generate-plan` | |
| `tasks.md` content, `checklists/tasks-quality.md` | `spec-kit-generate-tasks` | Includes appending `Superada por:` to a closed task |
| `tasks.md` checkbox state (`[ ]` → `[x]`) | `spec-kit-execute-tasks` | Only the orchestrating run, never a parallel `task-executor` |
| `checklists/consistency-report.md` | `spec-kit-analyze-consistency` | Its only write |
| `amendments.md` entries | `spec-kit-amend-artifacts` | |
| `amendments.md` `Status: executed`/`verified` and `Closure re-walk` | `spec-kit-execute-tasks` | Only these fields of an existing entry |
| `state.json` `schema_version` | Whichever skill writes `state.json` first, or migrates it | § Schema Versions and Migrations |
| `state.json` `artifacts.spec`, `source_documents` | `spec-kit-generate-spec` | |
| `state.json` `artifacts.plan` | `spec-kit-generate-plan` | |
| `state.json` `artifacts.tasks` | `spec-kit-generate-tasks` | Never rewritten for checkbox changes (the hash ignores them) |
| `state.json` acknowledgment / legacy-hash exceptions | `spec-kit-sync-artifacts` | Only the two exceptions in its § Writing `state.json` |

### `state.json`

Each generating skill writes its own entry (§ Write Ownership). `spec-kit-sync-artifacts` compares
it — the Fase 0 staleness check of `spec-kit-generate-plan`, `spec-kit-generate-tasks`,
`spec-kit-execute-tasks`, and `spec-kit-amend-artifacts` — and writes only its two bookkeeping
exceptions:

```json
{
  "schema_version": 2,
  "artifacts": {
    "spec": { "path": "spec.md", "content_hash": "sha256:...", "sections": { "R-AC01": "sha256:...", "...": "..." }, "updated_at": "2026-07-10T10:00:00Z" },
    "plan": { "path": "plan.md", "content_hash": "sha256:...", "based_on_spec_hash": "sha256:...", "updated_at": "2026-07-11T09:00:00Z" },
    "tasks": { "path": "tasks.md", "content_hash": "sha256:...", "based_on_plan_hash": "sha256:...", "updated_at": "2026-07-11T15:00:00Z" }
  },
  "source_documents": {
    "S1": { "path": "docs/product/invoice-export-prd.md", "fingerprint": "sha256:...", "read_at": "2026-07-10T09:40:00Z" }
  }
}
```

- `schema_version` — the contract version these entries follow; absent means version 1 (§ Schema
  Versions and Migrations).
- `artifacts.<name>.content_hash` — the current content hash of that artifact itself (always a
  SHA-256 over its content, computed per the Content Fingerprint Convention's "kit-internal
  artifact" rule below — never a commit SHA, to stay stable regardless of git status). For
  `tasks.md` the hash is **progress-insensitive**: checkbox state is normalized before hashing, so
  `spec-kit-execute-tasks` marking `[x]` never changes it and never needs to rewrite it.
- `artifacts.<name>.sections` — optional per-ID hashes: one SHA-256 per ID definition block
  (§ Artifact Grammar), so drift is localized to the IDs that changed instead of "the file
  changed". Absent (older entries) → localization falls back to a manual diff. Adding it does not
  change the meaning of existing data, so it needs no schema version bump.
- `artifacts.plan.based_on_spec_hash` — the `spec.content_hash` value at the moment `plan.md` was
  generated from it. `artifacts.tasks.based_on_plan_hash` is the equivalent for `tasks.md`
  against `plan.md`.
- `source_documents.<ID>` — mirrors the Evidence Catalog rows in `spec.md` (`[S#]`/`[P#]`), so
  `spec-kit-sync-artifacts` can detect an external source changing without re-reading and re-diffing the
  full spec every time. `fingerprint` follows the Content Fingerprint Convention's "external
  source" rule.

Staleness is a simple comparison, not a judgment call, at the mechanical level: `plan.md` is
potentially stale if `spec.content_hash` ≠ `plan.based_on_spec_hash`; `tasks.md` is potentially
stale if `plan.content_hash` ≠ `tasks.based_on_plan_hash`; a source is potentially stale if its
current fingerprint ≠ the recorded one. Whether a detected difference is *semantically material*
(a real requirement change) versus cosmetic is a judgment the consuming skill makes — this file
only defines the data, not that classification logic.

### Schema Versions and Migrations

| Version | Identified by | What it means |
| --- | --- | --- |
| 1 | `state.json` without `schema_version` | Raw `tasks.md` hash; plans may use `A-D0#`/`O-0#` for their own entries; no `amendments.md` |
| 2 | `"schema_version": 2` | Everything in this document as written |

Rules every skill follows when it reads `state.json`:

- **Newer than this contract** (`schema_version` greater than the Contract version above): stop
  and report that the installed kit is older than the feature's artifacts. Never write to it —
  an older reader would silently drop rules it does not know.
- **Older** (absent or 1): read it with the version-1 meaning — the Legacy `tasks.md` hashes rule
  and the legacy plan ID rule (§ Stable ID Namespaces) are exactly the 1 → 2 migration. The next
  skill that writes `state.json` for its own entry applies the migration: it upgrades a legacy
  `tasks.md` hash per that rule, sets `schema_version` to 2, and reports `SCHEMA_MIGRATED: 1→2`. A
  read-only skill reports the version it found and never migrates.
- Plans keep their legacy IDs after migration — stable IDs are never renumbered; the migration
  only changes how they are read.

A future contract change that alters the meaning of existing data adds a row here and a migration
rule, and bumps the Contract version — never a silent reinterpretation.

## Content Fingerprint Convention

One hashing convention, used everywhere a fingerprint is recorded — in `spec.md`'s Evidence
Catalog, in `state.json`, and by any future skill in this kit that needs to detect whether
something changed.

**Kit-internal artifacts** (`spec.md`, `plan.md`, `tasks.md` — files this kit itself generates and
updates): always a SHA-256 content hash of the file's current text, regardless of git status.
Never a commit SHA for these — an internal artifact is frequently compared before it has been
committed, and tying its fingerprint to git history would make staleness detection silently stop
working on uncommitted work.

**`tasks.md` normalization**: before hashing `tasks.md`, rewrite every checkbox to the open state —
each line matching `^(\s*[-*]\s+)\[[xX]\]` becomes `$1[ ]`. Nothing else is normalized: a changed
description, a new task, or an appended `Superada por:` line still changes the hash, as it
should. Execution progress is the one edit that is not a content change.

Compute fingerprints mechanically, never by estimation:

```bash
node spec-kit-shared/scripts/fingerprint.mjs <file>...                    # sha256:<hex>  <file>
node spec-kit-shared/scripts/fingerprint.mjs --state <feature-dir>        # chain comparison, localized by ID
node spec-kit-shared/scripts/fingerprint.mjs --record <feature-dir> <spec|plan|tasks>
                                         # writes that artifact's state.json entry — owner only
```

`--record` is how an owning skill writes its own `state.json` entry (§ Write Ownership): it
computes `content_hash`, the matching `based_on_*` from the current upstream file, and
`sections`, sets `schema_version` (migrating a version-1 file), and leaves every other entry and
`source_documents` untouched. A skill never types a hash into `state.json` by hand.

(`spec-kit-shared/` resolves the same way as every other reference to it.) The script applies the `tasks.md` normalization automatically (by basename; `--tasks`/`--raw`
override). Without Node, the equivalent is
`sed -E 's/^([[:space:]]*[-*][[:space:]]+)\[[xX]\]/\1[ ]/' tasks.md | shasum -a 256` for
`tasks.md` and `shasum -a 256 <file>` for the others.

**Legacy `tasks.md` hashes**: a `state.json` written before this normalization existed may hold a
raw hash. If the normalized hash mismatches but the raw hash matches, it is not drift. If neither
matches, check whether the only differences against the last committed or recorded version are
checkbox states (e.g. `git diff` of `tasks.md` with both sides normalized); if so, it is not drift
either. In both cases the next skill that writes `state.json` stores the normalized hash and says
so in its report.

**External sources** (anything cited as `[S#]`/`[P#]` in an Evidence Catalog — PRDs, contracts,
existing code inspected as evidence, pasted text, URLs):

- **Versioned file in this repository**: the commit SHA at which the file was last modified (e.g.
  via `git log -1 --format=%H -- <path>`), when that information is available in the environment.
- **Non-versioned local file, or a document whose text was extracted** (PDF/DOCX/etc.): a SHA-256
  content hash of the exact bytes or extracted text actually read.
- **Pasted free-form text with no backing file**: a SHA-256 hash of the exact text as provided.
- **URL or other external resource**: a SHA-256 hash of the fetched content at read time, plus the
  retrieval timestamp. Treat this fingerprint as time-bound — the URL's content can change later
  without notice, unlike a versioned file or a fixed hash.
- **Attachment interpreted rather than extracted verbatim** (image, etc.): a hash of the file bytes
  when accessible; otherwise a hash of the interpreted text actually used, noted as covering the
  interpretation, not the original file.

Never leave a fingerprint field blank or as an unexplained "N/A" when a real one could be computed
— a missing fingerprint makes drift detection silently impossible for that artifact or source. If a
fingerprint genuinely cannot be computed (e.g. a requirement described only verbally, with no
artifact behind it), state that explicitly instead of leaving the field empty.

## Stable ID Namespaces

Each artifact owns its own ID prefixes. An ID is defined in exactly one artifact; every other
artifact only cites it.

| Artifact | Owns | Level |
| --- | --- | --- |
| `spec.md` | `R-G`, `R-US`, `R-FR`, `R-QR`, `R-AC`, `R-AS`, `R-D`, `R-DEP`, `R-RISK`, `E-##`, `E-I`, `E-DL`, `A-##`, `A-D`, `A-E`, `A-C`, `S-C`, `S-CS`, `O-##`, `N-##`, `S-SG`, `[S#]`/`[P#]` | Observable behavior, business rules, capability-level approach and operations |
| `plan.md` / `research.md` | `PL-D##` (technical decisions), `PL-O##` (technical operations), `RS-##` (research entries) | Libraries, files, mount points, concrete values, runtime premises |
| `tasks.md` | `T###` | Execution units |
| `amendments.md` | `AM-##` | Decided changes applied after generation |

`spec.md`'s `A-D##` and `O-##` are capability-level; `plan.md` never reuses those prefixes for its
own entries. `tasks.md` traces to `PL-O##` (and to the `R-FR`/`R-AC` it satisfies), never directly
to a spec `O-##`.

The two operation layers stay linked in both directions: every `PL-O##` cites the spec `O-##` it
realizes, and every spec `O-##` is realized by at least one `PL-O##` (or covered by a Safe
Deferral entry). The spec's `O-##` list stays mandatory — it is the REASONS canvas's capability
view — but never holds file-level steps, so a technical change touches only `PL-O##`.

**Legacy plans**: a `plan.md` generated before this convention defines its decisions and
operations as `A-D0#`/`O-0#`. A skill reading such a plan resolves those IDs in `plan.md` first and
only then in `spec.md`, and reports the ambiguity when both define the same ID. Updating a legacy
plan keeps its existing IDs (stable IDs are never renumbered) and gives new entries `PL-` IDs.

## Layer Ownership (the lowest-affected-layer rule)

A change is written in the **lowest** artifact that owns everything it changes, and propagates
only downward from there:

| A change to… | Belongs to | Touches `spec.md`? |
| --- | --- | --- |
| Scope, actors, observable behavior, business rules, acceptance criteria, entities, invariants, safeguards (including sensitive data per channel), a user-visible error or status | `spec.md` → `plan.md` → `tasks.md` | Yes |
| Library, file, mount point, wiring order, concrete timeout/retry value that still satisfies the same `R-QR`/`S-SG`, a runtime premise, a technical decision | `plan.md` → `tasks.md` | No |
| Task wording, a `Validación` criterion, a file within an existing `PL-O`, an extra task inside an existing `PL-O`, rework of a closed task without new `R-AC` | `tasks.md` | No |

Consequences every skill follows:

- `spec.md` never states a file-level fact as a binding constraint ("`main.js` does not change"). A
  safeguard protects a behavior or a contract; which files may change is `plan.md`'s call.
- When in doubt between two layers, use the higher one — the rule exists to skip unnecessary
  cascades, never to hide a behavior change from the spec.
- A behavior change still goes spec-first (SPDD direction rule); this table only stops purely
  technical changes from forcing a spec version.

## Evidence Levels

Every `Verified` claim about the real project carries one of these levels — in `research.md`,
in `plan.md`'s decision Evidence column, and in any task or review that relies on it:

| Level | Meaning | Sufficient for |
| --- | --- | --- |
| `executed` | Observed by running something: a scratch probe against the installed dependency, an existing test, a local request. The command and its observed output are cited. | Any claim, including runtime behavior |
| `read` | Established by reading source, types, contracts, or docs of the installed version. | Shapes: names, signatures, fields, enum values, config keys, file paths |
| `assumption` | Neither of the above. | Nothing binding — it must be recorded as an assumption with a task that confirms it |

**Runtime-behavior claims require `executed`.** A claim is about runtime behavior when it states
*when*, *in what order*, *how many times*, *how long*, or *with what side effect* something happens:
retries and their delays, timeouts, `retry-after` handling, when a logger/serializer captures
its input, middleware ordering, transaction or connection lifecycles, what an error object
contains, what a library actually sends over the wire. Reading the code of such behavior is
`read`, not `executed`, however carefully it was read. A runtime premise that cannot be executed
during planning is recorded as `assumption` and gets a probe task (`[SONDA]`, see § Task
Lifecycle) that runs before any task depending on it.

## Artifact Grammar

What makes text in an artifact a definition, a citation, or a task — the rules
`spec-kit-shared/scripts/lint-artifacts.mjs` and `fingerprint.mjs --sections` parse. Write
artifacts so they hold; anything else is prose the scripts ignore.

**IDs** match one of the families in § Stable ID Namespaces exactly (`R-AC03`, `E-I01`, `PL-O02`,
`RS-01`, `AM-04`, `T012`, `[S1]`/`[P2]` in brackets). Template placeholders such as `R-FR0#` are not
IDs. Text inside fenced code blocks is never parsed.

**Definitions** — an ID is defined where it appears as:

- the first bold token of a list item: `- **R-FR01**: …` or `1. **A-01 — Strategy**: …` — the block
  is that item plus its indented continuation lines;
- the first token of a heading: `### O-01 — …`, `### RS-01 — …`, `## AM-01 — …` — the block runs to
  the next heading of the same or higher level;
- the first cell of a row in a table whose first column is headed `ID` — the block is the row.
  Rows of tables with any other first column (Safe Deferral, Convention Enforcement, Sensitive
  Data by Channel) cite IDs; they never define them;
- a task line in `tasks.md` (below).

Every other occurrence of an ID is a **citation**, and must resolve to a definition. Each ID is
defined once per artifact.

**Tasks** (`tasks.md`):

```text
- [ ] T012 [P] [US2] [SONDA] Description          ← checkbox, ID, zero or more [tags], description
      Traza a: R-AC03, PL-O02                      ← fields as indented sub-lines…
      Archivo(s): src/x.js — Depende de: T010      ← …or as ` — `-separated segments on one line
      Validación: …                                 ← a field's continuation lines are indented
```

Required fields: regular tasks `Traza a`, `Archivo(s)`, `Depende de`, `Validación`; `[CIERRE]`
`Verifica`, `Validación`; `[ENMIENDA T0XX]` `Enmienda`, `Traza a`, `Validación`; `[SONDA]` `Traza a`,
`Validación`. A task's story is its `[USn]` tag, or the `USn` in its phase heading
(`## Phase 3: US1 — Title (Priority: P1)`). Amendment tasks sit under a `#### Enmiendas` heading
inside their story's phase.

**Amendment entries** (`amendments.md`): one `## AM-NN — title` heading per entry, with fields as
`- **Field**: value` items (`- **Status**: applied`).

**Evidence levels and runtime premises** are read from the `Evidence level` / `Runtime premise`
columns of the `ID` tables in `plan.md` and `research.md`, or from `- **Evidence level**:` /
`- **Runtime premise**:` items under an `RS-##` heading.

### Mechanical Checks

`node spec-kit-shared/scripts/lint-artifacts.mjs <feature-dir> [--json]` runs every check that can
be decided from the text alone. Codes are stable; severities follow
`spec-kit-analyze-consistency`. Exit 0 = no `BLOCKING`, 1 = `BLOCKING` found, 2 = not a feature
directory, 3 = `state.json` newer than this contract.

| Code | Check | Severity |
| --- | --- | --- |
| L01 | ID defined twice in one artifact | BLOCKING |
| L02 | Cited ID defined nowhere (task and amendment references: L07, L11, L12) | BLOCKING |
| L03 | ID defined in both `spec.md` and a plan file (expected only for legacy plans) | ADVISORY |
| L06 | Missing required task field (`Validación` → BLOCKING; others ADVISORY) | BLOCKING / ADVISORY |
| L07 | `Depende de` names a task that does not exist | BLOCKING |
| L08 | Story without exactly one active `[CIERRE]` | BLOCKING |
| L09 | Non-`[ENMIENDA]` task after the story's active `[CIERRE]` | BLOCKING |
| L10 | Active `[CIERRE]` lists R-AC IDs that miss some the story claims (lists none → ADVISORY, not checkable) | BLOCKING / ADVISORY |
| L11 | `Superada por:` on an open task, or naming a task that does not exist | BLOCKING |
| L12 | `[ENMIENDA]` / `Superada por:` citing a task or `AM-##` that does not exist | BLOCKING |
| L13 | `PL-D##` at `assumption` with no `[SONDA]` citing it | BLOCKING |
| L14 | Task built on an `assumption` decision (directly or via the `PL-O##` that applies it) not depending on its `[SONDA]` | BLOCKING |
| L15 | Runtime premise at `read`, or a decision resting on one without being marked `assumption` | BLOCKING |
| L16 | `PL-D##` / `RS-##` without an evidence level | ADVISORY |
| L17 | `PL-O##` citing no spec `O-##`, or spec `O-##` realized by no `PL-O##` | ADVISORY |
| L18 | Sensitive Data by Channel row without a safeguard or `N/A` reason | BLOCKING |
| L19 | Open amendment (`planned` / `stopped`) | BLOCKING |
| L20 | Amendment status outside the defined set | ADVISORY |
| L21 | Non-canonical grammar token (e.g. `Validacion:`) | ADVISORY |

Checks a script cannot decide — whether an acceptance criterion contradicts an invariant, whether
a `Dormant` operation is actually invoked, terminology drift — stay with
`spec-kit-analyze-consistency`'s semantic phases. Legacy plans skip L13–L17 and say so.

## Grammar Tokens

The artifacts use a small set of fixed tokens. They are **language-independent keys**: written
exactly as below whatever language the surrounding prose uses, never translated, and matched
literally by every skill (and by any script that parses the artifacts). They are in Spanish for
historical reasons; changing them would break existing artifacts, so they are part of the contract
instead.

| Token | Where | Meaning |
| --- | --- | --- |
| `Traza a:` | task sub-line | Requirement and operation IDs the task satisfies |
| `Archivo(s):` | task sub-line | Expected files; `nuevo: <path>` for a proposed one, `ninguno` for none |
| `Depende de:` | task sub-line | Task IDs, or `ninguna` |
| `Validación:` | task sub-line | Observable criterion that must pass before `[x]` |
| `Verifica:` | `[CIERRE]` task | Conditions the closure walks |
| `Enmienda:` | `[ENMIENDA]` task | The `AM-##` the task comes from |
| `Superada por:` | appended to a closed task | The task (and `AM-##`) that replaced it |
| `[P]`, `[USn]` | task tags | Parallelizable; owning user story |
| `[CIERRE]`, `[SONDA]`, `[ENMIENDA T0XX]` | task tags | § Task Lifecycle |
| `#### Enmiendas` | story phase subsection | Where amendment tasks go after the active `[CIERRE]` |
| `READY`, `DRAFT — NEEDS CLARIFICATION` | checklist `Status` | Artifact readiness |
| `N/A — sin constitución` | Constitution Check gates | No constitution exists |

## Task Lifecycle

`tasks.md` states, and who may write each one:

- `- [ ]` open — written by `spec-kit-generate-tasks` / `spec-kit-amend-artifacts`.
- `- [x]` closed — written only by `spec-kit-execute-tasks`, only after the task's `Validación`
  actually ran and passed.
- A closed task is immutable. The single permitted edit is appending one line,
  `Superada por: T0NN (AM-##)`, written by `spec-kit-generate-tasks` or `spec-kit-amend-artifacts`
  when later work replaces it. A superseded task stays `[x]`; it records history, not current
  intent.

Tags:

- `[CIERRE]` — a story's closure checkpoint. Each story has **exactly one active `[CIERRE]`**: the
  one without a `Superada por:` line. A new `[CIERRE]` is created only when the story's `R-AC` set
  changes; the previous one then gets `Superada por:`.
- `[ENMIENDA T0XX]` — rework of closed task `T0XX` (or new work inside the story) applied through
  an amendment, carrying an `Enmienda: AM-##` line. Amendment tasks that do not change the story's
  `R-AC` set do **not** get a new `[CIERRE]`: they go under an `#### Enmiendas` subsection after the
  active `[CIERRE]`, and their `Validación` ends with "re-recorrer el `Verifica` de T0XX (cierre
  activo)". `spec-kit-execute-tasks` re-walks that block after the story's last amendment task and
  records the result in `amendments.md`, without editing the closed `[CIERRE]`.
- `[SONDA]` — a probe that turns an `assumption` runtime premise into `executed` evidence
  (§ Evidence Levels). It runs before every task that depends on the premise; if the probe refutes
  the premise, execution stops and the change goes to `spec-kit-amend-artifacts` at the `plan`
  layer.

## `amendments.md`

Written by `spec-kit-amend-artifacts` (entries) and `spec-kit-execute-tasks` (status and closure
re-walk results only). One entry per decided change applied after the artifacts were generated —
so no decision lives only in chat, and so every amendment task cites a reason.

The entry is a **write-ahead record**: it is written with `Status: planned` right after the
amendment plan is confirmed and **before** any artifact is edited, then updated after each layer
validates. If an amendment stops halfway, the entry says what was decided, which layers are done,
and which artifact hashes it started from — enough to resume it or to undo it without guessing.

```markdown
# Amendments: [Feature Name]

## AM-01 — [short title]

- **Origin**: [pre-pr-review F-2 @ <head-sha> | user request | execute-tasks unplanned scope | SONDA T0NN refuted premise]
- **Decision**: [the decided change] — Decided by: [user | reviewer + user]
- **Recorded in**: [spec.md R-D## + [S#] | plan.md PL-D## | amendments.md only]
- **Layer**: spec | plan | tasks | none (accepted as-is, no artifact change)
- **IDs changed**: [R-AC06, PL-D07, T046 …]
- **Closed tasks affected**: [T018 → Superada por T050 | T009 re-walked | none]
- **Base hashes**: spec [sha256:…] · plan [sha256:…] · tasks [sha256:…] — `state.json` values when the entry was written
- **Layers done**: [spec, plan | none yet]
- **Stopped at**: [only when Status is stopped: layer — failed validation item]
- **Closure re-walk**: [T052 [CIERRE] re-walked <date>: holds | fails: …]
- **Status**: planned | applied | stopped | escalated | accepted | abandoned | executed | verified
```

| Status | Set by | Meaning |
| --- | --- | --- |
| `planned` | `spec-kit-amend-artifacts` | Confirmed; no layer applied yet (write-ahead) |
| `stopped` | `spec-kit-amend-artifacts` | A layer failed validation; `Layers done` and `Stopped at` say where |
| `applied` | `spec-kit-amend-artifacts` | Every layer validated and `state.json` refreshed by each owner |
| `escalated` | `spec-kit-amend-artifacts` | Handed to the regular chain (structural change) |
| `accepted` | `spec-kit-amend-artifacts` | `Layer: none` — a `🟡` accepted as-is; nothing to apply or execute |
| `abandoned` | `spec-kit-amend-artifacts` | An open entry undone: touched artifacts restored to their base hashes; the decision stays recorded |
| `executed` | `spec-kit-execute-tasks` | Amendment tasks ran and the closure re-walk was recorded |
| `verified` | `spec-kit-execute-tasks` | A review gate covering the executed amendment returned `approve` or `approve with conditions` with every `🟡` decided |

`Layer: none` is how a `🟡` accepted without changing anything is recorded: the decision and its
owner are written down with `Status: accepted`, and no artifact or hash changes.
