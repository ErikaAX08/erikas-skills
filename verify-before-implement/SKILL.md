---
name: verify-before-implement
description: Analyze and implement code changes with strict verification protocol. Use when implementing features, fixing bugs, or modifying existing code. Enforces reality-checking against actual codebase, contracts, and specs before making changes. Prevents assumption-based development and invented parameters/entities.
license: MIT
---

This skill enforces a verification-first approach to code analysis and implementation, preventing the common AI failure mode of inventing parameters, endpoints, entities, or behaviors that don't exist in the actual codebase.

The user requests implementation, bug fixes, refactoring, or code analysis. They may reference features, endpoints, models, or behaviors that need verification before proceeding.

## Core Principle

**VERIFY REALITY BEFORE IMPLEMENTING**

Never assume. Never invent. Never guess.

- If you haven't read the file, you don't know what's in it.
- If you haven't checked the contract, you don't know the actual API shape.
- If you haven't inspected the model, you don't know the actual fields.
- If you haven't traced the code path, you don't know the actual behavior.

## Pre-Implementation Checklist

Before writing ANY code, complete this verification sequence:

### 1. Read Source of Truth Documents (MANDATORY)

**Always read these first**:

- [ ] Repository root README.md
- [ ] Module-specific README.md (if exists)
- [ ] Contract/spec files referenced in scope
- [ ] Related plan.md (if this is part of a plan)

**For backend/API work, also read**:

- [ ] API contract spec (e.g., docs/specs/\*-contrato.md)
- [ ] apps/backend/README.md or equivalent
- [ ] Database schema/models documentation

**For frontend work, also read**:

- [ ] Component documentation
- [ ] API integration specs
- [ ] Design system/style guide (if exists)

### 2. Inspect Actual Code (MANDATORY)

**Before touching any file**:

- [ ] Read the target file(s) completely
- [ ] Trace imports and dependencies
- [ ] Check existing function signatures
- [ ] Verify actual model fields/types
- [ ] Review existing error handling patterns
- [ ] Check test files for expected behavior

**Search for**:

- Existing implementations of similar features
- Utility functions you might reuse
- Naming conventions in use
- Validation patterns already established

### 3. Verify Claims and Assumptions

**If the user says "the endpoint returns X"**:

- [ ] Find the actual endpoint code
- [ ] Read the actual response serializer
- [ ] Verify the actual return type
- [ ] Check if X actually exists or is invented

**If the user says "the model has field Y"**:

- [ ] Open the actual model file
- [ ] Verify field Y exists
- [ ] Check its actual type and constraints
- [ ] Confirm it's not a misremembered field name

**If the user mentions "status can be Z"**:

- [ ] Find the status enum/choices
- [ ] List ALL valid values
- [ ] Verify Z is actually valid
- [ ] Don't invent new status values

## Reality Check Protocol

### When You Encounter Unknown Information

**STOP and follow this decision tree**:

1. **Can I verify this by reading existing code?**
   - YES → Read the file and verify
   - NO → Continue to 2

2. **Is this documented in contract/spec/README?**
   - YES → Read the documentation and verify
   - NO → Continue to 3

3. **Is this a reasonable inference from verified facts?**
   - YES → Document the inference explicitly and continue
   - NO → Continue to 4

4. **ASK THE USER**
   - State what you know
   - State what you don't know
   - Ask specific questions
   - Propose options if applicable

### Never Proceed When

- You haven't read the contract but are implementing an API
- You haven't checked the model but are adding fields
- You haven't inspected the file but are "fixing" it
- The user's description conflicts with actual code
- A required field/endpoint/entity doesn't exist in reality

## Implementation Rules

### Rule 1: Contract Alignment (APIs)

**Before implementing any API change**:

```markdown
## Contract Verification Checklist

- [ ] Endpoint path matches contract exactly
- [ ] HTTP method matches contract
- [ ] Request payload fields match contract (name, type, required/optional)
- [ ] Response payload fields match contract (name, type, presence)
- [ ] Status codes match contract
- [ ] Error response format matches contract
- [ ] Authentication requirements match contract
- [ ] No invented fields added to request/response
- [ ] No contract-breaking changes introduced

**Contract Reference**: [exact section/endpoint ID]
**Deviations**: [none | list specific deviations with justification]
```

**If contract doesn't exist**:

- Document the gap in implementation notes
- Propose contract addition with explicit user approval
- Don't proceed without design decision

### Rule 2: Model/Schema Verification (Database)

**Before modifying any model**:

