---
name: code-documentation
description: Document code clearly, concisely, and professionally. Use when the user asks to document functions, classes, modules, or code files; add comments to existing code; improve existing documentation; or mentions "document", "comments", "docstrings", "JSDoc", or "code documentation". Generates documentation that other engineers can quickly understand without being verbose.
license: MIT
---

This skill guides the creation of clear, concise, and useful code documentation that facilitates understanding without being excessive.

The user provides code that needs to be documented or requests improvements to existing documentation. They may specify the language, documentation style (JSDoc, docstrings, etc.), or level of detail.

## Core Principles

**CLARITY OVER QUANTITY**: A concise comment explaining the "what" and "why" is better than paragraphs explaining the obvious "how".

**GOLDEN RULES**:

- Document the INTENT, not the obvious implementation
- If the code is self-explanatory, DON'T document it
- Focus on the "why", not the "what" when it's evident
- Document EDGE CASES, ASSUMPTIONS, and SIDE EFFECTS
- Use examples only when they clarify non-obvious use cases
- Focus 100% on describing the code itself — never reference or link to external documentation, blog posts, Stack Overflow answers, RFCs, or other outside sources. Explain behavior, constraints, and reasoning in terms of the code, not by pointing readers elsewhere

## Where Documentation Goes: Declaration vs Inside the Body

This is a **key distinction** to keep documentation useful and not noisy:

- **When creating a new class or function**: document it with a full, formal docstring
  block (docstring / JSDoc / JavaDoc / Doxygen) exactly as shown in the examples
  below — description, parameters, return, and exceptions. This is the right place for
  structured, complete documentation.
- **When writing code INSIDE a function**: use **single-line comments only**, clear and
  concise, and only where they add value (a non-obvious step, an edge case, a "why").
  Avoid large blocks of commented text inside a function body — most of the time that
  is unnecessary and adds noise. A short one-line note before a logical section is
  enough; the code itself should carry the rest.

```python
def transfer_funds(origin: str, target: str, amount: float) -> bool:
    """
    Move funds between two accounts atomically.   # ← formal block for the function

    Args:
        origin: Source account id
        target: Destination account id
        amount: Amount in USD, must be > 0
    Returns:
        True if the transfer was committed
    Raises:
        InsufficientFunds: If origin lacks balance
    """
    # Lock both accounts to avoid race conditions  ← single-line, only the "why"
    with lock(origin, target):
        debit(origin, amount)
        credit(target, amount)
    return True
```

## Documentation Levels

### 1. Public Functions/Methods (ALWAYS document)

**Essential elements**:

- Brief description (1 line) of WHAT it does
- Parameters: type, purpose, constraints
- Return: type, meaning
- Exceptions/Errors it can throw
- Example ONLY if usage is not obvious

**Structure by language**:

```python
def process_payment(amount: float, method: str, retry: bool = True) -> dict:
    """
    Process a payment using the specified method.

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

```javascript
/**
 * Process a payment using the specified method.
 *
 * @param {number} amount - Amount in USD, must be > 0
 * @param {string} method - 'card', 'paypal', or 'transfer'
 * @param {boolean} [retry=true] - Automatically retry if it fails
 * @returns {Promise<Object>} Object with status, transaction_id, and timestamp
 * @throws {ValueError} If amount <= 0 or invalid method
 * @throws {PaymentError} If processing fails after retries
 */
