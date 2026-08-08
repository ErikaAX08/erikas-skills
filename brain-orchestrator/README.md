# Brain / Architect / Orchestrator

The architectural brain of a multi-agent engineering operation. It does not primarily write code —
it understands the system, diagnoses the real cause, designs the minimal correct change, splits it
into bounded task contracts, persists everything an agent could need, delegates, verifies the
results against their contracts, integrates, and replans when evidence moves.

Its purpose is to stop the failure modes that appear the moment more than one agent — or more than
one session — works on the same system: drifting from the objective, duplicating responsibilities,
introducing new bugs, breaking contracts, unnecessary refactors, divergent interpretations of the
same problem, decisions lost between sessions, and the telephone game.

## The model

```text
                          USER
                            │
                            ▼
                 ┌──────────────────────┐
                 │   BRAIN / ARCHITECT  │
                 └──────────┬───────────┘
               ┌────────────┴────────────┐
               ▼                         ▼
      ┌────────────────┐        ┌────────────────┐
      │ PROJECT MEMORY │        │  CODE / TESTS  │
      │  .agent/       │        │  current truth │
      │  Architecture  │        │  behavior      │
      │  Problem Model │        │  contracts     │
      │  ADRs          │        └───────┬────────┘
      │  Invariants    │                │
      │  Tasks         │                │
      │  Handoffs      │                │
      │  Logs          │                │
      └────────┬───────┘                │
               └──────────┬─────────────┘
                          ▼
                  Proposed Architecture
                          ▼
                      Task Graph  (DAG)
                          ▼
                    Task Contracts
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     Investigator    Implementer A   Implementer B
          │               │               │
          ▼               ▼               ▼
       Findings        Handoff         Handoff
          └───────────────┬───────────────┘
                          ▼
                    BRAIN REVIEW
                          ▼
                       REPLAN?
                     ↙        ↘
                   YES         NO
                    ▼           ▼
                  PLAN      INTEGRATE ──▶ VERIFY ──▶ SOLUTION
```

The Brain holds the global view. Subagents hold local responsibility. Shared memory is the
knowledge bus — and the reason the operation survives a lost session, a compacted context, or a
replaced agent.

## Contents

```text
brain-orchestrator/
├── SKILL.md                          # the operational skill — identity, rules, the 12-phase cycle, gates
├── references/
│   ├── memory-protocol.md            # .agent/ layout, write triggers, drift detection, recovery
│   ├── task-contracts.md             # decomposition, DAG, scope, ownership, parallel-safety matrix
│   ├── subagent-protocol.md          # briefs, blockers, contract conflicts, result verification
│   └── antipatterns.md               # code + orchestration antipatterns, review checklist
└── templates/
    ├── CONTEXT_INDEX.md   PROJECT_STATE.md   ARCHITECTURE.md
    ├── PROBLEM_MODEL.md   INVARIANTS.md      OPEN_QUESTIONS.md
    ├── TASK.md            ADR.md             HANDOFF.md
    └── LOGS.md                                # execution / findings / integration
```

`SKILL.md` is the entry point; the reference files are loaded on demand, per phase, so a simple
task never pays for the whole method.

## Install

| Tool                     | How                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Claude Code**          | Copy `brain-orchestrator/` into the project's `skills/` folder, or into `~/.claude/skills/` for every project     |
| **Kiro CLI**             | Same folder; reference `SKILL.md` from the agent's resources                                                      |
| **Cursor**               | Add `SKILL.md` as a `.cursor/rules/brain-orchestrator.mdc` rule; keep `references/` and `templates/` alongside it |
| **Windsurf / Cline**     | Copy `SKILL.md` into the rules folder; keep the folder structure for the references                               |
| **ChatGPT (Custom GPT)** | Upload all files in the Knowledge section                                                                         |

Keep the folder intact — `SKILL.md` references `references/*` and `templates/*` by relative path.

## Use it when

- A bug does not have an obvious single-file cause, or crosses layers.
- The change touches a contract, a shared type, a schema, a migration, or an event.
- The work spans several modules, or a codebase nobody currently understands.
- Several agents will work on it, in sequence or in parallel.
- The work will outlive this session, or is resuming after context was lost.

## Don't use it when

The change is trivial, local, low-risk, and fully understood — then `verify-before-implement` is
enough. `SKILL.md` states the exact test, and the skill also runs in a LIGHT mode that skips most of
the ceremony while keeping the parts that prevent real damage.

## Quick start

```text
Use the brain-orchestrator skill: sessions stay valid after logout in production.

Use the brain-orchestrator skill to plan the migration off the legacy payments adapter.

Use the brain-orchestrator skill: resume the operation in .agent/ and tell me what's next.

Use the brain-orchestrator skill to split this refactor into tasks I can run with parallel agents.
```

A typical first run: it reconstructs state from `.agent/` if it exists, investigates only as far as
the decision requires, writes `PROBLEM_MODEL.md` with the root cause and its evidence level, decides
the design (recording an ADR if it affects more than one task), produces a task DAG with the shared
contract extracted upstream, persists every task as its own file, and then delegates — reporting one
next action, not a menu.

## Relationship to the other skills here

| It delegates to                                   | For                                                      |
| ------------------------------------------------- | -------------------------------------------------------- |
| `verify-before-implement`                         | Confirming any fact before it enters an artifact or code |
| `code-architecture-explainer`                     | Deriving and explaining the architectural model          |
| `pre-pr-review`                                   | The final review over the integrated diff                |
| `git-commits`                                     | Commit messages and PR descriptions                      |
| `code-documentation`                              | Documenting new code                                     |
| `backend-api-standards` / `frontend-architecture` | Contract shape and layering, when active                 |
| `spec-kit-shared/agent-portability.md`            | Generating portable (Kiro + Claude) agent definitions    |

**Brain vs. `spec-kit`.** `spec-kit` runs requirement → spec → plan → tasks → code, for work whose
_intent_ is the unknown. The Brain runs discovery → diagnosis → architecture → task graph, for work
whose _system_ is the unknown. They compose — the Brain can hand a bounded, well-understood feature
to `spec-kit-generate-spec`, and a `spec-kit-execute-tasks` run can be one node in the Brain's DAG —
but never run both over the same work at the same time.

## The one principle

```text
Never pass critical knowledge through memory alone when it can be persisted as an artifact.
Do not ask the next agent to trust what the previous agent supposedly discovered.
Give it the persisted finding, contract, ADR, task, or handoff that holds the original information.
```
