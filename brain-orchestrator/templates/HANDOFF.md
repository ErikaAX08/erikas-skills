<!--
Target: .agent/handoffs/TASK-00X-HANDOFF.md
Written by the task that produced something another task consumes. The consumer reads THIS FILE
directly — the Brain does not paraphrase it into a message. Written in terms of what the consumer
needs, not as a diary of what the author did.
-->

# HANDOFF — TASK-00X

**From:** TASK-00X — <title>
**To:** TASK-00Y, TASK-00Z <!-- or "any future consumer of <contract>" -->
**Date:** <YYYY-MM-DD>
**Status of the producing task:** DONE

## What Changed

<2–5 lines: the behavioral change, stated as what the system does now that it did not before>

## Contract Produced

```text
<exact signature, type, schema, event shape, or endpoint — copy it verbatim, do not describe it>
```

**Defined in:** `<path:line>`
**Frozen by:** ADR-00X <!-- if a consumer thinks this is wrong, it raises CONTRACT CONFLICT -->

## Files Modified

| File     | What changed |
| -------- | ------------ |
| `<path>` | <one line>   |

## Important Decisions

- DECISION: <what was decided during execution and why> <!-- if it affects >1 task, it also needs an ADR -->

## Assumptions

- ASSUMPTION: <what was assumed, and its confidence level> — <what would invalidate it>

## Known Limitations

- <what this deliberately does not handle, and why>

## Risks for the Consumer

- <what the consumer must be careful about: ordering, nullability, error cases, performance,
  a migration that must run first>

## Validation Performed

| Check           | Command     | Result                      |
| --------------- | ----------- | --------------------------- |
| Regression test | `<command>` | fails before / passes after |
| Unit tests      | `<command>` | PASS                        |
| Typecheck       | `<command>` | PASS                        |
| Lint            | `<command>` | PASS                        |

## Consumer Must Know

1. <the single most important thing, stated first>
2. <the second>
3. <the third>

<!-- If the consumer only reads three lines of this file, these are the three. -->
