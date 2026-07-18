---
name: code-documentation
description: Document code clearly, concisely, and professionally. Use when the user asks to document functions, classes, structs, or code files; add comments to existing code; improve existing documentation; or mentions "document", "comments", "docstrings", "JSDoc", "godoc", or "code documentation". Generates documentation that other engineers can quickly understand without being verbose, with strict prose line-count caps and no comment-width limit, while allowing one line per structured parameter, return, or error entry and forbidding per-property documentation except for extreme type ambiguity.
license: MIT
---

# Code Documentation Skill

> **Purpose:** this is the operational rulebook for adding or improving documentation on any piece of
> code — modules, data structures, functions, methods, and the rare truly ambiguous field — without producing the two failure
> modes documentation always drifts toward: **silence** (public APIs nobody can use without reading the
> implementation) and **noise** (walls of prose that repeat what the code already says and rot the
> first time the code changes).
>
> **This file is self-contained by design.** Every rule that matters for day-to-day documentation work
> is inlined below — length caps, per-language formats, worked examples — so this skill can be used
> without any other context.

---

## 0. How to use this skill

1. **Identify the element type** you're documenting: package/module, struct/class/interface,
   constant/variable, field/property, function/method, or inline step inside a function body. Each has
   its own rule — see §3.
2. **Classify functions by size/complexity** (trivial / medium / complex, §3.2) before writing the doc
   comment — the tier determines the prose cap, and no function documentation may ever exceed **2
   lines of descriptive prose**, no matter how complex the function is. Structured parameter, return,
   and error entries may each use their own additional line and do not count toward that cap. Do not
   wrap prose or structured entries to a fixed width: each logical fact remains on one complete line.
3. **Write the language-appropriate format** from §5. Go gets the most detailed treatment here (§5.1)
   because it clearly separates documentation for an exported type from its data fields. Document the
   structure as a whole; do not document each property unless §2's extreme-ambiguity exception applies.
4. **Before delivering, run the checklist in §9** — it directly encodes the caps from §2/§3, so a
   documentation pass isn't done until every element respects them.

---

## 1. Core Principles

**CLARITY OVER QUANTITY**: A concise comment explaining the "what" and "why" is better than paragraphs
explaining the obvious "how".

**GOLDEN RULES**:

- Document the INTENT, not the obvious implementation.
- If unexported/private code is self-explanatory, DON'T document it. Exported/public declarations still require the concise contract mandated by §2.
- For exported/public APIs, state the contract's "what" once; elsewhere, focus on the "why" when the "what" is evident.
- Document EDGE CASES, ASSUMPTIONS, and SIDE EFFECTS.
- Use examples only when they clarify non-obvious use cases.
- Use the repository's established documentation language; if none exists, default to English. Never mix documentation languages within one public API.
- Focus 100% on describing the code itself — never reference or link to external documentation, blog
  posts, Stack Overflow answers, RFCs, or other outside sources. Explain behavior, constraints, and
  reasoning in terms of the code, not by pointing readers elsewhere.

---

## 2. Non-negotiables (zero tolerance)

These caps are absolute — a documentation pass that violates any of these is not done, regardless of
how good the prose reads.

- **Never cap or wrap the width of documentation comments.** Documentation lines may be as long as
  needed to preserve a complete sentence or logical fact. Do not split a comment merely to satisfy an
  80-, 100-, 120-, or any other column limit; line-count caps, not column width, control brevity.
- **No function/method doc comment ever exceeds 2 lines of descriptive prose.** This applies no
  matter the function's size or complexity — a 200-line function still gets at most 2 prose lines. Use
  those unwrapped lines fully and use structured entries to retain every caller-visible contract fact;
  never hide such facts inside the body. Only additional implementation-local reasoning belongs inline
  at the specific step that needs it (§6).
- **Structured contract entries are exempt from the 2-line prose cap.** When a parameter, return,
  or error is documented in a format that supports `Args:`/`@param`, `Returns:`/`@return`/`@returns`, or
  `Raises:`/`@throws`, its entry must occupy its own additional line. These are semantic line breaks,
  not width wrapping: keep exactly one parameter, return, or error entry per line, and do not use the
  exception for extra narrative paragraphs.
