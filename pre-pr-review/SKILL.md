---
name: pre-pr-review
description: >-
  Audit PRs and diffs with evidence to decide whether they are safe to merge and deploy. Use when asked to review a PR, audit a diff, compare changes against develop/main or another base branch, perform a technical review, find production risks, prepare a merge decision, or analyze changes involving backend, frontend, jobs, APIs, auth, databases, migrations, events, queues, external integrations, payments, feature flags, infrastructure, CloudWatch, operational logs, or critical product flows.
---

# Technical PR Audit

Produce an internal diagnostic for the person making the merge decision. Do not write a public
review or a diplomatic GitHub comment for the PR author.

Always write the review output in Spanish with a direct, factual, technical tone. Be brief when one
sentence is enough. Do not praise, soften findings, add filler, or use phrases such as `LGTM`.

## Objective

Determine quickly:

- whether the PR is safe;
- what it breaks or changes;
- what remains unverified;
- what decision to make.

Apply the same rigor to backend, frontend, jobs, APIs, auth, databases, events, queues, external
integrations, payments, feature flags, migrations, infrastructure, and product logic.

## Evidence Discipline

- Do not state opinions without verification.
- Do not assume the PR's intent. Compare the issue or ticket, PR description, base-branch diff, and
  actual behavior.
- Do not treat the PR description, comments, function names, or tests as sufficient proof of behavior.
- Separate explicitly:
  - **Fact**: demonstrated by code, contract, test, configuration, log, metric, read-only query, or history.
  - **Inference**: conclusion derived from facts; state the reasoning.
  - **Conditional risk**: impact that depends on an unproven condition; name the condition.
  - **Open question**: missing data and the exact verification required to close it.
- Identify real blockers, not style or architecture preferences.
- Look for silent semantic changes even when types, compilation, and tests still pass.
- Prioritize impact on production, users, data, security, contracts, and operations.
- Say `No pude verificar X` when access or evidence is missing. Do not fill gaps with assumptions.
- Correct invalidated hypotheses explicitly: `Me equivocaba: con los datos nuevos, este punto ya no aplica.`
- Do not keep a finding open after evidence disproves it. Move it to **Puntos descartados**.
- When deployment coordination is the problem, say `No es bug de código; es orden de despliegue.`
- When behavior is technically valid but ambiguous, say `Esto requiere decisión de producto`,
  operations, or architecture as appropriate.
- When a risk depends on real traffic, configuration, or data, verify that condition. If verification
  is unavailable, leave it pending and do not present the impact as fact.
- Request authorization before querying production or any system that requires it. Use read-only
  operations only. Record the limitation when access is unavailable.
- Cite a concrete file and line, flow, contract, test, log, query, or commit. Do not use vague references.

## Required Method

Follow these phases in order. Scale effort to scope, but do not omit a phase without stating why it
does not apply or could not be verified.

### 1. Understand the Objective

1. Read the issue or ticket, PR description, commits, and linked documentation when available.
2. Identify the promised behavior, acceptance criteria, and declared out-of-scope work.
3. Separate functional changes, refactors, migrations, and operational coordination.
4. Identify contradictions between declared intent and the diff.
5. If no issue or sufficient context exists, say so; do not invent the objective.

### 2. Compare Against the Base Branch

1. Determine the base branch from PR metadata or the user's instruction. If unavailable, identify a
   candidate using git evidence and disclose the limitation; never choose silently.
2. Review the complete diff from the merge base to `HEAD`, not only the latest commit or a partial
   file list.
3. Include committed changes and distinguish local changes that are not part of the PR.
4. Inventory added, modified, moved, and deleted files.
5. Search outside the primary area for added or removed routes, auth, permissions, flags,
   configuration, schemas, states, contracts, transaction order, and external calls.
6. Compare against base-branch behavior when the diff alone does not explain the semantic change.
7. Do not modify or clean the user's working tree for the review. Use git reads or a temporary
   worktree when comparing executions is necessary.

### 3. Map Affected Flows

For every relevant flow, trace end to end:

- input and real caller;
- validations;
- auth, permissions, flags, and guards;
- state read;
- state written;
- transaction boundaries and order;
- external effects;
- retries, deduplication, and idempotency;
- errors, timeouts, and recovery;
- logs, metrics, and alerts;
- output to the user or consumer.

Find actual callers and consumers. Do not infer scope only from the modified file.

### 4. Review Invariants

Verify that the change preserves these conditions when applicable:

