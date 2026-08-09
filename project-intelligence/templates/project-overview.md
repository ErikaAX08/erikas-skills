<!--
Target: .ai/project-overview.md   (or docs/ai/project-overview.md)
The stable identity of the project, plus the index into every other document.
Keep it short (~80 lines) and slow-moving. It is NOT a changelog and NOT a place for detail:
anything that changes weekly belongs in the document that owns it.
Every non-obvious claim carries Confidence + Evidence.
-->

# Project Overview — <project name>

**Knowledge base location:** `.ai/` | `docs/ai/`
**Last verified:** <YYYY-MM-DD> against <paths inspected>

## Purpose

<What this system does, for whom, in 2–4 lines. Business purpose, not a technology list.>

## Repository Shape

| Aspect         | Value                                    | Confidence | Evidence           |
| -------------- | ---------------------------------------- | ---------- | ------------------ |
| Type           | single service / monorepo / library      | CONFIRMED  | `<path>`           |
| Packages       | `<app>`, `<lib>` …                       | CONFIRMED  | `<workspace file>` |
| Package manager| <pnpm / poetry / go / maven>             | CONFIRMED  | `<lockfile>`       |

## Core Stack

<!-- Core only: what the system is built on. Linters, formatters and small utilities do not belong. -->

| Layer          | Technology            | Confidence | Evidence            |
| -------------- | --------------------- | ---------- | ------------------- |
| Language       | <lang + version>      | CONFIRMED  | `<path>`            |
| Runtime        | <runtime + version>   | CONFIRMED  | `<path>`            |
| Framework      | <framework>           | CONFIRMED  | `<path>`            |
| HTTP layer     | <library>             | CONFIRMED  | `<path>`            |
| Data access    | <ORM / client>        | CONFIRMED  | `<path>`            |
| Database       | <engine(s)>           | CONFIRMED  | `<path>`            |
| Authentication | <mechanism>           | CONFIRMED  | `<path>`            |
| Async/messaging| <queue / bus>         | CONFIRMED  | `<path>`            |
| Testing        | <framework(s)>        | CONFIRMED  | `<path>`            |
| Infrastructure | <IaC tooling>         | CONFIRMED  | `<path>`            |
| CI/CD          | <platform>            | CONFIRMED  | `<path>`            |
| Observability  | <logging / tracing>   | INFERRED   | `<path>`            |

## Architecture (one line + pointer)

<Pattern actually derived, or "no consistent pattern".> — see `architecture.md`.

## Deployment (one line + pointer)

<Where it runs and how it gets there.> — see `infrastructure.md` and `environments.md`.

## Main Modules

| Module   | Responsibility        | Entry point |
| -------- | --------------------- | ----------- |
| `<name>` | <what it is for>      | `<path>`    |

## Getting It Running

```bash
<the verified sequence: dependencies, config, migrations, seed, start, test>
```

<!-- Verified against the scripts that exist, not copied from the README. Note any disagreement. -->

## Index

| Question                                   | Document              |
| ------------------------------------------ | --------------------- |
| Where does responsibility X live?          | `project-map.md`      |
| How do the parts depend on each other?     | `architecture.md`     |
| What cloud/CI resources exist?             | `infrastructure.md`   |
| Which third parties are called?            | `integrations.md`     |
| What is the data model, and who writes it? | `database.md`         |
| Which environments and variables exist?    | `environments.md`     |
| How does business process X run?           | `flows/`              |
| Why is it built this way?                  | `decisions/`          |
| What changed, and how did it work before?  | `changes/`            |
| What is still unknown?                     | `investigation-log.md`|

## Coverage

**Inspected:** <areas actually examined>
**Not inspected:** <areas not examined>
**Blind spots:** <what cannot be determined from this repository>
