---
name: ddd-skill
description: Operational rulebook for writing, reviewing, or modifying code in the Kigo DDD rebuild (kz-*-svc core domains, platform services, product domains). Use when touching service structure, hexagonal layering, naming conventions, database schemas, events/outbox, HTTP handlers, or PR review for these services.
---

# DDD-SKILL.md — Kigo Zone DDD Engineering Skill

> **Purpose:** this is the operational rulebook an AI agent (or a human) follows to write, review, or
> modify code for the Kigo DDD rebuild — core domain services (`kz-*-svc`), platform services,
> product domains, and anything that touches their databases, events, or APIs — without introducing
> the bugs, architecture violations, style drift, or organizational mistakes this team has already
> caught in real PRs.
>
> **This file is self-contained by design.** Do not assume the AI or the reader has filesystem/repo
> access to any external document at the moment this skill is used — a skill can be invoked in
> contexts with no access to this org's private repos at all. Every rule that matters for day-to-day
> coding is inlined below, distilled from (but not dependent on) the org's architecture Bible
> (`kigo-DDD-planing`), the shared Go library's guides (`go-utils/docs/guides`), and real PR review
> history on the reference service (`kz-access-svc` in `kz-core-domains-svc`).
>
> **If your current session *does* have read access to those repos** (they're normal org repos other
> engineers can clone — not personal notes), use them for anything this file doesn't cover in enough
> depth, and treat them as the actual source of truth if this file and a repo ever disagree — that
> disagreement means this file is stale and should be corrected in the same change. But never treat
> "go read repo X" as a required step; if you don't have access, everything you need to follow the
> rules correctly should already be here.
>
> **Do not reference any local/private note-taking folder from this skill.** Personal working notes
> (delivery plans, ad-hoc review logs, scratch decisions) are not visible to anyone else and not
> portable across sessions — if something in a personal note is a real, durable rule, fold it into
> this file as inlined text (as has been done throughout §3–§23 below), don't link to the note.

---

## 0. How to use this file

1. **Before writing any code**, identify: which domain/service does this touch, and does it already
   exist? Use §4 to classify a *new* service if one doesn't exist yet.
2. **Before touching a database, event, or cross-domain call**, check whether an ADR-driven rule in
   this file (§3, §7, §12) already governs the area. If your session has access to the architecture
   repo, cross-check the owning domain's spec there too — but don't block on it if you don't.
3. **While writing code**, follow §5–§16 for structure, naming, layering, error handling, events,
   HTTP, DB, testing, and comments, plus §24 for process-lifecycle/runtime hardening (graceful
   shutdown, per-call timeouts, pool sizing) on anything that adds or changes a `cmd/` binary.
4. **Before opening/reviewing a PR**, run through §19 (real pitfalls already caught), §20
   (checklist), and §22 (how to run the review pass and word findings).
5. If something you're doing genuinely isn't covered here and you can't resolve it with available
   context: **stop and flag it explicitly rather than guessing or building around the gap silently.**
   §23 lists a few generic hygiene rules and one known, deliberately-unfilled gap (frontend
   conventions) for exactly this situation.

---

## 1. The stack at a glance

| Concern | Choice |
|---|---|
| Language | Go 1.24+ |
| HTTP framework | Fiber v2, via `go-utils/pkg/fiberapp` |
| ORM (MySQL, legacy) | Ent |
| SQL (PostgreSQL, new) | sqlc or raw pgx (`pgxpool`) |
| Cache | Redis 7.1 (`go-utils/pkg/persistence/redisdb`) |
| Async messaging | SNS FIFO → SQS FIFO (`go-utils/pkg/aws/{sns,sqs}`, `pkg/events`) |
| Long-running workflows / SAGAs | Temporal Cloud |
| Object storage | S3 + Object Lock (WORM) for immutable evidence |
| Orchestration | EKS 1.34 + Karpenter, ArgoCD, KEDA |
| Observability | Prometheus/Thanos, Loki, Grafana; `slog` + `go-utils/pkg/logger` for `request_id` propagation |
| Config/secrets | AWS SSM Parameter Store + Secrets Manager + External Secrets Operator; `go-utils/pkg/config` |
| API contract | OpenAPI 3.1, synced to a centralized docs portal — **never embedded/served in-process** |
| Feature flags | AWS AppConfig / `project_config` bag |
| IDs | UUID v7 for new services — generate app-side with `go-utils/pkg/uuidv7` (`uuidv7.New()`); the native PostgreSQL `uuidv7()` column `DEFAULT` **requires PG 18+** and is a server-side fallback, not the primary path. ULID for legacy-aligned services (`go-utils/pkg/ulid`) |

---

## 2. Source-of-truth hierarchy (when something isn't covered here, or seems to conflict)

If your session has read access to the org's shared repos, this is the priority order to resolve any
gap or apparent conflict. If it doesn't, treat this file's inlined rules (§3 onward) as the working
source and flag anything genuinely unresolved instead of guessing:

1. **An accepted ADR** (architecture decision record) for the specific thing you're doing always wins
   — over every guide, every existing service's code, and this file.
2. **The owning domain's full specification** (data model, API surface, events) — build a domain
   **completely** against its spec, not just the slice a current use case needs (see §4.4 "build the
   full domain").
3. **The org's written service/database conventions** — the concrete, mandatory code/DB rules. These
   win on top-level service structure over any generic library guide.
4. **The shared Go library's own guides** — authoritative for *internal code patterns* (DI wiring, the
   Outcome pattern, DTOs/domains, handler pipeline, events, adapters, routes, testing), not for
   top-level folder layout in the DDD monorepos (see §5).
5. **Existing service code — an example to read, never an authority.** The services in the monorepo
   (`kz-access-svc`, `kz-spatial-svc`, etc.) **predate this skill and were not built against it**, so
   none is guaranteed to conform — several demonstrably don't (e.g. standalone top-level cache packages
   §5.1 forbids, and the Ent+pgx failure mode §13.4 describes, both in sibling services). Read them to
   see how a pattern looks in practice, but when code and a rule stated here disagree, **the rule wins
   and the code is the thing to fix** — never resolve a conflict by copying what a service happens to
   do. "Existing code does X" is zero evidence that X is correct.
6. **This file's own §19/§20** — the pitfalls list and pre-flight checklist. Every PR should already
   satisfy these before it's opened.

---

## 3. Non-negotiables (would block a PR immediately)

These are the rules with zero tolerance. Violating any of these should stop a PR cold, no matter how
small the rest of the change is.

- **No cross-domain database access, not even read-only.** Every domain owns its schema; other
  domains reach it only through its API or its events. A straight SQL join across bounded contexts is
  rejected on sight.
- **No shared database between services.** One schema owner, one service writer.
- **No business logic in a BFF.** BFFs compose and relay; they don't decide.
- **Every state-changing endpoint (POST/PUT/PATCH) requires an `Idempotency-Key`.**
- **Every domain event write goes through the transactional Outbox pattern** — insert the domain
  mutation and the `outbox_event` row in the **same DB transaction**. Never publish directly from an
  HTTP handler.
- **Every network-exposed service or console ships with authentication/RBAC from day one.** "We'll
  add auth later" is never an acceptable state to merge or deploy.
- **`internal/` packages never import from `cmd/`.** Error definitions live in `internal/apperrors/`,
  not `cmd/errors/` — that's the legacy pre-monorepo layout and inverts the correct dependency
  direction.
- **A service's OpenAPI spec is never embedded (`go:embed`) or served in-process** (no
  `go-utils/pkg/swagger` call in a new `kz-*-svc`). It's synced to the centralized docs portal by CI.
- **`go.work` is never committed.** It's local-only, git-ignored, generated via `make workspace`. CI
  always runs with `GOWORK=off`.
- **Wire error `code` is always a JSON string**, never a bare number, for any service with
  `Config.Domain` set (i.e. every new service). Format: `KZ-<PREFIX>-<NNNN>`.
- **Money is `BIGINT` cents, never `NUMERIC`/`DECIMAL`/`FLOAT`.**
- **No plaintext secrets anywhere** — in code, docs, or logs. Reference Secrets Manager ARNs / SSM
  paths instead.
- **Report every issue a review finds, not just blockers.** There is no "non-blocking, ignore it"
  bucket — if it's worth mentioning, it's worth fixing.

---

## 4. Choosing where new code belongs

### 4.1 The three service classes

| Class | Folder in Bible | Repo | Naming | Schema/events? |
|---|---|---|---|---|
| **Core Domain** | `domains/core/` | folder in `kz-core-domains-svc` | `kz-{name}-svc` | Yes — owns a schema, publishes events |
| **Product Domain (PD)** | `domains/product/` | own standalone repo | `kz-{capability}-pd-svc` | Yes, but composes Core Domains; PDs proliferate by design and can need elevated access control (e.g. biometrics), which is exactly why they are **not** folded into a monorepo |
| **Platform Service (PS)** | `domains/platform/` | folder in `kz-platform-services-svc` | `kz-{name}` (no suffix; `kz-notification-svc` is a grandfathered exception) | Depends on subtype — see below |

Platform Service subtypes: **BFF** (stateless composer), **Operational** (templates/devices/delivery
tracking, no business invariants), **Derived** (CQRS read projection, e.g. Search), **Catalog/Contract**
(no runtime/schema/events at all, e.g. Presentation — it only defines SDUI contracts).

There are exactly **9 Core Domains** (Identity, Spatial, Access, Session, Financial, Pricing,
Enforcement, Evidence, Invoicing) — this is a deliberately closed kernel. Don't propose a 10th
casually; re-read `services.md §1.2` (decomposition rules) and `§1.4` (anti-patterns) first.

### 4.2 Decomposition rules, in order (services.md §1.2)

Before creating a new service, check in this order: (1) Domain Ownership — does this data belong to
an existing domain? If so, extend it, don't create a new service. (2) Scaling Independence. (3) Data
Boundary. (4) Team Boundary. (5) Availability Boundary (different SLA).

### 4.3 Anti-patterns — reject on sight

- "One service per API endpoint."
- "Shared database between services."
- "Business logic in the BFF."
- "Dedicated service per payment gateway" — gateways are **adapters**, not domains.
- "Microservice for CRUD only" — *"If it's just CRUD with no business rules, it's not a service —
  it's a table."*
- "Service per external integration" — third-party providers (PAC, Openpay, Orkesta, toll providers)
  are adapter packages inside the owning domain, not new services.

### 4.4 Build the full domain, not the use-case slice

