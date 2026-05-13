---
name: pre-pr-review
description: Analyze code changes before creating a PR with production-impact focus. Use when reviewing your own changes, preparing a PR, or conducting self-review before requesting team review. Identifies breaking changes, integration bugs, missing validations, and regressions by verifying against actual codebase, contracts, and production flows. Generates detailed, actionable feedback organized by severity.
license: MIT
---

This skill performs thorough pre-PR self-review to catch production-breaking issues before they reach code review, focusing on real-world impact rather than theoretical problems.

The user has made code changes and wants to review them before creating a PR. They may provide a diff, list of modified files, or describe the changes made.

## Core Principle

**VERIFY AGAINST REALITY, PRIORITIZE BY PRODUCTION IMPACT**

Review with the mindset of:

- What breaks in production if this merges?
- What data becomes inconsistent?
- What integrations fail?
- What error messages confuse users?
- What edge cases crash?

## Pre-Review Verification Protocol

Before analyzing ANY changes:

### 1. Understand the Change Context

**Read these FIRST**:

- [ ] PR description or commit messages (what was supposed to change)
- [ ] Related issue/ticket (original problem being solved)
- [ ] Related contract/spec files (what integrations depend on)
- [ ] Architecture docs (how this fits in the system)
- [ ] Plan.md if this is part of a tracked plan

### 2. Map the Change Surface

**Identify**:

- [ ] All modified files (list them)
- [ ] All new files (list them)
- [ ] All deleted files (list them)
- [ ] Dependencies between changed files
- [ ] External integrations affected
- [ ] Database schema changes
- [ ] API contract changes

### 3. Trace Production Flows

**For each modified file, answer**:

- What production flows use this code?
- Which users/regions are affected?
- What happens if this code throws an error?
- What data does this code touch?
- What external services does this call?

### 4. Verify Integration Points

**Check ACTUAL code**:

- [ ] Import/require paths resolve correctly
- [ ] Function signatures match actual definitions
- [ ] Fields exist in actual models/DTOs
- [ ] API responses contain expected fields
- [ ] External service contracts are honored
- [ ] Enum/status values exist in actual code

## Review Framework: Severity-First Analysis

Organize findings by production impact:

### 🔴 Blocker (Must Fix Before Merge)

**Criteria**:

- Production crashes/500 errors
- Data loss or corruption
- Security vulnerabilities
- Payment/transaction failures
- Broken imports/paths
- Missing required fields
- Auth/permission bypass

**Template**:

````markdown
🔴 Blocker N — [Short description]

[Detailed explanation of the problem]

**Location**: [file path (line number)]

**Current code**:

```[language]
[exact problematic code]
```

**Impact**: [What breaks in production? Which users? Which flows?]

**Root cause**: [Why this happens]

**Fix**:

```[language]
[concrete solution code]
```

[Optional: Additional context or alternatives]

````

### 🟠 Major (Should Fix Before Merge)

**Criteria**:
- Silent failures (no crash but wrong behavior)
- Missing error handling
- UX degradation
- Performance regression
- Incomplete feature (missing branches)
- Inconsistent state
- Missing validations

### 🟡 Minor (Can Fix Later)

**Criteria**:
- Code hygiene (unused imports)
- Suboptimal but working code
- Missing optimization
- Incomplete cleanup
- Minor UX improvements

### ✅ What's Good (Positive Feedback)

**Criteria**:
- Correct integration patterns
- Good error handling
- Proper transaction handling
- Clear improvement over previous code
- Good architectural decisions

## Critical Checks by Category

### 1. Import/Require Path Verification

**For every import/require statement**:

