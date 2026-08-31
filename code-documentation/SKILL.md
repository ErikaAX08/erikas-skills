---
name: code-documentation
description: Document code clearly, concisely, and professionally. Use when the user asks to document functions, classes, structs, or code files; add comments to existing code; improve existing documentation; or mentions "document", "comments", "docstrings", "JSDoc", "godoc", or "code documentation". Generates documentation that other engineers can quickly understand without being verbose, with strict prose line-count caps and no comment-width limit, while allowing one line per structured parameter, return, or error entry and forbidding per-property and per-interface-member documentation except for extreme type ambiguity.
license: MIT
---

# Code Documentation

Documentation drifts toward two failure modes: silence (public APIs nobody can use without reading
the implementation) and noise (prose that repeats what the code already says and rots the first time
the code changes). This skill prevents both with hard per-element line caps. The amount of
documentation an element gets is a function of its size and how obvious it is, never a fixed template
applied uniformly.

See [references/documentation-formats.md](references/documentation-formats.md) for the full per-language format reference with additional examples.

## Contents

- [Workflow](#workflow)
- [Core Rules Summary](#core-rules-summary)
- [Code Examples](#code-examples)
- [Common Mistakes](#common-mistakes)
- [Review Checklist](#review-checklist)
- [References](#references)

## Workflow

Choose the path that matches the request:

### 1. Document new code

1. Identify the element type: package/module, struct/class/interface, constant/variable,
   field/property, function/method, or inline step inside a body.
2. Classify each callable as trivial, medium, or complex using [Function tiers](#function-tiers).
   The tier caps descriptive prose; it never lowers documentation below what a caller needs.
3. Apply the ceiling from [Length caps by element](#length-caps-by-element). No function doc comment
   exceeds **2 prose lines**, whatever the complexity.
4. Move every caller-visible parameter, return, and error into a structured entry — one entry per
   line, exempt from the prose cap.
5. Write the language-native format from
   [references/documentation-formats.md](references/documentation-formats.md), in the language-native
   position. Never use trailing comments.
6. Leave trivial, unexported, self-evident elements undocumented.
7. Run the [Review Checklist](#review-checklist) before delivering.

### 2. Improve existing documentation

1. Find public modules and exported symbols shipping silent, and document them to the cap.
2. Cut prose that restates the implementation, then confirm the remaining lines still carry every
   caller-visible fact rather than hiding it in the body.
3. Delete routine field, property, and interface-member comments; re-encode units, formats, ranges,
   defaults, and enum options in names, dedicated types, validation, or the type-level contract.
4. Unwrap comments that were split to satisfy a column limit so each fact sits on one complete line.
5. Replace external links with a self-contained contract stated in terms of the code.

### 3. Review existing documentation

Trace each element through visibility, tier, prose cap, structured entries, placement, field-comment
justification, and staleness against the current body. Rerun the checklist after each correction.

## Core Rules Summary

### Length caps by element

| Element | Documented when | Max length |
|---|---|---|
| Package / module declaration | Always if public or required by the language convention | 1 prose line (rare 2nd invariant line) |
| Struct / class / interface declaration | Always, if exported/public | 1 prose line (rare 2nd invariant line) |
| Exported/public constant or variable | Always | **1 prose line, hard cap** |
| Data field / property, in a structure or an interface | Almost never: only extreme, irreducible ambiguity from multiple runtime types or representations | **1 line, hard cap** |
| Interface method signature | Never; the interface's declaration line carries the contract | **no comment** |
| Trivial function/method | Always if exported/public; otherwise only when not self-evident | 1 prose line + structured entries |
| Medium function/method | Always if exported/public | up to 2 prose lines + structured entries |
| Complex function/method | Always if exported/public | **2 prose lines, hard cap** + structured entries |
| Inline step inside a body | Only non-obvious steps: a "why", an edge case, an assumption | 1 line per comment |

### Function tiers

| Tier | Shape |
|---|---|
| Trivial | One expression or a direct pass-through. No branching, no error path, no side effect beyond the return value. |
| Medium | A handful of branches or a single loop, one side effect, a bounded and obvious error condition. |
| Complex | Multiple branches or nested logic, more than one side effect, non-obvious ordering, concurrency, or an error path the signature does not imply. |

A medium function fully explained in 1 prose line does not need a padded second line to use the budget.

### Non-negotiables

| Rule | Detail |
|---|---|
| No width limit | Never wrap or truncate a comment to satisfy an 80-, 100-, or 120-column limit. Line counts, not column width, control brevity. |
| 2-line prose ceiling | No function/method doc comment ever exceeds 2 descriptive prose lines. A 200-line function still gets 2. |
| Structured entries are exempt | `Args:`/`@param`, `Returns:`/`@return`, `Raises:`/`@throws` each take their own additional line, one entry per line. Not a licence for extra narrative paragraphs. |
| Members stay undocumented | Document the struct, class, record, DTO, entity, config object, request/response type, or interface as a whole. Exported visibility does not justify member-by-member comments. |
| Interfaces documented once | An interface gets 1 declaration line and nothing on its members. Per-operation facts live on the concrete implementations, which follow the function rule. |
| One field exception | A field comment is allowed only where the declaration erases meaningful type information and an external constraint blocks a precise type. Exactly 1 line. It reaches data fields and properties only, never a method signature. |
| Native position only | Declaration comments immediately above the declaration, Python docstrings as the first statement, inline comments immediately above their step. Never trailing. |
| Nothing public ships silent | Every public package/module and every exported type, function, concrete method, constant, and variable is documented. Interface method signatures are the exception: they are covered by the interface's own line. |
| Private and self-evident stays bare | Forcing a comment onto a trivial unexported getter is as wrong as under-documenting. |
| No external references | No links to external docs, blog posts, Stack Overflow answers, or RFCs inside any comment or docstring. Explain behavior in terms of the code. |
| One documentation language | Use the repository's established language, or English when none exists. Never mix languages within one public API. |

### Always document when applicable

Assumptions, side effects, performance costs, concurrency constraints, null/None behavior, and the
reason behind a magic number stated on one line above its declaration.

Caller-visible facts belong in the declaration contract. Implementation-local reasoning belongs
inline at the exact step it explains, never in the declaration, even when prose budget remains.

## Code Examples

### Structure documented once, fields left bare

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

Units, currency format, method options, and retry behavior belong in names, dedicated types, and
validation — not in one comment per field.

### The extreme-ambiguity field exception

```go
// LegacyAttribute preserves stored records that encode values as either UTF-8 text or base-10 integers.
type LegacyAttribute struct {
    // Value accepts either a UTF-8 string or a base-10 integer; every other runtime type is rejected.
    Value any
}
```

`Value` qualifies only because `any` hides two legal runtime types and a compatibility constraint
prevents a precise type. A merely broad or poorly chosen type is not enough: improve the model instead.

### Interface documented once, members left bare

```go
// InvoiceRepository persists invoice records and their processing outcomes.
type InvoiceRepository interface {
    Create(ctx context.Context, data core.Invoice) (core.Invoice, error)
    UpdateStatus(ctx context.Context, id ULID, status string, officialID string) error
    GetByID(ctx context.Context, id ULID) (core.Invoice, error)
}
```

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

The member list is the contract. Facts about what each operation returns or raises go on the concrete
implementations, under the function rule.

### Complex function, still capped at 2 prose lines

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

### Structured entries carrying the contract

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

One complete line per entry — never compacted together, never wrapped to a column limit.

### Exported constant, exactly one line

```go
// DefaultRetryLimit bounds transient provider retries before Charge returns an error.
const DefaultRetryLimit = 2
```

Constants and variables are symbols, not data-structure properties, so the field prohibition does
not apply to them.

### Inline comments that earn their line

```python
# Convert epoch seconds at the boundary so every internal timestamp is timezone-aware UTC.
timestamp = datetime.fromtimestamp(response.timestamp, tz=timezone.utc)

# Traverse in reverse so each removal preserves indexes that remain to be visited.
for index in range(len(items) - 1, -1, -1):
    if should_remove(items[index]):
        del items[index]

# Reserve five seconds of the execution budget for cleanup.
REQUEST_TIMEOUT_SECONDS = 25
```

Against the same steps, `# Increment counter`, `# Iterate over users`, and `# Return True` add
nothing and are prohibited.

### Private and self-evident, left undocumented

```python
def _get_user_name(user):
    return user.name
```

A docstring here would restate the name and the body. The public-symbol rule does not reach it.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Doc comment wrapped to an 80- or 120-column limit | Keep each prose line and each structured entry complete on one line; line counts control brevity. |
| Complex function gets a six-line narrative | Cap prose at 2 lines and move parameter, return, and error facts into structured entries. |
| Every exported struct field carries a comment | Document the structure once; encode units, formats, ranges, and defaults in names, types, and validation. |
| Every interface method carries its own comment | Document the interface once; put per-operation contract facts on the concrete implementations. |
| Contract facts hidden in the body to respect the cap | Use both prose lines fully and add structured entries; never drop a caller-visible fact. |
| `Field Type // comment` trailing on the declaration | Use the language-native leading position, or remove the comment entirely. |
| Public module or exported symbol ships with no documentation | Document every public symbol to its cap; silence is a violation, not brevity. |
| Trivial unexported getter padded with a docstring | Leave it undocumented. |
| Comment explains complexity that should be refactored away | Simplify the code instead of narrating it. |
| Docstring points at an external URL for the real contract | State the contract in terms of the code; external references are prohibited. |
| Stale comment describes behavior the body no longer has | Rewrite it against the current contract, or delete it. |

## Review Checklist

- [ ] **Public coverage**: Every public package/module and exported type, function, concrete method, constant, and variable is documented.
- [ ] **Declaration caps**: Packages/modules and types have 1 prose line, rarely a second line for a hard invariant.
- [ ] **Constant cap**: Every exported constant and variable has exactly 1 prose line.
- [ ] **Prose ceiling**: No function/method doc comment exceeds 2 lines of descriptive prose, regardless of complexity.
- [ ] **Tier applied**: Every documented callable was classified trivial/medium/complex and respects that tier's cap.
- [ ] **Structured entries**: Each documented parameter, return, and error occupies its own line and is not counted against the prose cap.
- [ ] **No width wrapping**: No comment was split or truncated to satisfy a column limit.
- [ ] **Members bare**: No routine field, property, or interface-member comments, whatever the visibility.
- [ ] **Interfaces once**: Each interface carries a single declaration line and no comment on any method signature.
- [ ] **Field exception justified**: Any field comment is exactly 1 line and driven by irreducible ambiguity between multiple legal runtime types.
- [ ] **Placement**: Declaration comments sit immediately above declarations, Python docstrings are first statements, inline comments precede their step, and no trailing comments remain.
- [ ] **Silence where due**: Trivial, unexported, self-evident elements are left undocumented rather than padded to a template.
- [ ] **Contract completeness**: Non-obvious errors/exceptions the callable can produce are documented.
- [ ] **Special cases**: Applicable assumptions, side effects, performance costs, concurrency constraints, and null/None behavior are stated; magic numbers carry a reason.
- [ ] **Layer separation**: Caller-visible edge cases live in the declaration contract; implementation-local reasoning lives inline at the relevant step.
- [ ] **Inline discipline**: Inline comments explain "why", stay single-line, and no large commented block sits inside a body.
- [ ] **Freshness**: No redundant, obvious, or outdated comments remain.
- [ ] **Language**: Documentation uses the repository's established language, or English when none exists, without mixing within one public API.
- [ ] **Self-contained**: No links or references to external documentation or sources.

## References

- Full per-language format guide: [references/documentation-formats.md](references/documentation-formats.md)