When a phase/ticket touches a domain for the first time (or extends it meaningfully), build against
the domain's **entire** `.md` spec — data model, full API surface, all events — not only the fields
the current use case needs. A domain built to satisfy one use case has to be reopened for every
subsequent one; that's slower in aggregate than building it once against an already-detailed spec.
The one genuine exception: a deliberate, **explicitly logged** scope reduction (e.g. deferring a
channel with no current partner need) is fine — an undocumented gap is not.

### 4.5 `go.work` and repo independence

Each service keeps its **own `go.mod`** — dependencies are never centralized. This is what makes
"N independent services in one repo" real: separate module, separate Dockerfile, separate migrations
sequence, separate deploy unit (ECR image + ArgoCD app), separate CI trigger (path-filtered). A service
**cannot** `import` another service's `internal/` package — the Go toolchain physically rejects it.

---

## 5. Service structure (canonical layout)

The **top-level layout** below wins over the legacy go-utils "Building a Service" guide's structure
(that guide is authoritative for *internal code patterns*, not folder layout, for DDD monorepo
services — see `conventions.md §3`):

```
kz-{name}-svc/
├── go.mod                          # github.com/Parkimovil/kz-core-domains-svc/kz-{name}-svc
├── Dockerfile                      # multi-stage; git+GOPRIVATE wiring for private go-utils; distroless final stage
├── Makefile
├── README.md                       # summary + link to the domain's .md in the Bible — never duplicate the spec
├── cmd/
│   ├── api/main.go                 # wiring ONLY: config, persistence, DI, routes, start
│   ├── consumer/main.go            # SQS consumer — event-driven cache invalidation / cross-domain reactions
│   └── outbox/main.go              # standalone outbox publisher (kept OUT of cmd/api so the hot decision
│                                   #   path never shares a process with SNS publish retries)
├── internal/
│   ├── shared/config.go            # AppConfig: SSM + env loading
│   ├── apperrors/                  # codes.go, status.go, category.go, locales/{en,es}.toml — NEVER cmd/errors
│   ├── persistences/               # the ONLY place that knows connection details
│   ├── domains/                    # pure business entities, NO tags, NO framework imports
│   ├── dto/                        # request/response structs, camelCase json + validate tags
│   ├── ports/                      # interfaces ONLY: services.go, repositories.go, clients.go, cache.go
│   ├── repositories/                # DB access, returns domain types, never DTOs
│   ├── adapters/                   # HTTP clients to other domains / external providers
│   ├── services/                   # pure business logic, Outcome pattern
│   ├── di/{container.go,builder.go}# BuildContainer = the single composition root
│   ├── handlers/{http,routes}/     # Fiber handlers + resource routers
│   ├── middleware/                 # ONLY if wrapping/extending a framework middleware — see §5.1
│   ├── validators/                 # ONLY if a custom go-playground/validator tag is needed — see §5.1
│   └── testhelpers/                # ONLY once a second package needs the same fakes
├── ent/schema/  or  postgres/       # (Ent for MySQL legacy alignment, sqlc/raw pgx for new PostgreSQL)
├── openapi/openapi.yaml             # MUST contain the substring "openapi" in the filename — the docs
│                                    #   portal's file matcher requires it; "spec.yaml" is invisible
├── docs/                            # service-LOCAL only (runbook, local-dev); the domain design lives
│                                    #   in the Bible — link to it, never copy it
└── migrations/                      # numbered per-service; created only AFTER first production apply
                                     #   (pre-launch: edit database/{instance}/schema_*.sql directly)
```

Platform Services typically drop `repositories/`, `ent/`/`postgres/`, and `cmd/outbox`/`cmd/consumer`
if they have no schema of their own; they tend to have many `adapters/` (one per upstream domain they
compose).

### 5.1 Additional packages — add only when the capability is genuinely needed, and place them correctly

The layout above is the baseline every service starts from. Some services legitimately need more —
a custom middleware, a cache accelerator, an ORM field codec. **Don't skip adding these when they're
needed, but don't add them speculatively either, and place them where the layering rules in §6 say
they belong** — a good capability implemented in the wrong place is still a layering violation.

