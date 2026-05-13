---
name: code-architecture-explainer
description: Analyze and explain code from multiple levels - from implementation details to software architecture. Use when understanding new codebases, explaining system design, documenting architecture, learning patterns, or analyzing technical decisions. Provides technical deep-dives, architectural overviews, flow diagrams, and concrete examples. Works at any abstraction level from "what does this function do" to "how does this system scale".
license: MIT
---

This skill guides comprehensive code and architecture analysis at multiple levels of abstraction, from low-level implementation details to high-level system design.

The user wants to understand code, architecture, design patterns, or system behavior. They may ask about specific files, entire modules, integration patterns, or architectural decisions. They may need technical details, conceptual understanding, or both.

## Core Principle

**UNDERSTAND BY LAYERS, VERIFY BY READING**

- Never explain code you haven't read
- Start from actual implementation, not assumptions
- Connect low-level details to high-level goals
- Use examples from the actual codebase
- Draw diagrams when they clarify structure

## Multi-Level Analysis Framework

Analyze code at these levels as appropriate for the question:

### Level 1: Implementation (Line-Level)

What does this specific code do? How does it work?

### Level 2: Component (File/Module-Level)

What is this module's responsibility? What are its boundaries?

### Level 3: Integration (Cross-Module)

How do components work together? What are the contracts?

### Level 4: Architecture (System-Level)

What's the overall design? Why these patterns? How does it scale?

### Level 5: Conceptual (Business-Level)

What problem does this solve? What are the tradeoffs?

## Pre-Analysis Verification

Before explaining ANYTHING:

### 1. Read the Actual Code

**MANDATORY**:

- [ ] Read the specific file(s) being asked about
- [ ] Read related files (imports, dependencies)
- [ ] Read tests to understand expected behavior
- [ ] Read documentation/comments if they exist
- [ ] Check git history for context (if relevant)

**Never explain based on**:

- File names alone
- Directory structure assumptions
- "This probably does X"
- Training data about similar systems

### 2. Map Dependencies

**For each component, identify**:

- What it imports/requires
- What imports/requires it
- External services it calls
- Database tables it touches
- Events it emits/listens to

### 3. Trace Data Flow

**Follow the data**:

- Where does input come from?
- How is it transformed?
- Where does output go?
- What side effects occur?
- What can fail?

### 4. Identify Patterns

**Look for**:

- Design patterns in use
- Architectural patterns
- Framework conventions
- Project-specific patterns
- Anti-patterns or tech debt

## Explanation Templates by Level

### Level 1: Implementation Explanation

**Template**:

````markdown
## [Function/Method Name]

**Location**: `path/to/file.js` (lines X-Y)

**Purpose**: [One sentence - what it does]

**Signature**:

```[language]
function name(param1: Type1, param2: Type2): ReturnType
```
````
````

**Parameters**:

- `param1` (Type1): [What it represents, constraints]
- `param2` (Type2): [What it represents, constraints]

**Returns**: [What it returns, possible values]

**How It Works**:

1. **[Step 1 name]**: [What happens]

   ```[language]
   [relevant code snippet]
   ```

   [Explanation of why this step exists]

2. **[Step 2 name]**: [What happens]

   ```[language]
   [relevant code snippet]
   ```

   [Explanation of why this step exists]

3. **[Step 3 name]**: [What happens]

**Edge Cases**:

- If input is null → [what happens]
- If validation fails → [what happens]
- If external call fails → [what happens]

**Dependencies**:

- Calls: [other functions/services]
- Uses: [utilities, helpers]
- Side effects: [database writes, API calls, state changes]

**Example Usage**:

```[language]
// Concrete example from actual code or realistic scenario
const result = functionName(actualParam1, actualParam2);
// result = { ... }
```

**Notes**:

- [Why this approach vs alternatives]
- [Known limitations]
- [Related TODO/FIXME if any]

````

**Example**:
````markdown
## processPayment

**Location**: `src/api/services/ParkingMeterPaymentService.js` (lines 145-203)

**Purpose**: Charge a parking meter payment using either card or wallet

**Signature**:
```javascript
async function processPayment(params, trx)
```

**Parameters**:

- `params` (Object): Payment details
  - `params.amount` (number): Amount in currency units
  - `params.cardId` (number|undefined): Card ID if paying with card
  - `params.userId` (number): User making the payment
  - `params.zoneId` (number): Parking zone ID
- `trx` (Transaction): Knex transaction object

**Returns**: Promise<PaymentResult> with transaction details

**How It Works**:

1. **Determine payment method**:

   ```javascript
   if (cardId) {
     payment = await chargeCard({ ... }, trx);
   } else {
     payment = await chargeWallet({ ... }, trx);
   }
   ```

   Bifurcates based on whether `cardId` is provided. Card payments go through payment gateway, wallet payments deduct from user balance.