- **Do not document individual fields or properties in data structures by default.** Document the
  struct, class, record, DTO, entity, configuration object, or request/response type as a whole; routine
  per-property comments create noise even when the fields are exported/public.
- **A field/property comment is allowed only for extreme, irreducible type ambiguity.** It must be
  essential for correct use because the field legally accepts multiple runtime types or representations
  that its declaration cannot express (for example, an `any`/`interface{}` value that may be either a
  string or an integer with different meanings), and the name or type cannot be made more precise due to
  an external or compatibility constraint. The exceptional comment gets exactly 1 complete line.
  Units, formats, valid ranges, defaults, enum options, and ordinary business meaning do not qualify;
  encode them in the field name, a dedicated type, validation, or the structure-level documentation.
- **No module/package or struct/class/interface declaration documentation exceeds 1 prose line**,
  except for a rare, short second line when a hard invariant genuinely cannot fit in one (for example,
  thread-safety or ownership rules) — never a multi-paragraph block.
- **Use the language-native documentation position and never use trailing comments.** Declaration
  comments go immediately above the declaration; Python docstrings are the first statement inside the
  declaration; inline comments go immediately above the relevant step. The rare field/property comment
  allowed by the extreme-ambiguity exception also goes immediately above that field.
- **Every public package/module and every exported/public type, function, method, constant, and
  variable is documented** — no public module or symbol ships silent. This requirement overrides the
  skip rule for self-explanatory private code, but never authorizes routine field/property comments;
  fields remain governed exclusively by the extreme-ambiguity exception.
- **Exported/public visibility does not justify field-by-field documentation.** Public properties
  follow the same no-comment default as private ones. The `@param`/`Args:` exception above applies to
  callable parameters, not to fields or properties in data structures.
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

| Element                                                                             | Documented when                                                                               | Max length                                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Package / module declaration                                                     | Always if public or required by the language convention                                       | 1 prose line (rare 2nd invariant line)           |
| Struct / class / interface declaration                                              | Always, if exported/public                                                                    | 1 prose line (rare 2nd invariant line)           |
| Exported/public constant or variable                                             | Always                                                                                        | **1 prose line, hard cap**                       |
| Data-structure field / property                                                     | Almost never: only extreme, irreducible ambiguity from multiple runtime types/representations | **1 line, hard cap**                             |
| Trivial function/method (getter, single expression, no branching)                   | Always if exported/public; otherwise only when not self-evident                              | 1 prose line + structured entries                |
| Medium function/method (a few branches, one clear side effect)                      | Always if exported/public                                                                     | up to 2 prose lines + structured entries         |
| Complex function/method (multiple branches, error paths, side effects, concurrency) | Always if exported/public                                                                     | **2 prose lines, hard cap** + structured entries |
| Inline step inside a function body                                                  | Only non-obvious steps ("why", edge case, assumption)                                         | 1 line per comment                               |

### 3.2 Classifying a function's tier

- **Trivial**: one expression or a direct pass-through (getters, simple wrappers, single-line
  transforms). No branching, no error path, no side effect beyond the return value.
- **Medium**: a handful of branches or a single loop, one side effect (a write, a cache set, a single
  external call), a bounded and obvious error condition.
- **Complex**: multiple branches or nested logic, more than one side effect, non-obvious ordering
  requirements, concurrency, or an error path that isn't implied by the signature.

The tier caps the doc comment's descriptive prose — it does not lower it below what a reader needs.
A medium function that's fully explained in 1 prose line doesn't need a padded second line just to "use
the budget." Structured contract entries are added only for parameters, returns, and errors that need
documentation, and do not consume that prose budget.

### 3.3 Why the caps exist

A doc comment with no ceiling tends to restate the implementation line by line, which (a) goes stale
the moment the body changes and nobody updates the six-line paragraph above it, and (b) buries the one
sentence that actually mattered (a side effect, an edge case) inside prose nobody finishes reading. A
hard prose cap forces the same discipline as a good commit message: say the one or two things a
caller actually needs before touching the internals, use structured entries for parameters, returns, and
errors, and let the code itself carry implementation detail rather than omitted contract facts.