- no duplicate execution or duplicate external effect;
- no data loss, corruption, or accidental reactivation;
- no silent permission or contract change;
- no inconsistency between the database and an external provider;
- no orphaned or unrecoverable intermediate state;
- no breakage of existing traffic;
- no dependency on implicit ordering;
- no conversion of dead historical data into active data;
- no deletion or alteration of operational or forensic evidence;
- no failure path without appropriate retry, reconciliation, rollback, or recovery.

### 5. Verify with Evidence

Use only relevant available evidence:

- branch and base-branch code;
- tests and actual execution results;
- logs and metrics;
- configuration and feature-flag values;
- OpenAPI, schemas, and contracts;
- read-only queries;
- git history;
- reproduced behavior.

For each possible problem:

1. State the failure hypothesis.
2. Trace the activating condition and whether it exists in the real flow.
3. Verify impact and the affected population.
4. Search for evidence that disproves the hypothesis.
5. Classify it only after completing the previous steps.

Do not promote a generic possibility into a finding. If it cannot be closed, state exactly what
remains to verify.

#### Safe Operational Data Protocol

Apply this protocol before querying a database, CloudWatch, or any external system. A review does
not grant production access by itself.

**1. Reduce the need for access**

1. State the hypothesis and the exact data that would confirm or refute it.
2. Try to close it first with code, tests, fixtures, configuration, contracts, and local environments.
3. Query an external system only when the answer can change a finding or the verdict.
4. Do not explore production without a concrete question.

**2. Open an authorization gate**

Before accessing shared staging, production, a cloud account, or sensitive data, present this
request in Spanish:

```text
Entorno y recurso: <cuenta/región/log group o host/base>
Identidad prevista: <perfil/rol/usuario, sin secretos>
Hipótesis: <qué se intenta verificar>
Operación: <query o comando exacto, con valores sensibles redactados>
Alcance: <tablas/columnas o log groups/campos>
Límites: <ventana temporal, filas, timeout y volumen esperado>
Datos sensibles: <ninguno o categorías que podrían aparecer>
```

Request explicit authorization and wait for the response. Authorization for one resource,
environment, query, or time range does not extend to another. Request new authorization before
elevating privileges, changing roles, or expanding scope.

**3. Verify identity and destination**

1. Use already configured and approved credentials. Do not request, print, copy, or persist secrets.
2. Confirm the effective identity, account/project, region, endpoint, and resource in the same session.
3. Compare those values with the authorization. Stop on any mismatch.
4. Use the least-privileged available role. Having write permissions does not make an operation
   safe; continue enforcing this protocol's prohibitions.

**4. Record evidence without leaking data**

Record the source, environment, non-sensitive identity, time range, sanitized query, limits,
aggregate result, and limitations in the review. Do not include tokens, connection strings, complete
payloads, PII, or financial data. Redact identifiers when their literal value is not necessary to
support the evidence.

#### Database

Distinguish these activities:

- **Behavioral test**: run in local, ephemeral, or staging environments with controlled fixtures.
  Write only within that environment and only when authorized.
- **Real-data validation**: run in production with read-only operations exclusively. Do not test
  mutations, migrations, locks, retries, or rollback against real data.

For read-only validation:

1. Identify the engine, version, schema, and source of truth before writing SQL. Do not assume shared
   syntax or semantics across PostgreSQL, MySQL, SQL Server, warehouses, or NoSQL stores.
2. Prefer a read replica. If only the primary is available, disclose that in the authorization request.
3. Use a user without write privileges and, when supported by the engine, a read-only transaction or
   session as an additional defense. Verify both conditions; do not infer them from the username.
4. Set native time, row, and resource limits when supported. Start with the smallest time range and
   sample that can answer the question.
5. Select only required columns. Use bounded predicates over keys or indexed ranges. Do not assume
   `LIMIT` prevents an expensive scan, sort, or aggregate.
6. Review the estimated plan without execution when safe for the engine. Do not use `EXPLAIN ANALYZE`
   or an equivalent in production without specific authorization based on known cost.
7. Prohibit even when they appear read-only: `SELECT ... FOR UPDATE`, functions or procedures with
   side effects, DDL, DML, loads, exports, global session changes, and multi-statement queries that
   mix reads and writes.
8. Do not query secrets, tokens, PAN, CVV, complete payloads, or PII when a count, hash, state, or
   redacted identifier answers the question.
9. Stop when the query exceeds the approved timeout, volume, or cost. Do not retry with broader scope
   without new authorization.
