<!--
Target: .agent/tasks/TASK-00X-<slug>.md
The contract an executor works from. It must be complete enough that a competent engineer with no
access to this conversation could execute it correctly, without making a single global decision.
Sections above "Findings During Execution" are written by the Brain, before delegation.
Sections from there down are written by the executor, before declaring the task done.
-->

# TASK-00X — <title stated as a responsibility, not as a file>

**Type:** IMPLEMENTATION | INVESTIGATION | INTEGRATION | VALIDATION
**Status:** DRAFT | READY | IN_PROGRESS | BLOCKED | REVIEW | DONE | CANCELLED
**Created:** <YYYY-MM-DD> · **Updated:** <YYYY-MM-DD>
**Owner:** <agent/role, or "—" while unassigned>
**Depends On:** TASK-00W <!-- must be DONE before this starts --> · **Blocks:** TASK-00Y, TASK-00Z
**Relevant ADRs:** ADR-00X · **Relevant Invariants:** INV-001, INV-003
**Temporary Ownership:** `<paths this task exclusively writes while IN_PROGRESS>`

## Objective

<One or two sentences: the outcome, in terms of system behavior. Not "modify X.ts".>

## Architectural Context

<The minimum model needed to implement this without redesigning anything: where this sits in the
flow, who calls it, what it calls, which component owns what. Reference `memory/ARCHITECTURE.md`
for the rest instead of copying it.>

## Problem Being Solved

<Reference PROBLEM_MODEL.md and state the root-cause mechanism this task addresses. If this task
addresses a symptom deliberately, say so and link the open question.>
ß
## Exact Responsibility

<What this task owns — and, explicitly, the adjacent responsibility it does NOT own.>

## Allowed Scope

```text
<path/glob>
<path/glob>
```

## Out of Scope

```text
<paths, modules, or activities this task must not touch — name the adjacent ones that would be
tempting: unrelated refactors, renames, dependency upgrades, formatting passes, other tasks' files>
```

## Relevant Files / Modules

| Path     | Why it matters      | Read / Write |
| -------- | ------------------- | ------------ |
| `<path>` | <role in this task> | R / W        |

## Inputs

- <what must already exist: a contract from a dependency, a handoff, a fixture, a migration>

## Expected Outputs

- <what this task produces, concretely: a function, a type, an endpoint, a migration, a test suite>

## Contracts

**Consumes**

```text
<exact shape it must accept, and where it is defined>
```

**Produces**

```text
<exact shape it must expose — verbatim, not described>
```

<!-- Contracts here are frozen. If the executor believes one is wrong, it raises CONTRACT CONFLICT
     and stops. It does not adjust the shape locally. -->

## Constraints

- <backward compatibility, performance budget, deploy ordering, framework/style constraints,
  patterns that must be followed because the codebase already uses them>

## Known Risks

- <what could regress, and where it would show>

## Edge Cases

- <the specific cases that must behave correctly>

## Required Tests

- <the regression test that must fail before the change and pass after>
- <unit / integration / contract coverage required>

## Acceptance Criteria

- [ ] AC-1 <objective, checkable by someone who did not write the code>
- [ ] AC-2 <…>

## Definition of Done

- [ ] Implementation complete and inside `Allowed Scope`
- [ ] All acceptance criteria satisfied
- [ ] Required tests written, run, and passing (output read, not inferred)
- [ ] Typecheck, lint, and build pass with no rule relaxed
- [ ] Contracts respected exactly as written above
- [ ] Referenced invariants preserved, demonstrated where testable
- [ ] This file's execution sections completed
- [ ] Handoff written if anything downstream consumes this
- [ ] Findings persisted; ADR proposed if a global decision changed
- [ ] No unresolved BLOCKER or CONTRACT CONFLICT
- [ ] No unexplained out-of-scope modification

## Forbidden Actions

- Changing anything under `Out of Scope`
- Modifying the contracts above instead of raising CONTRACT CONFLICT
- Deleting, skipping, or weakening any existing test
- Disabling a lint rule, a type check, or a build step
- Adding or upgrading a dependency
- Renaming or refactoring anything this task does not own
- Redesigning the architecture; that is a BLOCKER, not an implementation choice

---

<!-- Executor writes from here down, before declaring the task done. -->

## Findings During Execution

- F-0XX <!-- also appended to logs/FINDINGS_LOG.md --> — <what was discovered, with evidence and
  confidence, including anything broken outside this task's scope (reported, not fixed)>

## Deviations

- <anything done differently from this contract, and why it was necessary — each one classified by
  the Brain in review as EXPECTED / JUSTIFIED / SUSPICIOUS / INVALID; "none" is a valid answer>

## Final Result

**Files modified**

| File     | Change     |
| -------- | ---------- |
| `<path>` | <one line> |

**Validation run**

| Check  | Command     | Result                  |
| ------ | ----------- | ----------------------- |
| <test> | `<command>` | <actual output summary> |

**Remaining risks:** <or "none">
**Acceptance criteria:** <AC-1 ✅ / AC-2 ✅ …>

## Handoff

<Link to `handoffs/TASK-00X-HANDOFF.md`, or "not needed — nothing downstream consumes this task".>

## Revision History

### REV-01 — <YYYY-MM-DD>

**Reason:** <what forced the change: a finding, a blocker, a contract conflict, new evidence>
**Changed:** <exactly which sections changed, and how>
**Affected Tasks:** <which other tasks this revision impacts, and their new status>

<!-- If the change is substantial enough that this is no longer the same task, do not rewrite it:
     set Status: CANCELLED with a Reason and a "Superseded By: TASK-0YY". -->
