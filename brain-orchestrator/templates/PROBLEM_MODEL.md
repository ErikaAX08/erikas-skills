<!--
Target: .agent/memory/PROBLEM_MODEL.md
The single shared definition of the problem, so that no two agents are solving different ones.
One problem per file; a second problem gets PROBLEM_MODEL-<slug>.md.
-->

# Problem Model — <short title>

**Problem ID:** PROB-00X
**Status:** OPEN | ROOT CAUSE CONFIRMED | RESOLVED
**Last updated:** <YYYY-MM-DD>

## Expected Behavior

<what should happen, stated as an observable outcome>

## Actual Behavior

<what happens instead, stated as an observable outcome>

## Difference

<the precise observable discrepancy — not "it's broken">

## Reproduction

```text
<steps, command, request, or test that produces it — or "not reproducible; detected via <source>">
```

**Frequency:** always | intermittent (<rate>) | only under <condition>

## Relevant Components

| Component | Role in this problem  |
| --------- | --------------------- |
| `<path>`  | <what it contributes> |

## Evidence

| #   | Evidence            | Source                                                  | Confidence |
| --- | ------------------- | ------------------------------------------------------- | ---------- |
| E1  | <what was observed> | `<path:line>` / `<command output>` / `<test>` / `<log>` | CONFIRMED  |
| E2  | <what was observed> | …                                                       | LIKELY     |

## Hypotheses

| #   | Hypothesis | Cheapest disproof        | Status              |
| --- | ---------- | ------------------------ | ------------------- |
| H1  | <cause>    | <what would rule it out> | DISPROVED by E2     |
| H2  | <cause>    | <what would rule it out> | SUPPORTED by E1, E3 |

## Layers

```text
Symptom:    <what the user sees>
Mechanism:  <what the code actually does>
Root cause: <why that is wrong>
```

## Root Cause

**Status:** CONFIRMED | LIKELY | UNKNOWN
**Statement:** <one sentence naming the mechanism>
**Evidence:** <E# references>

## Impact

- Affected users/flows: <who and what>
- Data consequences: <corruption, drift, none>
- Security consequences: <if any>
- Blast radius of the fix: <modules, contracts, consumers>

## Constraints

- <what must be preserved: backward compatibility, performance budget, deploy ordering, API stability>

## Invariants at Stake

- INV-00X — <rule>

## Risks

- <what could regress, and what would detect it>

## Open Questions

- Q-00X — <question> — would change <which decision> if answered <which way>

## Resolution

<!-- Filled at Phase 12. What actually fixed it, which tasks delivered it, and whether the fix
     addressed the mechanism or was an accepted mitigation. -->