10. Explicitly close or roll back the read-only transaction and connection. Record rows
    examined/returned, duration, and whether the result was complete or sampled.

Abort when read-only mode cannot be proven, reasonable scope cannot be estimated, or the plan shows
unapproved operational impact. Record `No pude verificar X`.

#### CloudWatch Logs Insights

Use CloudWatch only with existing credentials and minimum-scope read permissions. Allow only
discovery/read operations plus `logs:StartQuery`, `logs:GetQueryResults`, and `logs:StopQuery`. Do not
create, update, or delete log groups, filters, subscriptions, dashboards, saved queries, alarms, or
policies. Do not use `unmask`, exports, or Live Tail.

Follow this sequence:

1. Run `aws sts get-caller-identity` with the approved profile and obtain the effective region. Show
   the non-sensitive account, ARN, and region before querying. Stop if they do not match the approval.
2. Name log groups explicitly. Do not use broad prefixes, `SOURCE`, or cross-account observability
   unless that scope was authorized.
3. Use absolute UTC times. Start with at most 15 minutes around the event; expand only with a stated
   reason. A range longer than one hour or multiple log groups requires confirmation of the new scope.
4. Filter by a concrete request ID, correlation ID, transaction ID, caller, flag, or error code.
   Prefer equality on indexed fields when available. Do not start with broad text search.
5. Project only required fields. Omit `@message` when structured fields suffice. Use an initial limit
   of at most 100 results; prefer `limit any` for an unordered sample.
6. Remember that a regular `limit` bounds returned results but may still scan the entire time range.
   Control cost by narrowing log groups and time range first.
7. Review every generated query before execution, including queries produced from natural language.
   Prohibit `unmask` and unnecessary sensitive fields.
8. Start the query, retain its `queryId`, poll until `Complete`, `Failed`, `Cancelled`, or `Timeout`,
   and stop it when no longer needed. Do not treat partial `Running` results as complete evidence.
9. Record the range, groups, sanitized query, final status, returned record count, and scan-volume
   statistics. Stop and request authorization if volume exceeds the approved scope.
10. Treat missing logs as limited evidence: verify retention, ingestion delay, sampling, log level,
    and whether the flow actually emits to the queried group.

Use this as an initial query shape. Adapt fields to the real schema and omit sensitive values from
the report:

```text
fields @timestamp, requestId, level, errorCode
| filter requestId = "<authorized id>"
| sort @timestamp desc
| limit 100
```

Do not run commands with `--debug`, `--no-verify-ssl`, `--no-sign-request`, or credentials in
arguments. Do not save raw results in the repository or files without explicit authorization.

### 6. Evaluate Tests

Determine whether tests exercise real behavior or merely confirm mocks and implementation details.
Review as applicable:

- regression coverage for changed behavior;
- flag ON, OFF, and missing-flag branches;
- errors, timeouts, and ambiguous responses;
- authorization and permissions;
- retries, duplicates, and idempotency;
- migration, rollback, and data compatibility;
- contract producers and consumers;
- compatibility with old clients or workers;
- frontend loading, error, and empty states;
- a test that fails against the base branch when proving a bug fix requires it.

Run relevant tests when the environment allows it. Distinguish precisely between tests executed,
inspected, and missing. Never claim a test passed when it was not run.

### 7. Classify Findings

Use only these Spanish output categories:

- **🔴 Bloquea**: evidence of production, data, auth, or contract breakage; a dangerous migration;
  duplicate external effect; or unsafe deployment. Explain the materialized scenario. Do not use it
  for preferences or abstract risks.
- **🟡 Decisión requerida**: a valid change that needs explicit product, operations, or architecture
  confirmation. Do not present it as a bug.
- **⚪ Seguimiento**: an improvement or bounded risk that must not block the merge.
- **✅ Verificado**: an investigated risk that is covered or a hypothesis disproved by evidence.

Combine symptoms with the same root cause into one finding. Order by impact, not by file. Keep stable
identifiers such as `F-1`, `F-2`, and so on.

Missing evidence prevents approval only when the missing fact is a real deployment-safety
prerequisite. In that case, recommend `no aprobar hasta verificar X`; do not invent a technical blocker.

### 8. Recommend a Decision

Choose exactly one Spanish verdict:

- **pedir cambios**: at least one demonstrated blocker requires changing the PR or deployment plan;
- **aprobar**: no blockers or required decisions remain and the evidence is sufficient;
- **aprobar condicionado**: the code can be approved, but merge or deployment depends on an explicit
  action or decision;
