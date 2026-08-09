# Memory Protocol

> Loaded by `project-intelligence` whenever the knowledge base is written to or relied upon. Defines
> **where each kind of knowledge lives, when it is written, how it is kept true, and what must never
> be written at all.**

The knowledge base exists so that no agent — and no human — has to rediscover this system. It earns
that only if it stays true. A confident, stale document is worse than an empty folder: an empty
folder makes someone go look.

## 1. Layout and ownership

```text
.ai/
├── project-overview.md      # stable identity + the index into everything else
├── project-map.md           # where each responsibility lives
├── architecture.md          # real architecture, boundaries, conventions, violations
├── infrastructure.md        # AWS, containers, CI/CD, networking, observability
├── integrations.md          # external services and APIs consumed
├── database.md              # engines, access layer, schema map, read/write owners
├── environments.md          # environments, env vars, config sources, commands
├── flows/<flow>.md          # one file per business flow actually traced
├── decisions/ADR-###-<slug>.md
├── changes/YYYY-MM-DD-<slug>.md
└── investigation-log.md     # dated discoveries + open questions
```

Use `docs/ai/` instead when the project keeps documentation in `docs/`, and adopt an existing
convention (an existing `docs/adr/`, an existing architecture document) rather than creating a
parallel one. Record the chosen home in `project-overview.md`.

**Nine concerns, nine homes.** They may be relocated; they may not be merged. A single `memory.md`
either grows until nobody reads it or starts contradicting itself silently — usually both.

## 2. One fact, one home

Duplicated truth is the second-fastest way memory rots; staleness is the first. Each fact has exactly
one authoritative location, and every other document references it.

| Knowledge                                | Lives in             | Referenced from                    |
| ---------------------------------------- | -------------------- | ---------------------------------- |
| What the project is, its core stack      | `project-overview.md`| everything                         |
| Where a responsibility is implemented    | `project-map.md`     | flows, changes                     |
| How the parts depend on each other       | `architecture.md`    | flows, ADRs, changes               |
| What cloud/CI/runtime resources exist    | `infrastructure.md`  | environments, flows                |
| Which third parties are called           | `integrations.md`    | flows                              |
| Data model, ownership, side effects      | `database.md`        | flows, operations                  |
| Environments, variables, config sources  | `environments.md`    | infrastructure, operations         |
| How a business process actually runs     | `flows/<flow>.md`    | changes, context packages          |
| Why a decision was made                  | `decisions/ADR-###`  | architecture, changes              |
| What changed, and how it worked before   | `changes/<date>-<slug>` | investigation-log                |
| What was discovered, and what is unknown | `investigation-log.md`| everything                        |

If you are about to write the same paragraph into a second file, reference the first instead. Two
copies of a fact will disagree; the only question is when.

## 3. Write triggers — persist on the event, not "at the end"

| Event                                                     | Write                                        |
| --------------------------------------------------------- | -------------------------------------------- |
| Bootstrap Pass A completes                                | `project-overview.md`, `environments.md`, top-level `project-map.md` |
| A domain is mapped for the first time                     | the corresponding domain document            |
| A flow is traced end to end                               | `flows/<flow>.md`                            |
| A responsibility is located that the map did not have     | one line in `project-map.md`                 |
| A new service, integration, table, or variable is found   | the owning document                          |
| A significant change lands                                | `changes/YYYY-MM-DD-<slug>.md` (+ ADR if a decision was made) |
| A decision defines ownership, changes a contract, moves a boundary, adds infrastructure or a dependency, or rejects a serious alternative | `decisions/ADR-###-<slug>.md` |
| A non-obvious behavior, constraint, gotcha, or risk is discovered | `investigation-log.md`               |
| A question could not be answered from the repository      | an open question in `investigation-log.md`   |
| Memory and code disagreed                                 | correct the document **now** (§5)            |
| A stored claim was re-verified                            | bump its `Verified:` stamp                   |

Never batch this to the end of a session. "I will write it up afterwards" is how the session ends
with nothing written.

## 4. The `Verified:` stamp — what makes staleness mechanical

Every non-trivial claim carries where it came from and when:

```md
Deployment target: AWS ECS Fargate, service `api-prod`
Confidence: CONFIRMED
Evidence: infra/ecs.tf:41 · .github/workflows/deploy.yml:31
Verified: 2026-08-08
```

That turns "is this still true?" from judgment into a command:

```bash
git log -1 --format=%cI -- infra/ecs.tf .github/workflows/deploy.yml   # newer than the stamp?
git log --since=2026-08-08 --oneline -- infra/                          # what moved
```

