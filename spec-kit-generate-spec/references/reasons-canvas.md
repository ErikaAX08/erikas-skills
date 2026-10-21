# REASONS Canvas — Template and Section Construction Rules

Read completely before writing or updating `spec.md` (`SKILL.md` Phase 6). The title plus all seven
sections are mandatory; replace every bracketed placeholder.

```markdown
# [Feature Title]

## R — Requirements

### Evidence Catalog

| ID  | Source / Path                          | Type                     | Role                          | Read Status                        | Source Fingerprint                                      |
| --- | -------------------------------------- | ------------------------ | ------------------------------ | ----------------------------------- | --------------------------------------------------------- |
| S1  | [User request or document path]        | [Text/PRD/RFC/etc.]      | [Primary/Supporting]          | [Read successfully / inaccessible] | [sha256:… / commit:\<sha\> / retrieved:\<timestamp\> / N/A — reason] |
| P1  | [Project file, contract, or code path] | [Contract/Code/ADR/etc.] | [Governance/Current behavior] | [Read successfully / inaccessible] | [sha256:… / commit:\<sha\>]                                |

Every `[S#]` and `[P#]` citation in this specification must resolve to one row in this catalog.

### Problem and Value

[Who needs what, why it matters, and the source-backed outcome.]

### Goals

- **R-G01**: [Outcome] — Sources: [S1]

### Scope

#### In Scope

- [Included behavior]

#### Out of Scope

- [Explicit exclusion]

### Actors and Scenarios

- **R-US01**: As a [verified actor], I need [capability], so that [value]. — Priority: [P1 | P2 | P3]

### Functional Requirements

- **R-FR01**: The system must [observable, testable behavior]. — Sources: [S1, S2]

### Quality Requirements

- **R-QR01**: [Measurable user/system quality outcome and measurement condition].

### Acceptance Criteria

- **R-AC01**: Given [context], when [action], then [observable result].

### Assumptions and Decisions

- **R-AS01**: [Explicit assumption] — Impact: [what changes if false].
- **R-D01**: [Resolved decision] — Rationale: [reason] — Sources: [S1, P1].

### Dependencies and Risks

- **R-DEP01**: [External or internal dependency].
- **R-RISK01**: [Risk, impact, and mitigation or owner].

## E — Entities

### Domain Model

[Define only verified or necessary domain concepts, their responsibilities, lifecycle, and ownership.]

| ID   | Entity / Concept | Responsibility | Key Attributes or States   | Relationships                   | Evidence |
| ---- | ---------------- | -------------- | -------------------------- | ------------------------------- | -------- |
| E-01 | [Name]           | [Purpose]      | [Only known fields/states] | [Cardinality/semantic relation] | [S1/P1]  |

[Include a Mermaid class, state, or flow diagram when it improves understanding and the relationships are supported by evidence.]

### Invariants

- **E-I01**: [Rule that must always hold].

### Data Lifecycle

- **E-DL01**: [Creation, update, retention, deletion, migration, or ownership rule].

## A — Approach

### Strategy

1. **A-01 — [Strategy]**: [How the requirements will be satisfied at a high level and why this fits the context].

### Key Decisions and Trade-offs

| ID    | Decision   | Alternatives Considered | Rationale | Consequences     | Evidence |
| ----- | ---------- | ----------------------- | --------- | ---------------- | -------- |
| A-D01 | [Decision] | [Alternatives]          | [Reason]  | [Benefits/costs] | [S1/P1]  |

### Error and Edge-Case Strategy

- **A-E01**: [Failure mode and intended handling].

### Compatibility and Evolution

- **A-C01**: [Backward compatibility, rollout, migration, or extension strategy].

## S — Structure

### System Context

[Where the change fits and which boundaries it crosses.]

### Components and Responsibilities

| ID    | Component / Boundary             | Responsibility          | Depends On     | Exposes / Produces | Status                |
| ----- | -------------------------------- | ----------------------- | -------------- | ------------------ | --------------------- |
| S-C01 | [Verified or proposed component] | [Single responsibility] | [Dependencies] | [Contract/output]  | Existing/New/Proposed |

### Dependency and Data Flow

[Describe or diagram the end-to-end flow, trust boundaries, and ownership transitions.]

### Change Surface

- **S-CS01**: `[verified/path/or/component]` — [reason for change].

Change Surface is the **expected** surface, for orientation — never a list of what may not change. Do not put guessed paths, classes, or signatures in Change Surface. Use logical component names and mark them `Proposed` when technical context is unavailable. The binding, file-level surface is `plan.md`'s Project Structure.

## O — Operations

List operations in dependency order, at the **capability level**: what capability is created or changed and how it is validated as behavior. Every operation must map to requirements and include a validation method. File-level steps, library calls, and wiring order belong to `plan.md`'s `PL-O##` operations, which cite these `O-##`.

### O-01 — [Create / Update / Migrate / Verify] [Component or Capability]

- **Purpose**: [Single responsibility and intended result].
- **Traces to**: [R-FR01, R-AC01, E-I01, S-C01].
- **Inputs / Preconditions**: [Required state, contracts, or preceding operations].
- **Changes**:
  1. [Concrete implementation step without unsupported detail].
  2. [Business logic, state transition, integration, or migration step].
  3. [Error and edge-case handling].
- **Contracts**: [Verified inputs, outputs, schemas, or proposed contract].
- **Constraints**: [Applicable norms and safeguards].
- **Validation**: [Specific automated test, scenario, inspection, or metric].
- **Dependencies**: [Operation IDs or external dependencies].
- **Done when**: [Observable completion condition].

## N — Norms

Define only applicable, enforceable standards. Prefer verified project norms; identify newly proposed norms explicitly.

- **N-01 — Source-backed implementation**: Concrete names and contracts must match verified project sources. — Source: [P1]
- **N-02 — Traceability**: Product code and tests created later must map to Operations and Acceptance Criteria.
- **N-03 — [Project norm]**: [Naming, architecture, testing, observability, documentation, accessibility, localization, or error-handling rule]. — Source: [P2/Proposed]
- **N-04 — Prompt/code synchronization**: Behavior changes update this specification before code; behavior-preserving structural changes are synchronized back after refactoring.

## S — Safeguards

State non-negotiable boundaries as testable `MUST`, `MUST NOT`, or quantified limits.

### Scope and Business Safeguards

- **S-SG01**: The implementation MUST NOT [out-of-scope behavior or forbidden business outcome].

### Security and Privacy Safeguards

- **S-SG02**: [Access, sensitive data, abuse prevention, audit, or compliance constraint supported by context].

#### Sensitive Data by Channel

Mandatory whenever the feature handles personal, secret, or regulated data (phone numbers, emails, tokens, document IDs, payment data, health data). One row per channel; every row is filled — a safeguard ID, or `N/A — <narrow reason>`. A channel nobody enumerated is a channel nobody protects.

| Channel | Sensitive data that can reach it | Allowed form (absent / masked: rule / full) | Safeguard |
| ------- | -------------------------------- | ------------------------------------------- | --------- |
| Request body | [...] | [...] | [S-SG## / N/A — reason] |
| Query string | [...] | [...] | [...] |
| Path parameters | [...] | [...] | [...] |
| Request/response headers | [...] | [...] | [...] |
| Request/access logs (framework or proxy) | [...] | [...] | [...] |
| Application and error logs (including library error messages, e.g. SQL text) | [...] | [...] | [...] |
| Validation error responses (e.g. echoed input values) | [...] | [...] | [...] |
| Other error responses (5xx bodies, stack traces) | [...] | [...] | [...] |
| Success responses | [...] | [...] | [...] |
| Persistence and audit records | [...] | [...] | [...] |
| Calls to third parties | [...] | [...] | [...] |
| Metrics, traces, analytics | [...] | [...] | [...] |

### Data and Integrity Safeguards

- **S-SG03**: [Invariant, consistency, idempotency, retention, migration, or recovery constraint].

### Reliability and Performance Safeguards

- **S-SG04**: [Measurable capacity, latency, availability, timeout, retry, or degradation boundary when required].

### Compatibility and Integration Safeguards

- **S-SG05**: [Backward compatibility, contract stability, dependency, rollout, or rollback constraint].

### Prohibited Changes

- **S-SG06**: The implementation MUST NOT modify [unrelated behavior or contract — stated as observable behavior, e.g. "the public response of `POST /login` for unaffected numbers"].

A prohibited change protects a behavior or a contract, not a file. "File X does not change" is not a safeguard: it fails the moment a correct fix needs one line there, and it is a technical decision that belongs to `plan.md`.
```

#### Section Construction Rules

##### R — Requirements: intent and definition of done

- Capture the problem, value, actors, behavior, boundaries, quality outcomes, acceptance criteria, assumptions, dependencies, and risks.
- Use stable IDs and cite source IDs for source-derived claims.
- Every `R-US##` declares a `Priority` of `P1`, `P2`, or `P3` — `P1` is the minimum viable increment, `P2`/`P3` are later increments. Assign it from what the source explicitly distinguishes (e.g. "first I need X, then Y"); if the source does not distinguish priority, default every story to `P1` and record that default as an assumption (`R-AS##`) rather than presenting it as a stated fact. `spec-kit-generate-tasks` depends on this field to order work — do not leave it blank.
- Acceptance criteria must test observable behavior, preferably in Given/When/Then form.
- When an acceptance criterion sets a **terminal or persistent state** (`failed`, `expired`, `deleted`, "stays active"), say under which exact outcome it applies — and distinguish a **definitive** outcome from an **ambiguous** one (timeout, network error, 5xx, a status that does not prove what happened on the other side). An ambiguous outcome mapped to a terminal state is the usual way an acceptance criterion silently contradicts an invariant.
- Do not disguise implementation choices as business requirements.
- Quantify metrics only when provided, governed by project standards, or explicitly accepted as proposed targets.

##### E — Entities: domain language and relationships

- Use the terminology from source documents and the existing domain.
- Distinguish existing entities from new or proposed concepts.
- Define ownership, lifecycle, states, relationships, and invariants relevant to this feature.
- For every state an invariant constrains, check which `R-AC` can produce that state; `SKILL.md` § Phase 7's terminal-state check depends on this mapping being explicit.
- Preserve existing simple data structures when they satisfy the requirement.
- Do not create wrapper entities, DTOs, or abstractions without a functional need.
- Do not add guessed attributes to make a diagram look complete.

##### A — Approach: solution direction and rationale

- Explain how the requirements will be met without dropping immediately into method-level detail.
- Record meaningful alternatives and why the selected direction is preferred.
- Cover validation, errors, compatibility, rollout/migration, and key cross-cutting concerns when relevant.
- Prefer the smallest design that satisfies current requirements and known evolution needs.

##### S — Structure: system fit and boundaries

- Define components, responsibilities, dependencies, contracts, data flow, and trust boundaries.
- Follow the existing architecture unless a requirement explicitly justifies changing it.
- Mark components as `Existing`, `New`, or `Proposed`.
- Ensure responsibilities are cohesive and dependencies point in an allowed direction.
- Avoid speculative layers and framework-shaped architecture in greenfield specs without approved stack decisions.

##### O — Operations: concrete, testable execution

- Derive every operation from R, E, A, and S.
- Order operations by dependency and keep each independently reviewable.
- Include product behavior, migrations, observability, tests, documentation, and rollout work when the requirements demand them.
- Map every operation to requirement and acceptance IDs.
- Keep operations at the capability level: name the verified component or contract involved, not method signatures, annotations, or line-level steps — those belong to `plan.md`'s `PL-O##`. Any concrete name used here must still be verified by project inspection.
- Do not implement the operations while writing the specification.

##### N — Norms: reusable engineering standards

- Apply constitution and project standards before generic conventions.
- Include only norms relevant to this change.
- Make norms objective enough to review or automate.
- Cover consistency concerns such as naming, testing, errors, logging, observability, documentation, accessibility, and defensive coding only where applicable.
- Label new standards as `Proposed`; do not represent them as existing policy.

##### S — Safeguards: hard boundaries and invariants

- Convert critical risks and exclusions into verifiable constraints.
- Cover scope, security/privacy, integrity, reliability/performance, compatibility/integration, and prohibited changes as applicable.
- Fill the Sensitive Data by Channel table whenever sensitive data is in scope; every row gets a safeguard or a narrow `N/A` reason.
- Express prohibited changes as protected behavior or contracts, never as files that must stay untouched.
- Do not add unsupported compliance names or arbitrary thresholds.
- If a category truly does not apply, state the narrow reason rather than inventing a safeguard.
