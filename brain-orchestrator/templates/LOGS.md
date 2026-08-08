<!--
Targets: .agent/logs/EXECUTION_LOG.md, .agent/logs/FINDINGS_LOG.md, .agent/logs/INTEGRATION_LOG.md
Three append-only logs, three different jobs. None of them is a transcript of reasoning.
This file holds the shape of all three — split it into the three target files.
-->

# EXECUTION_LOG.md

<!--
Chronological events, newest section last. Events, not narration: a status change, a decision,
a blocker, a replan, a checkpoint. A few lines each. If an entry does not change what someone
would do next, it does not belong here.
-->

## 2026-08-07

- TASK-003 DONE — session-expiry investigation; see handoff.
- ADR-004 ACCEPTED — AuthCoordinator owns session validity.
- TASK-004 IN_PROGRESS — owns `src/auth/AuthCoordinator.ts`, `src/auth/session-validation.ts`.
- TASK-005 BLOCKED — CONTRACT CONFLICT on `SessionValidationResult.reason`; Brain deciding.
- Replan triggered by F-021: TASK-006 revised (REV-01), TASK-008 cancelled → TASK-012.

## 2026-08-08

- <next day's events>

---

# FINDINGS_LOG.md

<!--
Only findings that change something: architecture, a task, a hypothesis, a decision, or an
explanation of significant behavior. Not every file opened, not every search run.
-->

## F-021

**Date:** 2026-08-07
**Source:** TASK-003 (investigation) — `src/cache/session-cache.ts:61`
**Finding:** `SessionCache.get()` re-materializes a session from its serialized payload without
consulting `AuthCoordinator`, so an expired session can authenticate through the cached path.
**Confidence:** CONFIRMED
**Implication:** Invalidates the assumption that `AuthCoordinator` is the only authentication path.
INV-001 is currently violated in production.
**Affected:** TASK-004 (scope), TASK-006 (premise), ADR-004 (context), PROBLEM_MODEL (root cause)

---

## F-022

**Date:** <YYYY-MM-DD>
**Source:** <task, agent, or investigation> — `<path:line>` / `<command>`
**Finding:** <what is now known>
**Confidence:** CONFIRMED | LIKELY
**Implication:** <what it changes>
**Affected:** <TASK / ADR / INV / Q ids>

---

# INTEGRATION_LOG.md

<!--
What happened when changes met each other. This is what later lets you tell an implementation bug
apart from an integration bug — the two have completely different fixes.
-->

## 2026-08-07 — Wave 1 (TASK-003, TASK-004)

- TASK-004 integrated. No conflict.
- TASK-006 conflict: consumer still expected a boolean from `validateSession`.
  **Resolution:** TASK-006 adapted to the contract produced by TASK-004 (its handoff was written
  after TASK-006 had already started — brief was issued too early).
  **Prevention:** dispatch consumers only after the producer's handoff exists.
- Validation after the batch:

  | Check       | Command     | Result |
  | ----------- | ----------- | ------ |
  | Unit        | `<command>` | PASS   |
  | Integration | `<command>` | PASS   |
  | Typecheck   | `<command>` | PASS   |
  | Lint        | `<command>` | PASS   |
  | Build       | `<command>` | PASS   |

## <date> — Wave <n> (<tasks>)

- <what merged, in what order, what collided, how it resolved, what it prevents next time>