A claim whose files changed after its stamp is **stale, not false** — it may still hold, but it may
not be the basis of an answer or an operation until someone looks again. Re-verifying is cheap
because the evidence line says exactly where to look; that is the whole point of recording it.

Document-level stamps are acceptable for small documents (`Last verified: 2026-08-08 against
<paths>`); per-claim stamps are required for anything an operation or a plan would rely on.

## 5. Drift procedure

Trigger it when a document and the repository disagree, when a stamp predates the code it describes,
or when another agent reports something that contradicts a stored claim.

```text
1. Name both sides:      "architecture.md says X; src/... shows Y."
2. Inspect code, config, and IaC. The repository decides — always.
3. Correct the active document immediately, in one voice, as if it had always been right.
4. If the truth changed (rather than the document having been wrong), record the change in
   changes/ and, if a decision drove it, in decisions/.
5. If the document was simply wrong, note it in investigation-log.md — a mistake that misled you
   will mislead the next agent.
6. Re-check anything else that leaned on the false statement.
```

**Active documents state what is true now.** No archaeology, no "it used to be", no diary entries:

```md
<!-- WRONG — architecture.md as a diary -->
Auth was handled by AuthService. Then maybe Cognito. Now Cognito, I think.

<!-- RIGHT — architecture.md -->
Authentication is delegated to AWS Cognito; the API only verifies JWTs against the pool's JWKS.
Evidence: src/modules/auth/jwt.strategy.ts:22 · infra/cognito.tf:11 · CONFIRMED · Verified: 2026-08-08
```

The trail belongs in `changes/` and `decisions/`, which are read on purpose rather than by accident.

## 6. Never write

- Commands executed, files opened, searches run.
- Intermediate reasoning, abandoned hypotheses with no consequence, thinking out loud.
- Anything re-derivable in under a minute by reading one file right now — a function signature, a
  folder listing, a column list the schema already owns.
- A restatement of what another document owns (§2).
- Conversation transcripts.
- **Any secret value**, real `.env` contents, credential, token, or full connection string — and
  nothing that is not already committed in the repository (account ids, private hostnames, ARNs).
  Point at where the value is configured instead.

> Persist knowledge, not activity. A memory that records everything is read by nobody.

## 7. Size discipline

| Document              | Discipline                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| `project-overview.md` | ≤ ~80 lines. Identity and index. Never a changelog, never deep detail.             |
| `project-map.md`      | Paths and responsibilities only. No explanation — that is `architecture.md`.       |
| `architecture.md`     | The model and its violations. Not a tutorial on the framework.                     |
| Domain documents      | Grouped by concern, not one flat alphabetical list.                                |
| `flows/*.md`          | One flow per file. A second flow gets a second file.                               |
| `changes/*.md`        | One change per file, and the file is never edited later — write a new one instead. |
| `investigation-log.md`| Dated entries, a few lines each. Prune answered questions into the owning document.|

When `investigation-log.md` grows past comfortable reading, compress: entries whose knowledge now
lives in a domain document are deleted from the log (the knowledge is not lost, it graduated); the
rest are summarized by period. Compress history; never compress decisions.

## 8. Reading order for a new agent

```text
1. project-overview.md        → what this is, and where everything else lives
2. the one or two documents its task actually touches
3. flows/<the relevant flow>.md, if the work follows a business process
4. the most recent entries in changes/, if the area changed recently
5. git status + git log --oneline -20 → the repository's current reality
6. staleness check (§4) on every claim it is about to rely on
```

Do not read the whole tree "to be safe". Reading everything is how a session burns its context
before doing any work.

## 9. Coexisting with an operation memory

If `brain-orchestrator` is also in use, keep the boundary clean:

| `.ai/` (this skill)                          | `.agent/` (brain-orchestrator)                    |
| -------------------------------------------- | -------------------------------------------------- |
| Describes **the system**                     | Describes **one operation on the system**          |
| Outlives every task                          | Ends when the operation ends                       |
| Architecture, infra, data, flows, history    | Problem model, task contracts, handoffs, execution logs |
| Read at the start of an operation            | Written during the operation                       |

When an operation closes, its durable conclusions **graduate**: architecture learned, invariants
found, decisions accepted, and the change record move into `.ai/`; the task contracts and execution
logs stay behind. Never duplicate a fact across both trees — the operation references the system
document by path.

## 10. Golden rule

```text
Code defines what the system does.
Configuration and IaC define how it is wired.
This memory explains what took work to find out, and why things are the way they are.
Nothing here may contradict the first two — and when it does, it is the one that is wrong.
```
