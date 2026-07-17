---
name: verify-before-implement
description: Analyze and implement code changes with strict verification protocol. Use when implementing features, fixing bugs, or modifying existing code. Enforces reality-checking against actual codebase, contracts, and specs before making changes. Prevents assumption-based development and invented parameters/entities.
license: MIT
---

# VERIFY-BEFORE-IMPLEMENT.md — Reality-First Implementation Skill

> **Purpose:** this is the operational rulebook an AI agent (or a human) follows before and while
> writing code, to prevent the most common AI failure mode in software engineering — inventing
> parameters, endpoints, fields, types, status values, config keys, or library APIs that sound
> plausible but don't exist in the actual codebase, contract, or dependency being used.
>
> **This file is self-contained by design.** It doesn't assume the codebase has any particular
> language, framework, or stack — the verification _method_ below applies the same way to a Python
> Django service, a Go microservice, a React frontend, or a bash script. Where a project has its own
> stricter standards (an API-contract skill, an architecture skill, a commit-message skill), those
> win on their specific topic — this file is the general-purpose verification discipline underneath
> all of them, not a replacement for any of them.

---

## 0. How to use this file

1. **Before writing any code**, identify what you're about to touch — an API contract, a database
   model, a type/interface, a config value, a third-party library call, a CLI flag, a UI component —
   and pick the matching checklist in §6. Every category has the same shape: find the actual
   definition, copy it verbatim, verify against it, don't proceed on a guess.
2. **While reading**, follow the source-of-truth hierarchy in §3 and the pre-implementation sequence
   in §4. If you hit something you can't verify, don't push through it — follow the decision tree in
   §5.
3. **While implementing**, keep running notes per §7 (verified facts, explicit assumptions, gaps
   found) — this is what makes §9's conflict-resolution and §12's escalation possible instead of
   silent guessing.
4. **Before calling anything "done"**, run the checklist in §11 and the self-review questions under
   it. §10 is a list of failure modes already known to happen — check the change doesn't repeat one
   of them.
5. If something is genuinely ambiguous even after following §3–§6, **stop and ask** (§5 step 4, §12) —
   don't resolve the ambiguity by picking the answer that lets you keep typing.

---

## 1. Non-negotiables (would make an implementation wrong, not just imperfect)

- **Never write a field, parameter, endpoint, status value, or config key into code without having
  read its actual definition first.** "It should have a `status` field" is not verification; opening
  the model file and finding `status` (or not) is.
- **Never invent a library/API call signature from memory.** If you haven't checked the installed
  version's actual signature (via its source, its type stubs, or its docs matching the installed
  version), you don't know it — memory of a different major version is a common, silent source of
  bugs.
- **Never let a stale document win over the code it's supposed to describe**, and never let the code
  win over a document when the document is what defines the contract (an OpenAPI spec, a public API
  contract, a schema migration source of truth) — §3 gives the priority order; when in doubt, that a
  discrepancy exists is itself something to report, not silently resolve either way.
- **Never silently patch over a gap or a conflict.** If the user's request doesn't match reality,
  that mismatch gets surfaced (§9), not quietly "fixed" by picking whichever interpretation is easiest
  to implement.
- **Never claim something was verified, tested, or checked when it wasn't actually done.** "Tests
  pass" means they were run and their output was read, not that the code looks like it should pass.
- **Never carry an assumption forward as if it were a verified fact.** An assumption is allowed (§5
  step 3) but it must stay labeled as one in the notes (§7) until it's actually confirmed.
- **Never resolve a user/reality conflict by silently picking the interpretation that's least work.**
  Present the conflict and the options (§9); let the user decide when the decision has product or
  architectural consequences.

---

## 2. Core principle

**VERIFY REALITY BEFORE IMPLEMENTING**

Never assume. Never invent. Never guess.

- If you haven't read the file, you don't know what's in it.
- If you haven't checked the contract, you don't know the actual API shape.
- If you haven't inspected the model, you don't know the actual fields.
- If you haven't traced the code path, you don't know the actual behavior.
- If you haven't checked the installed version, you don't know the actual library API.