- **`internal/middleware/`** — add this **only** when a service needs to wrap or extend a framework or
  go-utils middleware (e.g. closing a gap in Fiber's stock idempotency middleware, per §13.3). Most
  services won't need this; go-utils' `FlexibleAuthMiddleware`/`APIKeyMiddleware` are used directly,
  unwrapped, in the common case. A small adapter that only exists to satisfy a third-party interface
  for this middleware's benefit (e.g. a `fiber.Storage` implementation over Redis) can live as an
  unexported file inside this same package — promote it to its own package only if a second,
  unrelated consumer needs it too. **This is a top-level sibling of `handlers/`, never
  `internal/handlers/middleware/`.** Middleware wraps the request *before* it reaches a handler and is
  mounted onto route groups by `handlers/routes/`, not called by `handlers/http/` — nesting it under
  `handlers/` inverts that relationship and mirrors nothing in go-utils itself, which keeps
  `pkg/middleware` as a sibling of `pkg/http`, not a child of it. Mirror that shape here.
- **`internal/validators/`** — add this **only** when a DTO needs a custom `go-playground/validator`
  tag beyond what `validators.RegisterCommon` already provides (ULID/UUID). A custom validator is a
  small, stateless `validator.FieldLevel → bool` function with no dependency on Fiber or HTTP — it
  encodes a business-value constraint (closer in spirit to `domains/`), not an HTTP concern. Register
  it once at bootstrap (`cmd/api/main.go`, right after `validators.RegisterCommon(validate)`) into the
  single shared `*validator.Validate` instance that DI then injects into every handler via
  `RouterOptions`. **This is also a top-level sibling, `internal/validators/`, never
  `internal/handlers/validators/`** — same reasoning as middleware: the validator instance is
  constructed once and injected inward, it isn't owned by the handler layer, and go-utils' own
  `pkg/validators` is a sibling of `pkg/http`, not nested inside it.
- **A cache accelerator with real logic** (stampede protection, a Redis GEO snapshot, a live-envelope
  mirror — see §13.2) is **never** its own top-level package that other packages import as a concrete
  type. It's a `ports` interface (extend `ports.CacheStore`, or add a narrowly-scoped port if the
  shape genuinely doesn't fit the existing one) with the concrete Redis-backed implementation living
  in `internal/repositories/` (e.g. `project_geocache_repository.go`), constructed in
  `di.BuildContainer` exactly like every other repository. If you skip the port and let `services/`
  import a concrete `internal/{x}cache` package directly, that's the exact violation §6.2 already
  forbids — a missing port, not a new architectural pattern.
- **An ORM field-type codec** (e.g. a PostGIS `driver.Valuer`/`sql.Scanner`, per §13.4) is fine as its
  own small leaf package with no business logic and no imports of `domains/`/`ports/`/`services/` —
  keep it schema-adjacent, close to where the ORM field is declared.
- **Outbox insertion is never a package other internal packages import directly and call a free
  function on.** It's the `ports.OutboxRepository` interface, implemented in `internal/repositories/`,
  injected via DI — the same rule §6.2 already states for go-utils' own `outbox.InsertEvent`. If you
  build the transactional-mutation helper in §13.1, have it accept the outbox-insert behavior as an
  injected interface or closure parameter, never as an imported concrete package. A local package that
  bypasses this is exactly the mistake flagged in §19's pitfalls list as "a port is missing."
- **A shared per-package helper used only within one existing package** (e.g. a transactional-mutation
  helper used only by `internal/repositories/`) does not need to become its own top-level package —
  doing so only forces every type it touches to be exported to cross a boundary that didn't need to
  exist. Keep it as unexported code inside the package that actually uses it; split it into its own
  package only once a second, unrelated package genuinely needs the same helper.

**Multi-binary naming** (per `services.md §2`):

| Binary | ECR image | ArgoCD app |
|---|---|---|
| `cmd/api` | `api-kz-{name}` | `kz-{name}` |
| `cmd/consumer` | `consumer-kz-{name}` | `kz-{name}-consumer` |
| `cmd/{worker}` | `worker-kz-{name}-{worker}` | `kz-{name}-{worker}` |
| `cmd/{job}` (cronjob) | `cronjob-kz-{name}-{job}` | `kz-{name}-{job}` |

---

## 6. Hexagonal layering & dependency rules

### 6.1 Layer responsibilities (does / does NOT)

| Layer | Does | Does NOT |
|---|---|---|
| **Handler** (`handlers/http`) | Parse+validate the request, apply defaults, delegate to the service | Contain business logic, access repositories, create services, log errors (the pipeline does it) |
| **Service** (`services/`) | Pure business logic, return `(*RespT, kigohttp.Outcome)`, call repos/clients via interfaces | Parse requests, apply defaults, create repositories/clients, import `di/`/DB packages, log errors returned via `Outcome` (only `logger.WarnContext` for best-effort side effects the handler won't see) |
| **Domain** (`domains/`) | Pure structs (no tags), business enums, DB→Domain mappers | Import `dto/`, contain business logic, know about HTTP/JSON |
| **Repository** (`repositories/`) | DB access only, returns **domain types** | Contain business logic, import `dto/`, use the root client for writes when a tx is in scope (use `getClient(tx)`) |
| **DTO** (`dto/`) | Request/response shape, validation tags, Domain↔DTO mappers | Import `ent/`/DB packages |
| **Port** (`ports/`) | Interfaces ONLY | Structs, DTOs, any implementation |
| **Adapter** (`adapters/`, `repositories/providers/{name}/`) | Talk to one external system, translate to/from domain types | Leak provider-specific types outward |
| **DI** (`di/`) | Wire concrete types together in `BuildContainer` | Anything else — no business logic |

### 6.2 Import direction table (strict)

| Package | Can import | Must NOT import |
|---|---|---|
| `domains/` | `ent/`/DB packages, `pkg/ulid` | `dto/`, `services/`, `handlers/` |
| `dto/` | `domains/`, `pkg/ulid` | `ent/`, `repositories/`, DB packages |
| `services/` | `domains/`, `dto/`, `ports/`, `pkg/ulid` | `ent/`, DB packages, `di/`, `repositories/` |
| `repositories/` | `domains/`, `ent/`, DB packages | `dto/`, `services/` |
| `handlers/` | `dto/`, `ports/`, `di/` (for `RouterOptions`) | `services/` internals, `repositories/`, DB packages |

If a service constructor's signature includes a raw DB client type (`*pgxpool.Pool`, `*ent.Client`) or
an infrastructure package called directly (`outbox.InsertEvent` from go-utils, called from
`services/`), **a port is missing** — add it (e.g. `ports.TxManager`, `ports.OutboxRepository`) and
route through it instead.

### 6.3 The composition root (`internal/di/`)

Manual DI, no framework/container library. `container.go` defines the shapes
(`RouterOptions`, `Repositories` — private, `BuildContainer`-only, `Services` — exported,
`Container`). `builder.go`'s `BuildContainer()` is the **only** place in the app that knows concrete
types. Construction order follows the dependency graph: DB clients → Repositories → Services →
Container. **`RouterOptions` never carries DB clients.** Routes receive the container and pass the
**specific port interface** each resource router needs — never the whole `*di.Services`.

Anti-patterns: services creating their own repositories; handlers creating their own services;
DB clients living on `RouterOptions`.

---

## 7. Naming conventions

### 7.1 Go code

- Package names: lowercase, singular (`session`, never `sessions`).
- Repository interfaces: `{Entity}Repository`; unexported concrete struct `{entity}Repository`.
- Service interfaces: `{Resource}Service`.
- Adapter/client ports: `{Domain}Client` (e.g. `IdentityClient`, `SpatialClient`), `{Vendor}Adapter`
  for external providers.
- Handler methods: `{Verb}{Resource}` (`CreateSession`, `GetUser`).
- Constructors: `New{Type}`. Return the **port interface** for anything wired through DI and consumed
  only via that port (adapters, repositories, services, clients) — the codebase depends on the
  interface and `di.BuildContainer` is the one place that names the concrete type. Return the
  **concrete struct** for plain value types, codecs (§13.4), and package-local helpers that have no
  port. This is the deliberate, DI-scoped exception to Go's usual "accept interfaces, return structs" —
  outside the DI seam, prefer concrete return types. Two hard cautions when a constructor returns an
  interface: (1) on the error path return an explicit interface `nil` (`return nil, err`), never a
  typed `nil` concrete pointer — a `nil` `*fooRepo` boxed in a non-nil interface is **not** `== nil` at
  the call site and defeats every downstream nil check; (2) if you find yourself returning an interface
  only to hide a method a caller legitimately needs, the port is too narrow — widen the port, don't
  force the caller to type-assert back to the concrete type.
- **Pick one ID type per service and use it consistently across `dto/` and `domains/`; never mix the two
  in one service.** Legacy/ULID-aligned services use the **base `ulid.ULID`** (`pkg/ulid`) in DTOs and
  domain types — DB-specific variants (`ulid/mysql`, `ulid/postgres`) live **only** inside
  `repositories/`. New PostgreSQL-native services use **UUID v7** end to end (generate app-side with
  **`go-utils/pkg/uuidv7`** — `uuidv7.New()` plus its `NullID`/nullable helpers — the same way legacy
  services lean on `pkg/ulid`; the native PostgreSQL `uuidv7()` column `DEFAULT` is a **PG 18+-only**
  server-side fallback, not the primary path, and app-side generation also lets the service set the id
  before the row is written, which the outbox event identity in §12 needs):
  `uuid.UUID` (`github.com/google/uuid`) in DTOs/domains, as `kz-access-svc` does — `ulid.ULID` does not
  appear in a UUID-native service.

### 7.2 Database (mandatory, `database-conventions.md`)

- snake_case everywhere; **singular** table nouns (`payment_intent`, never `payment_intents`).
- 63-character identifier limit; American English; no unapproved abbreviations. Approved list:
  `id, url, bps, ms, tin, lpr, qr, sso, mfa, otp, ip, uuid, mv, fn, trg, pk, fk, uq, chk, idx, excl`.
- One schema per bounded context. Postgres enums are global — prefix every enum type with the
  schema's 2–4 letter abbreviation (`fin_`, `ident_`, `ses_`, `ac_`, `sp_`, `prc_`, `enf_`, `ev_`,
  `inv_`, `ntf_`).
- **PK is always `id UUID`** — never `{table}_id` for a primary key.
- FK: `{referenced_table}_id`, or `{role}_{referenced_table}_id` when a table has two FKs to the same
  referenced table, `parent_id` for self-reference.
- **Cross-schema references are UUID soft references — no `REFERENCES` constraint across schemas.**
- Timestamps: `_at` suffix **only** for `TIMESTAMPTZ`; `_date` suffix **only** for `DATE`. Never mix.
- Booleans: always `is_`/`has_` prefixed — never a bare adjective.
- **Money: `_cents` suffix, `BIGINT` only.** Always paired with `currency CHAR(3)` (ISO 4217).
- Durations: full-word unit suffix (`_seconds`, `_minutes`, `_hours`, `_days`; `_ms` is approved) —
  never `_secs`/`_mins`.
- Counts: `{noun}_count` — never `num_{noun}`/`total_{noun}`.
- JSONB columns: descriptive names (`metadata`, `config`, `payload`, `schedule`) — **never
  `data`/`json`/`info`**.
- Optimistic-locking column is always named `version` (`INTEGER`).
- Ordering column is `sort_order` — never `position`/`rank`/`order`.
- Soft delete: `deleted_at TIMESTAMPTZ` (NULL = active), preferred over an `is_deleted` boolean.
- `outbox_event` is the table name in **every** schema that produces events. `processed_events`
  (composite PK `(event_id, consumer_name[, channel_class])`) is the idempotency table in every
  schema with consumers.
- Constraints named explicitly, never auto-generated: `pk_{table}`, `fk_{child}_{parent}`,
  `uq_{table}_{columns}`, `chk_{table}_{description}`, `excl_{table}_{description}`.
- Indexes: `idx_{table}_{columns}`, `gist_{table}_{column}` (spatial), `gin_{table}_{column}`
  (JSONB/full-text).
- Triggers/functions: `trg_{table}_{action}` / `fn_{description}` — function bodies use `$$`
  delimiters, never a single `$`.
- Reserved-word dodges: `identity`→`ident`, `transaction`→`financial_transaction`,
  `user`→`ident`/`console_user` (**never create a table named `user`**), `order`→`sort_order`.
- Row-Level Security is the universal multi-tenancy foundation: `ENABLE ROW LEVEL SECURITY` +
  `FORCE ROW LEVEL SECURITY` (so even the table owner is subject to the policy) + a per-request project
  scope. **Set that scope with `SET LOCAL app.current_project` inside the request's transaction**, not
  a bare session-level `SET app.current_project`. `SET LOCAL` is transaction-scoped and resets on
  commit/rollback, so it (a) works under PgBouncer **`transaction`** pooling — the default, and the
  only mode that actually multiplexes connections at scale — and (b) can never leak one tenant's scope
  onto the next request that reuses the same pooled backend connection, which is a real cross-tenant
  data-exposure risk with a persistent `SET`. A bare `SET` pins the scope to the physical connection
  and therefore **forces PgBouncer into `session` mode**, which largely defeats pooling; treat that as
  a last resort for a path that genuinely cannot run in a transaction, and document why. Either way the
  scope must be set on the **same** connection/`tx` that runs the query (acquire → set scope → query,
  all on one handle), never on a separately-acquired pooled connection.
- Pre-launch schema changes: edit `database/{instance}/schema_*.sql` directly (no migrations exist
  yet). Post-launch: `golang-migrate` numbered migrations only, schema files become frozen snapshots.
  Migration numbers are **per service folder**; a duplicate number is caught by CI (§18.2).

### 7.3 Events

- One SNS topic **per domain**: `kz-{domain}-events-{env}.fifo`.
- One SQS queue **per consumer per producer**: `kz-{consumer}-from-{producer}-{env}.fifo`.
- `MessageGroupId` = `{AggregateType}:{AggregateID}` (or `Metadata.EntityType:Metadata.EntityID` once
  migrated to the universal envelope) — guarantees **per-aggregate** ordering, not global ordering.
- `MessageDeduplicationId` = `event_id` (UUID v7).
- Event type names are PascalCase, past-tense-verb style: `AccessGranted`, `SessionCompleted`,
  `EntitlementCancelled`.
- **Universal Event Envelope (ADR-043), mandatory three-part structure for every published event:**
  - `metadata` (required): `event_id` (idempotency key), `event_type`, `domain`, `schema_version`,
    `occurred_at`, optional `actor_id`/`entity_id`/`project_id`/`correlation_id`.
  - `audit_payload` (required, may be `{}`): fields safe for the 7-year audit trail — **no PII**. The
    *producing* domain self-classifies what's safe; Evidence's universal sink never reads `data`.
  - `data` (optional): the full payload, may contain PII.
  - This is being adopted **additively** in go-utils (new fields alongside the existing flat
    `EventType`/`SourceDomain`/`AggregateType`/`AggregateID`/`Payload`) — never as a breaking change
    to `pkg/events.Envelope`.

### 7.4 Error codes (ADR-046)

- Integer codes stay per-service in `internal/apperrors/codes.go`, grouped into **gapped ranges**
  (`1xxx` generic, `2000–2099`/`2100–2199`/... per functional area) — never a flat sequential list.
- Wire format: `KZ-<PREFIX>-<NNNN>` (e.g. `KZ-ACC-2001`), **always a JSON string**. `<PREFIX>` is the
  service's registered 3-letter code in the domain prefix registry (`identity→IDN`, `spatial→SPT`,
  `access→ACC`, `session→SES`, `financial→FIN`, `pricing→PRI`, `enforcement→ENF`, `evidence→EVD`,
  `notification→NTF`, `search→SCH`, `iot→IOT`, `marketplace→MKT`, `enrollment→FAC`,
  `mobile-bff→BFF`, `agent-bff→AGT`, generic→`GEN`).
- A relayed downstream error keeps the **producer's** prefix — a BFF never re-codes a foreign error
  under its own prefix ("relay, don't relabel").
- `CodeToCategoryMap` is required alongside `AppCodeToStatusMap` — clients branch on the stable
  `category` (`not_found`, `conflict`, `validation`, `upstream_unavailable`, ...), not on individual
  renumberable codes.
- Every code needs a locale entry in **both** `en.toml` and `es.toml`, grouped by the same functional
  blocks as `codes.go` with a comment header per block.
- Ship a **drift-guard test** (`codes_test.go`) that fails the build if any code is missing from
  `AppCodeToStatusMap`, `CodeToCategoryMap`, `DefaultMessages`, or either locale file.

### 7.5 Routes

`/{api}/{version}/{context}/{resource}` — `{context}` is the microservice name (guarantees zero
collisions company-wide), `{version}` is mandatory (`v1`, `v2`, never release without it), `{resource}`
is a RESTful plural noun. **No actor in the URL** (no `/admin/x` vs `/mobile/x`) — the same resource can
have some routes behind `FlexibleAuthMiddleware` and others behind `APIKeyMiddleware`; the resource
router applies the middleware per route group. Infrastructure endpoints (`/health`, `/healthz`,
`/metrics`, `/ready`) live **outside** the `/api` prefix.