```markdown
## Import Path Analysis

**File**: [path to file with import]
**Line**: [line number]
**Import**: `require("../path/to/module")`

**Resolution Check**:
- Current directory: [actual directory of file]
- Resolves to: [computed absolute path]
- File exists: [YES/NO - verify by checking]

**Issue**: [if path is wrong, explain]

**Fix**: [correct path]
````

**Common path issues**:

- Relative path miscalculation (`../../` vs `../`)
- File moved but import not updated
- Works from one location but not another
- Case sensitivity on Linux vs local

### 2. Field/Property Existence Verification

**For every field access (obj.field, data[key])**:

````markdown
## Field Access Analysis

**File**: [path]
**Line**: [line number]
**Access**: `chargeResult.data.externalTransactionId`

**Source Verification**:

- Comes from: [function/API/service name]
- Actual response type: [DTO/interface name from actual code]
- Actual response structure:

```[language]
[paste ACTUAL type definition from source]
```

**Field exists**: [YES/NO - verify in actual type]

**Issue**: [if field doesn't exist, explain]
**Impact**: [undefined, null, crash, wrong data]
**Fix**: [use correct field or generate locally]

````

**Common field issues**:
- Backend changed response shape
- Frontend expects field that was removed
- Typo in field name
- Optional field not handled
- Field renamed but not updated everywhere

### 3. Conditional Branch Completeness

**For every if/else or switch**:

````markdown
## Branch Coverage Analysis

**File**: [path]
**Lines**: [line range]

**Before PR**:
```[language]
if (cardId) {
  // handle card
} else {
  // handle wallet
}
```

**After PR**:

```[language]
// only card path remains - wallet branch removed
```

**Missing cases**:

- cardId is null/undefined → [what happens?]
- paymentMethod is "wallet" → [handled? breaks?]

**Impact**: [production flow X breaks for users Y]

**Fix**: [restore missing branch or handle differently]

````

### 4. Error Path Verification

**For every try/catch, API call, external service**:

````markdown
## Error Handling Analysis

**File**: [path]
**Operation**: [what's being attempted]

**Error cases to handle**:
- [ ] Network failure
- [ ] Validation error (400)
- [ ] Unauthorized (401/403)
- [ ] Not found (404)
- [ ] Server error (500)
- [ ] Timeout
- [ ] External service down

**Current handling**:
```[language]
[actual error handling code]
```

**Issues**:

- [Error X returns generic message instead of specific]
- [Error Y crashes instead of graceful fallback]
- [Error Z not caught, propagates to user]

**User impact**: [what user sees when each error happens]

**Fix**: [improve error handling]

````

### 5. Data Consistency Verification

**For every database write, state change**:

```markdown
## Data Consistency Analysis

**Operation**: [insert/update/delete]
**Tables affected**: [list]

**Transaction handling**:
- [ ] Wrapped in transaction
- [ ] Rollback on error
- [ ] All-or-nothing semantics

**Orphan risk**:
- If step 1 succeeds but step 2 fails → [what data is orphaned?]

**Order of operations**:
1. [step 1]
2. [step 2]
3. [step 3]

**Issue**: [if order is wrong or transaction missing]

**Fix**: [correct order or add transaction]
````

### 6. Integration Contract Verification

**For every external API call, message queue, webhook**:

````markdown
## Integration Contract Check

**Integration**: [service name]
**Contract source**: [file path or URL to spec]

**Request sent**:

```json
{
  "field1": "value",
  "externalTransactionId": "reference"
}
```

**Contract expects**:

```json
{
  "field1": "value"
  // externalTransactionId not in contract
}
```

**Mismatch**: [field not in contract, will be ignored]

**Response expected in code**:

```json
{
  "data": {
    "externalTransactionId": "..." // code reads this
  }
}
```

**Actual response from contract**:

```json
{
  "status": "...",
  "transactionID": "...",
  "legacyTransactionID": "..."
  // no externalTransactionId
}
```

**Impact**: [field is undefined, breaks downstream]

**Fix**: [generate locally and use that, or update contract]

````

## Domain-Specific Checks

### Payment/Transaction Code

**Additional checks**:
- [ ] Amount handling (type, precision, currency)
- [ ] Double-charge prevention (idempotency)
- [ ] Refund flow completeness
- [ ] Transaction reference reconciliation
- [ ] Ledger consistency (debit + credit balance)
- [ ] Payment method validation
- [ ] Card/wallet balance checks before charge
- [ ] Receipt generation (all required fields)
- [ ] Email/notification with correct data

### API Endpoints

**Additional checks**:
- [ ] Authentication required
- [ ] Authorization for user/role
- [ ] Input validation (all fields)
- [ ] Rate limiting considered
- [ ] Pagination for list endpoints
- [ ] Proper HTTP status codes
- [ ] Consistent error format
- [ ] Breaking vs non-breaking changes

### Database Migrations

**Additional checks**:
- [ ] Rollback script exists
- [ ] Data migration for existing records
- [ ] Index creation (online vs offline)
- [ ] Foreign key constraints validated
- [ ] Default values for new NOT NULL columns
- [ ] Performance impact estimated

### Background Jobs/Queues

**Additional checks**:
- [ ] Retry logic for failures
- [ ] Dead letter queue handling
- [ ] Idempotency (safe to run multiple times)
- [ ] Timeout handling
- [ ] Poison message handling
- [ ] Monitoring/alerting

## Review Output Format

### Structure

