# SMS Allow List

## R — Requirements

### Evidence Catalog

| ID | Source / Path | Type | Role | Read Status | Source Fingerprint |
| -- | ------------- | ---- | ---- | ----------- | ------------------ |
| S1 | docs/plan-sms-allow-list.md | Plan | Primary | Read successfully | sha256:1111111111111111111111111111111111111111111111111111111111111111 |
| P1 | src/sms/providerClient.js | Code | Current behavior | Read successfully | commit:2222222222222222222222222222222222222222 |

### Problem and Value

Support agents need to let specific phone numbers receive verification SMS while the provider's fraud filter blocks their prefix, without disabling the filter for everyone. [S1]

### Goals

- **R-G01**: Agents can allow a blocked number for a bounded time and the system removes it again automatically. — Sources: [S1]

### Scope

#### In Scope

- Adding a number to the provider allow list for a limited time.
- Removing expired entries from the provider allow list.

#### Out of Scope

- Changing the provider's fraud filter rules.

### Actors and Scenarios

- **R-US01**: As a support agent, I need to allow a blocked number for 24 hours, so that the customer can verify their account. — Priority: P1
- **R-US02**: As an operator, I need expired allow-list entries removed from the provider, so that exceptions do not become permanent. — Priority: P2

### Functional Requirements

- **R-FR01**: The system must add a number to the provider allow list and store a local entry with `expires_at` 24 hours later. — Sources: [S1]
- **R-FR02**: The system must remove every entry whose `expires_at` has passed from the provider and mark it `expired`. — Sources: [S1]

### Quality Requirements

- **R-QR01**: An allow request answers within 10 seconds, including provider retries. — Sources: [S1]

### Acceptance Criteria

- **R-AC01**: Given a blocked number, when an agent allows it, then the provider accepts it and the local entry is `active` with `expires_at` 24 hours later.
- **R-AC02**: Given the provider definitively rejects the number (a 4xx other than 429), when an agent allows it, then the local entry is `failed` and the agent sees the provider's reason.
- **R-AC03**: Given the provider outcome is ambiguous (timeout, network error, 5xx, or 429), when an agent allows it, then the local entry stays `pending` with `expires_at` set, and the sweep reconciles it.
- **R-AC05**: Given the provider answers 429, when an agent allows it, then the entry stays `pending` and the agent sees "provider busy, the number will be retried".
- **R-AC04**: Given an `active` or `pending` entry past `expires_at`, when the sweep runs, then the number is removed from the provider and the entry is `expired`.

### Assumptions and Decisions

- **R-AS01**: The provider exposes an allow-list delete call that is idempotent for absent numbers. — Impact: the sweep would need a pre-check if false.
- **R-D01**: Ambiguous provider outcomes keep the entry `pending` instead of `failed`. — Rationale: a number may already be allowed at the provider. — Sources: [S1]

### Dependencies and Risks

- **R-DEP01**: SMS provider allow-list API.
- **R-RISK01**: Phone numbers leaking into logs. Mitigation: S-SG02.

## E — Entities

### Domain Model

| ID | Entity / Concept | Responsibility | Key Attributes or States | Relationships | Evidence |
| -- | ---------------- | -------------- | ------------------------ | ------------- | -------- |
| E-01 | AllowListEntry | Local record of an allowed number | phone, status (pending, active, failed, expired), expires_at | One per allow request | [S1] |

### Invariants

- **E-I01**: No number is present in the provider allow list without a local entry that has `expires_at`.

### Data Lifecycle

- **E-DL01**: Entries are kept 90 days after `expired`, then deleted.

## A — Approach

### Strategy

1. **A-01 — Local entry first**: create the local entry before calling the provider, so every provider-side number has a local `expires_at`.

### Key Decisions and Trade-offs

| ID | Decision | Alternatives Considered | Rationale | Consequences | Evidence |
| -- | -------- | ----------------------- | --------- | ------------ | -------- |
| A-D01 | Write the local entry before the provider call | Call first, then write | Keeps E-I01 true on crashes | An orphan local entry may exist; the sweep handles it | [S1] |

### Error and Edge-Case Strategy

- **A-E01**: Ambiguous provider outcomes leave the entry `pending`; the sweep removes it from the provider at expiry either way.

### Compatibility and Evolution

- **A-C01**: The feature ships behind a flag that defaults off.

## S — Structure

### System Context

A new admin endpoint and a scheduled sweep inside the existing SMS service.

### Components and Responsibilities

| ID | Component / Boundary | Responsibility | Depends On | Exposes / Produces | Status |
| -- | -------------------- | -------------- | ---------- | ------------------ | ------ |
| S-C01 | Allow-list endpoint | Validates input and creates entries | S-C02 | POST /allow-list | New |
| S-C02 | Provider client | Calls the provider allow-list API | Provider | add/remove | Existing |

### Dependency and Data Flow

Agent → endpoint → local entry → provider client → provider.

### Change Surface

- **S-CS01**: `src/sms/` — new endpoint and sweep.

## O — Operations

### O-01 — Create the allow-list entry capability

- **Purpose**: allow a number with a local expiry.
- **Traces to**: R-FR01, R-AC01, R-AC02, R-AC03, R-AC05, E-I01, S-C01
- **Validation**: integration test of the three provider outcomes.
- **Done when**: R-AC01–R-AC03 and R-AC05 pass.

### O-02 — Create the expiry sweep capability

- **Purpose**: remove expired entries from the provider.
- **Traces to**: R-FR02, R-AC04, E-I01
- **Validation**: integration test with expired `active` and `pending` entries.
- **Done when**: R-AC04 passes.

## N — Norms

- **N-01 — Masked phone numbers**: phone numbers appear in logs only as `+` plus the last 4 digits. — Source: [P1]

## S — Safeguards

### Scope and Business Safeguards

- **S-SG01**: The implementation MUST NOT change the provider's fraud filter configuration.

### Security and Privacy Safeguards

- **S-SG02**: No log, error response, or validation response contains a full phone number.

#### Sensitive Data by Channel

| Channel | Sensitive data that can reach it | Allowed form (absent / masked: rule / full) | Safeguard |
| ------- | -------------------------------- | ------------------------------------------- | --------- |
| Request body | phone | full | N/A — required input |
| Query string | none | absent | N/A — POST only |
| Path parameters | none | absent | N/A — no path parameter |
| Request/response headers | none | absent | N/A — not used |
| Request/access logs (framework or proxy) | phone | masked: + last 4 | S-SG02 |
| Application and error logs (including library error messages, e.g. SQL text) | phone | masked: + last 4 | S-SG02 |
| Validation error responses (e.g. echoed input values) | phone | absent | S-SG02 |
| Other error responses (5xx bodies, stack traces) | phone | absent | S-SG02 |
| Success responses | phone | masked: + last 4 | S-SG02 |
| Persistence and audit records | phone | full | N/A — required to remove it later |
| Calls to third parties | phone | full | N/A — the provider needs it |
| Metrics, traces, analytics | none | absent | S-SG02 |

### Data and Integrity Safeguards

- **S-SG03**: Every provider-side allow-list number has a local entry with `expires_at` (E-I01).

### Reliability and Performance Safeguards

- **S-SG04**: The allow request answers within 10 seconds (R-QR01).

### Compatibility and Integration Safeguards

- **S-SG05**: With the flag off, existing SMS sending behaves exactly as before.

### Prohibited Changes

- **S-SG06**: The implementation MUST NOT change the public response of the existing `POST /sms/verify` endpoint.