```markdown
## Model Verification

**File**: [actual file path]
**Model**: [actual class name]

**Existing Fields Verified**:

- field_name: type, constraints
- [list ALL relevant existing fields]

**New Fields Proposed**:

- field_name: type, constraints, justification
- [list ONLY new fields with reasoning]

**Field Name Conflicts Checked**: [yes/no - explain if no]
**Migration Impact**: [describe or mark as none]
```

**Common Mistakes to Avoid**:

- Inventing field names that don't exist
- Assuming a field exists because it "should"
- Modifying fields without checking dependencies
- Adding fields without migration plan

### Rule 3: Type Safety (All Languages)

**Before using any type/interface**:

````markdown
## Type Verification

**Source**: [actual file defining the type]
**Type Name**: [exact name as defined]

**Actual Structure**:

```typescript
// Copy EXACT definition from source
interface User {
  id: string;
  email: string;
  // ... actual fields only
}
```

**Usage Validation**:

- [ ] All accessed fields exist in actual type
- [ ] All required fields are provided
- [ ] No assumed fields that don't exist
- [ ] Type annotations match actual definitions
````

### Rule 4: Endpoint Integration (Frontend)

**Before calling any API endpoint**:

````markdown
## Endpoint Integration Checklist

**Endpoint**: [actual path from backend]
**Method**: [actual HTTP method]

**Request Shape** (from actual backend code):

```json
{
  "field1": "type verified from serializer",
  "field2": "type verified from serializer"
}
```

**Response Shape** (from actual backend code):

```json
{
  "field1": "type verified from serializer",
  "field2": "type verified from serializer"
}
```

**Error Codes** (from actual backend):

- 400: [actual error format]
- 401: [actual error format]
- [list actual error responses]

**Verified Against**: [backend file path and line numbers]
````

### Rule 5: State Management

**Before implementing state transitions**:

```markdown
## State Verification

**Source**: [file defining valid states]

**Valid States** (from actual code):

- STATE_1
- STATE_2
- [list ONLY actual valid values]

**Valid Transitions** (from actual code):

- STATE_1 → STATE_2 (under condition X)
- [list ONLY actual allowed transitions]

**Invented States**: [none | would need to add: STATE_X]
**Requires Spec Update**: [yes/no]
```

## Documentation During Implementation

### Implementation Notes Template

Create/update notes in appropriate location (plan notes.md, inline comments, or dedicated doc):

```markdown
## Implementation Notes: [Feature/Fix Name]

### Verified Facts

- [Fact 1 verified by reading file X]
- [Fact 2 verified by reading contract section Y]
- [Fact 3 verified by testing code path Z]

### Assumptions Made (Explicit)

- [Assumption 1]: Based on [evidence], assuming [thing]
- Confidence: [high/medium/low]
- Validated by: [method or pending]

### Gaps Found

- [Gap 1]: Contract doesn't specify [X], implemented as [Y]
- [Gap 2]: No existing pattern for [Z], created new pattern
- [Action needed]: [document in contract / get approval / etc]

### Deviations from Plan/Request

- [Deviation 1]: User asked for X, but actual code does Y
- [Reason]: [explanation]
- [User notified]: [yes/no]

### Files Modified

- path/to/file.py: [what changed and why]
- path/to/test.py: [tests added]

### Testing Performed

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing: [describe]
- [ ] Edge cases verified: [list]
```

## Anti-Patterns to Prevent

### ❌ Assumption-Based Development

**WRONG**:

```python
# User says "add status field to response"
# AI invents field without checking

def get_user(user_id):
    user = User.objects.get(id=user_id)
    return {
        'id': user.id,
        'email': user.email,
        'status': user.status  # ❌ Didn't verify User model has 'status'
    }
```

**RIGHT**:

```python
# First: view User model, confirm fields
# Found: User has 'is_active' boolean, not 'status'
# Ask user: "User model has 'is_active' (boolean), not 'status'.
#           Should I map is_active to status, or add new status field?"

# After user clarifies:
def get_user(user_id):
    user = User.objects.get(id=user_id)
    return {
        'id': user.id,
        'email': user.email,
        'status': 'active' if user.is_active else 'inactive'  # ✅ Verified approach
    }
```

### ❌ Contract Invention

**WRONG**:

```javascript
// Contract says: GET /api/users/{id} returns {id, email}
// AI adds fields not in contract

async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();

  // ❌ Assuming fields that don't exist in contract
  displayName(user.firstName, user.lastName);
  showAvatar(user.avatarUrl);
  updateStatus(user.accountStatus);
}
```

