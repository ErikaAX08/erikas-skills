# Task Contracts, Decomposition, and Safe Parallelism

> Loaded by `brain-orchestrator` in Phase 5 (DECOMPOSE) and Phase 7 (DELEGATE). A task is the unit
> of delegation, and a delegated task is a contract: everything the executor is allowed to assume,
> and everything it is forbidden to touch. If the contract is vague, the executor will fill the gap
> with its own architecture — and two executors will fill it differently.

## 1. Split by responsibility, never by file

A file is where code happens to live. A responsibility is what the system must do. Decomposing by
file produces tasks that cannot be reasoned about, cannot be verified independently, and collide
the moment two of them touch the same module.

```text
WRONG                                RIGHT
TASK-1: modify fileA.ts              TASK-1: Define the session-validation contract
TASK-2: modify fileB.ts              TASK-2: Implement validation semantics in the domain
TASK-3: modify fileC.ts              TASK-3: Adapt consumers to the new contract
                                     TASK-4: Add regression coverage for expiry
```

The right-hand column can be reviewed against its intent, tested independently, reassigned to
another agent, and executed in a different order. The left-hand column can only be diffed.

Every task aims for: **high cohesion, low coupling, a single responsibility, explicit dependencies,
a verifiable result, and a bounded scope.**

### Sizing

A task is the right size when one executor can complete it after reading its task file, at most ~5
referenced artifacts, and roughly ~10 code files — and its acceptance can be checked by running
something.

Split when: it crosses an architectural boundary (a contract _and_ its consumers), it mixes
investigation with implementation, it has two acceptance criteria that could pass independently, or
it would touch a module its executor has no context for.

Merge when: two "tasks" always change together, share the same test, and have no independent
verifiable outcome. Two tasks that must be integrated as one are one task.

## 2. Task anatomy

Use `templates/TASK.md`. Every field is there because its absence has a specific failure mode:

| Field                         | Absent → the executor…                       |
| ----------------------------- | -------------------------------------------- |
| `Objective`                   | optimizes for the wrong thing                |
| `Architectural Context`       | redesigns the system from scratch            |
| `Problem Being Solved`        | fixes the symptom it happens to see first    |
| `Exact Responsibility`        | takes over an adjacent one too               |
| `Allowed Scope`               | edits whatever seems related                 |
| `Out of Scope`                | "improves" things nobody asked about         |
| `Dependencies` / `Blocks`     | starts before its input exists               |
| `Inputs` / `Expected Outputs` | invents a shape its consumer will not accept |
| `Contracts`                   | reinterprets an existing agreement           |
| `Relevant ADRs`               | re-litigates a decision already made         |
| `Relevant Invariants`         | breaks something silently                    |
| `Constraints`                 | picks a solution that was already excluded   |
| `Known Risks` / `Edge Cases`  | discovers them in production                 |
| `Required Tests`              | ships a fix with no proof it works           |
| `Acceptance Criteria`         | declares done when it compiles               |
| `Definition of Done`          | leaves the memory and the handoff unwritten  |
| `Forbidden Actions`           | disables a lint rule to get green            |

**The test for a finished task contract:** could a competent engineer with no access to this
conversation execute it correctly? If they would have to guess a global decision, the contract is
incomplete — not the engineer.

## 3. Scope control

Both lists are explicit, and both are paths or named surfaces — never adjectives.

```text
Allowed Scope:
  src/auth/session/**
  src/domain/session.ts
  tests/session/**

Out of Scope:
  UI components               permissions model          the user schema
  global renaming             dependency upgrades        unrelated refactors
  formatting passes           anything under src/billing/**
```

Rules:

- **An executor does not improve anything outside its task.** Not a typo, not a lint warning, not
  an obviously dumb function. It records the finding and moves on.
- A finding outside scope goes to the report and to `FINDINGS_LOG.md`; the Brain decides whether it
  becomes a task.
- If the task genuinely cannot be completed inside its scope, that is a `BLOCKER`, not a license to
  widen it (see `subagent-protocol.md`).
- Scope widening is a contract change: `REV-##`, or cancel and supersede. Never silent.

**Why this is strict:** out-of-scope edits are invisible in review (they look like noise in the
diff), they break other agents' assumptions mid-wave, and they are the mechanism by which a
two-file fix becomes a forty-file diff nobody can verify.

## 4. Temporary ownership

While a task is `IN_PROGRESS`, it may claim exclusive write access to specific paths or surfaces:

```text
Temporary Ownership (TASK-004, until DONE):
  src/auth/AuthCoordinator.ts
  src/auth/session-validation.ts
```

No other agent writes to those paths without coordination through the Brain. This is _operational_
ownership for the duration of the wave — it says nothing about who owns the component
architecturally. Record claims in `PROJECT_STATE.md`, and release them when the task closes.

## 5. The dependency graph

Model tasks as a DAG, and derive two things from it: what must be sequenced, and what may actually
run at the same time.

```text
T1 Confirm root cause
     ↓
T2 Define SessionValidationResult contract     ← extracted so T3 and T4 stop colliding
     ├── T3 Implement domain semantics
     └── T4 Adapt infrastructure consumers
               ↓
T5 Integrate
     ↓
T6 Regression coverage

Parallelizable: T3 ∥ T4
Critical path:  T1 → T2 → T3 → T5 → T6
```

Requirements: no cycles; every edge is a real dependency (an output one task produces and another
consumes), not a preference about order; the critical path is named, because that — not the total
task count — determines how long the work takes.

**Extract the shared contract first.** Whenever two tasks would both need to change the same
interface, type, schema, or event shape, pull that change into its own upstream task. This one move
converts a guaranteed merge conflict plus two divergent interpretations into a single decision made
once. It is the highest-leverage step in the entire decomposition.

## 6. Parallel-safety conflict matrix

Check every candidate pair before running them at the same time. Availability of agents is not a
reason to parallelize; independence is.

| Shared between two tasks                                                                                    | Parallel?                                                            |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| The same file                                                                                               | **Never**                                                            |
| The same contract / interface / shared type they both modify                                                | **Never** — extract it into an upstream task first                   |
| Producer and consumer of the same output                                                                    | **Never** — sequence them, or freeze the contract upstream           |
| The same DB migration chain                                                                                 | **Never** — migration order is global state                          |
| The same generated artifact (client, snapshot, schema dump)                                                 | **Never**                                                            |
| The same lockfile / dependency manifest                                                                     | **Never**                                                            |
| The same test file or fixture                                                                               | **Never**                                                            |
| The same config file                                                                                        | **Never** unless keys are disjoint _and_ the file is not regenerated |
| The same module, different files, with the module's public surface already frozen by a merged contract task | Yes, with care — re-check at integration                             |
| Different modules, no shared symbols, no shared state                                                       | Yes                                                                  |

When a conflict exists, choose one of four resolutions, in this order of preference:

1. **Extract the shared thing** into an upstream task (best — removes the conflict).
2. **Sequence** the two tasks (simple, costs wall-clock time).
3. **Re-split** the work along a boundary that is actually independent.
4. **Assign temporary ownership** (§4) and keep the other task away from those paths.

Before launching a wave, also verify: no hidden dependency through a shared runtime singleton, no
two tasks editing the same ADR, and no two tasks whose acceptance criteria can only both pass if
one of them wins.

## 7. Investigation tasks

Not every task produces code. When an unknown could invalidate the plan, the correct next artifact
is an investigation task, not an optimistic implementation task.

```markdown
# TASK-002 — Determine the real owner of session-expiration semantics

Type: INVESTIGATION
Status: READY

## Objective

Establish, with evidence, which component decides that a session is expired, and whether any
other path can authenticate a request without consulting it.

## Expected Outputs

- The flow, end to end, with file:line references
- Every component that participates
- Evidence for each claim, with confidence level
- A recommendation, and the architectural impact of each option
- Any invariant this reveals

## Out of Scope

Any code change whatsoever. This task produces knowledge, not commits.

## Definition of Done

- [ ] Findings persisted to FINDINGS_LOG.md with IDs
- [ ] OPEN_QUESTIONS.md updated (answered questions closed, new ones added)
- [ ] A recommendation the Brain can decide on without re-investigating
```

**Prioritize investigation by, in order:** uncertainty (how little we know), risk (what breaks if
we are wrong), impact (how much of the plan depends on it), dependency (how many tasks are blocked
by it), reversibility (how expensive it is to undo a wrong guess).

Investigate first whatever could invalidate the largest portion of the plan. Answering a cheap
question that changes nothing feels productive and is not.

## 8. Revisions

Tasks do not change silently. If the objective, scope, contract, dependencies, architecture, or
acceptance criteria change, append to the task file:

```markdown
## Revision History

### REV-01 — 2026-08-07

Reason: F-021 showed the cache layer also decides validity.
Changed: Allowed Scope now includes src/cache/session-cache.ts; added AC-4 for cache invalidation.
Affected Tasks: TASK-006 (its input contract is unchanged), TASK-008 (BLOCKED pending this).
```