Every rule in this file is a specific application of that one sentence to a specific kind of claim.

---

## 3. Source-of-truth hierarchy (when something isn't covered, or two sources disagree)

Different sources of truth carry different weight, and they can disagree with each other. Use this
order to resolve a conflict; if the order itself doesn't resolve it, that's a genuine gap — go to §5.

1. **The actual running/compiled code, read directly.** A model file, a handler, a component — the
   thing that will actually execute. This beats any description of it.
2. **The actual, currently-installed dependency's source or type definitions** — not a cached mental
   model of "what that library's API looks like," which may be stale by one or more major versions.
3. **A machine-checked contract that gates the code** (an OpenAPI/JSON-Schema/GraphQL schema wired
   into CI, a database migration history, a generated type from a schema). These are authoritative
   for _shape_ even when the current code hasn't caught up yet — a mismatch here is a bug to flag, not
   a license to follow the code instead.
4. **Project-level documentation** (README, architecture doc, ADR, a project-specific skill like an
   API-standards or architecture skill in this same skills directory). Authoritative for _intent and
   convention_ — read these first (§4.1) because they tell you where to look, but verify what they
   claim against #1–#3 before relying on specifics.
5. **Tests.** Authoritative for _documented expected behavior_, with a caveat: a test can itself be
   wrong or stale. Treat a test as strong evidence, not as an unquestionable oracle — if a test and
   the actual running code disagree, that's a conflict to surface, not a tiebreaker to trust blindly.
6. **The user's description of the system.** Useful for intent and priorities, but the least reliable
   for exact shape — people misremember field names, conflate two similar endpoints, or describe how
   something _should_ work rather than how it _does_. Verify before implementing on top of it.
7. **Your own memory/training knowledge of "how this kind of system usually works."** The weakest
   source of all for anything specific (a field name, a status value, a library's function
   signature) — fine for guessing where to _look_, never sufficient as the basis for what to _write_.

When two sources at different levels disagree, the higher one wins _and the disagreement itself is
worth reporting_ — a stale README, an out-of-date test, or a contract the code no longer matches are
all real findings, not just noise to route around.

---

## 4. Pre-Implementation verification sequence

Before writing ANY code, complete this sequence.

### 4.1 Read source-of-truth documents (MANDATORY)

**Always read these first** — they tell you where to look, not what to write:

- [ ] Repository root README.md
- [ ] Module-specific README.md (if it exists)
- [ ] Contract/spec files referenced in scope
- [ ] Related plan/design doc, if this work is part of one
- [ ] Any project-specific skill in scope for this area (API standards, architecture conventions,
      commit conventions) — these define stricter rules than this file's defaults

**For backend/API work, also read**:

- [ ] The API contract spec (OpenAPI/GraphQL schema, or a docs/specs file)
- [ ] The service's own README or architecture note
- [ ] Database schema/model documentation

**For frontend work, also read**:

- [ ] Component documentation
- [ ] API integration specs / generated client types
- [ ] The design system or style guide, if one exists

### 4.2 Inspect actual code (MANDATORY)

**Before touching any file**:

- [ ] Read the target file(s) completely — not just the function you expect to change
- [ ] Trace imports and dependencies
- [ ] Check existing function/method signatures
- [ ] Verify actual model fields/types
- [ ] Review existing error-handling patterns
- [ ] Check test files for currently expected behavior (and run them — don't just read them, see §10)

**Search for**:

- Existing implementations of similar features (don't duplicate what's already there)
- Utility functions you might reuse
- Naming conventions already in use
- Validation patterns already established

### 4.3 Verify specific claims and assumptions

Every category below has the same shape: find the actual source, copy the actual shape, verify
against it — never fill in from memory or from what "sounds right."

**If the user says "the endpoint returns X"**:

- [ ] Find the actual endpoint code
- [ ] Read the actual response serializer/handler
- [ ] Verify the actual return type
- [ ] Check whether X actually exists or is invented

**If the user says "the model has field Y"**:

- [ ] Open the actual model file
- [ ] Verify field Y exists
- [ ] Check its actual type and constraints
- [ ] Confirm it's not a misremembered field name (e.g. `is_active` vs. `status`)

**If the user mentions "status can be Z"**:

- [ ] Find the status enum/choices
- [ ] List ALL valid values
- [ ] Verify Z is actually valid
- [ ] Don't invent new status values to make the request fit

**If the change calls a library/framework function**:

- [ ] Confirm the installed version (lockfile / `go.mod` / `requirements.txt`, not a guess)
- [ ] Read the actual signature for that version — a function's arguments, return shape, and defaults
      commonly change across major versions, and memory doesn't carry a version number with it
- [ ] Don't assume an argument name, default value, or return shape from a different, more-familiar
      version of the same library

**If the change reads or writes a config value / environment variable**:

- [ ] Find where it's actually declared/loaded (`.env.example`, config schema, settings module)
- [ ] Verify the exact key name, casing, and expected type
- [ ] Don't invent a plausible-sounding key name — a silently-`undefined`/`None` config read is a
      classic way to ship a feature that appears to work in code review and does nothing at runtime

**If the change relies on a CLI tool's flags**:

- [ ] Check the installed tool's actual `--help` output or version-pinned docs
- [ ] Don't assume a flag exists or behaves the same way across major versions of the tool

---

## 5. Reality-check decision tree

### When you encounter unknown information

**STOP and follow this decision tree, in order:**

1. **Can I verify this by reading existing code (or running it)?**
   - YES → Read/run it and verify.
   - NO → Continue to 2.

2. **Is this documented in a contract/spec/README, or checkable in an installed dependency's actual
   source/types?**
   - YES → Read it and verify.
   - NO → Continue to 3.

3. **Is this a reasonable inference from facts I've already verified?**
   - YES → Document the inference explicitly as an assumption (§7) and continue, flagged for
     confirmation.
   - NO → Continue to 4.

4. **ASK THE USER.**
   - State what you know.
   - State what you don't know.
   - Ask specific questions — not "what should I do?" but "the model has `is_active` (boolean), not
     `status` — should I map it, or add a new field?"
   - Propose options if applicable (§9's template).

### Never proceed when

- You haven't read the contract but are implementing an API.
- You haven't checked the model but are adding fields.
- You haven't inspected the file but are "fixing" it.
- You haven't checked the installed dependency's version but are calling one of its functions.
- The user's description conflicts with actual code and the conflict hasn't been surfaced.
- A required field/endpoint/entity/config key doesn't exist in reality and you're about to write code
  that assumes it does.

---

## 6. Verification templates by change category

Each of these is a short checklist to fill in _before_ writing the corresponding code — not
documentation to write after the fact. If a field in a template can't be filled from something you
actually read, that's the signal to stop and go verify it, not to write "presumably" and move on.

### 6.1 Contract Alignment (APIs)

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

- Document the gap in implementation notes (§7).
- Propose contract addition with explicit user approval.
- Don't proceed without a design decision.

### 6.2 Model/Schema Verification (Database)

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

**Common mistakes to avoid**:

- Inventing field names that don't exist.
- Assuming a field exists because it "should."
- Modifying fields without checking dependencies.
- Adding fields without a migration plan.

### 6.3 Type/Interface Safety (all languages)

**Before using any type/interface**:

````markdown
## Type Verification

**Source**: [actual file/package defining the type]
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

### 6.4 Endpoint Integration (Frontend calling Backend)

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

### 6.5 State/Enum Verification

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

### 6.6 Config / Environment Variable Verification

**Before reading or writing a config value**:

```markdown
## Config Verification

**Key**: [exact name, exact casing]
**Declared In**: [.env.example / config schema / settings module — actual file path]
**Type & Default**: [actual type, actual default if any — "none found" is a valid, important answer]
**Consumed By**: [file(s) that actually read this key today, if any]

**Invented Key**: [no | yes — requires adding to config schema + .env.example + deployment config]
```

A config key that exists only in the code you just wrote, with no corresponding entry in the actual
config loader, will silently read as unset in every environment — this is a common way for a feature
to look complete in the diff and do nothing at runtime.

### 6.7 Third-Party / Library API Verification

**Before calling a dependency's function**:

````markdown
## Library API Verification

**Package & Installed Version**: [name + exact version from the lockfile/manifest]
**Function/Method**: [exact name]
**Signature Verified From**: [actual installed source / type stubs / version-matched docs]

**Actual Signature**:
​`
def actual_signature(arg1: Type, arg2: Type = default) -> ReturnType: ...
​`

**Deviations From Memory/Assumption**: [none | list what you expected vs. what it actually is]
````

This category exists because library-API hallucination is one of the most common and hardest-to-spot
AI mistakes: the invented signature is plausible, compiles in dynamically-typed languages, and often
only fails at runtime with an obscure error.

### 6.8 CLI / Tool Flag Verification

**Before relying on a command-line tool's behavior**:

```markdown
## CLI Verification

**Tool & Version**: [name + version actually installed/pinned]
**Flag(s) Used**: [exact flags]
**Verified Against**: [--help output actually run, or version-matched changelog/docs]

**Behavior Assumption**: [what you're relying on the flag to do, and how you confirmed it]
```

---

## 7. Documentation during implementation

### Implementation Notes Template

Keep running notes in the appropriate place (a plan's notes file, inline comments where genuinely
warranted, or a dedicated scratch note) as you go — not reconstructed from memory afterward:

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

- [ ] Unit tests pass (actually run, output read)
- [ ] Integration tests pass (actually run, output read)
- [ ] Manual testing: [describe]
- [ ] Edge cases verified: [list]
```

An assumption that's never revisited quietly becomes a fact nobody actually checked — if confidence
is "medium" or "low," that item belongs in §9 or §12 before the work is called done, not left in the
notes indefinitely.

---

## 8. Anti-Patterns to Prevent

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
# First: read the User model, confirm fields.
# Found: User has 'is_active' boolean, not 'status'.
# Ask user: "User model has 'is_active' (boolean), not 'status'.
#           Should I map is_active to status, or add a new status field?"

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
// First: read the contract - only {id, email} are returned.
// Document the gap.

async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();

  // ✅ Use only verified fields
  displayEmail(user.email);

  // Document: "Contract doesn't include name/avatar.
  //            Need to either: 1) Update contract to add fields
  //                           2) Call separate endpoints
  //                           3) Use different approach"
  // Ask user for direction.
}
```

### ❌ Type Hallucination

**WRONG**:

```typescript
// AI invents an interface without checking the actual API

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
// First: check the actual backend serializer.
// Found: only a flat structure with {id, email, created_at}.

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
# AI invents status values without checking the enum

def update_order(order_id, status):
    # ❌ Assumes these are valid without verification
    if status in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        order.status = status
        order.save()
```

**RIGHT**:

```python
# First: check the Order model for actual status choices.
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
#            User requested: pending, processing, shipped, delivered, cancelled
#            These don't match. Need to either:
#            1) Map user's terms to existing statuses
#            2) Extend OrderStatus enum (requires migration)
#            Which approach?"
```

### ❌ Library API Hallucination

**WRONG**:

```python
# AI remembers a different major version of the library's signature

import redis
r = redis.Redis()
r.set('key', 'value', expire=60)  # ❌ Invented kwarg name from memory
```

**RIGHT**:

```python
# First: check the installed redis-py version's actual Redis.set signature.
# Found: the keyword is `ex`, not `expire` — `ex: Optional[ExpiryT] = None`.

import redis
r = redis.Redis()
r.set('key', 'value', ex=60)  # ✅ Verified against installed version's actual signature
```

### ❌ Config Key Invention

**WRONG**:

```javascript
// AI guesses a plausible-sounding env var name instead of checking the loader

const timeout = process.env.API_TIMEOUT_MS ?? 5000; // ❌ Never verified this key exists anywhere
```

**RIGHT**:

```javascript
// First: grep the config loader / .env.example.
// Found: the existing convention is REQUEST_TIMEOUT_MS, already declared and documented.

const timeout = Number(process.env.REQUEST_TIMEOUT_MS) || 5000; // ✅ Matches the actual declared key
```

---

## 9. Conflict Resolution Protocol

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

Word the conflict as something for the user to decide, not as a rhetorical setup for the option you've
already picked — if the trade-offs are genuinely lopsided, say so plainly in the recommendation, but
still lay out what was actually considered.

---

## 10. Common pitfalls already seen (learn from these, don't repeat them)

These are generalized, recurring AI-implementation failure modes — treat each as a check to run
proactively while implementing, not a historical curiosity.

1. **Library API hallucination.** Calling a dependency function with an argument name, default, or
   return shape from a different (often older, more commonly-documented) major version than what's
   actually installed. Always check the installed version's real signature (§6.7).
2. **Plausible-sounding config key invented instead of looked up.** The code reads
   `process.env.API_KEY` when the project actually declares `EXTERNAL_API_KEY`; nothing errors, the
   value is just always `undefined`/`None`, and the bug only surfaces at runtime, often in production.
3. **A field name misremembered as a close synonym** (`status` vs. `is_active`, `userId` vs. `id`,
   `createdAt` vs. `created_at`) — because the synonym is common elsewhere, it reads as correct on a
   skim and passes casual review.
4. **Trusting a test file as current behavior without running it.** A test can be stale, skipped, or
   already failing on `main` — reading its assertions tells you what someone _intended_, not what the
   code _does now_. Run it.
5. **Treating "the README says X" as settled when the code has since diverged.** Documentation drifts
   from implementation constantly; always cross-check the specific claim against the code path it
   describes before relying on it for something exact (an endpoint shape, a default value).
6. **Silently picking the interpretation that's least implementation work** when a request is
   ambiguous or conflicts with reality, instead of surfacing the ambiguity (§9). This looks like
   progress but ships something nobody actually asked for.
7. **Reusing a type/interface from a similar-but-different part of the codebase** without checking it
   actually matches the target — e.g. assuming two services' `User` types are identical because they
   share a name.
8. **Declaring an implementation "done" based on the code compiling/type-checking**, without actually
   running it or its tests — a type checker verifies internal consistency, not that the code does
   what was asked or that a called API actually behaves the way the types claim.
9. **Inventing a new status/enum value to make a request "work"** instead of reporting that the
   requested value doesn't exist in the actual enum and asking whether to extend it or map to an
   existing one.
10. **Copy-pasting a pattern from one file into a new file without checking it still fits** — the
    original file's imports, error-handling convention, or framework version may not match the new
    file's context, producing code that looks idiomatic but silently breaks an assumption the
    original relied on.
11. **Treating a schema/type migration as complete once it compiles**, with no consumer actually
    exercised end-to-end against the new shape — track "no real caller has verified this yet" as an
    explicit, visible gap (§7), not an implicit assumption that it's fine.
12. **Format claims not matching what the code actually produces** — e.g. documentation or a comment
    stating an ID "is a UUID" when the implementation actually emits something else. Either fix the
    code or fix the claim; never leave the mismatch unstated once noticed.

---

## 11. Quality Gates

Before marking implementation complete:

### Verification Checklist

- [ ] All modified files were read before modification.
- [ ] All referenced contracts/specs were verified.
- [ ] No invented fields/endpoints/entities/config keys/library arguments.
- [ ] All library/dependency calls were checked against the actually-installed version.
- [ ] All assumptions are explicitly documented (§7), none left silently un-flagged.
- [ ] All conflicts were resolved with user input (§9), not silently picked.
- [ ] Implementation matches actual codebase patterns.
- [ ] Tests cover verified behavior, and were actually run (not just read).
- [ ] Documentation reflects the actual implementation, not the original request if they diverged.
- [ ] None of §10's known pitfalls are present in this change.

### Self-Review Questions

1. Did I read every file I modified?
2. Did I verify every field/parameter I used?
3. Did I check contracts before implementing APIs?
4. Did I check the installed version before calling a library function?
5. Did I ask when uncertain instead of assuming?
6. Can I trace every decision to a verified source?
7. Did I document gaps between request and reality?
8. Would another developer understand my reasoning?
9. Did I actually run what I'm claiming passes, or am I inferring that it would?

---

## 12. Escalation Triggers

**STOP and ask the user when**:

- The contract doesn't cover the requested feature.
- The user's request conflicts with an existing contract.
- A required field/entity/config key doesn't exist in the codebase.
- Multiple valid implementation approaches exist with real trade-offs.
- A significant deviation from the plan/request is needed.
- A breaking change would be required.
- There's genuine uncertainty about business logic.
- Security/permission implications are unclear.
- A dependency's actual behavior, once verified, contradicts what the task assumed it does.

---

## 13. Review process shape (running the verification pass)

§4–§11 cover _what_ to verify. This section covers _how to run the pass_ without either rushing past
real gaps or stalling on trivial ones.

### 13.1 Time-boxed pass structure

For anything beyond a one-line change, work in explicit passes rather than verifying opportunistically
while typing:

1. **Scope first.** Identify every category from §6 this change actually touches (contract? model?
   config? a library call?) before reading a single line of implementation code.
2. **Verification pass.** Work through each relevant §6 checklist, filling it from actual sources —
   not from memory, not from what "should" be true.
3. **Implementation pass.** Write the code against what was just verified, keeping §7's notes updated
   as you go, not reconstructed afterward.
4. **Closing pass.** Run §11's checklist. Anything still marked "assumption" with medium/low
   confidence gets resolved via §9/§12 before the work is called done — it doesn't get carried forward
   silently as "probably fine."

### 13.2 How to report a gap or conflict

Being right that something doesn't match isn't enough — it has to be reported usefully:

- **Specific and actionable**, not vague: state exactly what was expected, what was found, and where
  (file/line or contract section) — not just that "something doesn't match."
- **Every finding gets reported.** There's no "minor, not worth mentioning" tier for a verification
  gap — a small mismatch today (a wrong default value) is a production bug tomorrow. If it's worth
  noticing, it's worth stating, even if the recommendation is "this is probably fine, confirm?"
- **Show the actual evidence**, not just the conclusion — the copied field list, the actual function
  signature, the actual enum values — so the user (or a reviewer) can verify the verification instead
  of just trusting it.

---

## 14. Relationship to other skills, and known gaps

- This file is the general-purpose verification discipline; it does not replace a project's own
  stricter, stack-specific standards. If a project has an API-contract skill, an architecture skill, or
  a commit-message skill available, those win on their specific topic — use this file's method (read
  the real source, verify before writing, surface conflicts) to _apply_ them correctly, not as a
  competing set of rules.
- This file does not cover UI/visual verification (whether a rendered component actually looks right)
  — that requires actually running the app and looking at it, which is a distinct skill from source
  verification. Don't treat "the props match the verified type" as equivalent to "I confirmed it
  renders correctly."
- This file does not cover performance or security review in depth — those need their own dedicated
  passes; this file only ensures the _facts_ the implementation is built on (fields, contracts,
  library behavior) are real, not that the resulting design is optimal or safe.

If something in day-to-day use genuinely isn't covered here and can't be resolved with available
context: stop and flag it explicitly rather than guessing or building around the gap silently — the
same rule this file applies to code applies to itself.

---

## 15. Where these rules come from (for maintainers of this file)

This file distills a single recurring failure pattern seen across many AI-assisted implementations:
plausible-sounding, unverified detail (a field name, a library argument, a config key, a status value)
written with the same confidence as verified fact, discovered only much later — at review time, at
runtime, or in production. Every section above exists to catch one specific shape of that mistake
before it ships.

- When a new recurring hallucination pattern is discovered in real review, add it to §10 and, if it
  needs its own checklist, add a category to §6.
- If this file and a project's own stricter skill genuinely disagree, the project's skill wins on its
  topic (§14) — update this file only if the disagreement reveals this file's _general_ guidance was
  wrong, not just that the project has a stricter local rule.
- Keep this file honest: when a rule here turns out to be incomplete or superseded, fix it in the same
  change that surfaces the gap.

---

> "The fastest way to ship bugs is to implement based on assumptions. The fastest way to ship quality
> is to verify first."

**When in doubt, verify. When uncertain, ask. Never invent.**
