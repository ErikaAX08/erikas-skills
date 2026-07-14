---
name: code-documentation
description: Document code clearly, concisely, and professionally. Use when the user asks to document functions, classes, structs, or code files; add comments to existing code; improve existing documentation; or mentions "document", "comments", "docstrings", "JSDoc", "godoc", or "code documentation". Generates documentation that other engineers can quickly understand without being verbose, with strict length caps so documentation never outgrows the code it describes.
license: MIT
---

# CODE-DOCUMENTATION.md — Code Documentation Skill

> **Purpose:** this is the operational rulebook for adding or improving documentation on any piece of
> code — structs, classes, functions, methods, fields, modules — without producing the two failure
> modes documentation always drifts toward: **silence** (public APIs nobody can use without reading the
> implementation) and **noise** (walls of prose that repeat what the code already says and rot the
> first time the code changes).
>
> **This file is self-contained by design.** Every rule that matters for day-to-day documentation work
> is inlined below — length caps, per-language formats, worked examples — so this skill can be used
> without any other context.

---

## 0. How to use this skill

1. **Identify the element type** you're documenting: struct/class declaration, field/property,
   function/method, or inline step inside a function body. Each has its own rule — see §3.
2. **Classify functions by size/complexity** (trivial / medium / complex, §3.2) before writing the doc
   comment — the tier determines the line cap, and no function documentation may ever exceed **3
   lines**, no matter how complex the function is. Detail that doesn't fit goes into inline comments
   inside the body (§6), not into a longer header.
3. **Write the language-appropriate format** from §5. Go gets the most detailed treatment here (§5.1)
   because its convention of documenting every exported identifier, including every struct field, makes
   it the clearest model for the size-based rules in §3 — but the same length discipline applies to
   every language.
4. **Before delivering, run the checklist in §9** — it directly encodes the caps from §2/§3, so a
   documentation pass isn't done until every element respects them.

---

## 1. Core Principles

**CLARITY OVER QUANTITY**: A concise comment explaining the "what" and "why" is better than paragraphs
explaining the obvious "how".

**GOLDEN RULES**:

- Document the INTENT, not the obvious implementation.
- If the code is self-explanatory, DON'T document it.
- Focus on the "why", not the "what" when it's evident.
- Document EDGE CASES, ASSUMPTIONS, and SIDE EFFECTS.
- Use examples only when they clarify non-obvious use cases.
- Focus 100% on describing the code itself — never reference or link to external documentation, blog
  posts, Stack Overflow answers, RFCs, or other outside sources. Explain behavior, constraints, and
  reasoning in terms of the code, not by pointing readers elsewhere.

---

## 2. Non-negotiables (zero tolerance)

These caps are absolute — a documentation pass that violates any of these is not done, regardless of
how good the prose reads.

- **No function/method doc comment ever exceeds 3 lines.** This applies no matter the function's size
  or complexity — a 200-line function still gets at most 3 lines of header documentation. Anything more
  belongs as inline comments at the specific step that needs it (§6), never as header prose.
- **No struct/class field or property comment ever exceeds 1 line.** If a field genuinely needs more
  than one line to explain, that's a signal the field's name or type is wrong, not that the comment
  should grow.
- **No struct/class declaration comment exceeds 1 line**, except for a rare, short second line when the
  type's invariant genuinely can't fit in one (e.g. thread-safety or ownership rules) — never a
  multi-paragraph block.
- **Every comment goes on its own line, immediately above the element it documents — never trailing on
  the same line as code.** This applies uniformly: struct/class declarations, fields/properties,
  function signatures, interface methods, and magic numbers all get a leading comment line, not a
  same-line `code // comment` pairing. A leading comment reads as documentation; a trailing one reads as
  an afterthought and gets pushed out of view by long lines.
- **Every exported/public struct, class, interface, and function is documented** — no public API ships
  silent.
- **Every field in an exported struct/class is documented in 1 line unless its name+type already say
  everything** (e.g. `ID string // primary key` is redundant; skip it). Never leave an exported field
  ambiguous about units, format, or valid range when that isn't obvious from the type alone.
- **Trivial, unexported, self-evident code stays undocumented.** Forcing a comment onto
  `func (u user) Name() string { return u.name }` violates the golden rule in §1 as much as under-
  documenting does.
