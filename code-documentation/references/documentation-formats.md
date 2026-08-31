# Documentation Format Reference by Language

## Contents

- [Overview](#overview)
- [Non-Negotiable Rules](#non-negotiable-rules)
- [Why the Caps Exist](#why-the-caps-exist)
- [Declaration vs. Function Body](#declaration-vs-function-body)
- [Go (godoc)](#go-godoc)
- [Python (Google style)](#python-google-style)
- [JavaScript / TypeScript (JSDoc)](#javascript--typescript-jsdoc)
- [Java (JavaDoc)](#java-javadoc)
- [C / C++ (Doxygen)](#c--c-doxygen)
- [Inline Comments](#inline-comments)
- [Special Cases to Document](#special-cases-to-document)
- [Anti-Patterns](#anti-patterns)
- [Best Practices Summary](#best-practices-summary)

## Overview

This reference expands the caps summarized in [SKILL.md](../SKILL.md) into the concrete syntax each
language expects. The rules are identical everywhere; only the comment format changes.

Two ideas carry the whole system:

- **Clarity over quantity.** A concise comment explaining the "what" and "why" beats paragraphs
  explaining the obvious "how". Document the INTENT, not the implementation.
- **Size drives length.** An element's documentation budget follows its size and how obvious it is.
  For exported/public APIs, state the contract's "what" once; elsewhere focus on the "why" when the
  "what" is already evident. Use examples only when they clarify non-obvious use.

## Non-Negotiable Rules

A documentation pass that violates any of these is not done, however well the prose reads.

- **Never cap or wrap the width of documentation comments.** Lines may be as long as needed to
  preserve a complete sentence or logical fact. Do not split a comment merely to satisfy an 80-,
  100-, 120-, or any other column limit; line-count caps, not column width, control brevity.
- **No function/method doc comment ever exceeds 2 lines of descriptive prose.** This holds no matter
  the function's size or complexity — a 200-line function still gets at most 2 prose lines. Use those
  unwrapped lines fully and use structured entries to retain every caller-visible contract fact; never
  hide such facts inside the body. Only implementation-local reasoning belongs inline at the specific
  step that needs it.
- **Structured contract entries are exempt from the 2-line prose cap.** When a parameter, return, or
  error is documented in a format supporting `Args:`/`@param`, `Returns:`/`@return`/`@returns`, or
  `Raises:`/`@throws`, its entry must occupy its own additional line. These are semantic line breaks,
  not width wrapping: exactly one parameter, return, or error entry per line, and never an excuse for
  extra narrative paragraphs.
- **Do not document individual members of a type by default.** Document the struct, class, record,
  DTO, entity, configuration object, request/response type, or interface as a whole; routine
  per-member comments create noise even when the members are exported/public. This covers data fields
  and properties as well as the methods declared inside an interface.
- **A field/property comment is allowed only for extreme, irreducible type ambiguity.** It must be
  essential for correct use because the field legally accepts multiple runtime types or representations
  that its declaration cannot express (for example, an `any`/`interface{}` value that may be either a
  string or an integer with different meanings), and the name or type cannot be made more precise due
  to an external or compatibility constraint. The exceptional comment gets exactly 1 complete line.
  Units, formats, valid ranges, defaults, enum options, and ordinary business meaning do not qualify;
  encode them in the field name, a dedicated type, validation, or the structure-level documentation.
  The exception reaches data fields and properties only — including those declared on an interface —
  and never a method: a signature is not an ambiguous runtime type.
- **No module/package or struct/class/interface declaration documentation exceeds 1 prose line**,
  except for a rare, short second line when a hard invariant genuinely cannot fit in one (for example,
  thread-safety or ownership rules) — never a multi-paragraph block.
- **Use the language-native documentation position and never use trailing comments.** Declaration
  comments go immediately above the declaration; Python docstrings are the first statement inside the
  declaration; inline comments go immediately above the relevant step. The rare field/property comment
  allowed by the extreme-ambiguity exception also goes immediately above that field.
- **Every public package/module and every exported/public type, function, concrete method, constant,
  and variable is documented** — no public module or symbol ships silent. This overrides the skip rule
  for self-explanatory private code, but never authorizes routine member comments: fields and
  properties remain governed exclusively by the extreme-ambiguity exception, and the methods declared
  inside an interface are covered by that interface's own declaration line rather than one comment each.
- **Exported/public visibility does not justify member-by-member documentation.** Public properties
  and public interface methods follow the same no-comment default as private ones. The
  `@param`/`Args:` exception applies to the parameters of the callable being documented, not to
  fields, properties, or interface members.
- **Trivial, unexported, self-evident code stays undocumented.** Forcing a comment onto
  `func (u user) Name() string { return u.name }` is as wrong as under-documenting.
- **No redundant, obvious, or outdated comments** — see [Anti-Patterns](#anti-patterns).
- **No links or references to external documentation or sources** inside any comment or docstring.
  Explain behavior, constraints, and reasoning in terms of the code, never by pointing readers
  elsewhere.
- **One documentation language.** Use the repository's established documentation language; if none
  exists, default to English. Never mix documentation languages within one public API.

## Why the Caps Exist

A doc comment with no ceiling tends to restate the implementation line by line, which (a) goes stale
the moment the body changes and nobody updates the six-line paragraph above it, and (b) buries the one
sentence that actually mattered — a side effect, an edge case — inside prose nobody finishes reading.

A hard prose cap forces the same discipline as a good commit message: say the one or two things a
caller actually needs before touching the internals, use structured entries for parameters, returns,
and errors, and let the code itself carry implementation detail rather than omitted contract facts.

## Declaration vs. Function Body

This distinction keeps documentation useful instead of noisy.

- **At a declaration** (package, module, type, or callable that requires documentation): use the
  language-native declaration position. Packages, modules, and types get 1 prose line, rarely a second
  invariant line. Functions and methods get at most 2 prose lines, plus one structured line per
  documented parameter, return, or exception where the format supports it. Leave private self-evident
  elements undocumented.
- **Inside a function body**: single-line comments only, and only where they add value — a non-obvious
  step, an edge case, a "why". Avoid large blocks of commented text inside a body. A short one-line note
  before a logical section is enough; the code itself should carry the rest.

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

## Go (godoc)

Go is the flagship example here because it cleanly separates documentation for an exported type from
its data fields. Go's convention documents exported declarations, but that does not require narrating
every field in an exported struct. Document the struct's responsibility once at the declaration; its
fields remain uncommented unless one meets the extreme, irreducible type-ambiguity exception.

**Package comment** — one line, on the file that owns the package declaration:

```go
// Package payment handles payment processing and provider integration.
package payment
```

**Struct declaration and fields** — document the responsibility once and leave the fields uncommented.
Use precise names and dedicated types to carry details such as units and allowed values:

```go
// PaymentRequest captures provider-independent input for one payment attempt.
type PaymentRequest struct {
    AmountCents             int64
    Currency                CurrencyCode
    Method                  PaymentMethod
    RetryOnTransientFailure bool
    id                      string
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

**Trivial function** — 1 line, and only because it is exported; an unexported equivalent would carry
no comment at all:

```go
// Amount returns the payment amount in cents.
func (r PaymentRequest) Amount() int64 {
    return r.AmountCents
}
```

**Exported constants and variables** — exactly 1 line starting with the identifier. These are symbols,
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

**Interfaces** follow the structure rule, not the function rule: the declaration gets its 1 prose line
and the methods get nothing. Name each method precisely enough that the list reads as the contract:

```go
// InvoiceRepository persists invoice records and their processing outcomes.
type InvoiceRepository interface {
    Create(ctx context.Context, data core.Invoice) (core.Invoice, error)
    UpdateStatus(ctx context.Context, id ULID, status string, officialID string) error
    GetByID(ctx context.Context, id ULID) (core.Invoice, error)
}
```

Per-operation facts such as `ErrDuplicateInvoice` or `ErrInvoiceNotFound` belong on the concrete
implementations, which are documented under the function rule and are where a caller debugging real
behavior actually looks. When a single invariant governs the whole contract, put it in the interface's
one declaration line — never restore a comment per method to carry it.

This departs from the common Go habit of documenting every exported interface method. That habit is
exactly what this skill treats as noise: the same contract ends up written once on the interface and
again on each implementation, and the two drift apart.

**Go-specific anti-patterns**: commenting every exported struct field; commenting each method inside
an interface declaration; explaining units, formats,
ranges, defaults, or enum options property by property; restating the Go type in prose; or using a
trailing `Field Type // comment`. Prefer precise names and dedicated types. If the extreme-ambiguity
exception applies, use one leading line stating the otherwise inexpressible runtime representations.

## Python (Google style)

**Module docstring** — the first statement in a public module, before imports:

```python
"""Provide payment orchestration and provider-independent contracts."""
```

Apply the same tiers to callable summary prose. `Args:`, `Returns:`, and `Raises:` entries are
structured contract lines and are exempt from the 2-line prose cap; use one complete, unwrapped line
per entry rather than compacting multiple parameters together.

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

## JavaScript / TypeScript (JSDoc)

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

A TypeScript `interface` takes one declaration comment and nothing on its members, whether those
members are data properties or method signatures:

```typescript
/** Describe the persisted shape of one invoice as returned by the invoices API. */
interface InvoiceRecord {
    id: string;
    status: InvoiceStatus;
    totalCents: number;
    issuedAtUtc: string;
    cancel(reason: CancellationReason): Promise<void>;
}
```

`totalCents` and `issuedAtUtc` carry their unit and format in the name, and `status` carries its
allowed values in `InvoiceStatus`. That is why none of them needs a line of its own.

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

## Java (JavaDoc)

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

## C / C++ (Doxygen)

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

## Inline Comments

Use them only when they add value.

**Good** — each one states a "why" the code cannot state itself:

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

**Bad** — obvious and redundant:

```python
# Increment counter
counter += 1

# Iterate over users
for user in users:

# Return True
return True
```

## Special Cases to Document

Always document these when they apply to a callable, type, or module contract, regardless of tier:

- **Assumptions**: "Assumes the caller is already authenticated."
- **Side effects**: "Modifies global session state."
- **Performance**: "Runs in O(n²); use only with small collections."
- **Concurrency**: "Not safe for concurrent use; callers must hold an external lock."
- **Null/None handling**: "Returns None when no user exists."
- **Magic numbers**: one leading line above the constant explaining the reason:

```python
# Reserve five seconds of the execution budget for cleanup.
REQUEST_TIMEOUT_SECONDS = 25
```

Put every caller-visible fact in the declaration contract. Keep implementation-local reasoning out of
declaration documentation even when prose budget remains; place it as a single-line comment at the
exact step it explains. Parameter, return, and error facts may use structured entries without consuming
the prose cap. Never use this rule to add routine comments to data-structure properties.

## Anti-Patterns

The snippets labeled **Bad** intentionally violate this skill; explanatory annotations stay outside the
code so they cannot be mistaken for recommended comments.

**Documentation that repeats private, self-explanatory code**

Bad:

```python
def _get_user_name(user):
    """Get the user's name."""
    return user.name
```

Better: remove the docstring; the private function's name and body already state the behavior.

**Outdated comments**

Bad:

```python
# Return a list of user names.
def get_users():
    return {"users": [...]}
```

Better — replace the stale comment with language-native documentation for the current public contract:

```python
def get_users() -> dict:
    """Load the user records visible to the current request.

    Returns:
        An object whose 'users' key contains the visible user records.
    """
    return {"users": [...]}
```

**Comments that explain avoidable complexity instead of refactoring it**

Bad:

```python
# Loop through every item, validate it, and append valid items to the result.
for item in items:
    if validate(item):
        result.append(item)
```

Better:

```python
result = [item for item in items if validate(item)]
```

**Excessive type documentation**

Bad:

```python
class User:
    """
    Represent a user in the system.

    Store the user's name, email address, and creation date for use throughout the application.
    """
```

Better:

```python
class User:
    """Maintain a normalized, case-insensitive email identity."""
```

**A comment on every interface member**

Bad:

```typescript
interface InvoiceRecord {
    /** The invoice ID. */
    id: string;
    /** The total in cents. */
    totalCents: number;
    /** Cancels the invoice. */
    cancel(reason: CancellationReason): Promise<void>;
}
```

Better — one line on the declaration, and precise member names carrying the rest:

```typescript
/** Describe the persisted shape of one invoice as returned by the invoices API. */
interface InvoiceRecord {
    id: string;
    totalCents: number;
    cancel(reason: CancellationReason): Promise<void>;
}
```

Each of those comments restates its own member name. The interface's contract is the member list;
the per-operation behavior belongs on the concrete implementations.

**Routine comments on struct/class fields or properties** are noise even when they fit on 1 line.
Unless the field meets the extreme, irreducible type-ambiguity exception, encode units, formats,
ranges, defaults, enum options, and ordinary meaning in the name, type, validation, or type-level
contract.

**A permitted exceptional field comment that exceeds 1 line, or a function doc comment with more than
2 lines of descriptive prose**, is a hard violation. Structured parameter, return, and error entries
are not prose and may add one line per entry. Keep every line complete without width wrapping; move
any other implementation-local reasoning to the relevant step.

**External references instead of a self-contained contract**

Bad:

```python
def parse_date(value):
    """Parse a date; see https://example.com/date-formats for accepted formats."""
    return date_parser.parse(value)
```

Better:

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

## Best Practices Summary

1. Document the intent, not the obvious implementation.
2. Classify every callable into a tier before writing its doc comment.
3. Never exceed 2 prose lines on a function, whatever its complexity.
4. Give each parameter, return, and error its own structured line, exempt from the prose cap.
5. Never wrap a comment to satisfy a column limit.
6. Document a data structure or interface once; leave its fields, properties, and method signatures bare.
7. Reserve the 1-line field comment for irreducible ambiguity between legal runtime types.
8. Document every public package/module and exported symbol; leave trivial private code silent.
9. Put caller-visible facts in the declaration and implementation-local reasoning inline at its step.
10. Keep every contract self-contained — no links to external sources.

> "Code is read many more times than it's written. Document for your future self and your teammates,
> not to impress. Be brief, clear, and useful."

The best documentation is self-explanatory code plus strategic comments at critical points, each one
paying its own way within its size cap.
