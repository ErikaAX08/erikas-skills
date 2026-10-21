# Tasks Quality Checklist Template

Write it as `checklists/tasks-quality.md` (`SKILL.md` § Validate and Iterate).

```markdown
# Tasks Quality Checklist: [Feature Name]

**Purpose**: Validate internal consistency and traceability of tasks.md before execution
**Tasks**: [Relative link to tasks.md]
**Status**: [READY / DRAFT — NEEDS CLARIFICATION]

## Structure

- [ ] Phases follow Setup → Foundational → one phase per R-US## (Priority order) → Polish
- [ ] No task sits outside this structure (no ad hoc "misc" phase)
- [ ] Task IDs are sequential and unique
- [ ] An empty Setup/Foundational phase states a reason instead of a filler task

## Task Quality

- [ ] Every task has Traza a / Archivo(s) / Depende de / Validación
- [ ] No task uses a vague description without a concrete action and file
- [ ] Every file path is verified, or explicitly marked "nuevo: <proposed path>"
- [ ] Every Validación is observable behavior — no parameter/variable names, hunk or line counts, or "file X unchanged" (Rule 15)
- [ ] Every `assumption` runtime premise in plan.md has a `[SONDA]` placed before its dependent tasks

## Closure Rule

- [ ] Every user-story phase has exactly one active [CIERRE] task (superseded ones carry `Superada por:`)
- [ ] Every [CIERRE] task's Verifica block covers dangling references, half-wired paths, and R-AC coverage
- [ ] Foundational's checkpoint is present if it gates all stories

## Safe Deferral Consistency

- [ ] No earlier-story task invokes a later story's Dormant-deferred operation
- [ ] Deferred operations from plan.md's Safe Deferral table are each covered by exactly one later task/story

## Traceability

- [ ] Every PL-O## from plan.md appears in at least one task
- [ ] Every task's R-FR##/R-AC## citation exists in spec.md

## Governance

- [ ] tasks.md contains no TODOs, placeholders, or unresolved template labels
- [ ] state.json was created/updated with `fingerprint.mjs --record <feature-dir> tasks` (content hash, based_on_plan_hash, sections)
- [ ] `lint-artifacts.mjs <feature-dir>` reports no BLOCKING finding (fields, dependencies, closures, probes, amendment links)

## Agent Portability

- [ ] If a task-decomposer (or other agent) was generated, both Kiro and Claude definitions exist and validated per spec-kit-shared/agent-portability.md, or AGENTS: none is reported

## Notes

[Specific failures, evidence, and remaining decisions]
```