---

## 8. HTTP handler pipeline

Use the **V2 handlers / Outcome pattern** for all new code — the legacy 4-value return signature
(`(*RespT, code int, devErr error, err error)`) is deprecated (fragile: forgetting a return value
silently misuses `code` as an HTTP status).

```go
func (h *userHandler) GetUser(c *fiber.Ctx) error {
    return kigohttp.HandleV2(c,
        kigohttp.AutoParseOptions[dto.GetUserRequest](),
        h.validate, h.logger, h.errorHandler,
        func(ctx context.Context, req *dto.GetUserRequest) (*dto.UserResponse, kigohttp.Outcome) {
            return h.service.GetByID(ctx, req)
        },
    )
}
```

Service side:

```go
func (s *userService) GetByID(ctx context.Context, req *dto.GetUserRequest) (*dto.UserResponse, kigohttp.Outcome) {
    user, err := s.userRepo.GetByID(ctx, req.ID)
    if err != nil {
        // Pass err straight in — no %w wrap at the service→handler seam.
        return nil, kigohttp.Fail(apperrors.InternalServerError, "unable to retrieve user", err)
    }
    if user == nil {
        return nil, kigohttp.FailMsg(apperrors.UserNotFound, "user not found")
    }
    resp := dto.UserToResponse(*user)
    return &resp, kigohttp.OK()
}
```

- **Don't wrap the error at the service→handler seam** — the pipeline already logs full request
  context. Do wrap with `%w` for context deeper down (repos/adapters, per §11/§13.1).
- `Fail(code, devMsg, internalErr)` — dev message and internal error differ (most common).
- `FailMsg(code, msg)` — no sensitive data, both are the same string.
- `OK()` / `Created()` / `NoContent()` — semantic success constructors.
- `HandleNoBodyV2` for 204 responses (DELETE).
- `AutoParseOptions[T]()` auto-detects Body/Query/Params/Headers from struct tags
  (`json:`/`query:`/`params:`/`reqHeader:`).
- `InjectAuth: true` fills `UserID string` / `LegacyUserID int64` fields on the DTO from
  `FlexibleAuthMiddleware`'s resolved user — only if those exact field names exist and are still
  zero-valued (never overwrites a client-supplied value). To *require* token auth, add
  `validate:"required,ulid"` / `validate:"required,gt=0"`.
- **Wire the global `RequestLogger`** via `fiberapp.Config.Logger` in every service — otherwise
  requests rejected before reaching a handler (bad auth header, tenant mismatch, parse failure) are
  completely silent in logs.
- **Don't log what `HandleRequestV2`/`HandleV2` already logs.** Only use `logger.WarnContext` for
  best-effort side effects the handler won't see (e.g. an audit insert you intentionally ignore on
  failure).

---

## 9. Domains, DTOs, mappers

Three data layers, dependencies flow **inward only**:

```
DB types (ent.*, sqlc pgtype.*)  →  domains.*  (pure, no tags)  →  dto.*  (json + validate tags)
```

- Domain structs have **no tags** — no `json:`, no `bson:`, no ORM internals leaking through
  (`ent.ObUser` carries `config`, `Edges`, `selectValues`; strip all of it).
- DB→Domain mappers live in `domains/mappers.go` (imports `ent`/sqlc package, never `dto/`). Exception:
  a MongoDB bson→domain mapper lives in the repository file itself (the bson struct stays
  unexported/local).
- Domain→DTO mappers live in `dto/mappers.go`.
- Repository return types are always **domain types**, never DTOs and never raw ORM structs.
- Repositories that support transactions use a `getClient(tx)` accessor
  (`getClient(tx *ent.Tx)` returns `tx.ObUser` when non-nil, else the root client; sqlc/pgx equivalent
  returns `r.db.WithTx(tx)` when non-nil) — writing through the root client while a tx is in scope
  silently escapes the transaction.
- Common mistakes to avoid: tags on domain types; domain importing `dto/`; repository returning DTOs;
  skipping the domain layer and returning ORM types from repos; creating a domain type for Redis
  (use primitives); using DB-specific ULID variants in DTOs/domains.

---

## 10. Provider/Adapter pattern (external integrations)

For any third-party integration (toll providers, payment gateways, hardware vendors), use the
**Self-Contained Adapter** pattern (Anti-Corruption Layer + Strategy + Ports & Adapters):

1. `ports/` file has **zero structs** — interface(s) only, accepting/returning **domain types**.
2. Provider-specific DTOs (JSON/XML/SOAP structs) are **unexported**, live inside the adapter file.
3. Mappers translating provider ↔ domain are **private methods** on the adapter struct.
4. Constructor `New{Provider}Adapter(...)` returns the **interface**, never the concrete struct.
5. One file (or package) per provider — each is independently testable/replaceable.
6. The service holds `map[ProviderEnum]Adapter` and **routes via the map**, never `if/else`/`switch`
   on provider name.
7. Adding a new provider = one new file + one new map entry in `di.BuildContainer`.

Not worth the ceremony for: a single external system with no foreseeable alternative (skip the
strategy map, keep the file self-contained anyway); a trivial single-GET integration; database
repositories (this pattern is for *external API* adapters only).

---

## 11. Resilient outbound HTTP calls

Use `go-utils/pkg/http`'s `ServiceClient` (long-lived integrations) or `RequestBuilder[T]` (one-off
calls) — never a bare `http.Client` for calling another domain or a third party.

- **Timeouts, retry, and circuit breaker are per upstream, explicit** — don't reuse one blanket
  config for every call. Retry only idempotent verbs (GET/PUT/DELETE) on 502/503/504/429/timeout;
  never auto-retry POST (rely on the idempotency key instead).
- Retry: exponential backoff with jitter (default ~30%), capped at `max_wait`.
- Circuit breaker: Closed → Open (on failure ratio, e.g. 50%) → Half-Open (probe requests) → Closed/Open.
- Config is JSON-driven, typically loaded from SSM.
- Failed requests are auto-logged with sensitive headers masked (`Authorization`, `*key*`, `*token*`,
  `*secret*`, `*password*`) — don't hand-roll this logging.
- **Adapters decode, they don't flatten.** Never collapse a downstream `KigoError` into
  `fmt.Errorf("...: %w", err)` — decode it with `FromHTTPError` and relay/carry it so `code`/`domain`
  survive the hop.
- **Fan out concurrently — bounded and cancelable.** When one request composes several *independent*
  upstreams (the common BFF shape, §4.1), don't call them serially. Run them under
  `golang.org/x/sync/errgroup` created with the request's `ctx` (`errgroup.WithContext(ctx)`): the first
  failure cancels the siblings' contexts and `g.Wait()` returns that error, and no goroutine outlives the
  request. Cap real parallelism with `g.SetLimit(n)` whenever the fan-out width isn't a small fixed set
  (e.g. per-item enrichment over a client-supplied list) so a large request can't spawn hundreds of
  simultaneous upstream calls. The errgroup bounds *concurrency*; each call still carries its own
  per-upstream timeout from the bullets above, which bounds *latency*. Never hand-roll a bare `go` per
  upstream with manual channel collection — that's how leaked goroutines, lost errors, and unbounded
  fan-out get in.

---

## 12. Event-driven architecture

- **Mantra:** "Write to your database. The bus will carry the news." Never call another domain
  synchronously "to inform it" of something that happened — publish an event and let the consumer
  react.
- **Outbox, always.** Insert the domain mutation and the outbox row in the same transaction:

```go
_, err = outbox.InsertEvent(ctx, pgTx, "session", outbox.EventRow{
    EventType:     "SessionCompleted",
    AggregateType: "ParkingSession",
    AggregateID:   session.ID, // must be a UUID
    Payload:       payload,
})
```

- The outbox worker (a **separate `cmd/outbox` binary**, not a goroutine sharing the API process) is a
  dumb relay: poll unpublished rows → publish → mark sent. **No business logic in the worker.**
- **Claim rows with `FOR UPDATE SKIP LOCKED`, but never hold the transaction open across the SNS
  publish.** Do the network publish *outside* any DB transaction — pinning a pooled connection and row
  locks across a multi-message SNS round-trip works directly against the connection-budget discipline in
  §24 and lengthens the transaction (MVCC bloat on the outbox table, idle-in-transaction risk). Use a
  **lease-based claim** instead: in one short transaction, `SELECT ... WHERE published_at IS NULL AND
  (locked_until IS NULL OR locked_until <= now()) ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED`,
  stamp the claimed rows with `locked_until = now() + lease` (a bounded per-batch deadline), and **commit
  immediately** to release the locks and the connection. Then publish each row to SNS with a bounded
  per-call timeout, and set `published_at` on success. Multiple `cmd/outbox` replicas stay non-overlapping
  because a claimed row is filtered out until its lease expires — never an unbatched `SELECT` of
  unpublished rows that every replica reads at once (that either double-publishes or serializes the
  workers). If a worker crashes mid-batch, the lease simply expires and another replica reclaims the rows;
  `MessageDeduplicationId = event_id` is the backstop that makes that reclaim — or any at-least-once
  republish where the worker died after the SNS publish but before `published_at` was set — harmless. On
  an empty poll, back off (short sleep, or a `LISTEN`/`NOTIFY` wake) instead of hot-looping the database.
- Canonical `outbox_event` schema uses a **UUID v7 primary key** (doubling as the event identity),
  `published_at TIMESTAMPTZ` (NULL = unpublished) and `locked_until TIMESTAMPTZ` (the claim lease from the
  bullet above), plus `retry_count`/`max_retries`/`error_message` for dead-lettering — don't copy the
  older `BIGINT IDENTITY + separate event_id UUID` shape shown in some older guide examples; it's
  superseded.
- **Idempotency, three layers:** HTTP `X-Idempotency-Key` (client retries, ~24h window) → SNS
  `MessageDeduplicationId = event_id` (~5-minute FIFO window) → `processed_events` table (the
  permanent backstop, composite PK `(event_id, consumer_name[, channel_class])`). A consumer checks
  `processed_events` → executes in a tx → inserts into `processed_events` → commits → acks.
- A Redis-based fast idempotency pre-filter is fine for high-throughput consumers, but Redis is a
  cache, never the source of truth — on Redis unavailability, process anyway (availability over
  dedup) and rely on the DB check.
- Anti-patterns (explicit "DO NOT" from the guide): publish directly from an HTTP handler; call
  another service synchronously to "inform" it; put business logic in the outbox worker; rely on
  event ordering **across** different aggregates (only per-aggregate ordering is guaranteed); write
  non-idempotent event handlers.
