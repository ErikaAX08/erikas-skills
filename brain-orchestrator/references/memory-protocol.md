# Memory Protocol

> Loaded by `brain-orchestrator` in Phase 0 (RESUME) and Phase 6 (PERSIST), and any time an
> artifact under `.agent/` is written or relied upon. This file defines _where_ knowledge lives,
> _when_ it is written, _how_ it is kept true, and _what must never be written at all_.

The memory exists for one reason: **critical knowledge must not depend on any agent's conversation
surviving.** Sessions end, context is compacted, agents are replaced. Anything that only exists in
a chat message is already lost — it just does not know it yet.

## 1. Layout

```text
.agent/
├── memory/
│   ├── CONTEXT_INDEX.md      # navigation map + current status. Small, always current.
│   ├── PROJECT_STATE.md      # where the operation stands right now
│   ├── ARCHITECTURE.md       # how the relevant part of the system actually works
│   ├── PROBLEM_MODEL.md      # the one shared definition of the problem
│   ├── INVARIANTS.md         # rules that must never break
│   └── OPEN_QUESTIONS.md     # known unknowns, with why they matter
├── tasks/
│   └── TASK-001-<slug>.md    # one file per task — the contract a subagent executes
├── adr/
│   └── ADR-001-<slug>.md     # why a decision was made, and what it rejected
├── handoffs/
│   └── TASK-001-HANDOFF.md   # what a finished task produced, for its consumers
└── logs/
    ├── EXECUTION_LOG.md      # chronological events (not reasoning)
    ├── FINDINGS_LOG.md       # discoveries that change something
    └── INTEGRATION_LOG.md    # what happened when changes met each other
```

The exact paths may be adapted to a project that already has a convention (`docs/agent/`,
`.brain/`, an existing ADR folder). What may **not** be adapted: these nine concerns stay in
separate files. Never collapse them into a single `memory.md` — a single file guarantees that
either it grows until nobody reads it, or its sections start contradicting each other silently.

**Creation is lazy.** Create a file the first time it has real content. An empty
`INVARIANTS.md` teaches a subagent that invariants do not matter here.

**Placement:** `.agent/` goes at the repository root by default. Commit it — its whole value is
that it outlives the machine and the session. If the project forbids that, keep it local and say so
in `CONTEXT_INDEX.md`, because an uncommitted memory is invisible to every other agent.

## 2. Identifiers and status vocabularies

| Artifact      | ID                                                        | Statuses                                                                           |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Task          | `TASK-001`, `TASK-002` … (never reused, never renumbered) | `DRAFT` → `READY` → `IN_PROGRESS` → `REVIEW` → `DONE`; plus `BLOCKED`, `CANCELLED` |
| ADR           | `ADR-001` …                                               | `PROPOSED` → `ACCEPTED`; plus `REJECTED`, `SUPERSEDED`                             |
| Invariant     | `INV-001` …                                               | `ACTIVE`, `RETIRED` (retired keeps the reason and the date)                        |
| Finding       | `F-001` …                                                 | evidence level only: `CONFIRMED` / `LIKELY`                                        |
| Open question | `Q-001` …                                                 | `OPEN`, `ANSWERED` (answered keeps the answer and its evidence)                    |
| Task revision | `REV-01` inside the task file                             | —                                                                                  |

Filenames carry the ID and a slug: `TASK-004-centralize-session-validation.md`,
`ADR-004-session-validity-owned-by-authcoordinator.md`. IDs never change meaning; a task that turns
out to be wrong is cancelled and superseded, never rewritten into a different task under the same
ID — some other agent may already have read the old one.

## 3. One fact, one home

Duplicated truth is the second-most-common way memory rots (the first is staleness). Each kind of
knowledge has exactly one authoritative home; everywhere else references it by ID.

| Knowledge                          | Lives in                                  | Referenced from              |
| ---------------------------------- | ----------------------------------------- | ---------------------------- |
| How the system works today         | `ARCHITECTURE.md`                         | tasks, ADRs                  |
| What we are solving                | `PROBLEM_MODEL.md`                        | tasks, ADRs                  |
| A rule that must not break         | `INVARIANTS.md` (`INV-###`)               | tasks, ADRs, review          |
| Why a decision was taken           | `ADR-###`                                 | tasks, `ARCHITECTURE.md`     |
| What must change, and its boundary | `TASK-###`                                | handoffs, `PROJECT_STATE.md` |
| What a task produced               | `TASK-###-HANDOFF.md`                     | consumer tasks               |
| A discovery that changes something | `FINDINGS_LOG.md` (`F-###`)               | tasks, ADRs                  |
| Where the operation stands         | `PROJECT_STATE.md`                        | `CONTEXT_INDEX.md`           |
| How we got here                    | `EXECUTION_LOG.md` / `INTEGRATION_LOG.md` | —                            |