---

## 4. Where Documentation Goes: Declaration vs Inside the Body

This is a **key distinction** to keep documentation useful and not noisy:

- **When creating a package, module, type, or callable that requires documentation under §1–§3**:
  use the language-native declaration position. Packages/modules/types get 1 prose line (rarely a
  second invariant line); functions/methods get at most 2 prose lines, plus one structured line per
  documented parameter, return, or exception where supported. Leave private self-evident elements
  undocumented.
- **When writing code INSIDE a function**: use **single-line comments only**, clear and concise, and
  only where they add value (a non-obvious step, an edge case, a "why"). Avoid large blocks of commented
  text inside a function body. A short one-line note before a logical section is enough; the code itself
  should carry the rest.

```python
def transfer_funds(origin: str, target: str, amount_cents: int) -> None:
    """Move funds between two accounts atomically.

    Raises:
        InsufficientFunds: If the origin account cannot cover amount_cents.
    """
    # Hold both locks so observers never see only one side of the transfer.
    with lock(origin, target):
        debit(origin, amount_cents)
        credit(target, amount_cents)
```

---

## 5. Format by language

### 5.1 Go (godoc) — flagship example of the size-based rules

Go's convention documents exported declarations, but that does not require narrating every field in
an exported struct. Document the struct's responsibility once at the declaration; its fields remain
uncommented unless one meets §2's extreme, irreducible type-ambiguity exception.

**Package comment** — one line, on the file that owns the package declaration:

```go
// Package payment handles payment processing and provider integration.
package payment
```

**Struct declaration + fields** — document the responsibility once on the declaration and leave the
fields uncommented. Use precise names and dedicated types to carry details such as units and allowed
values:

```go
// PaymentRequest captures provider-independent input for one payment attempt.
type PaymentRequest struct {
    AmountCents int64
    Currency CurrencyCode
    Method PaymentMethod
    RetryOnTransientFailure bool
    id string
}
```

Do not add one comment per field to explain cents, currency format, method options, retry behavior, or
visibility. Those facts belong in names, dedicated types, validation, or the structure-level contract.

**Extreme exception** — a field comment is acceptable only when the declaration is forced to erase
meaningful type information and callers cannot use the field correctly without knowing its runtime
representations:

```go
// LegacyAttribute preserves stored records that encode values as either UTF-8 text or base-10 integers.
type LegacyAttribute struct {
    // Value accepts either a UTF-8 string or a base-10 integer; every other runtime type is rejected.
    Value any
}
```

`Value` qualifies only because `any` hides two legal runtime types and a compatibility constraint
prevents replacing it with a precise type. A merely broad or poorly chosen type is not enough: improve
the model instead of documenting around it.

**Trivial function** — 1 line, and only because it's exported (Go convention documents every exported
identifier even when the body is obvious); an unexported equivalent would carry no comment at all:

```go
// Amount returns the payment amount in cents.
func (r PaymentRequest) Amount() int64 {
    return r.AmountCents
}
```

**Exported constants and variables** — exactly 1 line starting with the identifier; these are symbols,
not data-structure properties, so the field-comment prohibition does not apply:

```go
// DefaultRetryLimit bounds transient provider retries before Charge returns an error.
const DefaultRetryLimit = 2

// ErrInvoiceNotFound indicates that no persisted invoice matches the requested identifier.
var ErrInvoiceNotFound = errors.New("invoice not found")
```

**Medium function** — up to 2 lines: what it does, plus the caller-visible side effect or constraint:

```go
// Charge submits the request to the configured provider and records the transaction.
// When RetryOnTransientFailure is true, it makes up to DefaultRetryLimit additional calls; validation failures return ErrInvalidPayment without retry, and exhausted provider attempts return ErrProviderUnavailable.
func Charge(req PaymentRequest) (*Result, error) {
    ...
}
```

**Complex function** — up to 2 lines, hard cap, even though the body has several branches, a side
effect, and a non-obvious conflict-resolution rule. Keep every caller-visible fact in those complete,
unwrapped lines or structured entries; only implementation-local reasoning goes inline in the body:

```go
// SyncInventory reconciles warehouse and e-commerce inventory; conflicts compare each system's inventory_updated_at normalized to UTC epoch seconds, with the highest value winning and ties favoring the warehouse.
// It returns partial results alongside a non-nil error whenever synchronization fails for one or more individual SKUs.
func SyncInventory(products []string, source string) (*Summary, error) {
    // Normalize once so conflict detection and writes use identical SKU keys.
    valid := normalize(products)

    for sku, conflict := range detectConflicts(valid, source) {
        resolve(sku, conflict)
    }
    ...
}
```

**Interfaces** use the type rule for the interface declaration and the function rule for each
exported method. Method comments must add contract information rather than merely repeat the name:

```go
// InvoiceRepository persists invoice records and their processing outcomes.
type InvoiceRepository interface {
    // Create stores a pending invoice and returns its persisted representation; it returns ErrDuplicateInvoice when the ID already exists.
    Create(ctx context.Context, data core.Invoice) (core.Invoice, error)
    // UpdateStatus atomically stores the terminal status and official ID; it returns ErrInvoiceNotFound when id has no persisted invoice.
    UpdateStatus(ctx context.Context, id ULID, status string, officialID string) error
    // GetByID returns ErrInvoiceNotFound when id has no persisted invoice.
    GetByID(ctx context.Context, id ULID) (core.Invoice, error)
}
```

**Go-specific anti-patterns**: commenting every exported struct field; explaining units, formats,
ranges, defaults, or enum options property by property; restating the Go type in prose; or using a
trailing `Field Type // comment`. Prefer precise names and dedicated types. If the extreme-ambiguity
exception applies, use one leading line that states the otherwise inexpressible runtime representations.

### 5.2 Python (Google style)

**Module docstring** — the first statement in a public module, before imports:

```python
"""Provide payment orchestration and provider-independent contracts."""
```

Apply the same tiers from §3 to callable summary prose. `Args:`, `Returns:`, and `Raises:` entries are
structured contract lines and are exempt from the 2-line prose cap; use one complete, unwrapped line per
entry rather than compacting multiple parameters together.

```python
def process_payment(amount: float, method: str, retry: bool = True) -> dict:
    """Process a payment using the selected method; retry only transient failures.

    Args:
        amount: Positive amount in USD.
        method: Payment method; accepts 'card', 'paypal', or 'transfer'.
        retry: Whether to make up to two additional provider calls after a transient failure; false makes one attempt.

    Returns:
        Payment status, transaction ID, and processed_at_utc as a YYYY-MM-DDTHH:MM:SSZ string.

    Raises:
        ValueError: If amount or method is invalid.
        PaymentError: If the sole attempt fails while retry is false, or every attempt fails while retry is true.
    """
    return payment_provider.process(amount=amount, method=method, retry=retry)
```

```python
class CacheManager:
    """Bound an in-memory cache with TTL expiration and LRU eviction."""

    max_size: int
    default_ttl_seconds: int
```

### 5.3 JavaScript/TypeScript (JSDoc)

**Module block** — above the first export in a public module:

```typescript
/**
 * Provide payment orchestration and provider-independent contracts.
 * @module payment
 */
```

Keep callable descriptions within 2 prose lines, then place every structured contract tag on its own
additional line.

```typescript
/** Manage an in-memory cache with TTL expiration and LRU eviction at maxSize. */
class CacheManager {
    private maxSize: number;
    private defaultTTLSeconds: number;
}
```

```javascript
/**
 * Process a payment using the selected method; retry only transient failures.
 * @param {number} amount - Positive amount in USD.
 * @param {string} method - Payment method; accepts card, PayPal, or transfer.
 * @param {boolean} retry - Whether to make up to two additional provider calls after a transient failure; false makes one attempt.
 * @returns {Promise<Object>} Payment status, transaction ID, and processedAtUtc as a YYYY-MM-DDTHH:MM:SSZ string.
 * @throws {PaymentError} If the sole attempt fails while retry is false, or every attempt fails while retry is true.
 */
async function processPayment(amount, method, retry = true) {
    return submitPayment({ amount, method, retry });
}
```