- **No redundant, obvious, or outdated comments** — see §8 for concrete examples of what this rules out.
- **No links or references to external documentation/sources** inside any comment or docstring.

---

## 3. Documentation by element size

This is the central rule of this skill: **the amount of documentation an element gets is a function of
its size and how obvious it is — not a fixed template applied uniformly.**

### 3.1 Quick reference

| Element | Documented when | Max length |
|---|---|---|
| Struct / class / interface declaration | Always, if exported/public | 1 line (rare 2nd line for a hard invariant) |
| Struct / class field / property | Only if not obvious from name + type | **1 line, hard cap** |
| Trivial function/method (getter, single expression, no branching) | Only if not self-evident (skip for unexported obvious ones) | 1 line |
| Medium function/method (a few branches, one clear side effect) | Always if exported | up to 2 lines |
| Complex function/method (multiple branches, error paths, side effects, concurrency) | Always if exported | **3 lines, hard cap** |
| Inline step inside a function body | Only non-obvious steps ("why", edge case, assumption) | 1 line per comment |

### 3.2 Classifying a function's tier

- **Trivial**: one expression or a direct pass-through (getters, simple wrappers, single-line
  transforms). No branching, no error path, no side effect beyond the return value.
- **Medium**: a handful of branches or a single loop, one side effect (a write, a cache set, a single
  external call), a bounded and obvious error condition.
- **Complex**: multiple branches or nested logic, more than one side effect, non-obvious ordering
  requirements, concurrency, or an error path that isn't implied by the signature.

The tier caps the doc comment's length — it does not lower it below what a reader needs. A medium
function that's fully explained in 1 line doesn't need a padded second line just to "use the budget."

### 3.3 Why the caps exist

A doc comment with no ceiling tends to restate the implementation line by line, which (a) goes stale
the moment the body changes and nobody updates the six-line paragraph above it, and (b) buries the one
sentence that actually mattered (a side effect, an edge case) inside prose nobody finishes reading. A
hard cap forces the same discipline as a good commit message: say the one or two things a caller
actually needs before touching the internals, and let the code itself carry the rest.

---

## 4. Where Documentation Goes: Declaration vs Inside the Body

This is a **key distinction** to keep documentation useful and not noisy:

- **When creating a new struct, class, or function**: document it at the declaration, following the
  size/tier caps in §3 — description, parameters, return, and exceptions where relevant, but never past
  the cap for that element.
- **When writing code INSIDE a function**: use **single-line comments only**, clear and concise, and
  only where they add value (a non-obvious step, an edge case, a "why"). Avoid large blocks of commented
  text inside a function body. A short one-line note before a logical section is enough; the code itself
  should carry the rest.

```python
def transfer_funds(origin: str, target: str, amount: float) -> bool:
    """Move funds between two accounts atomically. Raises InsufficientFunds if origin lacks balance."""
    # Lock both accounts to avoid race conditions  ← single-line, only the "why"
    with lock(origin, target):
        debit(origin, amount)
        credit(target, amount)
    return True
```

---

## 5. Format by language

### 5.1 Go (godoc) — flagship example of the size-based rules

Go's own convention — every exported identifier gets a doc comment starting with its name — is the
clearest place to see §3's caps in practice, because a struct's fields are documented individually,
right next to the declaration, rather than in a separate prose block.

**Package comment** — one line, on the file that owns the package declaration:

```go
// Package payment handles payment processing and provider integration.
package payment
```

**Struct declaration + fields** — declaration gets exactly 1 line describing its responsibility; each
exported field gets at most 1 line **on its own line immediately above it**, and only when the name and
type don't already say enough:

```go
// PaymentRequest represents a single payment attempt against a provider.
type PaymentRequest struct {
    // Amount in cents, must be > 0
    Amount int64
    // ISO 4217 currency code
    Currency string
    // "card", "paypal", or "transfer"
    Method string
    // Automatically retry on transient failure
    Retry bool
    id    string // internal correlation id, unexported — no comment needed if self-evident
}
```

Note `id` above: an unexported, self-evident field gets no comment at all, per §2 — adding one would be
noise, not documentation. A field that's simple enough not to need a comment can stay on its own compact
line; a field that does need one always gets it leading, never trailing.

