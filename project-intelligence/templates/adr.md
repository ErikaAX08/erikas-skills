<!--
Target: .ai/decisions/ADR-###-<slug>.md   (or the project's existing ADR folder, if it has one)
One architectural decision per file. IDs are never reused and never renumbered.
Write one when a decision defines ownership, changes a contract, moves a boundary, adds
infrastructure or a dependency, or rejects a serious alternative. A decision with no rejected
alternative is usually not a decision — it is a default, and it does not need an ADR.
An ADR is never rewritten when the decision changes: it is marked SUPERSEDED and a new one is
written, because the reasoning of the old one is exactly what the next person needs.
-->

# ADR-###: <decision, phrased as the choice made>

**Status:** PROPOSED | ACCEPTED | REJECTED | SUPERSEDED by ADR-###
**Date:** <YYYY-MM-DD>
**Deciders:** <who>
**Supersedes:** <ADR-###, if any>

## Context

<The situation that forced a decision. Constraints that were real at the time: scale, deadline,
team size, existing infrastructure, cost, compliance. Include what was true then even if it is no
longer true — that is what makes a past decision legible instead of baffling.>

## Problem

<The specific question being decided, in one or two sentences.>

## Options Considered

### Option A — <name>

- Pros: <…>
- Cons: <…>

### Option B — <name>

- Pros: <…>
- Cons: <…>

## Decision

<What was chosen, stated plainly.>

**Reason:** <why this one, and specifically why not the others.>

## Consequences

**Positive**

- <…>

**Negative**

- <…>

**Accepted trade-offs**

- <what this knowingly gives up, so nobody later "discovers" it as a bug>

## Affected

```md
Components:   <paths>
Contracts:    <what changes shape>
Data:         <schema or migration implications>
Infrastructure: <what must be provisioned>
Documents:    <which knowledge-base documents this changes>
```

## Follow-up

- <work this decision creates but does not itself do>