- **The `internal/consumer`/`cmd/consumer` package is a dispatch shim, not a place for business
  rules.** An SQS/dispatcher handler function should unmarshal the payload, resolve the idempotency
  guard, and then call into `services/` (or a domain function) for the actual decision — the same
  layering rule §6 applies to the *handler* section of `handlers/http` applies here too. A handler
  function that itself clamps a value to a business range, decides a state-machine transition, or
  encodes a SAGA guard directly in SQL inside the dispatch package is business logic in the wrong
  layer — it can't be unit tested independently of a real dispatcher, and it can't be reused by an
  HTTP-triggered path that needs the same rule.

---

## 13. Patterns worth adopting from real-world review (not yet standard, but should be)

These four patterns were found in a sibling service's codebase during a comparative review. They are
**not currently standard practice for this team**, but each is independently defensible on
correctness/reliability/scalability grounds and doesn't conflict with anything in §3–§12. Adopt them
going forward; they are not retrofits required on existing code.

### 13.1 A shared transactional-mutation helper for optimistic-locked writes

When multiple aggregates in the same service use optimistic locking (a `version` column, per §7.2)
plus the outbox pattern (§12), don't let each repository hand-roll its own
`Begin → mutate → probe-on-miss → outbox insert → Commit` sequence — that's the same five-step
lifecycle repeated per repository, and it's exactly the kind of duplication where one repository
quietly gets the 404-vs-409 disambiguation wrong while the others don't.

Factor it into a small helper **used internally by `internal/repositories/`** (per §5.1, this does not
need to be its own top-level package unless a second, unrelated package needs it too), supplying only
what genuinely varies: the mutating SQL+scan, the outbox event to emit via the injected
`ports.OutboxRepository` (never a directly-imported outbox package — see §5.1 and §6.2), and (for
versioned updates) an `Exists` probe that runs on the same transaction when the
`UPDATE ... WHERE id = ? AND version = ?` matches no row — that's what tells a stale version (409,
`ErrVersionConflict`) apart from a row that never existed or was already deleted (404,
`ErrNotFound`):

```go
// Exists tells a stale version (409) from a vanished row (404) on the same tx.
type Exists func(ctx context.Context, tx pgx.Tx) (bool, error)

func MutateVersioned[T any](ctx context.Context, pool *pgxpool.Pool, run Run[T], ev Event[T], exists Exists) (*T, error) {
    return inTx(ctx, pool, run, ev, func(ctx context.Context, tx pgx.Tx) error {
        ok, err := exists(ctx, tx)
        if err != nil {
            return fmt.Errorf("mutate: exists probe: %w", err)
        }
        if ok {
            return domains.ErrVersionConflict
        }
        return domains.ErrNotFound
    })
}
```

Sentinel errors (`ErrNotFound`, `ErrVersionConflict`) are returned **unwrapped** — not because
`errors.Is` needs it (it walks `%w` chains fine either way), but so the sentinel stays the exact error
the caller switches on: don't wrap it in `fmt.Errorf("...: %w", ErrNotFound)` here, because that would
force the service to `errors.Is`-match through added prose and, worse, risk a later refactor swapping
`%w` for `%v` (or prepending a *different* sentinel) and silently breaking the 404-vs-409
disambiguation. Wrap with `%w` for *context* deeper down (§11); return the *bare* sentinel at this
decision boundary. This is a repository-layer helper — it doesn't change anything about
§6's layering or §8's Outcome pattern above it; the service still translates the sentinel error into
the right `apperrors` code. **The outbox insert inside this helper must go through the injected
`ports.OutboxRepository`, not a directly-called package-level function** — otherwise this "good
pattern" quietly reintroduces the exact missing-port violation §6.2 already forbids.

### 13.2 Cache-stampede protection for any cache that's expensive to rebuild

A cache backed by a full-table scan or an expensive aggregation (a geo-index snapshot, a denormalized
read model) needs more than plain `GET`/`SET`. On a cold cache — right after a deploy, or after a TTL
expiry across a large key set — every concurrent request that misses will otherwise try to rebuild it
at once, hammering the database with identical redundant work (a "miss storm").

**Where this lives:** per §5.1, the concrete Redis-backed cache is a `ports` interface implemented in
`internal/repositories/`, wired through `di.BuildContainer` — not a standalone top-level package that
`services/` imports directly. The mitigations below apply to that repository's implementation either
way; only the package placement changes.

Two cheap, composable mitigations:

- **Single-flight warm lock.** Before rebuilding, take a short-TTL distributed lock
  (`go-utils/pkg/locker`). If the lock is already held, another instance is warming it — return an
  error so the caller falls back to the real data source for *this* request only, rather than
  duplicating the rebuild.
- **Jittered TTL.** Spread expiry by ±5-10% (`d - delta + rand()*2*delta`) so a large key set warmed
  at the same time doesn't all expire on the same second and cause a synchronized miss storm later.

```go
func (p *Cache) warm(ctx context.Context) error {
    if err := p.locker.Lock(warmLock); err != nil {
        return fmt.Errorf("warm in progress: %w", err) // caller falls back to source of truth
    }
    defer func() { _ = p.locker.Unlock(warmLock) }() // best-effort: lock self-expires on its short TTL (§23 bare-`_` rule)
    // Another instance may have finished warming while we waited for the lock.
    if alreadyWarm(ctx) { return nil }
    // ... rebuild from the real source, write with jittered TTL ...
}
```

**Every read against this kind of cache must treat a Redis error or a miss as "fall back to the
source of truth," never as a hard failure** — this is the same fail-open posture as §3's Redis-outage
guidance, generalized: the cache is always an accelerator, never a second source of truth. Only reach
for this pattern when the rebuild is genuinely expensive (a full scan, cross-service call, or heavy
aggregation) — a plain `SET`/`GET` cache of a cheap lookup doesn't need the lock or jitter.

### 13.3 Enforce the idempotency-key requirement at the middleware layer, not per-service glue code

