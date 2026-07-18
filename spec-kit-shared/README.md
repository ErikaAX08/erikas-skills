# Spec Kit

A sequential chain of skills for specification-driven development: from a document or free-form
request, through a governed specification, a technical plan, and an executable task list, to real
code — with drift detection, cross-artifact consistency checking, and cross-platform (Kiro
CLI + Claude Code) agent generation built in at every step.

**Folder layout**: each skill is its own top-level folder at the repository root
(`generate-spec/SKILL.md`, `generate-plan/SKILL.md`, etc.) — the same one-level convention every
other skill in this repo uses, so each is independently discoverable and copyable. This folder,
`spec-kit-shared/`, holds only the documents those skills reference in common (§ Shared Contracts
below) — it is not a skill itself and has no `SKILL.md`. Copy it alongside any spec-kit skill you
use; the skills reference it as `spec-kit-shared/<file>`, a path relative to the repository root.

## Order and When to Use Each Skill

```
establish-constitution (optional, once per project — re-invocable to check drift)
        │
        ▼
generate-spec  ──────────────► spec.md + checklists/requirements.md
        │
        ▼
generate-plan  ──────────────► plan.md + research.md + data-model.md +
        │                      contracts/ + quickstart.md
        ▼
generate-tasks ──────────────► tasks.md (organized by user story, priority order,
        │                      mandatory [CIERRE] closure per story)
        ▼
analyze-consistency (optional, read-only) ──► checklists/consistency-report.md
        │                                      (BLOCKING/ADVISORY findings)
        ▼
execute-tasks ────────────────► real code + tests + commits, delegating to
                                 verify-before-implement, git-commits,
                                 code-documentation, pre-pr-review

sync-artifacts: not a step in the chain — a drift detector every other skill's own
"Fase 0" calls internally, and that you can also invoke directly after editing a
source document, spec.md, or plan.md by hand.
```

| Skill | Use when |
| --- | --- |
| `establish-constitution` | You want the project's real architecture/conventions made explicit — from documentation, from mining consistent patterns in existing code, or both — so every other skill in this kit follows them instead of guessing. Optional; re-invoke later to check whether code has drifted from it. |
| `generate-spec` | You have a requirement, PRD, or free-form request and need a governed specification (a REASONS Canvas) before any design or code — from scratch or as an update to an existing one. |
| `generate-plan` | You have a `READY` `spec.md` and need a verified technical plan — real Technical Context, a two-gate Constitution Check, a real Project Structure, and an explicit Safe Deferral table for any phased work. |
| `generate-tasks` | You have a `READY` `plan.md` and need it decomposed into an ordered, per-user-story task list with mandatory closure checkpoints — never a flat list, never a "TODO for later" without a safety condition. |
| `analyze-consistency` | Before executing, you want a read-only cross-check of `spec.md`/`plan.md`/`tasks.md` for coverage gaps, orphan tasks, unsafe deferrals, and incomplete story checkpoints — with a `READY_FOR_EXECUTION` verdict. |
| `sync-artifacts` | A source document, `spec.md`, or `plan.md` changed, and you want to know exactly what's now stale downstream — before or without re-running the skill that would normally check this itself. |
| `execute-tasks` | You have a `READY` `tasks.md` and are ready to write real code — sequentially, or in parallel across genuinely independent user stories. |

## Design Principles

- **One source of truth per artifact.** `spec.md` is business intent, `plan.md` is technical
  design, `tasks.md` is execution — no skill downstream silently reinterprets an upstream one; a
  mismatch is reported, not resolved by guessing.
- **No hallucination.** Every skill that names a real file, dependency, or existing pattern
  verifies it first (`verify-before-implement`'s discipline), and marks anything unverified
  `NEEDS CLARIFICATION` rather than inventing it.
- **Cierre de ciclos.** No phase, story, or task list is "done" while it leaves the system in a
  broken or inconsistent state — enforced structurally through `generate-tasks`'s per-story
  `[CIERRE]` checkpoint and `generate-plan`'s Safe Deferral rule (`Dormant`/`Flagged`/`Additive` —
  or it isn't deferred at all).
- **Convention-aware.** Existing project patterns are captured once (`establish-constitution`,
  explicit or mined with evidence) and enforced per feature (`generate-plan`'s Convention
  Enforcement) — never re-guessed from scratch each time.
- **Cross-platform by construction.** Any support agent a skill materializes gets a validated Kiro
  CLI **and** Claude Code definition — see `spec-kit-shared/agent-portability.md`.
- **No duplicated rules.** Anything more than one skill needs — the agent portability contract, the
  `.specify/` file layout, the hashing/fingerprint convention — lives once in `spec-kit-shared/`
  and is referenced, not copy-pasted.

## Shared Contracts (`spec-kit-shared/`)

Not invocable skills — documents every skill above reads and follows:

- **`agent-portability.md`** — the Kiro CLI + Claude Code agent contract: naming, tool mapping,
  templates, validation procedure. Defines every standard role used across this kit
  (`spec-clarifier`, `spec-planner`, `plan-reviewer`, `task-decomposer`, `spec-analyzer`,
  `drift-watcher`, `task-executor`, `pattern-miner`).
- **`artifact-conventions.md`** — the `.specify/` file layout (including `.specify/specs/<feature-dir>/`),
  `feature.json`/`state.json`/`extensions.yml` schemas, and the Content Fingerprint Convention
  every hash/drift check in this kit uses.
- **`templates/plan-template.md`** / **`templates/tasks-template.md`** — the fill-in-the-blank
  shapes `generate-plan`/`generate-tasks` produce (Technical Context, Constitution Check,
  Complexity Tracking, Safe Deferral for plans; Setup/Foundational/per-story/Polish with mandatory
  closure for tasks).

## Reuse Map (skills this kit delegates to, outside this chain)

| `spec-kit` skill | Delegates to | For |
| --- | --- | --- |
| `establish-constitution` | `verify-before-implement` | Confirming real conventions before citing them |
| `generate-plan` | `verify-before-implement` | Verifying stack/dependencies/existing patterns |
| `generate-plan` | `backend-api-standards` / `frontend-architecture` | Project-specific contract/layer conventions, when active |
| `execute-tasks` | `verify-before-implement` | Per-task implementation discipline |
| `execute-tasks` | `git-commits` | Commit messages |
| `execute-tasks` | `code-documentation` | Documenting new code when required |
| `execute-tasks` | `pre-pr-review` | Final safety-net review over the accumulated diff |

No skill in `spec-kit` reimplements what one of these already does.

## Artifacts Per Feature

```text
.specify/
├── memory/constitution.md   # establish-constitution
├── extensions.yml           # optional hooks, per skill
├── init-options.json
├── feature.json             # pointer to the active feature
└── specs/<feature-dir>/
    ├── spec.md                  # generate-spec
    ├── plan.md                  # generate-plan
    ├── research.md / data-model.md / quickstart.md / contracts/
    ├── tasks.md                 # generate-tasks
    ├── state.json               # drift-detection state (sync-artifacts, artifact-conventions.md)
    └── checklists/
        ├── requirements.md          # generate-spec
        ├── plan-quality.md          # generate-plan
        ├── tasks-quality.md         # generate-tasks
        └── consistency-report.md    # analyze-consistency
```

Everything this kit generates lives under `.specify/` — no spec-kit file is ever written outside
this folder, so a project's own source tree stays free of scattered spec-kit artifacts.