async function processPayment(amount, method, retry = true) {
```

```java
/**
 * Process a payment using the specified method.
 *
 * @param amount Amount in USD, must be > 0
 * @param method 'CARD', 'PAYPAL', or 'TRANSFER'
 * @param retry Automatically retry if it fails
 * @return Object with status, transactionId, and timestamp
 * @throws IllegalArgumentException If amount <= 0 or invalid method
 * @throws PaymentException If processing fails after retries
 */
public PaymentResult processPayment(double amount, String method, boolean retry) {
```

### 2. Complex Functions (document STEPS)

For long functions or complex logic, use strategic inline comments:

```python
def sync_inventory(products: list, source: str) -> dict:
    """
    Sync inventory between systems, handling conflicts.

    Args:
        products: List of SKUs to sync
        source: Source system ('warehouse', 'ecommerce', 'pos')

    Returns:
        Summary with success/failure counters
    """
    # Validate and normalize products
    valid_products = [p for p in products if validate_sku(p)]

    # Get current states from both systems
    local_state = db.get_inventory(valid_products)
    remote_state = api.get_inventory(valid_products, source)

    # Resolve conflicts: most recent timestamp wins
    conflicts = detect_conflicts(local_state, remote_state)
    for sku, (local, remote) in conflicts.items():
        winner = local if local.updated_at > remote.updated_at else remote
        db.update_inventory(sku, winner)

    # Apply changes and log to audit trail
    results = apply_changes(local_state, remote_state)
    audit_log.record('sync_inventory', results, source)

    return generate_summary(results)
```

**IMPORTANT**: Comment LOGICAL SECTIONS, not every line. Group related operations.

### 3. Classes (document RESPONSIBILITY)

```python
class CacheManager:
    """
    Manage in-memory cache with automatic expiration.

    Uses TTL to automatically expire entries. Thread-safe via locks.
    Implements LRU strategy when reaching max_size.

    Attributes:
        max_size: Maximum number of entries (default: 1000)
        default_ttl: Time to live in seconds (default: 300)
    """
```

```typescript
/**
 * Manage in-memory cache with automatic expiration.
 *
 * Uses TTL to automatically expire entries. Thread-safe via locks.
 * Implements LRU strategy when reaching maxSize.
 */
class CacheManager {
    /** Maximum number of entries */
    private maxSize: number;

    /** Time to live in seconds */
    private defaultTTL: number;
```

### 4. Inline Comments (ONLY when necessary)

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

# Assign name to variable
name = user.get_name()
```

### 5. Special Cases to Document

**ALWAYS document**:

- **Assumptions**: "Assumes user is already authenticated"
- **Side effects**: "Modifies global session state"
- **Performance**: "O(n²), use with small lists"
- **Concurrency**: "Not thread-safe, use external lock"
- **Null/None handling**: "Returns None if user doesn't exist"
- **Magic numbers**: `TIMEOUT = 30  # seconds, AWS Lambda limit`

## Format by Language

### Python (Google Style / NumPy Style)

```python
def function(param: type) -> type:
    """
    Brief one-line description.

    Extended description ONLY if necessary to understand
    non-obvious behavior, edge cases, or assumptions.

    Args:
        param: Parameter description

    Returns:
        Return value description

    Raises:
        ErrorType: When it's raised

    Example:
        >>> function(value)  # ONLY if usage is not obvious
        result
    """
```

### JavaScript/TypeScript (JSDoc)

```javascript
/**
 * Brief one-line description.
 *
 * @param {type} param - Parameter description
 * @returns {type} Return value description
 * @throws {ErrorType} When it's thrown
 */
```

### Java (JavaDoc)

```java
/**
 * Brief one-line description.
 *
 * @param param Parameter description
 * @return Return value description
 * @throws ExceptionType When it's thrown
 */
```

### C/C++ (Doxygen)

```c
/**
 * @brief Brief one-line description.
 *
 * @param param Parameter description
 * @return Return value description
 */
```

## Anti-Patterns to Avoid

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

**Comments that explain bad code**:

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
    their name, email, and creation date. It provides methods
    to access and modify this data...
    """  # Too obvious

    # Better:
    """System user with email validation."""
```

**External references instead of describing the code**:

```python
def parse_date(value):
    """Parses a date. See https://example.com/date-formats for details."""  # Don't link out

# Better:
def parse_date(value):
    """Parses ISO 8601 date strings; returns None if the format doesn't match."""
```

## Quality Checklist

Before delivering documentation, verify:

- [ ] Public functions have complete docstring
- [ ] Complex parameters are explained
- [ ] Exceptions are documented
- [ ] Non-obvious edge cases are commented
- [ ] NO redundant or obvious comments
- [ ] Inline comments explain "why", not "what"
- [ ] Classes/functions use a formal docstring block; inside the body only single-line comments
- [ ] No large commented text blocks inside a function body
- [ ] Documentation is in agreed language (English/Spanish)
- [ ] Examples are ACTUALLY useful (not trivial)
- [ ] No links or references to external documentation/sources — describes the code itself

## Final Principle

> "Code is read many more times than it's written. Document for your future self and your teammates, not to impress. Be brief, clear, and useful."

**The best documentation is self-explanatory code + strategic comments at critical points.**
