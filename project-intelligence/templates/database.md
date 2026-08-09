<!--
Target: .ai/database.md
Engines, access layer, and the logical data map. See references/data-and-config.md, Part 1.
Do NOT restate the schema column by column — the schema file already owns that and this copy
would drift. The value here is ownership and consequence: who writes each table, who reads it,
what fires when it changes, and which constraints bite. Record writes that happen OUTSIDE the
obvious code path (a Lambda, a job, a migration, another service) — they are invisible from the
schema and they are what breaks a "quick test insert".
-->

# Database

**Last verified:** <YYYY-MM-DD> against <paths>

## Engines

| Engine   | Role                                     | Authoritative? | Access from | Evidence |
| -------- | ---------------------------------------- | -------------- | ----------- | -------- |
| <Postgres> | <source of truth for transactional data> | yes          | `<path>`    | `<path:line>` |
| <Redis>  | <cache / sessions / queue backend>       | no             | `<path>`    | `<path:line>` |

## Access Layer

```md
ORM / client:   <name + version>            <path:line>
Client created: <path:line>  ·  <singleton? pooled? per-request?>
Pool:           <size / timeouts>           <path:line>
Raw SQL:        <where it exists, if it does>
Transactions:   <used at which layer; is correctness dependent on them?>
Read replicas:  <yes/no>
Multi-tenancy:  <none | column | schema | database> — tenant selected at <path:line>
```

## Schema Source & Migrations

| Aspect            | Value                        | Evidence  |
| ----------------- | ---------------------------- | --------- |
| Schema definition | `<path>`                     |           |
| Migration tool    | <name>                       | `<path>`  |
| Migration command | `<command>`                  | `<path>`  |
| Run on deploy?    | <automatic / manual>         | `<path:line>` |
| Seeds             | `<path>` — <idempotent?>     |           |
| Test data         | <factories / fixtures>       | `<path>`  |

## Logical Data Map

<!-- One block per significant table/collection. Ownership and consequence, not columns. -->

### `<table>`

```md
Source:       <path:line>
Primary key:  <field + type>
Unique:       <constraints that will reject an insert>
Required:     <fields with no default that must be supplied>
Relations:    <table>.<col> → <table>.<col>  (<cardinality>, ON DELETE <action>)
Soft delete:  <field, and whether read paths must filter it>

Written by:   <component>   <path:line>
              <component>   <path:line>       ← <note when a write bypasses the API>
Read by:      <components>

Side effects on write: <events · triggers · outbox · listeners · emails · jobs>
Constraints that bite:  <the non-obvious ones that break a manual insert>
Volume:       <rough scale, if known — decides whether a full scan is safe>
```

## Relationship Overview

```text
<table> 1──N <table> ──N <table>
```

## Indexes That Matter

| Table    | Index    | Query it supports | Consequence if dropped |
| -------- | -------- | ----------------- | ---------------------- |
| `<name>` | `<name>` | `<path:line>`     | <full scan on a hot path> |

## Triggers, Views & Stored Procedures

| Object   | Type     | Does                | Defined in |
| -------- | -------- | ------------------- | ---------- |
| `<name>` | <type>   | <behavior>          | `<path>`   |

## Data Risks

- <e.g. "`orders` is written by both the API and the reconciliation job; there is no lock or
  version column"> — `<path:line>` · CONFIRMED

## Known Unknowns

- UNKNOWN: <what could not be determined> — <why it matters>
