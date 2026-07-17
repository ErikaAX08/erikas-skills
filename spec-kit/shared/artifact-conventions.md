# Artifact Conventions

> Canonical, shared reference for the file layout and data formats every `spec-kit` skill reads
> from or writes to. Any skill that creates, reads, or updates something under `.specify/` or
> `specs/` follows this document instead of inventing its own layout or hashing scheme.
>
> **Used by**: `generate-spec`, `establish-constitution`, `generate-plan`, `generate-tasks`,
> `analyze-consistency`, `sync-artifacts`, `execute-tasks`.

## `.specify/` — project-wide state

```text
.specify/
├── memory/
│   └── constitution.md     # written by establish-constitution; read (optionally) by every other skill
├── extensions.yml          # optional hook definitions (see below); absence is not an error
├── init-options.json       # { "feature_numbering": "timestamp" | "sequential" }
└── feature.json            # pointer to the currently active feature directory
```

Everything here is project-wide — one copy per project, not per feature.

### `feature.json`

Already used by `generate-spec`. A single pointer to whichever feature directory the active
conversation is working on, so a skill doesn't require the user to restate the path on every
invocation:

```json
{
  "feature_directory": "specs/003-invoice-export"
}
```

Written by `generate-spec` when it creates or resumes a feature. Any skill that needs "the current
feature" and receives no explicit path reads this file first; if it's missing or the user gave an
explicit path, that explicit path wins.

### `init-options.json`

```json
{
  "feature_numbering": "timestamp" | "sequential"
}
```

`timestamp` → `YYYYMMDD-HHMMSS` feature directory names. `sequential` (default when absent) → next
three-digit number under `specs/`. A deprecated `branch_numbering` key is honored with a warning if
`feature_numbering` is absent — see `generate-spec` Phase 5.

### `extensions.yml`

Optional. Missing or invalid → every skill continues silently, without hooks. Structure:

```yaml
hooks:
  before_specify: [] # generate-spec, before Phase 1
  after_specify: [] # generate-spec, after Phase 7
  before_plan: [] # generate-plan, before Technical Context / Constitution Gate 1
  after_plan: [] # generate-plan, after Constitution Gate 2
  before_tasks: [] # generate-tasks, before Phase 0 staleness check
  after_tasks: [] # generate-tasks, after the last user-story phase is written
  before_execute: [] # execute-tasks, before its own staleness check
  after_execute: [] # execute-tasks, after the closure check + pre-pr-review
  before_constitution: [] # establish-constitution, before inspecting the project
  after_constitution: [] # establish-constitution, after constitution.md is written/updated
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

A skill only ever reads the hook list for its own key (a `generate-plan` invocation reads
`before_plan`/`after_plan`, never `before_specify`). Unknown keys are ignored, not treated as
errors — this keeps `extensions.yml` forward-compatible as new spec-kit skills are added.

A hook may create or switch branches, but a hook never creates the feature directory itself — that
stays the responsibility of the skill that owns this invocation.

## `specs/<feature-dir>/` — per-feature artifacts

```text
specs/003-invoice-export/
├── spec.md                 # generate-spec
├── plan.md                 # generate-plan
├── research.md              # generate-plan, Phase 0
├── data-model.md            # generate-plan, Phase 1
├── quickstart.md            # generate-plan, Phase 1
├── contracts/                # generate-plan, Phase 1
├── tasks.md                 # generate-tasks
├── state.json                # sync-artifacts — see below
└── checklists/
    ├── requirements.md      # generate-spec
    ├── plan-quality.md      # generate-plan
    └── consistency-report.md # analyze-consistency
```

`state.json` lives inside the feature's own directory, not in `.specify/` — it describes that one
feature's artifacts, and a project can have multiple feature directories with independent state at
once. `feature.json` only tracks which one is "active"; it is not where per-feature state lives.

### `state.json`

Written and updated by `sync-artifacts` (read by `generate-plan`, `generate-tasks`,
`execute-tasks` as their Fase 0 staleness check):

```json
{
  "artifacts": {
    "spec": { "path": "spec.md", "content_hash": "sha256:...", "updated_at": "2026-07-10T10:00:00Z" },
    "plan": { "path": "plan.md", "content_hash": "sha256:...", "based_on_spec_hash": "sha256:...", "updated_at": "2026-07-11T09:00:00Z" },
    "tasks": { "path": "tasks.md", "content_hash": "sha256:...", "based_on_plan_hash": "sha256:...", "updated_at": "2026-07-11T15:00:00Z" }
  },
  "source_documents": {
    "S1": { "path": "docs/product/invoice-export-prd.md", "fingerprint": "sha256:...", "read_at": "2026-07-10T09:40:00Z" }
  }
}
```

- `artifacts.<name>.content_hash` — the current content hash of that artifact itself (always a
  SHA-256 over its content, computed per the Content Fingerprint Convention's "kit-internal
  artifact" rule below — never a commit SHA, to stay stable regardless of git status).
- `artifacts.plan.based_on_spec_hash` — the `spec.content_hash` value at the moment `plan.md` was
  generated from it. `artifacts.tasks.based_on_plan_hash` is the equivalent for `tasks.md`
  against `plan.md`.
- `source_documents.<ID>` — mirrors the Evidence Catalog rows in `spec.md` (`[S#]`/`[P#]`), so
  `sync-artifacts` can detect an external source changing without re-reading and re-diffing the
  full spec every time. `fingerprint` follows the Content Fingerprint Convention's "external
  source" rule.

Staleness is a simple comparison, not a judgment call, at the mechanical level: `plan.md` is
potentially stale if `spec.content_hash` ≠ `plan.based_on_spec_hash`; `tasks.md` is potentially
stale if `plan.content_hash` ≠ `tasks.based_on_plan_hash`; a source is potentially stale if its
current fingerprint ≠ the recorded one. Whether a detected difference is *semantically material*
(a real requirement change) versus cosmetic is a judgment the consuming skill makes — this file
only defines the data, not that classification logic.

## Content Fingerprint Convention

One hashing convention, used everywhere a fingerprint is recorded — in `spec.md`'s Evidence
Catalog, in `state.json`, and by any future skill in this kit that needs to detect whether
something changed.

**Kit-internal artifacts** (`spec.md`, `plan.md`, `tasks.md` — files this kit itself generates and
updates): always a SHA-256 content hash of the file's current text, regardless of git status.
Never a commit SHA for these — an internal artifact is frequently compared before it has been
committed, and tying its fingerprint to git history would make staleness detection silently stop
working on uncommitted work.

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