2. **Execute charge**:
   - Card path: Calls `chargeCard()` which invokes Payment Hub V2
   - Wallet path: Calls `chargeWallet()` which updates user balance directly

   Both wrapped in same transaction to ensure atomicity.

3. **Record transaction**:
   ```javascript
   await ParkingMeterRepository.upsert(
     {
       transactionId: payment.legacyTransactionId,
       paymentReceipt: payment.reference,
       // ...
     },
     trx,
   );
   ```
   Creates local record with FK to central transaction table.

**Edge Cases**:

- If `cardId` is undefined → Uses wallet (user must have sufficient balance)
- If transaction fails after charge → Rollback via `trx`
- If user has no card → Falls back to wallet automatically

**Dependencies**:

- Calls: `chargeCard()`, `chargeWallet()`, `ParkingMeterRepository.upsert()`
- Uses: Payment Hub V2 API, User balance system
- Side effects:
  - Charges external payment gateway (if card)
  - Updates `PKM_TRANSACTION` table
  - Updates user wallet balance (if wallet)

**Example Usage**:

```javascript
// Card payment
await processPayment(
  {
    amount: 50.0,
    cardId: 12345,
    userId: 67890,
    zoneId: 1,
  },
  trx,
);

// Wallet payment
await processPayment(
  {
    amount: 50.0,
    cardId: undefined, // or omitted
    userId: 67890,
    zoneId: 1,
  },
  trx,
);
```

**Notes**:

- Uses transaction to ensure payment and record creation are atomic
- `legacyTransactionId` from hub links to `CDX_TRANSACTION` table for reconciliation
- Method selection is implicit (presence/absence of cardId) rather than explicit parameter

````

### Level 2: Component Explanation

**Template**:
````markdown
## [Component/Module Name]

**Location**: `path/to/module/`

**Type**: [Service / Repository / Controller / Utility / etc]

**Responsibility**: [What this component owns in the system]

**Public Interface**:
```[language]
// Main functions/methods exposed
export function method1(params): ReturnType
export function method2(params): ReturnType
```

**Internal Structure**:

- `file1.js`: [Responsibility]
- `file2.js`: [Responsibility]
- `helpers/`: [What helpers do]

**Key Abstractions**:

- [Abstraction 1]: [What it represents, why it exists]
- [Abstraction 2]: [What it represents, why it exists]

**Dependencies**:

- **Uses**:
  - [Module A]: For [purpose]
  - [Module B]: For [purpose]
- **Used By**:
  - [Module X]: For [purpose]
  - [Module Y]: For [purpose]

**Data Flow**:

```
[Input Source]
  → [Processing Step 1]
  → [Processing Step 2]
  → [Output Destination]
```

**State Management**:

- [What state it maintains, if any]
- [How state is persisted]

**Patterns Used**:

- [Pattern 1]: [Why / Where]
- [Pattern 2]: [Why / Where]

**Configuration**:

- Environment variables: [list]
- Constants: [list]
- Feature flags: [list]

**Examples**:

**Example 1: [Common use case]**

```[language]
[Concrete example showing typical usage]
```

**Example 2: [Edge case]**

```[language]
[Example showing how edge case is handled]
```

**Design Decisions**:

- **Why [decision]?**: [Reasoning, tradeoffs]
- **Why not [alternative]?**: [Why rejected]

**Known Limitations**:

- [Limitation 1 and workaround if any]
- [Limitation 2 and workaround if any]

````

### Level 3: Integration Explanation

**Template**:
````markdown
## Integration: [System A] ↔ [System B]

**Purpose**: [Why these systems integrate]

**Integration Pattern**: [API calls / Event-driven / Shared DB / Message Queue / etc]

**Contract**:

**[System A] → [System B]**:
```[language/format]
// Request format
{
  "field1": "type and meaning",
  "field2": "type and meaning"
}

// Response format
{
  "field1": "type and meaning",
  "field2": "type and meaning"
}
```

**[System B] → [System A]** (if bidirectional):

```[language/format]
// Format
```

**Data Flow**:

```
[System A]
  ↓
  1. [Trigger event/condition]
  2. [Prepare data]
  3. Call [System B endpoint/method]
  ↓
[System B]
  ↓
  4. [Process request]
  5. [Perform operation]
  6. Return [response/event]
  ↓
[System A]
  ↓
  7. [Handle response]
  8. [Update local state]
```

**Error Handling**:

- If [System B] is down → [Fallback behavior]
- If [System B] returns error → [How handled]
- If timeout → [Retry logic or fail]

**Synchronization**:

- **Consistency model**: [Eventual / Strong / etc]
- **Conflict resolution**: [How conflicts handled]
- **Reconciliation**: [How systems stay in sync]

**Example Scenarios**:

**Scenario 1: [Happy path]**

