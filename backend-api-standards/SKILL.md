---
name: backend-api-standards
description: Defines mandatory standards for REST API contracts and data format, including unified response structure, OpenAPI documentation, ULID identifiers, JWT auth headers, mandatory entity fields, and HTTP status codes. Framework-agnostic — describes what the API must return, not how to build it.
license: Complete terms in LICENSE.txt
---

# Backend API Standards Skill

This skill establishes **mandatory standards** for REST API **contracts and data format**. It defines **what the API must return** and **how data must be shaped** — it does not prescribe backend structure, folders, or implementation details.

## When to Use This Skill

- When designing or documenting a new API endpoint
- When the user mentions "API", "endpoint", "REST", "response format"
- When defining request/response schemas or data models
- To ensure all APIs follow the same contract conventions

## Core Standards

### 1. Unified Response Format

**Every single API response MUST follow this exact structure:**

```json
{
  "status": "success",
  "message": "Human-readable description of the result",
  "data": {},
  "meta": null
}
```

#### Response Fields Specification

| Field     | Type                      | Required | Description                                                             |
| --------- | ------------------------- | -------- | ----------------------------------------------------------------------- |
| `status`  | `"success"` \| `"error"`  | Always   | Indicates if the request succeeded                                      |
| `message` | `string`                  | Always   | Human-readable description                                              |
| `data`    | `object \| array \| null` | Always   | Response payload. Use `null` when there's no data to return             |
| `meta`    | `object \| null`          | Always   | Pagination, filters, or additional metadata. Use `null` when not needed |

#### Success Response Examples

**Resource retrieved:**

```json
{
  "status": "success",
  "message": "Credit cards retrieved successfully.",
  "data": [
    {
      "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
      "alias": "Mercado Pago",
      "color": "#007bff",
      "total_debt": "837.83",
      "payment_due_day": 18,
      "statement_close_day": 7,
      "credit_limit": "2900.00",
      "metadata": {},
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": null
}
```

**Resource created:**

```json
{
  "status": "success",
  "message": "Credit card created successfully.",
  "data": {
    "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
    "alias": "New Card",
    "credit_limit": "5000.00",
    "metadata": {},
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "meta": null
}
```

**Resource deleted (no content to return):**

```json
{
  "status": "success",
  "message": "Transaction deleted successfully.",
  "data": null,
  "meta": null
}
```

**Paginated list:**

```json
{
  "status": "success",
  "message": "Products retrieved successfully.",
  "data": [{ "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A2", "name": "Product 1" }],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

#### Error Response Examples

**Validation error:**

```json
{
  "status": "error",
  "message": "Validation failed.",
  "data": {
    "errors": {
      "email": ["The email field is required."],
      "password": ["Password must be at least 8 characters."]
    }
  },
  "meta": null
}
```

**Authentication error:**

```json
{
  "status": "error",
  "message": "Unauthenticated.",
  "data": null,
  "meta": null
}
```

**Authorization error:**

```json
{
  "status": "error",
  "message": "You do not have permission to perform this action.",
  "data": null,
  "meta": null
}
```

**Resource not found:**

```json
{
  "status": "error",
  "message": "Credit card not found.",
  "data": null,
  "meta": null
}
```

**Server error (no details exposed):**

```json
{
  "status": "error",
  "message": "Internal server error.",
  "data": null,
  "meta": null
}
```

### 2. Mandatory OpenAPI Documentation

**Every API endpoint MUST be documented using OpenAPI 3.0+ specification.**

#### Delivery Requirements

- Each project must expose an OpenAPI specification endpoint (e.g., `/api/docs/openapi.json`)
- Swagger UI or Scalar must be available at `/api/docs`
- Every endpoint must be fully documented with:
  - Summary and description
  - All path, query, and header parameters
  - Request body schema (when applicable)
  - All possible response schemas (including errors)
  - Security requirements

#### OpenAPI Example

```yaml
openapi: 3.0.3
info:
  title: Credit Cards API
  version: 1.0.0
  description: API for managing credit cards and transactions
servers:
  - url: /api
    description: Base API path

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    ApiResponse:
      type: object
      required: [status, message, data, meta]
      properties:
        status:
          type: string
          enum: [success, error]
        message:
          type: string
        data:
          nullable: true
        meta:
          nullable: true
          type: object
          properties:
            current_page: { type: integer }
            per_page: { type: integer }
            total_items: { type: integer }
            total_pages: { type: integer }

    CreditCard:
      type: object
      properties:
        id:
          type: string
          format: ulid
          example: "01JQ5B3K7MNP9R8V2WX4Y6Z0A1"
        alias:
          type: string
          example: "Mercado Pago"
        color:
          type: string
          pattern: "^#[0-9a-fA-F]{6}$"
          example: "#007bff"
        total_debt:
          type: string
          format: decimal
          example: "837.83"
        payment_due_day:
          type: integer
          minimum: 1
          maximum: 31
        statement_close_day:
          type: integer
          minimum: 1
          maximum: 31
        credit_limit:
          type: string
          format: decimal
          example: "2900.00"
        metadata:
          type: object
          additionalProperties: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

