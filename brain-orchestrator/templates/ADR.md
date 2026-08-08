<!--
Target: .agent/adr/ADR-00X-<slug>.md
An ADR explains WHY a decision was made and what it rejected. It is not a log, not a status
report, and not a design document. Write one when a decision affects more than one task, defines
ownership, changes a contract, moves a boundary, introduces an abstraction, or discards a serious
alternative — otherwise the ADR folder becomes noise and nobody reads any of it.
-->

# ADR-00X — <decision stated as a claim, e.g. "Session validity owned by AuthCoordinator">

**Status:** PROPOSED | ACCEPTED | REJECTED | SUPERSEDED
**Date:** <YYYY-MM-DD>
**Deciders:** Brain <!-- add the user when the decision was escalated -->

## Context

<What forced a decision: the problem, the constraint, the conflict. Enough that someone in six
months understands the pressure without reading the whole conversation. State facts with their
evidence level; do not argue for the outcome here.>

## Decision

<The decision, in one or two sentences, in the active voice. "AuthCoordinator owns the session
validity decision and exposes it through SessionValidationResult.">

## Evidence

| #   | Fact                           | Source                    | Confidence |ßß
| --- | ------------------------------ | ------------------------- | ---------- |
| E1  | <fact that drove the decision> | `<path:line>` / `<F-0XX>` | CONFIRMED  |

## Alternatives Considered

### Option A — <name>

Pros: <…>
Cons: <…>

### Option B — <name>

Pros: <…>
Cons: <…>

## Rationale

<Why the chosen option wins given the evidence and the optimization priority
(correctness > architectural coherence > regression safety > maintainability > traceability >
parallelism > speed). Name explicitly what the rejected options would have cost.>

## Consequences

**Positive**

- <what becomes easier, safer, or clearer>

**Negative**

- <what becomes harder, slower, or more constrained — every real decision has these; an ADR with
  no negative consequences was not a decision>

**Mitigation type** <!-- only if this decision knowingly does not fix the root cause -->

- MITIGATION: <what remains broken, and the open question tracking it (Q-00X)>

## Affected Components

- `<path>` — <how>

## Affected Tasks

- TASK-00X — <created / revised / cancelled by this decision>

## Related Invariants

- INV-00X — <established, preserved, or retired by this decision>

## Supersedes

- ADR-00W <!-- and mark that file SUPERSEDED with a pointer back here -->

## Superseded By

- <ADR-00Z, when this one is retired — never delete a superseded ADR>