```markdown
1. User does X in System A
2. System A calls System B: [concrete request]
3. System B responds: [concrete response]
4. System A updates: [what changes]
```

**Scenario 2: [Failure path]**

```markdown
1. User does X in System A
2. System A calls System B: [request]
3. System B fails with: [error]
4. System A handles: [fallback]
```

**Contract Source**: [File path or URL to spec]

**Monitoring**:

- What to monitor: [metrics, logs]
- Success criteria: [what indicates healthy integration]
- Failure indicators: [what indicates problems]

````

**Example**:
````markdown
## Integration: Parking Meter Service ↔ Payment Hub V2

**Purpose**: Process parking meter payments (card and wallet) through centralized payment gateway

**Integration Pattern**: Synchronous HTTP API calls

**Contract**:

**Parking Meter → Payment Hub**:
```javascript
// Charge request
POST /api/v2/charge
{
  "amount": 50.00,
  "currency": "mxn",
  "paymentMethodToken": "tok_xxxx" | null,
  "paymentMethod": "card" | "wallet",
  "serviceId": "parking_meter",
  "userId": "usr_12345",
  "legacyUserId": 67890,
  "externalTransactionId": "01HQXY...",
  "context": {
    "zoneId": 1,
    "vehicleId": 123,
    // ...
  }
}

// Response
{
  "status": "success" | "failed",
  "transactionID": "txn_abc123",
  "legacyTransactionID": "legacy_xyz",
  "message": "Payment processed",
  "providerResponse": { /* gateway details */ },
  "nextAction": { /* 3DS if needed */ }
}
```

**Data Flow**:

```
[Parking Meter API]
  ↓
  1. User parks, requests payment
  2. Validate zone, vehicle, amount
  3. Call Payment Hub: POST /api/v2/charge
  ↓
[Payment Hub V2]
  ↓
  4. Validate payment method
  5. Call external gateway (Openpay/Orkestapay)
  6. Create CDX_TRANSACTION record
  7. Return response with legacyTransactionID
  ↓
[Parking Meter API]
  ↓
  8. Create PKM_TRANSACTION with legacyTransactionID as FK
  9. Send receipt email
  10. Return success to client
```

**Error Handling**:

- If Payment Hub is down → Return 503, user retries
- If card declined → Return specific error code, show user-friendly message
- If timeout (>30s) → Log for manual review, show "processing" to user
- If hub succeeds but local DB fails → Transaction rolls back (wrapped in trx)

**Synchronization**:

- **Consistency model**: Strong (synchronous)
- **Reconciliation**: `legacyTransactionID` links PKM_TRANSACTION → CDX_TRANSACTION
- **Idempotency**: `externalTransactionId` prevents double-charging

**Example Scenarios**:

**Scenario 1: Successful card payment**

```markdown
1. User parks in zone 1, owes $50
2. Parking Meter calls Payment Hub:
   {
   amount: 50.00,
   paymentMethod: "card",
   paymentMethodToken: "tok_card123",
   externalTransactionId: "01HQXY1234"
   }
3. Payment Hub charges Openpay, responds:
   {
   status: "success",
   transactionID: "txn_abc",
   legacyTransactionID: "legacy_xyz"
   }
4. Parking Meter creates PKM_TRANSACTION:
   {
   transactionId: "legacy_xyz", // FK to CDX_TRANSACTION
   paymentReceipt: "01HQXY1234",
   amount: 50.00
   }
```

**Scenario 2: Insufficient wallet balance**

```markdown
1. User tries to pay with wallet, balance: $20, owes: $50
2. Parking Meter calls Payment Hub:
   {
   amount: 50.00,
   paymentMethod: "wallet",
   paymentMethodToken: null
   }
3. Payment Hub checks balance, responds:
   {
   status: "failed",
   message: "Insufficient funds",
   error: { code: "insufficient_balance" }
   }
4. Parking Meter returns error to client:
   "Fondos insuficientes. Tu saldo: $20"
```

**Contract Source**:

- Payment Hub: `internal/dto/transactions.go` (ChargeRequest, ChargeResponse)
- Parking Meter: `src/api/services/PaymentGatewayService.js`

**Monitoring**:

- Success rate: >99% expected
- P95 latency: <2s
- Failed charges: Alert if >5% in 5min window
- Reconciliation: Daily job checks PKM_TRANSACTION.transactionId → CDX_TRANSACTION.id

````

### Level 4: Architecture Explanation

**Template**:
```markdown
## Architecture: [System/Feature Name]

**Overview**: [2-3 sentence description of what this is and why it exists]

**Architectural Pattern**: [Layered / Microservices / Event-Driven / Monolith / etc]

**High-Level Diagram**:
````

┌─────────────────┐
│ Client/UI │
└────────┬────────┘
│
▼
┌─────────────────┐
│ API Layer │
└────────┬────────┘
│
┌────┴────┐
▼ ▼
┌────────┐ ┌─────────┐
│Service │ │ Service │
│ A │ │ B │
└───┬────┘ └────┬────┘
│ │
▼ ▼
┌──────────────────┐
│ Database │
└──────────────────┘

```