```markdown
# Review: [PR Title/Branch Name]

## Summary
[1-2 sentence overview of changes and general assessment]

## Change Surface
**Modified**: [count] files
**Added**: [count] files
**Deleted**: [count] files

**Key areas affected**:
- [Area 1]: [brief description]
- [Area 2]: [brief description]

**Integration points touched**:
- [Service/API 1]
- [Service/API 2]

---

## Blockers (Must Fix)

### 🔴 Blocker 1 — [Title]
[Detailed analysis using template above]

### 🔴 Blocker 2 — [Title]
[Detailed analysis using template above]

---

## Major Issues (Should Fix)

### 🟠 Major 1 — [Title]
[Detailed analysis using template above]

---

## Minor Issues (Can Fix Later)

### 🟡 Minor 1 — [Title]
[Detailed analysis using template above]

---

## ✅ What's Working Well

- [Positive point 1 with specific code reference]
- [Positive point 2 with specific code reference]
- [Good architectural decision with reasoning]

---

## Suggested Next Steps

1. [Most critical fix]
2. [Second priority]
3. [Testing recommendations]
4. [Additional verification needed]

## Risk Assessment

**Merge risk**: [HIGH/MEDIUM/LOW]

**Reason**: [Why this risk level]

**Affected users**: [Specific user groups, regions, or "all users"]

**Rollback plan**: [How to rollback if this breaks production]

**Recommended testing**:
- [ ] [Specific flow 1 to test]
- [ ] [Specific flow 2 to test]
- [ ] [Edge case 1 to verify]
````

## Example Review Analysis

### Blocker Example (Import Path)

````markdown
🔴 Blocker 1 — Broken require path in ParkingMeterPaymentService.js

Line 31 resolves to a file that does not exist:

**Location**: `src/api/services/ParkingMeterPaymentService.js` (line 31)

**Current code**:

```javascript
const {
  charge: paymentCharge,
  getCardByToken,
  PAYMENT_METHOD,
} = require("../PaymentGatewayService"); // resolves to src/api/PaymentGatewayService.js — missing
```

**Path resolution**:

- Current file: `src/api/services/ParkingMeterPaymentService.js`
- Relative path: `../PaymentGatewayService`
- Resolves to: `src/api/PaymentGatewayService.js`
- File exists: **NO** ❌

**Actual file location**: `src/api/services/PaymentGatewayService.js`

**Why this happened**: The sibling file `src/api/services/legacy/ParkingMeterPaymentService.js` uses the same relative path `../PaymentGatewayService`, but being one level deeper, it correctly resolves to `src/api/services/PaymentGatewayService.js`. This was copy-pasted without adjusting for directory depth.

**Impact**:

- Any route that loads this module throws `MODULE_NOT_FOUND`
- Current live consumer: `spots-v2.js` for zones in `TEMPORAL_HACK_IDS_FOR_PUEBLA`
- **Puebla parking meter payments fail with 500 error in production**

**Fix**:

```javascript
const {
  charge: paymentCharge,
  getCardByToken,
  PAYMENT_METHOD,
} = require("./PaymentGatewayService"); // same directory
```

````

### Field Missing Example

````markdown
🔴 Blocker 3 — Using field that Payment Hub never returns

Two locations read `chargeResult.data.externalTransactionId` from the Payment Hub response, but this field doesn't exist in the actual contract.

**Location 1**: `legacy/pvpayment/index.js` — `parseResult()`
**Location 2**: `legacy/pvpayment/index.js` — `payParkingMeter()` → `ParkingMeterRepository.upsert()`

**Current code**:
```javascript
// parseResult()
paymentReceipt: chargeResult.data?.externalTransactionId,

// payParkingMeter()
await ParkingMeterRepository.upsert({
  paymentReceipt: chargeResult.data?.externalTransactionId,
});
```

**Contract verification**:
Source: `internal/dto/transactions.go` — `ChargeResponse`

**Actual response structure**:

```go
type ChargeResponse struct {
    Status              string
    TransactionID       string
    LegacyTransactionID string
    Message             string
    ProviderResponse    map[string]any
    NextAction          map[string]any
}
```

**Field exists**: NO ❌ (`externalTransactionId` is not in the response)

**Impact**:

- `PKM_MULTI_SPACE.paymentReceipt` is always `NULL`/`undefined`
- API response exposes `paymentReceipt: undefined` to app
- Email receipt shows `reference: undefined`
- **Cannot reconcile with `CDX_TRANSACTION.transaction_number`**
- Payment audit trail is broken

**Additional issue**: The call to `paymentCharge` also doesn't send `externalTransactionId`, so the hub has no reference from the core side either.

**Fix**: Generate the reference locally once, send it to the hub, and use it as single source of truth:

```javascript
const reference = Ulid.generate().toCanonical();

const chargeResult = await paymentCharge({
  amount: Number(calculation.amount),
  currency: context.country?.currency || "mxn",
  description,
  paymentMethodToken: token || null,
  paymentMethod: mapMethodToPaymentMethod(method),
  serviceId: PARKING_METER_SERVICE_ID,
  userId: idToString(user.newId),
  legacyUserId: user.id,
  deviceSessionID: fingerprint,
  externalTransactionId: reference, // <-- send to hub
  context: {
    /* ... */
  },
});

