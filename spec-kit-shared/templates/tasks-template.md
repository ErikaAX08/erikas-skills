# Tasks: [FEATURE NAME]

**Input**: Design documents from `.speckit/specs/[###-feature-name]/` — `plan.md` (required), `spec.md`
(required for user stories and priorities), `research.md`, `data-model.md`, `contracts/` as
available.

**Tests**: OPTIONAL — only include test tasks if `spec.md` explicitly requests them.

**Organization**: tasks are grouped by user story (`R-US##` from `spec.md`, in `Priority`
`P1 → P2 → P3` order) so each story can be implemented, tested, and delivered as an independent
MVP increment. This is the primary mechanism by which "cierre de ciclos" is enforced — see
`spec-kit-generate-tasks/SKILL.md` § Closure Rule: a story only counts as complete when its
checkpoint holds, and a checkpoint requires the story to be independently functional, which
excludes leaving the system broken by construction.

**Note**: adapted from a general-purpose spec-kit tasks template to this repo's REASONS
vocabulary and mandatory per-story closure checkpoints.

## Format: `[ID] [P?] [Story] Description`

- **`[P]`**: parallelizable — different files, no cross-dependencies with other `[P]` tasks in the
  same phase.
- **`[Story]`**: which user story (`US1`, `US2`, ...) this task belongs to. Setup/Foundational
  tasks carry no story tag.
- **`[CIERRE]`**: the mandatory closing consistency task for a story or phase — see "Closure Rule"
  below. Never omitted, never treated as optional polish. Exactly one is active per story.
- **`[SONDA]`**: a probe that confirms a runtime premise `plan.md` left as `assumption`; it runs
  before every task that depends on it.
- **`[ENMIENDA T0XX]`**: rework applied through `amendments.md` (`AM-##`); see the Task Lifecycle in
  `spec-kit-shared/artifact-conventions.md`.
- Every task also carries, inline or as a sub-line: `Traza a:` (requirement IDs and the `PL-O##`
  it decomposes), `Archivo(s):` (verified path, or `nuevo: <proposed path>` — expected, not a
  fence), `Depende de:` (task IDs or "ninguna"), `Validación:` (an observable, executable
  criterion — a test, a grep with expected count, an HTTP call, a log line; never a parameter
  name, a hunk count, "looks correct", or "file X unchanged").

<!--
  IMPORTANT: everything below Phase 1 is illustrative shape only. spec-kit-generate-tasks MUST replace it
  with real tasks derived from:
  - User stories from spec.md (with their Priority P1/P2/P3)
  - Operations from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  Do not ship the illustrative placeholders in a generated tasks.md.
-->

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per `plan.md` Project Structure
      Traza a: S-C0# — Depende de: ninguna — Validación: estructura verificada manualmente
- [ ] T002 [P] Initialize dependencies verified in `plan.md` Technical Context
      Traza a: Technical Context — Depende de: ninguna — Validación: instalación exitosa

## Phase 2: Foundational (Blocking Prerequisites)

⚠️ **No user story task starts until this phase is complete.**