§3 states the non-negotiable ("every state-changing endpoint requires `X-Idempotency-Key`"), but *how*
it's enforced matters. A framework's stock idempotency middleware often has gaps that undermine the
rule silently: it may skip enforcement entirely when the header is absent (treating "no key" as "no
idempotency wanted" instead of "reject the request"), and it may surface an invalid key as a raw,
unlocalized 500 instead of a proper validation error.

Wrap the framework middleware so both gaps are closed, and back it with **distributed storage** (a
Redis-backed storage adapter + a distributed lock) so the guarantee holds across replicas, not just
within one process:

```go
func RequireIdempotency(errorHandler errors.Handler, storage fiber.Storage, lock idempotency.Locker) fiber.Handler {
    inner := idempotency.New(idempotency.Config{KeyHeader: KeyHeader, Storage: storage, Lock: lock})
    return func(c *fiber.Ctx) error {
        if fiber.IsMethodSafe(c.Method()) {
            return c.Next()
        }
        if c.Get(KeyHeader) == "" {
            return errorHandler.HandleError(c, apperrors.BadRequest,
                fmt.Errorf("missing required %s header", KeyHeader))
        }
        if err := inner(c); err != nil {
            if errors.Is(err, idempotency.ErrInvalidIdempotencyKey) {
                return errorHandler.HandleError(c, apperrors.BadRequest, err)
            }
            return err
        }
        return nil
    }
}
```

This makes the §3 rule systemic (every state-changing route gets it by construction, via one
middleware mount) rather than something each service's `services/` layer has to remember to implement
as bespoke Redis `SETNX` glue. `kz-access-svc`'s existing bespoke decision-guard pattern (§19 item 11)
is not wrong — it solves a narrower, service-specific concurrent-duplicate-decision problem on top of
this — but the *baseline* header-presence + invalid-key enforcement belongs at the middleware level for
every new service, not reinvented per service.

### 13.4 A PostGIS field-type codec, if — and only if — a service is committed to Ent and needs geometry

If a service uses Ent (MySQL-legacy-aligned or otherwise) and needs a `geometry(Point,4326)` column,
Ent has no native PostGIS support. Rather than pulling in a full geometry library, a small
`driver.Valuer`/`sql.Scanner` implementation that round-trips the point as hex-encoded EWKB
(little-endian, SRID 4326) is a legitimate, self-contained, unit-testable solution:

```go
func (p Point) Value() (driver.Value, error) {
    // little-endian byte-order flag + EWKB type|SRID-flag + SRID + X (lng) + Y (lat) ordinates
    // ... returns hex.EncodeToString(buf)
}
func (p *Point) Scan(src any) error {
    // decodes the hex EWKB PostGIS emits for a geometry column back into Lat/Lng
}
```

**Caution — this is not a license to mix Ent and raw pgx as two parallel access strategies in one
service.** The sibling service this pattern came from also demonstrates the failure mode: splitting
aggregates across two ORMs (Ent for geometry-free tables, raw pgx for geometry tables) to work around
Ent's PostGIS gap adds real, unjustified complexity — two outbox-insert code paths, two mental models,
duplicated semantics. Per §5/§6, a service should commit to **one** persistence stack. If that stack is
raw pgx/sqlc (the default for new PostgreSQL-native services per §1), PostGIS geometry columns don't
need this codec at all — bind them the same way any other column is scanned. Only reach for this codec
if the service is genuinely Ent-committed for other reasons and a geometry column shows up as a
secondary need.

---

## 14. Observability

- Use **`Context`-suffixed slog methods and always pass `ctx`**: `logger.InfoContext(ctx, ...)`, never
  `logger.Info(...)` — the non-context form silently drops `request_id` correlation.
- `go-utils/pkg/logger.ContextHandler` injects `request_id` into every log line automatically once the
  Fiber `requestid` middleware + a context-propagation middleware are wired — set this up once per
  service, don't hand-roll it.
- Set `fiberapp.Config.Logger` so `RequestLogger` closes the "pre-handler gap" (§3).
- Every log line for a given request should share the same `request_id`, across the incoming request
  log, service failure log, and any outgoing `ServiceClient` failure log.
- **Known gap — no distributed tracing yet.** Observability today is structured logs (correlated by
  `request_id`) plus Prometheus metrics; there is **no** OpenTelemetry span/trace pipeline wired. A
  request that crosses domains over HTTP or hops through SNS→SQS can therefore only be *correlated* by
  `request_id`/`correlation_id`, not *followed* as one end-to-end trace with per-span latency. This is
  stated honestly rather than papered over (same posture as §23.1), and the seam already exists —
  `pkg/events.Envelope` carries `correlation_id`, and its `Producer.Service` maps to OTel's `service.name`
  (`OTEL_SERVICE_NAME`). Until a tracing backend + OTel SDK wiring is an actual, ADR-backed team decision,
  **don't invent per-service tracing conventions ad hoc**; instead, propagate `correlation_id` end to end
  (including across event hops) so a future trace layer has something to attach to, and flag this gap
  explicitly on any work where cross-service latency attribution is the point.

---

## 15. Testing

- **Colocate always.** `foo.go` + `foo_test.go` in the same directory/package — this is a Go toolchain
  requirement, not a style choice. Never attempt to move tests into a separate `tests/` folder.
- Package can be `package services` (white-box) or `package services_test` (black-box) — either is
  fine, choose per file based on whether unexported access is needed.
- **Convert to `testify/suite` once a file accumulates ~4+ related cases with repeated setup.** Don't
  rewrite a stable 2-3-case file into a suite preemptively.
- **Extract `internal/testhelpers/` only when a *second* package needs the same fake.** A package-local
  `mocks_test.go` used by only one package is correct, not duplication — don't create shared
  testhelpers speculatively for a single consumer.
- **Separate unit vs. integration tests by filename suffix, not folder:** `{name}_test.go` (fakes
  only, no real DB/Redis, every push) vs. `{name}_integration_test.go` (real Postgres/Redis via
  `testhelpers/containers`, may run in a separate CI stage). Both stay in the same directory as the
  code under test.
- No numeric coverage target is imposed by the guides — focus on covering business logic paths in
  `services/`, not on hitting a percentage.

---

## 16. Comment & documentation style

- **No decorative dividers.** `// ── Generic (1xxx) ──────────` is not idiomatic Go and isn't rendered
  specially by `gofmt`/`godoc` — it's noise. A plain one-line comment above a grouped block is enough.
- **Comment the *why*, never the *what*.** Never narrate the code's steps
  (`// first resolve the access point, then loop over entitlements`), never restate what a line already
  says, and never restate the task/prompt you were handed. If the code shows *what* happens, a comment
  repeating it is noise — delete it. A comment earns its place only by explaining intent, a non-obvious
  tradeoff, or a constraint the code itself can't express.
- **Length follows the *why*, not a line count.** Default to one or two lines. A longer comment is
  justified *only* when the rationale is genuinely subtle **and** has no better home; the moment an ADR
  or domain `.md` covers it, collapse the comment to a one-line pointer
  (`// IsDenylisted checks the project-scoped denylist.`) rather than re-explaining the Redis key
  format and ADR number inline on every method. Narrating mechanics is never justified at any length.
- **Every exported identifier needs at least a one-line doc comment** — most commonly missed on
  package-level `var` maps (`AppCodeToStatusMap`), `//go:embed` vars, and mapper functions
  (`XxxToResponse`).
- **Don't over-document, but don't under-trust the reader either.** A terse one-line comment that
  states a function's purpose without restating its body is correct, not incomplete — don't add prose
  where the signature plus one line already makes intent clear.
- Cite the domain doc/ADR by path (**one line**) when the "why" isn't obvious from the code
  (e.g. `// see domains/core/access.md "Anti-Passback"` or `// ADR-037 §4 "narrows, never widens"`).
  A terse pointer is what makes rationale traceable years later without bloating the code. This terse
  standard is what this skill *sets*, not something to infer from existing services — several predate
  this skill and over-comment (multi-paragraph rationale blocks inline); when reviewing them, flag that
  verbosity and move the rationale to an ADR/`.md` with a one-line pointer. Don't copy it.
- **Only cite a document every future reader of this repo can actually open.** A citation is only as
  useful as the reader's ability to resolve it. `kigo-DDD-planing` (domains/ADRs/`architecture/`,
  `database/`, `use-cases/`) and `go-utils`'s own docs are the only doc sources safe to cite by path —
  they are normal org repos every engineer can clone. **Never cite a private planning file, a personal
  scratch doc, a one-off delivery plan, or an informal `plan §N` shorthand that lives only on the
  author's machine or in a local `DDD-DOCUMENTATION`-style folder** — a comment reading `// plan §7.3`
  with no `plan.md` anywhere in the org's repos is worse than no citation at all: it *looks* traceable,
  costs a reader real time hunting for a document that was never checked in, and silently rots the
  moment the author's local file is deleted or never shared. This is a real, observed failure mode, not
  a hypothetical — `kz-spatial-svc` shipped dozens of `plan §N` references (`plan §7.3`, `plan §4.2`,
  `plan §3.1`, ...) that resolve to nothing in any repo. If a rationale genuinely only exists in a
  personal note today, either (a) fold the substance into the code comment itself (briefly — see the
  length rule below), or (b) commit the plan (or the relevant slice of it) into `kigo-DDD-planing` first,
  *then* cite it. Never point at a document whose location depends on which machine the reader is on.
  Per §2 of this file, this cuts both ways: if a citation in code disagrees with what's actually in
  `kigo-DDD-planing`, or points at something that was never committed there, the citation is what's
  stale — fix the comment (or file the missing doc), never leave a dangling pointer in place.
- **Reserve a doc/ADR citation for *why*, never for restating logic the code already expresses.** A
  citation is not a substitute for reading the code — if the next line of Go already shows what happens
  (a static route registered before its `:id` sibling, a field being optional, an `if` guarding a nil
  check), a comment pointing at a doc for that is redundant with the *what*-comment rule above, just
  redirected at a URL instead of restated inline. Reserve citations for the genuinely non-derivable
  parts: a numeric threshold, a deliberate trade-off, a cross-service contract, a product decision date.
  `// Static /nearby registered before /:id so it isn't captured as an id.` needs no citation — the code
  and that one clause already say everything a reader needs; `plan §4.1` after it adds nothing checkable.
- **Trim comment length by cutting restated mechanics, not by an arbitrary line cap.** Several existing
  services (`kz-spatial-svc` most visibly) accumulated 4-8 line comment blocks that mostly narrate
  *what* the following code does, with the one genuine *why* buried in the last sentence or missing
  entirely behind a dangling doc citation (see the two rules above). When trimming: identify the single
  non-obvious fact the comment is protecting (a tradeoff, an invariant, a constraint) and keep exactly
  that, in one to two lines; delete everything that either repeats the code or would only make sense to
  someone reading a document that isn't checked in anywhere. Don't mechanically truncate a good 5-line
  explanation of a subtle bug-prone invariant (e.g. a lease-duration safety margin, a clock-skew
  avoidance) just to hit a line count — length still follows the *why*, this is about removing bloat
  that was never doing that job in the first place.