**Trivial function** — 1 line, and only because it's exported (Go convention documents every exported
identifier even when the body is obvious); an unexported equivalent would carry no comment at all:

```go
// Amount returns the payment amount in cents.
func (r PaymentRequest) Amount() int64 {
    return r.amount
}
```

**Medium function** — up to 2 lines: what it does, plus the one thing a caller must know (a side effect
or a constraint):

```go
// Charge submits the request to the configured provider and records the transaction.
// Retries once on a transient provider error; does not retry validation failures.
func Charge(req PaymentRequest) (*Result, error) {
    ...
}
```

**Complex function** — up to 3 lines, hard cap, even though the body has several branches, a side
effect, and a non-obvious conflict-resolution rule; everything past that goes inline in the body:

```go
// SyncInventory reconciles inventory between the warehouse and e-commerce systems.
// Conflicts are resolved by most-recent-timestamp; ties favor the warehouse.
// Returns partial results with a non-nil error if any SKU sync fails.
func SyncInventory(products []string, source string) (*Summary, error) {
    // Validate and normalize before touching either system.
    valid := normalize(products)

    // Most-recent-timestamp wins; a tie favors the warehouse as the source of truth.
    for sku, conflict := range detectConflicts(valid, source) {
        resolve(sku, conflict)
    }
    ...
}
```

**Interfaces** follow the same struct rule — 1 line on the interface, 1 line per method signature only
when the method name doesn't already say enough, each on its own line directly above the method:

```go
// InvoiceRepository persists and queries invoice records.
type InvoiceRepository interface {
    // Create initializes the invoice log record.
    Create(ctx context.Context, data *core.Invoice) (*core.Invoice, error)
    // UpdateStatus updates the final result, official ID, and file URLs.
    UpdateStatus(ctx context.Context, id ULID, status string, officialID *string) error
    // GetByID fetches a single invoice record by its ULID.
    GetByID(ctx context.Context, id ULID) (*core.Invoice, error)
}
```

**Go-specific anti-patterns**: a Doxygen-style multi-line block above a struct field; restating the Go
type in prose (`// Amount is an int64`); or a trailing `Field Type // comment` on the same line, which
§2 also bans — the field comment is for the one thing the type doesn't already tell you (units, format,
valid range), and it always goes on its own leading line, never a same-line restatement.

### 5.2 Python (Google style)

Apply the same tiers from §3: a trivial function gets a 1-line docstring; only medium/complex functions
carry Args/Returns/Raises, and never past 3 lines of prose above the structured fields.

```python
def process_payment(amount: float, method: str, retry: bool = True) -> dict:
    """Process a payment using the specified method; retries transient failures if retry is True.

    Args:
        amount: Amount in USD, must be > 0
        method: 'card', 'paypal', or 'transfer'
        retry: Automatically retry if it fails

    Returns:
        dict with 'status', 'transaction_id', and 'timestamp'

    Raises:
        ValueError: If amount <= 0 or invalid method
        PaymentError: If processing fails after retries
    """
```

```python
class CacheManager:
    """Manage in-memory cache with TTL-based expiration and LRU eviction at max_size."""

    # Maximum number of entries (default: 1000)
    max_size: int
    # Time to live in seconds (default: 300)
    default_ttl: int
```

### 5.3 JavaScript/TypeScript (JSDoc)

```typescript
/**
 * Manage in-memory cache with TTL-based expiration and LRU eviction at maxSize.
 */
class CacheManager {
    /** Maximum number of entries */
    private maxSize: number;
    /** Time to live in seconds */
    private defaultTTL: number;
```

```javascript
/**
 * Process a payment using the specified method.
 * @param {number} amount - Amount in USD, must be > 0
 * @param {string} method - 'card', 'paypal', or 'transfer'
 * @returns {Promise<Object>} Object with status, transaction_id, and timestamp
 * @throws {PaymentError} If processing fails after retries
 */
async function processPayment(amount, method, retry = true) {
```

### 5.4 Java (JavaDoc)

```java
/**
 * Process a payment using the specified method.
 *
 * @param amount Amount in USD, must be > 0
 * @param method 'CARD', 'PAYPAL', or 'TRANSFER'
 * @return Object with status, transactionId, and timestamp
 * @throws PaymentException If processing fails after retries
 */
public PaymentResult processPayment(double amount, String method, boolean retry) {
```