### 5.4 Java (JavaDoc)

**Package documentation** — in `package-info.java`:

```java
/** Provide payment orchestration and provider-independent contracts. */
package com.example.payment;
```

```java
/**
 * Process a payment using the selected method; retry only transient failures.
 * @param amount Positive amount in USD.
 * @param method Payment method; accepts CARD, PAYPAL, or TRANSFER.
 * @param retry Whether to make up to two additional provider calls after a transient failure; false makes one attempt.
 * @return Payment status, transaction ID, and processedAtUtc as a YYYY-MM-DDTHH:MM:SSZ string.
 * @throws PaymentException If the sole attempt fails while retry is false, or every attempt fails while retry is true.
 */
public PaymentResult processPayment(double amount, String method, boolean retry) {
    return paymentProvider.process(amount, method, retry);
}
```

### 5.5 C/C++ (Doxygen)

**File/module block** — before declarations in the public header:

```c
/**
 * Expose payment orchestration and provider-independent contracts.
 * @file payment.h
 */
```

```c
/**
 * @brief Process a payment using the selected method; retry only transient failures.
 * @param amount Positive amount in USD.
 * @param method Payment method; accepts PAYMENT_CARD, PAYMENT_PAYPAL, or PAYMENT_TRANSFER.
 * @param retry Whether to make up to two additional provider calls after a transient failure; false makes one attempt.
 * @return Result containing payment status, transaction ID, processed_at_utc as a YYYY-MM-DDTHH:MM:SSZ string, and an error if the sole attempt fails while retry is false or every attempt fails while retry is true.
 */
PaymentResult process_payment(double amount, PaymentMethod method, bool retry);
```

---

## 6. Inline Comments (ONLY when necessary)

**GOOD inline comments**:

```python
# Convert epoch seconds at the boundary so every internal timestamp is timezone-aware UTC.
timestamp = datetime.fromtimestamp(response.timestamp, tz=timezone.utc)

# Reuse the compiled pattern because this validation runs for every imported record.
if not unicode_name_pattern.fullmatch(name):
    raise ValueError('name contains unsupported characters')

# TODO: Add distributed rate limiting after Redis is available; per-process counters would diverge.
make_request(url)

# Traverse in reverse so each removal preserves indexes that remain to be visited.
for index in range(len(items) - 1, -1, -1):
    if should_remove(items[index]):
        del items[index]

# Cache the remote result because repeated calls dominate this endpoint's latency.
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

**ALWAYS document when applicable to a callable, type, or module contract**, regardless of tier:

- **Assumptions**: "Assumes the caller is already authenticated."
- **Side effects**: "Modifies global session state."
- **Performance**: "Runs in O(n²); use only with small collections."
- **Concurrency**: "Not safe for concurrent use; callers must hold an external lock."
- **Null/None handling**: "Returns None when no user exists."
- **Magic numbers**: place one leading line above the constant that explains the reason, for example:
  ```python
  # Reserve five seconds of the execution budget for cleanup.
  REQUEST_TIMEOUT_SECONDS = 25
  ```

Put every caller-visible fact in the declaration contract. Keep implementation-local reasoning out
of declaration documentation even when prose budget remains; place it as a single-line comment at the
exact step it explains. Parameter, return, and error facts may use structured entries without consuming
the prose cap. Do not use this rule to add routine comments to data-structure properties.

---

## 8. Anti-Patterns to Avoid

The snippets labeled **Bad** intentionally violate this skill; explanatory annotations stay outside the
code so they cannot be mistaken for recommended comments.

**Documentation that repeats private, self-explanatory code**:

**Bad:**
```python
def _get_user_name(user):
    """Get the user's name."""
    return user.name
```

**Better:** remove the docstring; the private function's name and body already state the behavior.

**Outdated comments**:

**Bad:**
```python
# Return a list of user names.
def get_users():
    return {"users": [...]}
```

**Better:** replace the stale comment with language-native documentation for the current public contract:

```python
def get_users() -> dict:
    """Load the user records visible to the current request.

    Returns:
        An object whose 'users' key contains the visible user records.
    """
    return {"users": [...]}