**RIGHT**:

```javascript
// First: Read contract - only {id, email} are returned
// Document the gap

async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();

  // ✅ Use only verified fields
  displayEmail(user.email);

  // Document: "Contract doesn't include name/avatar.
  //            Need to either: 1) Update contract to add fields
  //                           2) Call separate endpoints
  //                           3) Use different approach"
  // Ask user for direction
}
```

### ❌ Type Hallucination

**WRONG**:

```typescript
// AI invents interface without checking actual API

interface UserResponse {
  id: string;
  email: string;
  profile: {
    // ❌ Invented nested object
    firstName: string;
    lastName: string;
  };
  preferences: {
    // ❌ Invented nested object
    theme: string;
    language: string;
  };
}
```

**RIGHT**:

```typescript
// First: Check actual backend serializer
// Found: Only flat structure with {id, email, created_at}

interface UserResponse {
  id: string;
  email: string;
  created_at: string; // ✅ Actual field from backend
}

// Document: "Backend only returns id, email, created_at.
//            Profile and preferences would require separate endpoints
//            or backend changes. Which approach should we take?"
```

### ❌ Status/Enum Invention

**WRONG**:

```python
# AI invents status values without checking enum

def update_order(order_id, status):
    # ❌ Assumes these are valid without verification
    if status in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        order.status = status
        order.save()
```

**RIGHT**:

```python
# First: Check Order model for actual status choices
# Found: class OrderStatus(models.TextChoices):
#           DRAFT = 'draft'
#           SUBMITTED = 'submitted'
#           APPROVED = 'approved'
#           REJECTED = 'rejected'

def update_order(order_id, status):
    # ✅ Use actual enum values
    if status not in [choice.value for choice in OrderStatus]:
        raise ValueError(f"Invalid status. Valid: {[c.value for c in OrderStatus]}")

    order.status = status
    order.save()

# Document: "Current statuses: draft, submitted, approved, rejected.
//            User requested: pending, processing, shipped, delivered, cancelled
//            These don't match. Need to either:
//            1) Map user's terms to existing statuses
//            2) Extend OrderStatus enum (requires migration)
//            Which approach?"
```

## Conflict Resolution Protocol

### When User Request Conflicts with Reality

**Template**:

```markdown
## Conflict Detected

**User Request**: [what user asked for]

**Actual Reality**: [what exists in code/contract]

**Conflict**: [specific mismatch]

**Options**:

1. **Adapt request to reality**: [how to implement using what exists]
   - Pros: [list]
   - Cons: [list]

2. **Extend reality to match request**: [what would need to change]
   - Requires: [contract update / model change / etc]
   - Impact: [migration / breaking change / etc]
   - Pros: [list]
   - Cons: [list]

3. **Alternative approach**: [different solution]
   - Pros: [list]
   - Cons: [list]

**Recommendation**: [your suggestion with reasoning]

**Awaiting user direction before proceeding.**
```

## Quality Gates

Before marking implementation complete:

### Verification Checklist

- [ ] All modified files were read before modification
- [ ] All referenced contracts/specs were verified
- [ ] No invented fields/endpoints/entities
- [ ] All assumptions explicitly documented
- [ ] All conflicts resolved with user input
- [ ] Implementation matches actual codebase patterns
- [ ] Tests cover verified behavior
- [ ] Documentation reflects actual implementation

### Self-Review Questions

1. Did I read every file I modified?
2. Did I verify every field/parameter I used?
3. Did I check contracts before implementing APIs?
4. Did I ask when uncertain instead of assuming?
5. Can I trace every decision to verified source?
6. Did I document gaps between request and reality?
7. Would another developer understand my reasoning?

## Escalation Triggers

**STOP and ask user when**:

- Contract doesn't cover the requested feature
- User request conflicts with existing contract
- Required field/entity doesn't exist in codebase
- Multiple valid implementation approaches exist
- Significant deviation from plan is needed
- Breaking change would be required
- Uncertainty about business logic
- Security/permission implications unclear

## Integration with plan-write-new

If working within an existing plan:

1. **Reference the plan**: Check plan.md for guidance
2. **Update log.md**: Document verification findings
3. **Update notes.md**: Record gaps/conflicts discovered
4. **Follow task boundaries**: Don't exceed defined scope
5. **Escalate deviations**: Update plan if reality differs

---

> "The fastest way to ship bugs is to implement based on assumptions. The fastest way to ship quality is to verify first."

**When in doubt, verify. When uncertain, ask. Never invent.**
