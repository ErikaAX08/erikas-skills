# Project Intelligence

The technical brain and living memory of a software project. It builds an evidence-backed model of
how a system is actually built, deployed, connected, stored, configured, and changed — then answers
from it, keeps it true, and hands it to whoever works on the project next.

It behaves like a senior engineer who has been on the project for years, with one difference: it may
only claim what it can prove from the repository. Everything else is labelled `INFERRED` or
`UNKNOWN`, out loud.

## What it answers

```text
What technologies does this project use?          Which AWS services exist, and what for?
Which external services does it consume?          Which databases, and how does it connect?
Where does functionality X live?                  What architecture does it follow — really?
What are the main business flows?                 Which environment variables exist?
Which environments exist, and how do they differ? How do I test this flow safely?
What changed recently, and why?                   How did it work before? How does it work now?
What breaks if I modify this?                     What do we still not know?
```

## The model

```text
                         REPOSITORY
        code · config · IaC · CI/CD · migrations · docs · git history
                              │
                              ▼
                   ┌──────────────────────┐
                   │ PROJECT INTELLIGENCE │
                   │  discover · interpret│
                   │  model · verify      │
                   └──────────┬───────────┘
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
     ┌────────────────────┐          ┌────────────────────┐
     │  PROJECT MEMORY    │          │      ANSWERS       │
     │  .ai/              │          │  evidence-backed   │
     │  overview · map    │◀────────▶│  CONFIRMED         │
     │  architecture      │  keeps   │  INFERRED          │
     │  infrastructure    │  true    │  UNKNOWN           │
     │  integrations      │          └─────────┬──────────┘
     │  database          │                    │
     │  environments      │                    ▼
     │  flows · decisions │            impact analysis
     │  changes · log     │            context packages
     └────────────────────┘            safe real operations
```

Memory is a cache of the repository — never an authority over it. On any contradiction the code
wins, the document is corrected on the spot, and the contradiction itself gets recorded.

## Contents

```text
project-intelligence/
├── SKILL.md                                # the operational skill — modes, rules, confidence system
├── references/
│   ├── discovery-protocol.md               # what to read, in what order, and when to stop
│   ├── infrastructure-inventory.md         # AWS/containers/CI-CD/messaging + external integrations
│   ├── data-and-config.md                  # databases, env vars, environments
│   ├── safe-operations.md                  # the gate before any real DB or cloud operation
│   └── memory-protocol.md                  # .ai/ layout, write triggers, staleness, economy
└── templates/
    ├── project-overview.md   project-map.md      architecture.md
    ├── infrastructure.md     integrations.md     database.md
    ├── environments.md       flow.md             change.md
    ├── adr.md                investigation-log.md  context-package.md
```

`SKILL.md` is the entry point; references load on demand, so a single question never pays for the
whole method.

## Modes

| Mode          | Ask it for                                              |
| ------------- | ------------------------------------------------------- |
| **BOOTSTRAP** | "Map this project" — breadth-first, depth on demand     |
| **REFRESH**   | "Is what we know still true?" — staleness check + fixes |
| **ANSWER**    | Any question about the system, answered with evidence   |
| **IMPACT**    | "What breaks if I change this?"                         |
| **RECORD**    | "Write down what this change did and why"               |
| **OPERATE**   | A real database or cloud operation, run safely          |
| **HANDOFF**   | A context package for another agent or session          |

## Install

| Tool                     | How                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Claude Code**          | Copy `project-intelligence/` into the project's `skills/` folder, or `~/.claude/skills/` for every project   |
| **Kiro CLI**             | Same folder; reference `SKILL.md` from the agent's resources                                                 |
| **Cursor**               | Add `SKILL.md` as `.cursor/rules/project-intelligence.mdc`; keep `references/` and `templates/` alongside it |
| **Windsurf / Cline**     | Copy `SKILL.md` into the rules folder; keep the folder structure for the references                          |
| **ChatGPT (Custom GPT)** | Upload all files in the Knowledge section                                                                    |

Keep the folder intact — `SKILL.md` references `references/*` and `templates/*` by relative path.

## Quick start

```text
Use the project-intelligence skill to map this project.

Use the project-intelligence skill: what does this project use from AWS?

Use the project-intelligence skill: where are users created, end to end?

Use the project-intelligence skill: what breaks if I change the payment status enum?

Use the project-intelligence skill to record what this change did and why.

Use the project-intelligence skill: I need to insert a test user — figure out the safe way.

Use the project-intelligence skill: build a context package for the payments area.
```

A first run maps the project breadth-first, writes `.ai/project-overview.md`, `environments.md` and
the top level of `project-map.md`, states which areas it did **not** inspect, and lists what it could
not determine. Depth comes later, per domain, when a question actually needs it.

## Safety

The skill knows the flows, which is exactly what makes it capable of doing real damage — a "harmless
test insert" that emails four thousand real customers. `references/safe-operations.md` is therefore
binding before any real operation:

- The environment is resolved by following the configuration chain, **never** from a name.
- An unidentified environment is treated as production.
- Production and unknown environments require explicit authorization for that exact operation.
- Non-database side effects — emails, webhooks, payments, queue consumers — are enumerated first.
- Secret values are never read into memory, printed, or stored.

## Relationship to the other skills here

| It delegates to                                   | For                                               |
| ------------------------------------------------- | ------------------------------------------------- |
| `code-architecture-explainer`                     | Explaining one module's internals in depth        |
| `brain-orchestrator`                              | Planning, decomposing, and delegating a change    |
| `verify-before-implement`                         | Confirming a fact immediately before writing code |
| `pre-pr-review`                                   | Reviewing the resulting diff                      |
| `git-commits` / `create-pull-request`             | Commit messages and PR descriptions               |
| `backend-api-standards` / `frontend-architecture` | Contract shape and layering, when active          |

**`.ai/` vs `brain-orchestrator`'s `.agent/`.** `.ai/` describes **the system** and outlives every
task; `.agent/` describes **one operation on the system** and ends with it. The Brain's discovery
phase should read `.ai/` instead of rediscovering the project, and when an operation closes its
durable conclusions graduate into `.ai/`. Never store the same fact in both.

## The one principle

```text
Everything asserted is traceable to the repository.
Everything inferred says so.
Everything unknown is named rather than filled in.
And none of it is worth writing down if the code contradicts it.
```