```

**Comments that explain avoidable complexity instead of refactoring it**:

**Bad:**
```python
# Loop through every item, validate it, and append valid items to the result.
for item in items:
    if validate(item):
        result.append(item)
```

**Better:**
```python
result = [item for item in items if validate(item)]
```

**Excessive type documentation**:

**Bad:**
```python
class User:
    """
    Represent a user in the system.

    Store the user's name, email address, and creation date for use throughout the application.
    """
```

**Better:**
```python
class User:
    """Maintain a normalized, case-insensitive email identity."""
```

**Routine comments on struct/class fields or properties** are noise even when they fit on 1 line. Unless
the field meets §2's extreme, irreducible type-ambiguity exception, encode units, formats, ranges,
defaults, enum options, and ordinary meaning in the name, type, validation, or type-level contract.

**A permitted exceptional field comment that exceeds 1 line, or a function doc comment with more than
2 lines of descriptive prose**, is a hard violation of §2. Structured parameter, return, and error
entries are not prose and may add one line per entry. Keep every line complete without width wrapping;
move any other implementation-local reasoning to the relevant step (§6).

**External references instead of a self-contained contract**:

**Bad:**
```python
def parse_date(value):
    """Parse a date; see https://example.com/date-formats for accepted formats."""
    return date_parser.parse(value)
```

**Better:**
```python
import re
from datetime import date


def parse_date(value):
    """Parse a calendar date from the exact YYYY-MM-DD string shape.

    Args:
        value: Candidate value; non-string values are invalid.

    Returns:
        The parsed date, or None for a non-string, another shape, or an invalid calendar date.
    """
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return None
    year, month, day = map(int, value.split("-"))
    try:
        return date(year, month, day)
    except ValueError:
        return None
```

---

## 9. Quality Checklist

Before delivering documentation, verify:

- [ ] Every public package/module and every exported/public type has 1 prose line of declaration documentation (rarely a second invariant line) (§2, §3.1, §5)
- [ ] Every exported/public constant and variable has exactly 1 prose line of declaration documentation; data-structure fields remain undocumented except for the extreme exception (§2, §3.1)
- [ ] Data-structure fields/properties have no individual comments by default, regardless of visibility (§2)
- [ ] Any exceptional field/property comment is exactly 1 line and is justified by irreducible ambiguity between multiple legal runtime types/representations (§2)
- [ ] Declaration comments are immediately above declarations, Python docstrings are first statements, inline comments precede their steps, and no trailing comments remain (§2, §4)
- [ ] Every exported/public function and method is documented; private self-evident callables remain undocumented (§1, §2)
- [ ] Every documented function/method is classified into a tier (trivial/medium/complex) and respects that tier's cap (§3.2)
- [ ] **No function/method doc comment exceeds 2 lines of descriptive prose** — no exceptions,
      regardless of complexity (§2)
- [ ] In formats with structured sections/tags, every documented parameter, return, or error uses its
      own line; those entries are not counted against the 2-line prose cap (§2, §5)
- [ ] Documentation comments are not wrapped or truncated to satisfy a column-width limit; prose and
      each structured entry stay on complete lines (§2)
- [ ] Trivial, unexported, self-evident elements are left undocumented, not padded to match a template
- [ ] Non-obvious returned errors/exceptions are documented when the callable can produce them
- [ ] Applicable assumptions, side effects, performance costs, concurrency constraints, and null/None behavior are documented; magic numbers have a reason at their declaration (§7)
- [ ] Caller-visible edge cases are documented in the declaration contract; implementation-local edge-case reasoning is placed inline at the relevant step (§4, §7)
- [ ] NO redundant, obvious, or outdated comments
- [ ] Inline comments explain "why", not "what", and are single-line
- [ ] No large commented text blocks inside a function body
- [ ] Documentation uses the repository's established language, or English when none exists, without mixing languages within one public API (§1)
- [ ] No links or references to external documentation/sources

---

## Final Principle

> "Code is read many more times than it's written. Document for your future self and your teammates,
> not to impress. Be brief, clear, and useful."

**The best documentation is self-explanatory code + strategic comments at critical points, each one
paying its own way within its size cap.**