- **A grouped constant/map block benefits from a one-line header comment per group, even when no single
  entry needs its own comment.** This isn't the "every exported identifier needs a doc comment" rule
  (that's about the *var*/*const* itself) — it's about a block with many same-shaped entries
  (`DefaultMessages`, `AppCodeToStatusMap`, `CodeToCategoryMap`, `codes.go`'s constant blocks): a blank
  line plus a one-line comment naming the group (`// Generic platform errors.`, `// Access-point /
  Spatial resolution.`) makes it obvious at a glance which section a new entry belongs in, or that a new
  group is needed — without that, a map with 12+ flat entries reads as an undifferentiated list a future
  editor has to scan in full before adding the 13th. Keep the same grouping and ordering across
  `codes.go`, `status.go`, `category.go`, `defaults.go`, and both locale files (§7.4) so the groups line
  up file-to-file.

---

## 17. Security & compliance baseline

- Auth/RBAC wired **before** a route/console is exposed — no exceptions, no "internal only for now."
- Three RBAC middlewares layered on top of app-level checks: `RequireRole`, `RequirePermission`,
  `RequireProjectScope` — plus PostgreSQL RLS as defense in depth (§7.2). `SUPER_ADMIN` bypasses scope
  checks explicitly, not implicitly.
- Biometric/sensitive personal data (LFPDPPP Art. 9 in Mexico): requires **separate, explicit written
  consent** from the general privacy notice; a non-biometric alternative must always be offered
  wherever a biometric method gates physical access; international transfer needs its own disclosure
  and consent step.
- Crypto-shredding pattern for privacy-sensitive payloads: per-record DEK, wrapped by a CMK sharded by
  `project_id` (never one global CMK, never one CMK per identity — KMS quotas don't scale to millions
  of CMKs). Deleting the DEK makes the WORM-stored ciphertext permanently unreadable without touching
  the immutable audit record itself.
- Never log or persist a plaintext secret. Compare secrets by length/prefix/exact-match boolean when
  you must reference one.
- Redact developer-facing error detail (`RedactDevError: true`) on any service whose responses reach
  untrusted/public clients — log the raw detail server-side, correlated by `request_id`, instead of
  returning it on the wire.
- **Scan dependencies for known vulnerabilities in CI** with `govulncheck` (reachability-based, so it
  only fails on CVEs in code the service actually calls) alongside Dependabot's version bumps — wired in
  §18.2. A supply-chain CVE in a transitively imported, actually-reachable package is a security finding,
  not just a maintenance chore.

---

## 18. Repo, CI/CD, and PR conventions

### 18.1 Branching & merge strategy

- Three permanent branches: `develop` (DEV) → `stg` (STG) → `main` (PROD). Nobody pushes directly to
  any of them.
- Feature branches: `kz-{service}-svc/{slug}` (or `.../APP-123/{slug}` with a ticket ID), branched off
  `develop`, PR back into `develop`.
- **Squash-merge** feature → `develop`. **Merge commit, never squash**, for `develop→stg` and
  `stg→main` promotions (preserves the exact tested commit set).
- One required approving review, team-agnostic — there is **no per-domain CODEOWNERS**. DDD
  boundaries are enforced by module/schema/deploy isolation, not by repo permissions.
- "Require branches up to date before merging" on `develop` is the serialization mechanism (merge
  queue isn't available on this org's GitHub plan for private repos).

### 18.2 CI

- Path-filtered per service folder; `GOWORK=off` is **mandatory** on every job — without it a service
  can pass locally by silently resolving a dependency through a sibling module in the workspace, then
  fail on a fresh clone.
- A single fixed-name `ci-gate` job is the one required status check (the per-service matrix job names
  are dynamic and can't be required directly).
- Includes a duplicate-migration-number check per service folder.
- The per-service job runs `go build ./... && go vet ./... && go test ./...` (all under `GOWORK=off`).
  **Run the tests with `-race`** (`go test -race ./...`): §23's shared-mutable-state rule is otherwise
  entirely unenforced, and the race detector is the only thing that reliably catches those data races
  before production. Race builds need cgo, so the runner needs a C toolchain — the stock `ubuntu-*`
  GitHub runners already have one.
- **Add a `govulncheck ./...` step** (`golang.org/x/vuln/cmd/govulncheck`) to the gate. It's
  reachability-based — it only flags vulnerabilities in code paths the service actually calls, so it's
  low-noise — and it *complements* rather than duplicates the repo's existing Dependabot config:
  Dependabot bumps versions on a schedule; `govulncheck` tells you whether an un-bumped dependency is
  actually exploitable from this service right now.
- Broader static analysis (`golangci-lint`) is enabled **incrementally** — go-utils' `.golangci.yml`
  currently runs `errcheck`+`govet` with `staticcheck`/`gosec`/`revive`/`unused` staged behind
  pre-existing-issue cleanup. Follow that staged path; don't flip every linter on at once and bury an
  unrelated PR in findings.

### 18.3 PR checklist (minimum, expand with §22/§23)

- [ ] Branch starts with the service folder touched, branched off `develop`.
- [ ] Changes scoped to one service folder (or a small, justified cross-service set).
- [ ] `GOWORK=off go build ./... && go vet ./... && go test -race ./...` passes inside the service
      folder, and `govulncheck ./...` is clean.
- [ ] New migrations are the next unused number in *this service's* `migrations/`.
- [ ] No `import` of another service's `internal/` package.
- [ ] `openapi/openapi.yaml` updated for any public API change (filename contains "openapi").
- [ ] PR title: `feat(kz-{name}-svc): <short description>` (the scope is mandatory).
- [ ] No `go.work` committed; no `replace` directive pointing at a local path.

### 18.4 Dockerfile (private-module builds)

Every service depends on the private `go-utils` module — a bare `golang:*-alpine` base has no `git`,
and `go mod download` needs it. **Pass the GitHub token as a BuildKit build secret, not an `ARG`/`ENV`.**
An `ARG`-passed token is recoverable from the build stage's layer metadata and build cache (`docker
history`) even when a multi-stage build keeps it out of the *final* image; a `--mount=type=secret` is
exposed only to the single `RUN` that needs it and is never written to any layer. The Dockerfile must, in
order: (1) install `git` in the build stage and set `ENV GOPRIVATE=github.com/Parkimovil/*`; (2) mount
the token only on the `go mod download` layer and feed it to git **without persisting it to disk** —
`git config --global` would write the token into `~/.gitconfig` in the builder layer and defeat the
secret mount, so inject the URL rewrite via git's environment-based config, which lives only in the
process env of that one `RUN`:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=github_token \
    GIT_CONFIG_COUNT=1 \
    GIT_CONFIG_KEY_0="url.https://x-access-token:$(cat /run/secrets/github_token)@github.com/.insteadOf" \
    GIT_CONFIG_VALUE_0="https://github.com/" \
    go mod download
```

(3) confirm the calling deploy workflow actually supplies the secret — `secrets: |` / `github_token=...`
for `docker/build-push-action`, or `--secret id=github_token,src=<file>` (or `,env=GITHUB_TOKEN`) for a
raw `docker build`; a missing secret makes `go mod download` fail on the private module. (4) The final
`FROM` (ideally `gcr.io/distroless/static-debian12:nonroot`) must not `COPY --from=build` anything
carrying the token — with a secret mount there's nothing to leak, but never reintroduce it as an `ENV`,
`ARG`, or a committed `.gitconfig`/`.netrc`. Missing any of these passes CI (which builds on the runner,
not in Docker) and fails silently at the **next deploy**, not at review time — check the Dockerfile
explicitly on every review.

---

## 19. Common pitfalls already caught in real reviews (learn from these, don't repeat them)

These are drawn from actual PR review rounds (`kz-access-svc` #23/#33, `kz-evidence-svc` #24, the
event-envelope migration proposal review). Treat each as a check to run proactively, not just a
historical note.

1. **ASCII-art comment dividers and missing doc comments on exported vars** (`AppCodeToStatusMap`,
   `//go:embed` vars, mapper functions) — caught on a first scaffold PR, fixed by deleting dividers and
   adding one-line comments only where actually missing.
1a. **Comments citing a document that doesn't exist in any org repo.** `kz-spatial-svc` accumulated
    dozens of `// ... (plan §7.3)`-style citations across `internal/`, `cmd/`, referring to a private
    delivery-plan doc that was never committed anywhere — every one is a dead pointer to anyone without
    the author's local files. Fixed by replacing each with either the actual `kigo-DDD-planing`
    doc/ADR section that covers the same ground (when one exists) or, when no such section exists,
    trimming the comment to state only the in-code rationale with no citation at all. See §16's new
    "only cite a document every future reader can actually open" rule — this is exactly the failure mode
    it targets.
2. **Flat `TestXxx` functions with a shared setup helper past the ~4-case threshold** — converted to a
   `testify/suite`; the fakes file (`mocks_test.go`) was correctly **left in place** since only one
   package used it — don't confuse "convert the test structure" with "extract testhelpers."
3. **`openapi/spec.yaml` instead of `openapi/openapi.yaml`** — silently invisible to the docs portal,
   no error anywhere. Always grep for the literal substring `"openapi"` in the filename.
4. **Error codes documented as `type: integer` in OpenAPI** while the service actually emits the
   namespaced string once `Config.Domain` is set — a spec/implementation mismatch that's easy to miss
   by pattern-matching against older, non-namespaced services.
5. **Flat, ungapped error code sequences** (`2001, 2002, 2003...`) — restructure into gapped blocks
   before the service accumulates 20+ codes, or a later renumbering touches every caller.
6. **Dockerfile missing `git`/`GITHUB_TOKEN`/`GOPRIVATE` wiring** — passes CI, fails at the *next
   deploy* with `exec: "git": executable file not found in $PATH`. Always check the Dockerfile itself,
   not just that CI is green.
7. **Workflow-file-only changes that don't trigger a re-sync** — a PR that only edits a `category:`
   value inside `sync-docs.yml` never fires because the path filter watches the doc folder, not the
   workflow file. Verify with `gh run list` that a sync actually ran, don't trust "the PR merged."
8. **Reintroducing a rejected schema shape** (e.g. `access_point.level_id` as 1:1 when an ADR
   explicitly rejected it in favor of an M:N join table because it can't express shared resources) —
   always check the ADR's "Options Considered" section, not just its final decision, for the exact
   thing to reject on sight.
9. **A cross-domain seam carrying more than the agreed-upon opaque identifier** — e.g. Access passing
   device internals or vendor identifiers across the Access↔IoT boundary when the ADR says only the
   opaque `access_point` code may cross.
10. **A caching layer with no fail-open/fail-closed decision made explicitly** — a new Redis cache
    added without documenting what happens on a cache miss during an upstream outage is a silent
    security/availability decision. State it and log it (see `DECISIONS_CHANGELOG.md`'s entries on
    Access's entitlement cache: cold-miss fails **closed** deliberately, distinct from the financial
    check's fail-**open** policy — the two are not interchangeable and must each be a conscious choice).
11. **Concurrent-request race on an idempotency key** — checking Postgres for an existing row is not
    enough by itself; two concurrent requests can both observe "no row yet." A short-TTL Redis claim
    (distinct from any offline-device dedup mechanism, even if superficially similar) closes the
    window; release it as soon as the pipeline finishes so a legitimate retry after a transient
    failure isn't blocked for the full TTL.
12. **Silent behavior/default changes buried in a changelog line** — e.g. changing a shared library's
    default `EventVersion` affects every producer that didn't explicitly set it; call this out as a
    platform-wide behavior change in the PR description, not just in `go-utils`'s own changelog.
13. **Format claims not matching what the code actually produces** — e.g. documentation stating an ID
    "is a ULID" when the implementation actually reuses a UUID v7 row id; either fix the code or fix
    the doc to say "ordered and unique, not literally the declared format" — don't leave the mismatch
    unstated.
14. **Treating "migrated" as "compiles" instead of "verified end-to-end against a real consumer."** A
    schema/contract migration with zero live consumers to validate against is not done — track that as
    an explicit dependency, not an implicit assumption.
15. **A `replace` directive in `go.mod` pointing at a local path landing in a real PR.** Should be a
    named, automated CI check, not a "remember not to" habit.

---

## 20. Pre-flight checklist before calling any change "done"

- [ ] If the owning domain's spec or a relevant ADR is available in this session, checked that this
      change doesn't contradict either. If unavailable, checked this file's §3/§7/§12/§16 for anything
      that governs the area.
- [ ] Structure matches §5; nothing crosses the layering rules in §6.
- [ ] Naming matches §7 (Go, DB, events, error codes, routes) — no ad-hoc deviations.
- [ ] Every state-changing endpoint has an idempotency story; every domain event goes through the
      outbox in the same transaction as its mutation.
- [ ] Error codes are wired into `AppCodeToStatusMap`, `CodeToCategoryMap`, and both locale files —
      and there's a drift-guard test.
- [ ] Comments follow §16 (no dividers, terse is fine, every exported symbol has one line, no citation
      to a document that isn't actually committed in an org repo).
- [ ] Tests are colocated, use the `_test.go`/`_integration_test.go` suffix convention, and only reach
      for `testify/suite` past the repeated-setup threshold.
- [ ] `go build ./... && go vet ./... && go test -race ./...` pass with `GOWORK=off` inside the service
      folder; `govulncheck ./...` reports no reachable vulnerabilities.
- [ ] Dockerfile (if touched or new) has the private-module wiring from §18.4.
- [ ] Any new/changed `cmd/` binary handles `SIGTERM` with a bounded graceful drain; every DB call
      carries a `context` deadline; pgxpool/Redis pool sizes are set from config and bounded against
      backend connection limits (§24).
- [ ] `openapi/openapi.yaml` reflects any public API change; filename contains "openapi".
- [ ] Nothing from §3 (non-negotiables) or §19 (known pitfalls) is present.
- [ ] Every issue found while doing this — not just blockers — has been raised and fixed, or
      explicitly and visibly deferred with a reason.
- [ ] If anything here contradicts the Bible or an ADR, the Bible/ADR was followed, and the
      contradiction was flagged instead of silently resolved in code.

---

## 21. Where these rules come from (for maintainers of this file, not a runtime dependency)

Everything above is a distillation, not a pointer. It was built from the org's architecture decision
records, each domain's full specification, the service/database convention docs, the shared Go
library's pattern guides, the reference service's actual code, and real PR review history. None of
that needs to be re-read to *use* this file — it only matters if you're **updating** this file:

- A new or changed architecture decision → update the relevant rule in §3/§7/§12/§16 and note it.
- A domain's spec changes in a way that affects a rule stated here → update it here too.
- A new convention/anti-pattern is discovered in real review → add it to §19.
- If this file and an authoritative decision genuinely disagree, this file is wrong — fix it, don't
  work around it silently.

Keep this file honest: when a rule here turns out to be incomplete or superseded, fix it in the same
change that surfaces the gap, and prefer inlining the actual rule text over adding a reference to
another document — the next reader of this file may not have access to whatever you'd be pointing at.

**Already-checked non-issues (don't re-raise these as findings):** a review pass verified the following
against the real code and found them *already handled* or *deliberately deferred* — don't flag them again.
Request body limits and panic recovery are handled by `fiberapp` (`Config.BodyLimit`; `recover.New()` is
always mounted last). Broad `golangci-lint` is intentionally staged in `.golangci.yml` (errcheck+govet
now, the rest behind cleanup) — don't demand it all at once. SQS consumer concurrency is bounded in
`sqs.Consumer` config, not a skill rule. Severity-tier review labels are rejected on purpose (§22.3).

---

## 22. Review process shape & feedback style

§19/§20 cover *what* to check. This section covers *how to run the review itself* and *how to word a
finding* — practical review mechanics that were missing above. None of this overrides §3's reporting
rule: **every finding still gets reported, and there is no "nice-to-have, skip it" tier.** A review
technique that implies otherwise is explicitly rejected below.

### 22.1 Time-boxed pass structure

For anything beyond a trivial change, work in passes rather than reading top-to-bottom once:

1. **Context first.** Read the PR description/ticket, check CI status, and check size before reading
   a single line of diff. **A PR over ~400 lines is a signal to ask for a split**, not a signal to
   read faster — large PRs hide more than they save.
2. **High-level pass.** Does the change fit the problem at the right layer (§6)? Is it consistent with
   the naming/structure rules (§5/§7)? Are there duplicate files, or logic in the wrong layer?
3. **Line-by-line pass.** Correctness, edge cases, error handling (§8/§19), naming, and anything from
   §3/§16.
4. **Close with a decision**, but the decision is binary in spirit even where the tool offers three
   states: **Approve**, or **Request changes listing every finding** — a "Comment only" review must
   still list every issue found, not a curated subset chosen for severity.

If a single review session runs past roughly an hour, take a break rather than pushing through — review
quality drops with fatigue the same as coding quality does.

### 22.2 How to word a finding

Being right about a problem and being useful about it are different skills. Prefer:

- **Specific and actionable** over vague: state what could go wrong and what to do about it, not just
  that something is "wrong."
- **A question that invites the author to reconsider**, when the issue benefits from them thinking it
  through, over a flat assertion — e.g. "What happens if `entitlements` is empty here?" instead of
  "You forgot to handle the empty case." Use a direct assertion instead of a question when the answer
  is not actually up for discussion (e.g. a violated non-negotiable from §3) — don't soften a hard rule
  into a question just for politeness.
- **A concrete suggestion with an example**, phrased as a suggestion, over a command — "Suggestion: X
  might read more consistently with the pattern in Y — worth it?" rather than "Change this to X."
- **Every finding still needs its citation** (§16's rule about pointing at the actual ADR/spec/PR, not
  a vague "this looks off") — a nicely-worded finding with no traceable source is not more useful than
  a bluntly-worded one; it's just harder to disagree with productively.

### 22.3 Explicitly rejected: severity-tier labeling

Some review guides recommend labeling every comment with a severity emoji/tag (blocking / important /
nit / suggestion) so the author can triage by priority. **Do not adopt this here.** It directly
contradicts §3's non-negotiable: *"there is no separate bucket of nice-to-haves that's fine to
silently skip."* In practice, once something is labeled "nit" or "non-blocking," it reliably never
gets fixed — that's the exact failure mode §3's rule exists to prevent. If a finding isn't worth
fixing, don't raise it; if it's worth raising, it's worth fixing, full stop — no tier system needed.

### 22.4 Test what the code does, not how it does it

A test that asserts internal state (`component.state.counter === 1`) breaks the moment the
implementation changes even if the observable behavior is still correct — it's testing the
implementation, not the contract. Prefer asserting the outward behavior a caller actually depends on
(the returned value, the persisted row, the HTTP response body) over private fields, internal call
counts, or implementation-specific state. This is a judgment call on top of §15's mechanics (colocation,
suite thresholds, unit/integration suffixing) — §15 says *how the test file is organized*, this says
*what a good assertion targets*.

---

## 23. Generic engineering hygiene baseline (language-agnostic gap-filler)

Everything in §3–§19 is specific to this Go/Postgres/event-driven stack and is the primary reference.
This section exists only to state a handful of generic hygiene rules that apply regardless of language
and aren't otherwise spelled out above — most are already *enforced by construction* elsewhere in this
file (cross-referenced below), so treat this as a checklist to confirm, not new architecture.

- **Parameterized queries, always** — never build SQL by string concatenation/interpolation with
  user-supplied values, even for a one-off script or a migration helper. In this stack, `sqlc`/Ent
  already parameterize by construction; flag any hand-rolled raw SQL that doesn't.
- **No secrets in code, logs, or docs** — already a non-negotiable in §3 and the security baseline in
  §17; this is the generic form of that same rule.
- **Rate limiting on any public endpoint** — already available via `go-utils/pkg/fiberapp`'s limiter
  config; confirm it's actually wired for new public routes, don't assume the framework default covers
  every case.
- **Shared mutable state without synchronization is a real footgun in Go too**, not just in
  languages with more implicit shared state — a package-level `var` map/slice touched by more than one
  goroutine or request without a mutex/atomic/channel is a data race waiting to be found by `go test
  -race` (run it) rather than in production. Check any new package-level mutable state for this before
  approving.
- **Handle every returned error and every rejected promise/future equivalent** — in Go this means never
  discarding an `error` return with a bare `_` unless there's a stated reason it's genuinely safe to
  ignore (and say so in a one-line comment, per §16).
- **Avoid an untyped escape hatch as a substitute for modeling the data** — Go's rough equivalent of
  "avoid `any`" is reaching for `map[string]any`/`interface{}` where a real struct would express the
  shape; reserve the untyped form for genuinely dynamic payloads (e.g. a provider's raw JSON dump kept
  for audit, per the adapter pattern in §10) rather than as a shortcut for normal request/response data.

### 23.1 Known gap: this file does not yet cover frontend/TypeScript conventions

This ecosystem includes TypeScript/Next.js console apps (`kigo-consoles`, e.g. `apps/ca-dashboard`,
`apps/ca-operator`) that this skill file says nothing about — no naming conventions, no component
structure, no state-management pattern, no `@workspace/design-system`/`@workspace/auth` usage rules.
That gap is called out here deliberately rather than filled with generic, unsourced React/TypeScript
advice: this file's value comes from being grounded in this team's actual decisions, and inventing
frontend conventions without a source would break that. If/when the console apps' own conventions are
written down (or a context-gathering pass over `kigo-consoles` is done), fold them in as a new section
following the same "inlined, self-contained, cite the real source" approach used throughout this file —
don't bolt on a generic frontend style guide as a substitute.
---

## 24. Process lifecycle & runtime hardening (every `cmd/` binary)

§5 covers how the `cmd/api`, `cmd/consumer`, and `cmd/outbox` binaries are *laid out*; this covers how
they must *behave at runtime*. These apply to every long-lived binary and are checked on any PR that
adds or changes a `main.go` or a persistence constructor. On EKS with Karpenter-driven scale-in/out and
rolling deploys, a binary that ignores any of these degrades or drops work during perfectly normal pod
churn — so these are reliability rules, not nice-to-haves.

- **Graceful shutdown is mandatory.** Every binary traps `SIGTERM`/`SIGINT`, stops accepting new work,
  drains in-flight work under a bounded timeout (shorter than the pod's `terminationGracePeriodSeconds`),
  then closes pools and flushes logs. Exiting immediately on `SIGTERM` drops in-flight HTTP requests,
  abandons un-acked SQS messages mid-processing, and can tear down mid-publish.
  - `cmd/api`: `app.ShutdownWithContext(ctx)` — Fiber stops the listener and waits for active handlers.
  - `cmd/consumer`: stop long-polling, finish the in-flight batch, then exit. Each message already acks
    only *after* its `processed_events` commit (§12), so a message dropped un-acked is redelivered and
    the idempotency guard makes redelivery safe — never ack early to "drain faster."
  - `cmd/outbox`: finish publishing the already-claimed lease batch, then exit — or just exit and let the
    `locked_until` lease expire so another replica reclaims it (the lease + `MessageDeduplicationId` dedup
    make an interrupted cycle safe to resume either way). Never set `published_at` on rows that weren't
    actually published.
- **Every DB and cache call carries a deadline.** Derive a per-operation `context.WithTimeout` at the
  repository/service boundary so one stalled query can't pin a pooled connection indefinitely and
  cascade into pool exhaustion for every other request. On the request path, propagate Fiber's
  request-scoped `ctx` (it already cancels on client disconnect) — **never** pass `context.Background()`
  down into a repository from a handler. Background binaries (`consumer`/`outbox`) derive their own
  per-cycle timeout from the shutdown-aware root context.
- **Size every connection pool explicitly, from config.** Set `pgxpool.Config`
  `MaxConns`/`MinConns`/`MaxConnLifetime`/`MaxConnIdleTime` (and the `redisdb` pool limits) from
  `AppConfig`, never leave them defaulted. Keep the sum of `MaxConns` across all replicas **below** the
  Postgres `max_connections` *and* below the PgBouncer pool size — an unbounded/defaulted pool
  multiplied by autoscaled replicas is a classic way to exhaust the database's connection slots and take
  down every service sharing that instance. `MaxConnLifetime` also lets a scale-in/rebalance actually
  hand old backend connections back.
- **Liveness and readiness are distinct** (both live outside `/api`, §7.5). `/health`/`/healthz` is
  liveness (the process is up); `/ready` is readiness (dependencies — DB, Redis — are reachable) and is
  what gates traffic into the pod. During graceful shutdown, **fail `/ready` first** so the load balancer
  drains this pod before the listener stops accepting connections. Don't let a slow dependency check on
  the liveness probe cause a needless pod restart — keep the two probes' semantics separate.
- **Startup is fail-fast.** Config load, required-secret resolution, and pool construction happen once at
  boot; a failure aborts startup with a non-zero exit code. Never lazily half-connect on the first
  request and serve in a degraded state — a pod that can't reach its own database should fail readiness
  and be replaced, not silently return 5xx.