### 5.5 C/C++ (Doxygen)

```c
/**
 * @brief Process a payment using the specified method.
 * @param amount Amount in USD, must be > 0
 * @return Result struct with status and transaction_id
 */
```

---

## 6. Inline Comments (ONLY when necessary)

**GOOD inline comments**:

```python
# HACK: API returns timestamps in PST but docs say UTC
timestamp = convert_to_utc(response.timestamp, from_tz='America/Los_Angeles')

# FIXME: This validation fails with Unicode characters in names
if not re.match(r'^[a-zA-Z\s]+$', name):

# TODO: Implement rate limiting once we have Redis
make_request(url)

# Edge case: division by zero when all values are 0
average = sum(values) / len(values) if values else 0

# Performance: cache crucial here, endpoint is very slow
result = cache.get_or_set(key, lambda: expensive_operation())
```

**BAD inline comments** (obvious, redundant):

```python
# Increment counter
counter += 1

# Iterate over users
for user in users:

# Return True
return True
```

---

## 7. Special Cases to Document

**ALWAYS document**, regardless of a function's tier:

- **Assumptions**: "Assumes user is already authenticated"
- **Side effects**: "Modifies global session state"
- **Performance**: "O(n²), use with small lists"
- **Concurrency**: "Not thread-safe, use external lock"
- **Null/None handling**: "Returns None if user doesn't exist"
- **Magic numbers**: a leading comment above the constant, e.g. `# seconds, AWS Lambda limit` on its
  own line before `TIMEOUT = 30`

If one of these doesn't fit inside the tier's line cap (§3), put the primary fact in the header and the
rest as an inline comment at the exact line it applies to — never break the cap to fit it all in the
header.

---

## 8. Anti-Patterns to Avoid

**Documentation that repeats the code**:

```python
def get_user_name(user_id):
    """Gets the user name."""  # Obvious from the name
```

**Outdated comments**:

```python
# Returns list of strings
def get_users():
    return {"users": [...]}  # Now returns dict!
```

**Comments that explain bad code instead of fixing it**:

```python
# Loop through items and check if valid then add to list
for i in items:
    if validate(i):
        result.append(i)
# Better: refactor to "result = [i for i in items if validate(i)]"
```

**Excessive documentation on obvious code**:

```python
class User:
    """
    Represents a user in the system.

    This class stores user information including
    their name, email, and creation date...
    """  # Too obvious, and already past the 1-line cap in §2

    # Better:
    """System user with email validation."""
```

**A struct/class field comment that exceeds 1 line, or a function doc comment that exceeds 3 lines** —
both are hard violations of §2, not a style preference. Trim to the one fact that matters and move the
rest inline (§6).

**External references instead of describing the code**:

```python
def parse_date(value):
    """Parses a date. See https://example.com/date-formats for details."""  # Don't link out

# Better:
def parse_date(value):
    """Parses ISO 8601 date strings; returns None if the format doesn't match."""
```

---

## 9. Quality Checklist

Before delivering documentation, verify:

- [ ] Every exported/public struct, class, and interface has a 1-line declaration comment (§3.1, §5.1)
- [ ] Every exported struct/class field has at most 1 line of comment, and only where not obvious (§2)
- [ ] Every comment is on its own line immediately above the element it documents — no trailing
      `code // comment` pairings anywhere (§2)
- [ ] Every function/method is classified into a tier (trivial/medium/complex, §3.2) and its doc comment
      respects that tier's cap
- [ ] **No function/method doc comment exceeds 3 lines** — no exceptions, regardless of complexity (§2)
- [ ] Trivial, unexported, self-evident elements are left undocumented, not padded to match a template
- [ ] Exceptions/errors are documented for medium and complex functions
- [ ] Non-obvious edge cases are covered by inline comments, not squeezed into the header
- [ ] NO redundant, obvious, or outdated comments
- [ ] Inline comments explain "why", not "what", and are single-line
- [ ] No large commented text blocks inside a function body
- [ ] Documentation is in the agreed language (English/Spanish)
- [ ] No links or references to external documentation/sources

---

## Final Principle

> "Code is read many more times than it's written. Document for your future self and your teammates,
> not to impress. Be brief, clear, and useful."

**The best documentation is self-explanatory code + strategic comments at critical points, each one
paying its own way within its size cap.**
