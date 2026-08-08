<!--
Target: .agent/memory/OPEN_QUESTIONS.md
Known unknowns that could change a decision. A question with no decision behind it is noise —
do not record it. Answered questions stay, with the answer and its evidence, so nobody
re-investigates them.
-->

# Open Questions

## Q-001

**Status:** OPEN
**Question:** <the question, precisely enough that an answer is checkable>
**Why it matters:** <which decision, task, or contract changes depending on the answer>
**Blocks:** TASK-00X, ADR-00Y — or "nothing yet"
**How to answer it:** <the specific investigation: which file, which command, which test, or the
one thing to ask the user>
**Priority:** <derived from: uncertainty > risk > impact > dependency > reversibility>
**Raised:** <YYYY-MM-DD> by <Brain | TASK-00X | user>

---

## Q-002

**Status:** ANSWERED — <YYYY-MM-DD>
**Question:** <the original question>
**Answer:** <the answer, in one sentence>
**Evidence:** `<path:line>` / `<command output>` / `<F-0XX>`
**Confidence:** CONFIRMED | LIKELY
**Consequence:** <what it changed: ADR-00X created, TASK-00Y revised, hypothesis H2 disproved>

---

<!--
Escalate a question to the user only when it depends on product requirements, user preference,
a business trade-off, an external constraint you cannot discover, or an irreversible action.
Everything else is answered by reading the repository — that is the Brain's job, not the user's.
-->