If you find yourself writing the same paragraph into a second file, stop and reference the first
instead. Two copies of a fact will disagree; the only question is when.

## 4. Source-of-truth hierarchy

When two sources conflict, the higher one wins — **and the conflict itself is a finding worth
recording**, because a stale document that misled one agent will mislead the next one too.

```text
1. Current code            — what the system actually does
2. Executable tests        — what it must keep doing (a test can be wrong; treat it as strong
                             evidence, not as an oracle)
3. Contracts / schemas     — how the parts agree to communicate
4. Active ADRs             — why it was built this way
5. PROJECT_STATE / tasks   — what is being changed right now
6. Findings                — what we learned along the way
7. Logs                    — how we got here
8. Conversation            — the weakest source; it is not persisted and cannot be audited
```

Markdown never overrules the code it describes. If memory says `AuthService` owns validation and
the code says `AuthCoordinator` does, the code is right and the memory is a bug — go to §7.

## 5. Write triggers — the operational core

Persist on the event, not on a schedule. "I will document it at the end" is how the end arrives
with nothing documented.

| Event                                                                                                                          | Write                                | Where                                                         |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------- |
| Confirmed a fact that changes the system model                                                                                 | update the model                     | `ARCHITECTURE.md` (+ `F-###` if it invalidated an assumption) |
| Chose among ≥ 2 viable designs, or defined ownership, or changed a contract, or moved a boundary, or introduced an abstraction | new ADR                              | `adr/ADR-###-<slug>.md`                                       |
| Discovered a rule that must never break                                                                                        | new invariant                        | `INVARIANTS.md`                                               |
| Problem definition established or revised                                                                                      | problem model                        | `PROBLEM_MODEL.md`                                            |
| Created a task, or changed its scope/contract/criteria                                                                         | task file + `REV-##`                 | `tasks/TASK-###-<slug>.md`                                    |
| Task status changed                                                                                                            | status in the task, plus the summary | task file + `PROJECT_STATE.md` + `CONTEXT_INDEX.md`           |
| A task produced something another task consumes                                                                                | handoff                              | `handoffs/TASK-###-HANDOFF.md`                                |
| Evidence contradicted the plan                                                                                                 | finding + replan                     | `FINDINGS_LOG.md`, then the Replanning protocol               |
| A blocker or a contract conflict was raised                                                                                    | the report verbatim, in the task     | task file + `PROJECT_STATE.md`                                |
| Changes were integrated, or collided                                                                                           | what happened and how it resolved    | `INTEGRATION_LOG.md`                                          |
| A phase ended (discovery, diagnosis, design, wave, integration, validation)                                                    | checkpoint                           | `PROJECT_STATE.md` + `CONTEXT_INDEX.md`                       |
| An open question was answered                                                                                                  | the answer + evidence                | `OPEN_QUESTIONS.md` (+ `F-###` if it changes a decision)      |

### Never write

- Every command run, every search, every file opened.
- Intermediate reasoning, discarded hypotheses with no consequence, "thinking out loud".
- The conversation transcript.
- Anything trivially derivable by reading the code right now (a function's signature, a folder
  listing). Memory records _conclusions and decisions_, not a cache of the repository.
- A restatement of something another artifact already owns (§3).

> **Persist knowledge, not noise.** A memory that records everything is read by no one, and a
> memory nobody reads is exactly as useful as no memory at all.

## 6. The `Verified:` stamp — what makes drift detection mechanical

Every statement in `ARCHITECTURE.md` and `INVARIANTS.md`, and every `CONFIRMED` claim anywhere,
carries where it came from and when:

```markdown
FACT: Session expiry is evaluated only inside AuthCoordinator.validateSession().
Evidence: src/auth/AuthCoordinator.ts:142 — the only call site of `isExpired()` (grep, 1 hit)
Confidence: CONFIRMED
Verified: 2026-08-07
```

This turns "is this document still true?" from a judgment call into a command:

```bash
# Has anything the claim describes changed since it was verified?
git log -1 --format=%cI -- src/auth/AuthCoordinator.ts     # → newer than Verified: ? then re-verify
git log --since=2026-08-07 --oneline -- src/auth/          # → what changed in the area
```

A claim whose files moved after its stamp is **stale, not false** — it may still be true, but it
may no longer be used as the basis of a new task until someone looks again.

## 7. Memory drift procedure

Trigger it when a document and the code disagree, when a stamp is older than the code it describes,
or when a subagent reports something that contradicts an artifact.