- [ ] T003 [SONDA] Confirmar [premisa de runtime] (PL-D0#, RS-0#) — only if plan.md left one as `assumption`
      Traza a: PL-D0#, RS-0# — Archivo(s): ninguno (script en scratch) — Depende de: ninguna
      Validación: [comando de la sonda] muestra [comportamiento esperado]
- [ ] T004 [P] [shared infrastructure task]
      Traza a: S-C0#, PL-O0# — Depende de: T001, T003 — Validación: [comando/criterio observable]

**Checkpoint**: foundation ready — user stories may start, in parallel if capacity allows.

---

## Phase 3: US1 — [Title] (Priority: P1) 🎯 MVP

**Goal**: [from `R-US01`]
**Independent test**: [from the `R-AC##` tied to `R-US01`]

### Tests for US1 (OPTIONAL — only if `spec.md` requests tests)

- [ ] T005 [P] [US1] Contract/integration test for [behavior]
      Archivo(s): tests/… — Depende de: ninguna — Validación: falla antes de implementar

### Implementation for US1

- [ ] T006 [P] [US1] [task] — Traza a: R-FR0#, PL-O0# — Archivo(s): [ruta] — Depende de: ninguna
- [ ] T007 [US1] [task] — Traza a: R-FR0#, PL-O0# — Archivo(s): [ruta] — Depende de: T006
- [ ] T008 [US1] [CIERRE] Verificar cierre de US1 (ver Closure Rule)

#### Enmiendas (only once an amendment touches this story after its [CIERRE] closed)

- [ ] T0NN [US1] [ENMIENDA T007] [change] — Enmienda: AM-01 — Traza a: R-AC0#, PL-O0#
      Validación: [comportamiento observable]; re-recorrer el `Verifica` de T008 (cierre activo)

**Checkpoint**: US1 funciona y es verificable de forma independiente — primer incremento
desplegable (MVP).

---

## Phase 4: US2 — [Title] (Priority: P2)

**Goal**: [from `R-US02`]
**Independent test**: [from the `R-AC##` tied to `R-US02`]

[Same pattern as US1 — Tests (optional) → Implementation → `[CIERRE]`. May integrate with US1 but
must remain independently testable.]

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

[Add one phase per additional user story, same pattern, in `Priority` order.]

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] TXXX [P] Documentation updates (delegate to `code-documentation` when applicable)
- [ ] TXXX Code cleanup / refactoring that spans multiple stories
- [ ] TXXX [P] Additional unit tests, if requested, in tests/unit/
- [ ] TXXX Run `quickstart.md` validation

---

## Closure Rule (mandatory for every story/phase — not optional polish)

The last task of every user-story phase, and of Setup/Foundational when it gates the whole
feature, is a `[CIERRE]` task:

```markdown
- [ ] T0XX [USn] [CIERRE] Verificar consistencia de cierre de USn
      Verifica:
        - Ninguna referencia colgante a código de una historia futura no marcada Dormant/Flagged/Aditiva
        - Ninguna rama/ruta alcanzable queda a medio conectar
        - Todo R-AC de esta historia está satisfecho o formalmente reclasificado como aplazamiento seguro
      Validación: recorrido explícito de las condiciones anteriores, no una inferencia
```

This task is not marked `[x]` for producing new code — it is marked `[x]` only when it actively
confirmed nothing was left half-done that would break the system in the state this increment is
delivered in.

A story has exactly one **active** `[CIERRE]`. Rework that does not change the story's `R-AC` set
re-walks the active one instead of adding another; a new `[CIERRE]` is created only when the `R-AC`
set changes, and the old one then gets `Superada por: T0NN (AM-##)`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup — blocks all user stories.
- **User Stories (Phase 3+)**: all depend on Foundational; can proceed in priority order or, once
  Foundational is done, in parallel across independent stories.
- **Polish (final phase)**: depends on all targeted user stories being complete.

### User Story Dependencies

- **USn (Pn)**: starts after Foundational. May integrate with an earlier story but must stay
  independently testable — see Closure Rule.

### Within Each Story

- Tests (if included) are written first and must fail before implementation.
- Models before services; services before endpoints; core implementation before integration.
- The active `[CIERRE]` is the last task of the story, except for later `[ENMIENDA]` tasks.

## Parallel Example: US1

```bash
# Tasks for US1 markeable [P] can be launched together:
Task: "T005 [P] [US1] [description]"
Task: "T00X [P] [US1] [description]"
```

## Implementation Strategy

- **MVP first**: Setup + Foundational + US1 only. Stop at US1's checkpoint, validate, deploy/demo.
- **Incremental delivery**: one story at a time; each one is a working, deployable increment.
- **Parallel execution strategy**: once Foundational is done, independent user stories may be
  delegated to separate `task-executor` agents in `spec-kit-execute-tasks` (see its Phase 3) —
  the story boundary is the primary parallelism unit; task-level `[P]` parallelism within a story
  is a secondary, smaller-grained option.

---

`NEXT`: review `tasks.md`, optionally run `spec-kit-analyze-consistency`, then `spec-kit-execute-tasks` — recommended
to start with US1 as the MVP and validate its checkpoint before continuing to US2.
