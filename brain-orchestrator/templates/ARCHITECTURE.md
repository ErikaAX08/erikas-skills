<!--
Target: .agent/memory/ARCHITECTURE.md
How the relevant part of the system actually works — current state only, in one voice.
Cover only what this operation touches; this is not a whole-repo textbook.
Every claim carries Confidence + Evidence + Verified. When the model changes, rewrite the
statement — never stack revisions here. History belongs in ADRs and logs.
-->

# Architecture — <area, e.g. "Authentication & session handling">

**Scope of this document:** <which part of the system is modeled, and which parts are deliberately not>
**Last updated:** <YYYY-MM-DD>

## Flow

```text
<entry point> → <component> → <component> → <persistence>
                     │
                     └── emits <event> → <consumer>
```

<!-- Draw the path the operation touches. A list of files is not a model. -->

## Components and Ownership

| Component | Responsibility   | Owns                        | Does not own                             | Confidence | Verified |
| --------- | ---------------- | --------------------------- | ---------------------------------------- | ---------- | -------- |
| `<path>`  | <what it is for> | <the decision/data it owns> | <what people assume it owns but doesn't> | CONFIRMED  | <date>   |

## Contracts

| Contract | Shape                   | Producer | Consumers          | Confidence | Verified |
| -------- | ----------------------- | -------- | ------------------ | ---------- | -------- |
| `<name>` | `<signature or schema>` | `<path>` | `<path>`, `<path>` | CONFIRMED  | <date>   |

## Data and Control Flow Notes

- FACT: <statement>
  Evidence: `<path:line>` or `<command + result>` · Confidence: CONFIRMED | LIKELY · Verified: <date>

## Boundaries and Coupling

- <module A> depends on <module B> through <interface>; the reverse direction does not exist. <Confidence · Verified>
- Tight coupling: <where>, because <why> — this is where regressions concentrate.

## Shared and Global State

| State | Where it lives | Who writes it | Who reads it | Risk |
| ----- | -------------- | ------------- | ------------ | ---- |

## Integration Points

| External system | Direction | Contract | Failure mode |
| --------------- | --------- | -------- | ------------ |

## Known Unknowns

- UNKNOWN: <what has not been investigated> — matters because <reason>, tracked as Q-00X.

## Target State (only while a change is in flight)

<!-- What the architecture becomes after the accepted design lands, with the ADR that decided it.
     Delete this section once the change is integrated and the sections above describe reality. -->

- After ADR-00X: <component> owns <responsibility>; <contract> replaces <old contract>.