**Components**:

### [Component 1]
- **Responsibility**: [What it owns]
- **Technology**: [Framework/language]
- **Interfaces**: [APIs/events it exposes]
- **Dependencies**: [What it needs]

### [Component 2]
- **Responsibility**: [What it owns]
- **Technology**: [Framework/language]
- **Interfaces**: [APIs/events it exposes]
- **Dependencies**: [What it needs]

**Key Flows**:

### Flow 1: [Main user journey]
```

1. User action: [What user does]
2. [Component A]: [Receives request, validates]
3. [Component B]: [Processes business logic]
4. [Component C]: [Persists state]
5. Response: [What user receives]

```

### Flow 2: [Secondary flow]
```

[Similar breakdown]

```

**Data Architecture**:

**Primary Entities**:
- [Entity 1]: [What it represents, key fields]
- [Entity 2]: [What it represents, key fields]

**Relationships**:
```

[Entity A] ─(1:N)─→ [Entity B]
[Entity B] ─(N:M)─→ [Entity C]

```

**Storage**:
- [Database 1]: [What data, why this DB]
- [Cache]: [What's cached, TTL]

**Scalability**:

**Bottlenecks**:
- [Bottleneck 1]: [What limits scale]
  - Mitigation: [How addressed]
- [Bottleneck 2]: [What limits scale]
  - Mitigation: [How addressed]

**Horizontal Scaling**:
- What scales: [Stateless services]
- What doesn't: [Stateful components]

**Performance Characteristics**:
- Read-heavy vs Write-heavy: [Which]
- Peak load: [Expected numbers]
- SLA targets: [Latency, uptime]

**Resilience**:

**Failure Modes**:
- If [Component X] fails → [Impact and fallback]
- If [Database] is slow → [Degradation strategy]
- If [External service] is down → [Fallback behavior]

**Recovery**:
- Retry logic: [Where, how]
- Circuit breakers: [Where applied]
- Graceful degradation: [What features degrade]

**Security**:

**Authentication**: [How users/services authenticate]
**Authorization**: [How permissions enforced]
**Data Protection**: [Encryption, PII handling]
**Attack Vectors**: [Known risks and mitigations]

**Trade-offs Made**:

**Decision 1**: [What was chosen]
- **Why**: [Reasoning]
- **Alternative considered**: [What was rejected]
- **Trade-off**: [What was sacrificed]

**Decision 2**: [What was chosen]
- **Why**: [Reasoning]
- **Alternative considered**: [What was rejected]
- **Trade-off**: [What was sacrificed]

**Evolution**:

**Current State**: [How it works today]
**Known Limitations**: [Current problems]
**Future Direction**: [Planned improvements]

**Operational Concerns**:

**Deployment**: [How deployed, rollout strategy]
**Monitoring**: [What's monitored, how]
**Debugging**: [How to troubleshoot]
**Runbooks**: [Link to operational docs]
```

### Level 5: Conceptual Explanation

**Template**:

```markdown
## Concept: [Feature/Problem Domain]

**Business Problem**: [What real-world problem this solves]

**Users Affected**: [Who benefits]

**Business Value**: [Why this matters to the business]

**Technical Challenge**: [Why it's technically interesting]

**Solution Approach**:

[2-3 paragraphs explaining the approach in business terms, then technical terms]

**Mental Model**:

Think of it like [analogy that relates to user's domain]:

- [Aspect 1] is like [analogy]
- [Aspect 2] is like [analogy]

**Key Concepts**:

### Concept 1: [Term]

**Definition**: [What it means]
**Why it exists**: [Problem it solves]
**Example**: [Concrete example from domain]

### Concept 2: [Term]

**Definition**: [What it means]
**Why it exists**: [Problem it solves]
**Example**: [Concrete example from domain]

**Constraints**:

- [Business constraint 1]
- [Technical constraint 1]
- [Regulatory constraint 1]

**Trade-offs**:

**Chose A over B**:

- Gains: [What we get]
- Loses: [What we sacrifice]
- Rationale: [Why worth it]

**Alternative Approaches**:

### Approach 1: [Name]

- How: [Brief description]
- Pros: [Benefits]
- Cons: [Drawbacks]
- Why not: [Reason for rejection]

### Approach 2: [Name]

- How: [Brief description]
- Pros: [Benefits]
- Cons: [Drawbacks]
- Why not: [Reason for rejection]

**Success Metrics**:

- [Metric 1]: [Target]
- [Metric 2]: [Target]

**Learning Resources**:

- [Related concept to read about]
- [Similar system that does this]
```

## Analysis Patterns

### Pattern 1: Layered Architecture Analysis

When analyzing layered systems:

```markdown
## Layer Analysis

**Presentation Layer** (Controllers, Routes):

- Files: [list]
- Responsibility: HTTP handling, validation, serialization
- Does NOT: Business logic, direct DB access

**Business Logic Layer** (Services):

- Files: [list]
- Responsibility: Business rules, orchestration
- Does NOT: HTTP concerns, SQL

**Data Access Layer** (Repositories):

- Files: [list]
- Responsibility: Database queries, ORM
- Does NOT: Business rules

**Cross-Cutting Concerns**:

- Authentication: [where/how]
- Logging: [where/how]
- Error handling: [where/how]

**Violations** (if any):

- [File X] in [Layer Y] does [Layer Z's job]
  - Impact: [Why this is problematic]
```

### Pattern 2: Event Flow Analysis

When analyzing event-driven systems:

````markdown
## Event Flow: [Event Name]

**Trigger**: [What causes this event]

**Producer**: [Component that emits]

**Event Payload**:

```json
{
  "eventType": "...",
  "data": { ... },
  "metadata": { ... }
}
```

**Consumers**:

### Consumer 1: [Name]

- **Action**: [What it does with event]
- **Side effects**: [What changes]
- **Failure mode**: [What if processing fails]

### Consumer 2: [Name]

- **Action**: [What it does with event]
- **Side effects**: [What changes]
- **Failure mode**: [What if processing fails]

**Ordering**: [In-order / At-least-once / Exactly-once]

**Idempotency**: [How duplicate events are handled]

**Timeline**:

```
T0: [Trigger occurs]
T1: [Event published]
T2: [Consumer 1 processes]
T3: [Consumer 2 processes]
T4: [All side effects complete]
```

**Tracing**: [How to trace this event through the system]

````

### Pattern 3: State Machine Analysis

When analyzing state management:

```markdown
## State Machine: [Entity Name]

**States**:
````

┌─────────┐
│ DRAFT │
└────┬────┘
│ submit()
▼
┌──────────┐
│SUBMITTED │
└────┬─────┘
│ approve() / reject()
▼
┌──────────┐ ┌──────────┐
│ APPROVED │ │ REJECTED │
└──────────┘ └──────────┘

```

**Transitions**:

| From | To | Trigger | Conditions | Side Effects |
|------|-----|---------|------------|--------------|
| DRAFT | SUBMITTED | `submit()` | [conditions] | [effects] |
| SUBMITTED | APPROVED | `approve()` | [conditions] | [effects] |
| SUBMITTED | REJECTED | `reject()` | [conditions] | [effects] |

**Invariants**:
- [Invariant 1]: [Always true condition]
- [Invariant 2]: [Always true condition]

**Edge Cases**:
- What if transition called in wrong state? [Behavior]
- What if transition fails midway? [Rollback]
```

### Pattern 4: Integration Pattern Analysis

When analyzing integrations:

```markdown
## Integration Pattern: [Pattern Name]

**Category**: [API Gateway / Event Bus / Shared DB / File Transfer / etc]

**Why This Pattern**: [Justification for choosing this integration style]

**Coupling**:

- **Data coupling**: [Shared data structures]
- **Temporal coupling**: [Must both be online?]
- **Platform coupling**: [Technology dependencies]

**Contract Evolution**:

- **Versioning strategy**: [How changes are managed]
- **Backward compatibility**: [How ensured]
- **Deprecation process**: [How old versions sunset]

**Testing Strategy**:

- **Contract tests**: [How contract is verified]
- **Integration tests**: [End-to-end tests]
- **Mocking**: [How dependencies are mocked]
```

## Visualization Guidelines

### When to Use Diagrams

**Component Diagrams**: When explaining architecture
**Sequence Diagrams**: When explaining flows over time
**State Diagrams**: When explaining state transitions
**Entity Relationship**: When explaining data models
**Flow Charts**: When explaining decision logic

### ASCII Diagram Style

Use clear, simple ASCII diagrams:

```
┌──────────────┐
│    Client    │
└──────┬───────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐
│   Gateway    │───────│  Auth Service│
└──────┬───────┘       └──────────────┘
       │
   ┌───┴────┐
   ▼        ▼
┌──────┐ ┌──────┐
│Service│ │Service│
│  A    │ │  B   │
└───────┘ └──────┘
```

**Symbols**:

- `┌─┐ └─┘`: Boxes (components)
- `│ ─ ├ ┤`: Lines (connections)
- `▼ ▲ ► ◄`: Arrows (direction)
- `┬ ┴ ┼`: Junctions

## Example Analyses

### Example 1: Implementation-Level

````markdown
## chargeCard()

**Location**: `src/api/services/ParkingMeterPaymentService.js` (lines 78-112)

**Purpose**: Charge a card payment through Payment Hub V2

**Signature**:

```javascript
async function chargeCard(params, trx)
```

**Parameters**:

- `params.amount` (number): Amount to charge
- `params.currency` (string): Currency code (e.g., "mxn")
- `params.cardId` (number): Card ID to charge
- `params.user` (Object): User object with id, newId
- `params.deviceSessionId` (string): Device fingerprint
- `params.description` (string): Payment description
- `trx` (Transaction): Knex transaction

**Returns**: Promise<PaymentResult>

**How It Works**:

1. **Get card token**:

   ```javascript
   const cardResult = await getCardByToken(
     user.id,
     cardId,
     idToString(user.newId),
   );
   ```

   Fetches card details from Payment Hub. Returns token for charging.

2. **Generate reference**:

   ```javascript
   const reference = Ulid.generate().toCanonical();
   ```

   Creates unique ID for transaction tracking and reconciliation.

3. **Call Payment Hub**:

   ```javascript
   const chargeResult = await paymentCharge({
     amount: Number(amount),
     currency,
     paymentMethodToken: token,
     paymentMethod: PAYMENT_METHOD.CARD,
     serviceId: PARKING_METER_SERVICE_ID,
     userId: idToString(user.newId),
     legacyUserId: user.id,
     deviceSessionID: deviceSessionId,
     // externalTransactionId: reference, // MISSING - should be added
   });
   ```

   Sends charge request to Payment Hub V2.

4. **Return result**:
   ```javascript
   return {
     ...chargeResult.data,
     reference,
     paymentType: PaymentType.CARD,
   };
   ```
   Combines hub response with local reference.

**Edge Cases**:

- If card not found → `cardResult.success = false`, function throws
- If hub declines → `chargeResult.data.status = "failed"`
- If network fails → Promise rejects, caught by caller

**Dependencies**:

- `getCardByToken()`: Retrieves card from Payment Hub
- `paymentCharge()`: Sends charge to Payment Hub
- Payment Hub V2 API

**Issues Identified**:

1. `reference` is generated but NOT sent to hub as `externalTransactionId`
   - Impact: Hub doesn't store our reference, harder to reconcile
   - Fix: Add `externalTransactionId: reference` to `paymentCharge` call

2. No validation of `amount` (negative, zero, too large)
   - Impact: Could send invalid charges to hub
   - Fix: Add validation before charging

**Example Usage**:

```javascript
const result = await chargeCard(
  {
    amount: 50.0,
    currency: "mxn",
    cardId: 12345,
    user: { id: 67890, newId: "usr_abc" },
    deviceSessionId: "device_xyz",
    description: "Parking zone 1",
  },
  trx,
);

// result = {
//   status: "success",
//   transactionID: "txn_123",
//   legacyTransactionID: "legacy_456",
//   reference: "01HQXY...",
//   paymentType: "CARD"
// }
```

````

### Example 2: Architecture-Level

```markdown
## Architecture: Parking Meter Payment System

**Overview**: Manages parking meter payments across multiple cities (Puebla, Guadalajara, etc.) supporting card and wallet payments through a centralized payment gateway (Payment Hub V2). Handles zone validation, pricing calculation, payment processing, and receipt generation.

**Architectural Pattern**: Service-Oriented Layered Architecture with Gateway Pattern

**High-Level Diagram**:
````

┌──────────────────────────┐
│ Mobile Apps (iOS/And) │
│ Parking Meter Kiosks │
└─────────────┬────────────┘
│ HTTPS
▼
┌──────────────────────────┐
│ API Gateway / Routes │
│ spots.js, spots-v2.js │
└─────────────┬────────────┘
│
┌─────┴──────┐
▼ ▼
┌───────────────┐ ┌────────────────┐
│ SpotService │ │ParkingMeterSvc │
│ (Legacy) │ │ (Current) │
└───────┬───────┘ └────────┬───────┘
│ │
└────────┬─────────┘
▼
┌──────────────────────┐
│PaymentGatewayService │ ◄── Abstraction Layer
└──────────┬───────────┘
│
▼
┌──────────────────────┐
│ Payment Hub V2 │ ◄── External Service
│ (Go microservice) │
└──────────┬───────────┘
│
┌───────┴────────┐
▼ ▼
┌─────────┐ ┌──────────┐
│ Openpay │ │Orkestapay│ ◄── Payment Providers
└─────────┘ └──────────┘

┌──────────────────────────┐
│ Database │
│ PKM_TRANSACTION ───FK─→ │
│ CDX_TRANSACTION │
│ USERS, CARDS, etc. │
└──────────────────────────┘

```

**Components**:

### API Layer
- **Files**: `src/api/routes/spots.js`, `spots-v2.js`, `spots-v3.js`
- **Responsibility**: HTTP request handling, routing by city/zone
- **Technology**: Express.js
- **Interfaces**: REST API (`POST /api/spots/payment`, etc.)
- **Dependencies**: SpotService, ParkingMeterPaymentService

### Service Layer
- **Files**:
  - `src/api/services/SpotService.js` (deprecated)
  - `src/api/services/ParkingMeterPaymentService.js` (current, Puebla)
  - `src/api/services/legacy/ParkingMeterPaymentService.js` (other cities)
  - `src/api/services/SpotSvc.js` (newer implementation)
- **Responsibility**: Business logic, orchestration, zone-specific rules
- **Dependencies**: PaymentGatewayService, Repositories

### Payment Gateway Layer
- **Files**: `src/api/services/PaymentGatewayService.js`
- **Responsibility**: Abstract payment processing, normalize hub responses
- **Interfaces**: `charge()`, `getCardByToken()`, etc.
- **Dependencies**: Payment Hub V2 HTTP API

### Repository Layer
- **Files**: `src/api/repositories/ParkingMeterRepository.js`, etc.
- **Responsibility**: Database access, query building
- **Dependencies**: Knex.js ORM, PostgreSQL

### Payment Hub V2 (External)
- **Technology**: Go microservice
- **Responsibility**:
  - Route to payment providers (Openpay, Orkestapay)
  - Create transactions in CDX_TRANSACTION
  - Return unified response
- **Interfaces**: REST API

**Key Flows**:

### Flow 1: Card Payment (Puebla)
```

1. User parks in zone, app shows amount $50
2. User selects card, submits payment
3. POST /api/spots-v2/payment
   ↓
4. ParkingMeterPaymentService.processPayment()
   - Validates zone, vehicle, amount
   - Calls chargeCard()
     ↓
5. PaymentGatewayService.charge()
   - Gets card token
   - Calls Payment Hub V2: POST /charge
     ↓
6. Payment Hub V2
   - Routes to Openpay
   - Creates CDX_TRANSACTION (id: legacy_xyz)
   - Returns { legacyTransactionID: "legacy_xyz" }
     ↓
7. ParkingMeterPaymentService
   - Creates PKM_TRANSACTION with transactionId: "legacy_xyz"
   - Sends email receipt
   - Returns success to app

```

### Flow 2: Wallet Payment (Puebla)
```

1. User selects wallet balance
2. POST /api/spots-v2/payment (no cardId)
   ↓
3. ParkingMeterPaymentService.processPayment()
   - Detects no cardId → wallet path
     ↓
4. PaymentGatewayService.charge()
   - paymentMethod: WALLET
   - Hub checks user balance
   - Deducts from wallet
     ↓
5. Creates PKM_TRANSACTION
6. Returns success

```

**Data Architecture**:

**Primary Entities**:
- **PKM_TRANSACTION**: Local parking meter transaction records
  - Key fields: `id`, `transactionId` (FK), `paymentReceipt`, `amount`, `zoneId`
- **CDX_TRANSACTION**: Central transaction ledger (managed by Payment Hub)
  - Key fields: `id`, `transaction_number`, `amount`, `status`, `provider`
- **USERS**: User accounts
- **PKM_MULTI_SPACE**: Multi-space parking records

**Relationships**:
```

PKM_TRANSACTION.transactionId ─(N:1)─→ CDX_TRANSACTION.id
PKM_TRANSACTION.userId ─(N:1)─→ USERS.id
PKM_TRANSACTION.zoneId ─(N:1)─→ ZONES.id

```

**Reconciliation**:
- `PKM_TRANSACTION.transactionId` links to `CDX_TRANSACTION.id`
- `PKM_TRANSACTION.paymentReceipt` is the external reference (ULID)
- Daily reconciliation job ensures PKM ↔ CDX alignment

**Scalability**:

**Bottlenecks**:
- Payment Hub V2 is single point of failure
  - Mitigation: Circuit breaker, timeout handling
- Database writes are synchronous
  - Mitigation: Transaction batching considered for future

**Horizontal Scaling**:
- API layer: Stateless, scales horizontally
- Service layer: Stateless, scales horizontally
- Payment Hub: Currently single instance (Go)
- Database: Primary-replica setup, read scaling

**Performance Characteristics**:
- Read-heavy: Zone lookups, user data
- Write spikes: Peak parking hours (8am, 5pm)
- P95 latency target: <2s for payment
- Peak: ~200 payments/hour per city

**Resilience**:

**Failure Modes**:
- If Payment Hub is down → 503 error, user retries
- If provider (Openpay) is slow → Hub times out (30s), returns error
- If database is slow → Connection pool exhaustion, requests queue

**Recovery**:
- Retry logic: Not implemented (user manually retries)
- Circuit breaker: Not implemented (planned)
- Graceful degradation: None (hard failure)

**Security**:

**Authentication**: JWT tokens in Authorization header
**Authorization**: User can only pay for own parking
**Data Protection**:
- Card tokens never stored locally (only in Payment Hub)
- PII encrypted at rest
- HTTPS only

**Trade-offs Made**:

**Decision 1**: Use Payment Hub V2 instead of direct provider integration
- **Why**: Centralize payment logic, support multiple providers
- **Alternative**: Each service calls Openpay/Orkestapay directly
- **Trade-off**: Added network hop (latency), dependency on hub availability
- **Rationale**: Worth it for maintainability and provider flexibility

**Decision 2**: Synchronous payment processing
- **Why**: User needs immediate confirmation
- **Alternative**: Async with webhook callback
- **Trade-off**: Slower user experience, must wait for payment
- **Rationale**: Parking use case requires immediate confirmation

**Decision 3**: Separate PKM_TRANSACTION and CDX_TRANSACTION
- **Why**: Parking domain needs specific fields, CDX is cross-service
- **Alternative**: Single transaction table
- **Trade-off**: Data duplication, reconciliation complexity
- **Rationale**: Domain separation, allows parking-specific queries

**Evolution**:

**Current State**:
- Mixed implementations (SpotService, ParkingMeterPaymentService, SpotSvc)
- Some cities on new flow, some on legacy
- Manual reconciliation between PKM and CDX

**Known Limitations**:
- No retry logic for failed payments
- No circuit breaker for Payment Hub
- Multiple service implementations (confusing)
- Missing wallet branch in some flows (bug)
- No comprehensive error mapping from hub

**Future Direction**:
- Consolidate to single service implementation
- Add resilience patterns (retry, circuit breaker)
- Automated reconciliation
- Real-time payment status webhooks
- Support for new payment methods (QR, bank transfer)

**Operational Concerns**:

**Deployment**:
- Blue-green deployment
- Gradual rollout by city (feature flags)

**Monitoring**:
- Payment success rate by city/provider
- P95 latency to Payment Hub
- Failed payment reasons
- Reconciliation drift

**Debugging**:
- Trace ID through logs (request ID)
- Payment Hub logs in separate system
- Reconciliation reports

**Runbooks**:
- Payment Hub down → Switch to maintenance mode
- High failure rate → Check provider status
- Reconciliation drift → Run manual sync script
```

## Quality Checklist

Before delivering explanation:

- [ ] Read all relevant source code
- [ ] Verified imports/dependencies
- [ ] Traced actual data flow
- [ ] Identified actual patterns used
- [ ] Included concrete examples from code
- [ ] Explained "why" not just "what"
- [ ] Used appropriate abstraction level
- [ ] Drew diagrams where helpful
- [ ] Noted limitations/issues found
- [ ] Connected to business value (if architectural)

## Anti-Patterns to Avoid

### ❌ Explaining Without Reading

**WRONG**:

```
This probably uses the repository pattern to access the database,
following standard MVC architecture...
```

**RIGHT**:

```
After reading ParkingMeterPaymentService.js:
- It does NOT use repository pattern directly
- Instead calls PaymentGatewayService, which calls Payment Hub V2
- The hub then handles database writes to CDX_TRANSACTION
- Local PKM_TRANSACTION writes use Knex directly (no repository)
```

### ❌ Jargon Without Context

**WRONG**:

```
It uses an event-driven microservices architecture with
eventual consistency leveraging CQRS and saga patterns.
```

**RIGHT**:

```
When a payment is processed:
1. The API service sends a charge request to Payment Hub (sync call)
2. The hub charges the provider and writes to the central DB
3. The API service then writes to its local DB with reference to central
4. If local write fails, transaction rolls back

This is a distributed transaction with strong consistency
(not eventual) using synchronous calls and database transactions.
No events, no CQRS, no sagas in this flow.
```

### ❌ No Examples

**WRONG**:

```
This function processes payments based on the payment method provided.
```

**RIGHT**:

```
This function processes payments. Example:

// Card payment
await processPayment({
  amount: 50,
  cardId: 123,
  userId: 456
}, trx);
// → Charges card via Payment Hub
// → Creates PKM_TRANSACTION with legacyTransactionID

// Wallet payment
await processPayment({
  amount: 50,
  cardId: undefined, // no card
  userId: 456
}, trx);
// → Deducts from user wallet
// → Creates PKM_TRANSACTION
```

### ❌ Ignoring Context

**WRONG**:

```
The code has a bug on line 45 where it doesn't handle null.
```

**RIGHT**:

```
Line 45 has a potential bug:

const user = users.find(u => u.id === userId);
console.log(user.name); // Crashes if user not found

However, checking the call sites:
- processPayment() validates user exists before calling
- The route middleware ensures authenticated user

So in practice, this line is never reached with null user.
Still, defensive coding suggests adding:
if (!user) throw new Error("User not found");
```

---

> "Understanding code is like archaeology—dig through layers, verify your findings, and explain what you discovered, not what you assumed."

**Explain what IS, not what you think SHOULD BE.**