```text
1. Detect the inconsistency and name both sides ("ARCHITECTURE.md says X; src/... shows Y").
2. Inspect the code and the tests. The code decides.
3. Correct the active document immediately, in one voice, as if it had always been right.
4. If the change is architectural, record it: an ADR (a decision changed) or an F-### (we were
   simply wrong about how it worked).
5. Review every task, contract, and invariant that depended on the false statement — some may need
   REV entries, some may need cancelling.
6. Note it in EXECUTION_LOG.md so the next agent knows the model moved.
```

### Current state vs. history

Active documents state what is true **now**, with no archaeology:

```markdown
<!-- WRONG — ARCHITECTURE.md as a diary -->

AuthService owns validation.
Maybe AuthCoordinator.
Actually AuthCoordinator since we checked.

<!-- RIGHT — ARCHITECTURE.md -->

AuthCoordinator owns session validation.
Evidence: src/auth/AuthCoordinator.ts:142 · Confidence: CONFIRMED · Verified: 2026-08-07
```

The trail lives where trails belong:

```markdown
<!-- adr/ADR-003-....md -->

Status: SUPERSEDED by ADR-004
Previous decision: AuthService owned session validation.
```

Never keep a false statement in an active document out of respect for history. History has its own
files, and they are read on purpose, not by accident.

## 8. Session recovery

A new session — or a new Brain — reconstructs the operation in this order, and stops as soon as it
can act:

```text
1. memory/CONTEXT_INDEX.md      → the map and the current status
2. memory/PROJECT_STATE.md      → objective, phase, active/blocked tasks, next action
3. memory/PROBLEM_MODEL.md      → what we are actually solving
4. active ADRs (as listed in CONTEXT_INDEX) → the decisions already made
5. tasks with status IN_PROGRESS / BLOCKED / READY
6. git status, git log --oneline -20, and any uncommitted diff → what the repo really looks like
7. drift check (§6) on every claim about to be used
8. continue from the current state
```

Do not read the whole memory tree "to be safe". Read the index, the state, and what the next action
touches. Reading everything is how a recovery burns its entire context before doing any work.

**Never rely on conversational memory from a previous session.** If it is not in a file, it did not
happen.

## 9. Read-before-work and write-after-work

**Before starting a task**, its executor reads exactly:

```text
1. Its own tasks/TASK-###.md            (authoritative — the contract)
2. The ADRs it references
3. The invariants it references
4. The handoffs of its dependencies
5. The relevant slice of ARCHITECTURE.md
```

Not the whole memory. The goal is to prevent all three failure modes at once: context loss (too
little), context bleed (someone else's task in your head), and context overload (a full tree in a
finite window).

**Before declaring a task done**, its executor writes into the task file: result, files modified,
tests run and their actual output, deviations from the plan, findings, remaining risks, produced
outputs, and the handoff if anything downstream consumes it. If it learned something global, it
proposes the change to `ARCHITECTURE.md` / `PROBLEM_MODEL.md` / `INVARIANTS.md` / `FINDINGS_LOG.md`
/ the relevant ADR — the Brain approves and applies it, so that global documents keep one voice.

## 10. Keeping memory small enough to be read

| Artifact           | Size discipline                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `CONTEXT_INDEX.md` | ≤ ~60 lines. References and status only, never content. If it grows, something belongs elsewhere. |
| `PROJECT_STATE.md` | ≤ ~80 lines. Current only — completed work compresses to counts plus IDs.                         |
| `ARCHITECTURE.md`  | Only the parts the operation touches. Not a whole-repo textbook.                                  |
| `PROBLEM_MODEL.md` | One problem. A second problem gets a second file (`PROBLEM_MODEL-<slug>.md`).                     |
| Logs               | Append-only, one entry per event, a few lines each. Not a transcript.                             |

When a log grows past comfortable reading, checkpoint it: summarize the closed period at the top
("2026-07: TASK-001..012 delivered the session-validation refactor; see ADR-004"), archive the
detail under `logs/archive/`, and keep every ADR, invariant, and task file intact. Compress
history; never compress decisions.

## 11. Cancelled and superseded work

Never delete a task file. A deleted task looks to the next agent exactly like a task that never
existed — and its ID appearing in an old handoff becomes an unresolvable dangling reference.

```markdown
Status: CANCELLED
Reason: The root cause moved to the cache layer after F-021; this task's contract no longer applies.
Superseded By: TASK-012
```

The same applies to ADRs (`SUPERSEDED` + a pointer to the successor) and invariants (`RETIRED` +
the reason and date). An artifact that stops being true stops being _active_; it does not stop
existing.

## 12. Golden rule

```text
Code defines what the system does.
Tests verify what it must keep doing.
Contracts define how the parts communicate.
ADRs explain why it was designed this way.
Tasks define what must change.
Handoffs explain what changed.
PROJECT_STATE explains where we are.
Logs explain how we got here.
```

Each kind of knowledge in its correct artifact. Anything filed in the wrong place is, in practice,
lost — it will be searched for where it should have been.