- **no aprobar hasta verificar X**: indispensable safety evidence is missing; name `X` and how to
  verify it.

The decision must match the findings. Do not approve merely because no findings were reported when
the review remained materially incomplete.

## Risk Checklist

Apply only the sections relevant to the diff.

### Architecture and Flow

- Did the durable order of operations or transaction boundary change?
- Is state persisted before or after an external effect?
- Is rollback real, and are intermediate states recoverable?
- Does the new flow preserve compatibility with the previous one?

### APIs and Contracts

- Did the request, response, status code, headers, or auth change?
- Who are the real consumers, and do they remain compatible?
- Do OpenAPI, contractual documentation, and tests reflect the change?

### Auth and Permissions

- Was access opened or closed?
- Who calls this today, and can that caller pass the new guard?
- Is a compatible transition required?

### Feature Flags

- Does the flag exist in code and in the relevant environment?
- What is its real value, and what happens when it is absent?
- Which branch receives real traffic? Is the OFF branch actually safe?

### Database and Migrations

- Does the migration provide value against real data?
- Is it idempotent, does it block writes, touch many rows, or affect indexes?
- Does it preserve evidence and temporal semantics, including `ON UPDATE` behavior?
- Does it require batches, rollback, or separation from the code deployment?
- Is the code compatible before, during, and after the migration?

### Jobs, Queues, and Events

- Is the new message compatible with old producers or consumers?
- Are retries and duplicates safe and idempotent?
- What happens to in-flight messages, poison messages, and the DLQ?

### External Integrations and Payments

- Is there a stable idempotency key?
- What happens after an ambiguous response or a failure after charging, sending, or creating?
- Is reconciliation and automatic recovery available?
- Are precision, currency, references, and traceability preserved?

### Frontend

- Does shared state, routing, permissions, or flags change?
- Are loading, error, empty, and historical-data states handled?
- Do analytics, attribution, or backend contracts change?

### Observability and Operations

- Do logs distinguish caller, flag, branch, state, attempt, and error?
- Are metrics or signals sufficient to detect impact and decide on rollback?
- Can rollback execute without data loss or incompatible versions?

## Output Format

Always start with this block and no preamble. The template is intentionally in Spanish because the
review output must be in Spanish:

```md
Revisado contra `<base>` y el diff del PR. [Si aplica: también contra issue/logs/producción/tests].

Veredicto: **pedir cambios / aprobar condicionado / aprobar / no aprobar hasta verificar X**.

Motivo: <una o dos frases directas>.
```

Continue with this structure and omit empty sections:

```md
## Lo verificado

- <hecho verificado y evidencia breve>

## Bloqueos

### 🔴 F-1 — <título concreto>

`archivo:línea` o `<flujo>`

Qué cambió:
<antes vs. ahora>

Impacto:
<impacto real, condición activadora y afectados>

Evidencia:
<código, contrato, test, log, métrica o query>

Recomendación:
<cambio específico>

## Decisiones abiertas

### 🟡 F-2 — <título concreto>

<hechos, opción que debe decidirse y por qué no es un bug técnico>

## No bloqueante

### ⚪ F-3 — <título concreto>

<riesgo acotado o mejora>

## Puntos descartados

### ✅ F-4 — <título concreto>

<hipótesis original y evidencia que demuestra por qué ya no aplica>

## Pruebas

- Ejecutadas: <comandos y resultado>
- Inspeccionadas: <cobertura relevante>
- Faltantes: <casos concretos>

## Consultas operativas

- Autorización: <quién autorizó y alcance, sin secretos>
- Destino: <entorno/recurso e identidad no sensible verificados>
- Operación: <query o comando sanitizado, rango y límites>
- Resultado: <hecho agregado, duración/volumen y limitaciones>

## Pendiente de cerrar

- No pude verificar <dato o condición>.
- Para cerrarlo: <consulta, prueba o evidencia exacta>.

## Decisión

**<pedir cambios / aprobar condicionado / aprobar / no aprobar hasta verificar X>**

<condición exacta o siguiente acción, solo si aplica>
```

## Final Rules

- Do not write as if the recipient were the PR author.
- Do not explain obvious facts or repeat the diff without analysis.
- Do not use long paragraphs when one sentence is enough.
- Do not say `posiblemente` when verification is available.
- Do not turn preferences into blockers.
- Do not block on risks that do not materialize in the real flow.
- Do not propose broad refactors when a concrete change removes the risk.
- Do not hide access, environment, or time limitations.
- Update the verdict when new evidence changes a conclusion.