paths:
  /credit-cards:
    get:
      tags: [Credit Cards]
      summary: List user's credit cards
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: per_page
          in: query
          schema: { type: integer, default: 20 }
      responses:
        "200":
          description: Credit cards retrieved successfully
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/ApiResponse"
                  - type: object
                    properties:
                      data:
                        type: array
                        items:
                          $ref: "#/components/schemas/CreditCard"
        "401":
          $ref: "#/components/responses/Unauthenticated"
```

### 3. ULID for Resource Identifiers

**All resource IDs exposed by the API MUST use ULID format instead of auto-increment integers or UUIDs.**

#### ULID Format

- 26 characters, Crockford's Base32 encoded
- Example: `01JQ5B3K7MNP9R8V2WX4Y6Z0A1`
- Sortable by generation time
- URL-safe (no special characters)

#### Use in API

```json
{
  "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
  "user_id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A2"
}
```

All references between resources (foreign keys exposed in the API) must also use ULID strings.

### 4. JWT Authentication

**All protected endpoints MUST authenticate via JWT sent in the `Authorization` header.**

#### Request Header

```
Authorization: Bearer <token>
```

#### Token Lifetime

- Access token: 15–60 minutes
- Refresh token: 7–30 days
- Algorithm: `HS256` (single service) or `RS256` (microservices)

#### Token Payload Structure

```json
{
  "sub": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
  "email": "user@example.com",
  "iat": 1687700000,
  "exp": 1687703600,
  "type": "access"
}
```

#### Login Response Format

```json
{
  "status": "success",
  "message": "Authenticated successfully.",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  },
  "meta": null
}
```

### 5. Mandatory Entity Fields

**Every resource exposed by the API MUST include these three fields in its representation:**

| Field        | Type                         | Description                                                |
| ------------ | ---------------------------- | ---------------------------------------------------------- |
| `created_at` | `string` (ISO 8601 UTC)      | Timestamp when the resource was created. Never changes.    |
| `updated_at` | `string` (ISO 8601 UTC)      | Timestamp of the last modification.                        |
| `metadata`   | `object` (free-form key/val) | Optional extra information not covered by the main schema. |

#### Format

- Timestamps: ISO 8601 in UTC with `Z` suffix (e.g., `2025-01-15T10:30:00Z`).
- `metadata`: always an object. Defaults to `{}` when empty, never `null`.

#### Example

```json
{
  "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
  "alias": "Mercado Pago",
  "credit_limit": "2900.00",
  "metadata": {
    "source": "mobile_app",
    "imported_from": "legacy_system",
    "custom_color": "#ff5733"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-16T14:20:15Z"
}
```

#### Purpose of `metadata`

The `metadata` field allows sending additional context without altering the resource schema or introducing new fields for every small variation. Clients should never rely on a specific metadata key being present unless explicitly documented for that endpoint.

### 6. Data Format Conventions

Consistent data shapes across every resource in the API:

| Data Type     | Format                                                | Example                        |
| ------------- | ----------------------------------------------------- | ------------------------------ |
| Identifiers   | ULID string                                           | `"01JQ5B3K7MNP9R8V2WX4Y6Z0A1"` |
| Timestamps    | ISO 8601 UTC string                                   | `"2025-01-15T10:30:00Z"`       |
| Dates (only)  | `YYYY-MM-DD`                                          | `"2025-01-15"`                 |
| Decimals      | String (to preserve precision)                        | `"2900.00"`                    |
| Integers      | Number                                                | `18`                           |
| Booleans      | `true` / `false`                                      | `true`                         |
| Enums         | lowercase `snake_case` string                         | `"pending_review"`             |
| Colors (hex)  | `#rrggbb`                                             | `"#007bff"`                    |
| Field naming  | `snake_case`                                          | `payment_due_day`              |
| Currency      | Amount as string + separate ISO 4217 `currency` field | `"100.00"`, `"USD"`            |
| Empty lists   | `[]` (never `null`)                                   | `[]`                           |
| Empty objects | `{}` (never `null`, e.g., for `metadata`)             | `{}`                           |
| Unknown value | `null` (used only when the value is genuinely absent) | `null`                         |

### 7. HTTP Status Codes

| Code | When to Use                                          |
| ---- | ---------------------------------------------------- |
| 200  | Successful GET, PUT, PATCH                           |
| 201  | Successful POST (resource created)                   |
| 204  | Successful DELETE (no content to return, data: null) |
| 400  | Malformed request                                    |
| 401  | Missing or invalid authentication                    |
| 403  | Authenticated but insufficient permissions           |
| 404  | Requested resource not found                         |
| 422  | Validation errors                                    |
| 429  | Rate limit exceeded                                  |
| 500  | Unexpected server error                              |

### 8. Sensitive Data

The API MUST NEVER return:

- Password hashes or raw passwords
- Internal tokens, secret keys, or private credentials
- Stack traces, raw exceptions, or internal error details
- Internal database IDs (use ULIDs instead)

Error responses in production must use the generic error format defined in Section 1 — never leak internal information.

### 9. Logging System (Mandatory)

**Every API MUST implement a structured logging system.** Logs are essential for
observability, debugging, auditing, and incident response in production.

#### Requirements

- Use **structured logging** (JSON) rather than plain text, so logs are machine-parseable.
- Assign a **correlation/request ID** (e.g., `request_id`, ideally a ULID) to every
  incoming request and include it in **all** log entries for that request. Return it in a
  response header (e.g., `X-Request-Id`) so clients and servers can be cross-referenced.
- Log at minimum, for every request: HTTP method, path, status code, latency (ms),
  authenticated user id (when present), and the `request_id`.
- Log the **complete request** (method, path, query params, headers, and body) and the
  **complete response** (status code, headers, and body) for each request — with
  sensitive fields masked/redacted (see security note below).
- Log all **errors and unhandled exceptions** with full stack traces **server-side only**
  — never expose them in the API response (see Section 8). When something crashes, the
  log MUST indicate the **exact code location** (file, line, function/method, and the
  full stack trace) so the failure can be traced back to its source.
- Use appropriate **log levels**: `debug`, `info`, `warning`, `error`, `critical`.

#### Standard Log Levels

| Level      | When to Use                                                       |
| ---------- | ----------------------------------------------------------------- |
| `debug`    | Detailed diagnostic info, disabled in production by default       |
| `info`     | Normal events: request received, resource created, job completed  |
| `warning`  | Unexpected but recoverable situations (deprecated usage, retries) |
| `error`    | A request failed or an operation could not be completed           |
| `critical` | System-level failures requiring immediate attention               |

#### Structured Log Entry Example

```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "level": "info",
  "request_id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
  "method": "POST",
  "path": "/api/credit-cards",
  "status_code": 201,
  "latency_ms": 42,
  "user_id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A2",
  "message": "Credit card created successfully."
}
```

#### Full Request/Response Log Example

```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "level": "info",
  "request_id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A1",
  "request": {
    "method": "POST",
    "path": "/api/credit-cards",
    "query": {},
    "headers": { "content-type": "application/json", "authorization": "Bearer ***" },
    "body": { "alias": "New Card", "credit_limit": "5000.00" }
  },
  "response": {
    "status_code": 201,
    "headers": { "content-type": "application/json" },
    "body": { "status": "success", "message": "Credit card created successfully.", "data": { "id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A3" }, "meta": null }
  },
  "latency_ms": 42
}
```

#### Crash / Exception Log Example

When an unhandled error occurs, log where it crashed (file, line, function) plus the
full stack trace — server-side only:

```json
{
  "timestamp": "2025-01-15T10:31:12.880Z",
  "level": "error",
  "request_id": "01JQ5B3K7MNP9R8V2WX4Y6Z0A4",
  "method": "POST",
  "path": "/api/credit-cards",
  "status_code": 500,
  "error": {
    "type": "NullPointerException",
    "message": "credit_limit is null",
    "location": {
      "file": "src/services/credit_card_service.py",
      "line": 87,
      "function": "create_credit_card"
    },
    "stack_trace": "Traceback (most recent call last):\n  File \"src/services/credit_card_service.py\", line 87, in create_credit_card\n    ..."
  }
}
```

#### Security: Never Log Sensitive Data

Logs MUST NOT contain passwords, tokens, JWTs, secret keys, full card numbers, or any
PII beyond what is strictly necessary. Mask or redact sensitive fields before logging
(e.g., `"authorization": "Bearer ***"`). The same restrictions from Section 8 apply to
logs.

## Non-Negotiable Rules

1. **Response format**: Every response MUST use `{ status, message, data, meta }`
2. **OpenAPI**: Every endpoint MUST be documented with OpenAPI 3.0+
3. **ULID**: All resource IDs exposed by the API MUST be ULIDs
4. **JWT**: Protected endpoints MUST use JWT via `Authorization: Bearer <token>`
5. **Entity fields**: Every resource MUST include `created_at`, `updated_at`, and `metadata`
6. **Data formats**: Follow the conventions table (snake_case, ISO 8601 UTC, decimals as strings, etc.)
7. **HTTP codes**: Use the correct status code for every response
8. **Error format**: Always follow the unified error structure — never expose internals
9. **Sensitive data**: Never return passwords, secrets, or stack traces
10. **Documentation**: OpenAPI spec must be accessible and kept in sync with the real API
11. **Logging**: Every API MUST implement structured logging with a per-request correlation id, logging the full request and response and, on crashes, the exact code location and stack trace — never logging sensitive data

## Quick Start Checklist

When designing a new API endpoint:

1. Define the OpenAPI schema first (contract-first approach)
2. Ensure the response uses the unified `{ status, message, data, meta }` format
3. Ensure every resource exposes `id` (ULID), `created_at`, `updated_at`, and `metadata`
4. Apply the correct HTTP status code
5. Document all success and error responses in OpenAPI
6. Protect the endpoint with JWT when required
7. Ensure requests and errors are logged with a correlation id (structured logging)