// Use reference as paymentReceipt everywhere
await ParkingMeterRepository.upsert({
  // ...
  paymentReceipt: reference, // <-- use local reference
});

const response = parseResult({
  calculation,
  zone,
  vehicle,
  chargeResult,
  reference, // <-- pass explicitly, don't read from chargeResult
});
```

Adjust `parseResult` to receive `reference` as parameter instead of reading from response.

````

### Missing Branch Example

````markdown
🔴 Blocker 2 — Wallet payment branch removed, breaks Puebla flow

Before PR, `legacy/ParkingMeterPaymentService.processPayment` had conditional logic for card vs wallet:

**Before**:
```javascript
if (cardId) {
  payment = await chargeCard({ ... }, trx);
} else {
  payment = await chargeWallet({ ... }, trx);
}
```

**After PR**: Unconditional call to `chargeCard`, `chargeWallet` completely removed.

**Impact**:

- In `spots-v2.js`, `cardId` is optional in request body
- When Puebla user pays with wallet balance (no `cardId`):
  ```javascript
  const cardResult = await getCardByToken(
    user.id,
    undefined,
    idToString(user.newId),
  );
  // → { success: false, error: { code: 3012, message: "Card not found" } }
  ```
- Request dies with `CARD_NOT_FOUND`
- **Wallet payments in Puebla are completely broken**

**Additional issue**: Inside `chargeCard`, `paymentType` is hardcoded:

```javascript
paymentType: PaymentType.CARD;
```

This is incorrect for wallet case even when restored.

**Fix**: Restore wallet branch and set `paymentType` based on method:

```javascript
let payment;
if (cardId) {
  payment = await chargeCard(
    {
      /* ... */
    },
    trx,
  );
} else {
  // Restore wallet branch using new payment gateway pattern
  payment = await paymentCharge({
    amount: Number(amount),
    currency,
    description,
    paymentMethodToken: null,
    paymentMethod: PAYMENT_METHOD.WALLET,
    serviceId: PARKING_METER_SERVICE_ID,
    userId: idToString(user.newId),
    legacyUserId: user.id,
    // ... rest of params
  });
}

// Set paymentType based on actual method used
const paymentType = cardId ? PaymentType.CARD : PaymentType.WALLET;
```

````

## Anti-Patterns to Avoid

### ❌ Vague Issue Reporting

**WRONG**:
```

This looks broken.
There might be a problem here.
Consider checking this.

```

**RIGHT**:
```

🔴 Blocker: Import path resolves to non-existent file

**Location**: src/api/services/ParkingMeterPaymentService.js (line 31)
**Resolves to**: src/api/PaymentGatewayService.js (does not exist)
**Impact**: MODULE_NOT_FOUND on production Puebla payments
**Fix**: Change to ./PaymentGatewayService

```

### ❌ Assuming Without Verifying

**WRONG**:
```

The hub probably returns externalTransactionId, so this should work.

```

**RIGHT**:
```

Verified actual hub response (internal/dto/transactions.go):
ChargeResponse does NOT contain externalTransactionId field.
Code reads chargeResult.data?.externalTransactionId → always undefined.

```

### ❌ Only Criticizing

**WRONG**:
```

[10 blockers listed]
[5 major issues listed]
[15 minor issues listed]
[No mention of what's good]

```

**RIGHT**:
```

[Issues listed organized by severity]

✅ What's Working Well:

- Correct use of legacyTransactionId as FK to CDX_TRANSACTION
- Proper transaction order: charge first, then create local record
- Good fallback: card.tokens?.[0]?.token || card.token

```

### ❌ No Production Context

**WRONG**:
```

Field doesn't exist in response.

```

**RIGHT**:
```

Field doesn't exist in response.
**Impact**:

- Payment receipt shows "reference: undefined" to users
- Accounting reconciliation impossible
- Affects all Puebla parking meter transactions (~500/day)

```

## Quality Checklist

Before submitting review:

- [ ] Verified all import/require paths by checking file existence
- [ ] Checked all field accesses against actual type definitions
- [ ] Traced production flows affected by changes
- [ ] Identified all integration points and verified contracts
- [ ] Listed concrete fixes, not just problems
- [ ] Organized by severity with clear priority
- [ ] Included production impact for each issue
- [ ] Acknowledged good code and decisions
- [ ] Provided testing recommendations
- [ ] Estimated merge risk

---

> "A great review finds real bugs before production does. An excellent review teaches the team how to prevent them next time."

**Review like you're debugging production at 3am—because that's the alternative.**
