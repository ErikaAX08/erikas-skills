<!--
Target: .ai/architecture.md
The architecture the code ACTUALLY has — derived from dependency direction and real imports,
never from folder names. Current state only, in one voice; history belongs in decisions/ and
changes/. "No consistent pattern" is a legitimate and common finding — record it plainly.
The Violations section is the most valuable part of this file: it is what a newcomer would
otherwise copy.
-->

# Architecture

**Last verified:** <YYYY-MM-DD> against <paths>

## Pattern

**Detected:** <MVC | layered | modular monolith | hexagonal | clean | onion | CQRS | DDD |
event-driven | microservices | serverless | custom | no consistent pattern>
**Confidence:** CONFIRMED | INFERRED
**Derived from:** <the imports actually read, with paths — not the folder names>
**Consistency:** <applied everywhere | only in `<modules>` | newer modules only>

## Entry Points

| Type                     | Location  | Notes                     |
| ------------------------ | --------- | ------------------------- |
| HTTP / GraphQL           | `<path>`  | <router, prefix, versioning> |
| Queue / stream consumer  | `<path>`  | <source>                  |
| Scheduled job            | `<path>`  | <schedule>                |
| CLI command              | `<path>`  |                           |
| Webhook receiver         | `<path>`  | <sender, verification>    |
| Lambda handler           | `<path>`  | <trigger>                 |

## Layers and Dependency Rule

```text
<layer>  →  <layer>  →  <layer>  →  <persistence>
```

**Rule as implemented:** <e.g. "controllers depend on application services; application depends on
domain interfaces; infrastructure implements them and is wired at the composition root">
**Evidence:** `<path:line>` · `<path:line>`

## Representative Path

```text
<HTTP request>
    ↓
<Controller>            <path>
    ↓
<Application service>   <path>
    ↓
<Domain>                <path>
    ↓
<Repository interface>  <path>
    ↓
<Infrastructure impl>   <path>
    ↓
<Datastore>
```

## Modules and Boundaries

| Module   | Owns                    | Depends on         | Must not depend on | Confidence |
| -------- | ----------------------- | ------------------ | ------------------ | ---------- |
| `<name>` | <responsibility / data> | `<modules>`        | `<modules>`        | CONFIRMED  |

## Communication Between Components

| Mechanism             | Used for       | Where            | Synchronous? |
| --------------------- | -------------- | ---------------- | ------------ |
| Direct call / DI      | <purpose>      | `<path>`         | yes          |
| Domain event          | <purpose>      | `<path>`         | <yes/no>     |
| Queue / topic         | <purpose>      | `<path>`         | no           |
| HTTP to another service | <purpose>    | `<path>`         | yes          |

## Conventions That Are Not Obvious

<!-- The rules that are real but written nowhere — the ones a change is likely to break silently. -->

- <e.g. "every read path must filter `deleted_at`; there is no global scope enforcing it"> —
  `<path:line>` · CONFIRMED

## Violations and Inconsistencies

| # | Rule broken                        | Where                | Evidence     | Impact                        |
| - | ---------------------------------- | -------------------- | ------------ | ----------------------------- |
| 1 | <e.g. domain imports infrastructure> | `<path>`           | `<path:line>`| <what it makes hard or risky> |

<!-- State the violation, not a verdict on the author. These are facts about the codebase and
     the first thing a newcomer needs, because the codebase teaches by example. -->

## Regression Risk Concentration

- `<path or module>` — <why a change here is disproportionately risky>

## Known Unknowns

- UNKNOWN: <what was not determined> — matters because <reason>; would be confirmed by <how>.