If the change is substantial enough that the original task is no longer recognizable — a different
responsibility, a different contract, a different owner — **cancel it and create a new one**. A
task rewritten in place lies to anyone who read the earlier version, including the agent currently
executing it.

## 9. Good and bad tasks

### Bad — a file with a verb attached

```markdown
# TASK-003 — Fix AuthCoordinator

Objective: Fix the session bug in AuthCoordinator.ts.
Scope: src/auth/
Acceptance: The bug is fixed.
```

Why it fails: no problem statement, so the executor diagnoses it again — differently. No contract,
so it invents a return shape. `src/auth/` as scope permits rewriting the whole module. "The bug is
fixed" cannot be verified by anyone else. Nothing prevents a refactor. No test is required.

### Bad — parallel tasks with a hidden collision

```markdown
TASK-005 — Add `reason` to SessionValidationResult (src/domain/session.ts)
TASK-006 — Add `expiresAt` to SessionValidationResult (src/domain/session.ts)
Both READY, both dispatched in the same wave.
```

Why it fails: the same type, in the same file, changed by two agents. They will conflict, and if
they somehow do not, the surviving shape is whichever agent wrote last. Correct move: one upstream
contract task defines the final shape of `SessionValidationResult`; the consumers follow.

### Bad — investigation smuggled into implementation

```markdown
# TASK-007 — Figure out why sessions leak and fix it
```

Why it fails: an executor that cannot find the cause will implement _something_ rather than return
empty-handed. Split: an investigation task that returns evidence, then an implementation task whose
contract is written from that evidence.

### Good

```markdown
# TASK-004 — Centralize session-validity semantics in AuthCoordinator

Status: READY
Depends On: TASK-002 (investigation, DONE) · Blocks: TASK-006, TASK-007
Relevant ADRs: ADR-004 · Relevant Invariants: INV-001, INV-003

## Objective

Make AuthCoordinator the single component that decides whether a session is valid, so that no
caller can authenticate a request against an expired session through any path.

## Problem Being Solved

PROBLEM_MODEL.md — root cause: validity is decided in two places (AuthCoordinator and
SessionCache), and the cache path has no invalidation on expiry. [CONFIRMED — F-021]

## Exact Responsibility

Own the validity decision and expose it through one contract. Do not change how sessions are
stored, issued, or revoked.

## Allowed Scope

src/auth/AuthCoordinator.ts · src/auth/session-validation.ts · src/domain/session.ts
tests/auth/session-validation.test.ts

## Out of Scope

src/cache/\*\* (TASK-005 owns it) · permissions · the user schema · any renaming outside the
symbols listed above · dependency changes

## Contracts

Produces: `AuthCoordinator.validateSession(id: SessionId): SessionValidationResult`
where `SessionValidationResult = { valid: true, session: Session } | { valid: false, reason: 'expired' | 'revoked' | 'not_found' }`
This shape is frozen by ADR-004. If it is wrong, raise a CONTRACT CONFLICT — do not adjust it.

## Relevant Invariants

INV-001 — An expired session must never authenticate a request.
INV-003 — Validation must not perform a write.

## Known Risks

Three call sites currently branch on the old boolean return; missing one silently re-enables the
bug. They are enumerated in the handoff of TASK-002.

## Edge Cases

Session expiring between validation and use · clock skew · a session revoked while valid.

## Required Tests

A regression test that fails on the current code: an expired session must be rejected through the
cached path. Plus unit coverage for each `reason` branch.

## Acceptance Criteria

- [ ] AC-1 `validateSession` is the only place `isExpired()` is called (verifiable by grep).
- [ ] AC-2 The regression test fails before the change and passes after it.
- [ ] AC-3 All three known call sites consume the new result type; none branches on a boolean.
- [ ] AC-4 INV-001 and INV-003 hold, demonstrated by tests.

## Forbidden Actions

Changing the cache layer · widening scope to src/billing · deleting or skipping any existing test ·
adding a dependency · disabling a lint or type rule.
```

Why it works: the executor knows what to build, what shape to produce, what never to break, what to
prove, and where to stop — without making a single global decision on its own.

## 10. Pre-delegation checklist

Run the Task Quality Gate in `SKILL.md` on every task. Two or more unchecked boxes means the task
gets redesigned, not delegated — the cost of fixing a bad task is minutes now and a wasted agent
run plus a corrupted contract later.
