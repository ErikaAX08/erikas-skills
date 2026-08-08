<!--
Target: .agent/memory/INVARIANTS.md
Rules that must never break, regardless of who is implementing. Every task references the
invariants that apply to it, by ID. An invariant that stops being true is RETIRED with a
reason and a date — never deleted, never silently edited.
-->

# Invariants

## INV-001

**Status:** ACTIVE
**Scope:** <area, e.g. authentication>
**Rule:** <one sentence, stated as something that must never happen or must always hold>
**Why:** <the consequence if it breaks>
**Evidence:** `<path:line>` / `<test that enforces it>` / `<ADR-00X>`
**Confidence:** CONFIRMED | LIKELY
**Verified:** <YYYY-MM-DD>
**Enforced by:** <test, type, runtime check — or "convention only", which is the weakest form>
**Referenced by:** TASK-00X, TASK-00Y, ADR-00Z

---

## INV-002

**Status:** RETIRED — <YYYY-MM-DD>
**Retired because:** <what changed; e.g. "superseded by INV-005 after ADR-006 moved ownership">
**Original rule:** <the rule as it stood>

---

<!--
Examples of well-formed invariants:

INV-001  An expired session must never authenticate a request, through any path including caches.
INV-003  Session validation must not perform a write.
INV-004  Every public API response conforms to the envelope defined in the API standard.
INV-007  No domain module imports from the infrastructure layer.

Badly-formed (too vague to enforce, too weak to reference):
  "The code should be clean."
  "Avoid coupling."
  "Handle errors properly."
-->
