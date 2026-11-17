# Safe Operational Data Protocol

Apply this protocol before querying a database, log system, or any external system. A review does
not grant production access by itself. No human available to authorize (the session cannot
receive a reply, or the user said they will not answer) means no access: do not proceed, record
`I could not verify X`, and route the candidate by `SKILL.md` Phase 7 rule 6.

## 1. Reduce the Need for Access

1. State the hypothesis and the exact data that would confirm or refute it.
2. Try to close it first with code, tests, fixtures, configuration, contracts, and local environments.
3. Query an external system only when the answer can change a finding or the verdict.
4. Do not explore production without a concrete question.

## 2. Open an Authorization Gate

Before accessing shared staging, production, a cloud account, or sensitive data, present the request using
[assets/authorization-request.md](../assets/authorization-request.md). Fill every field; do not omit
one because it seems obvious.

Request explicit authorization and wait for the response. Authorization already written in the
user's request counts only for the resources, environments, and operations it names explicitly;
still fill the block and record it in the report. Authorization for one resource,
environment, query, or time range does not extend to another. Request new authorization before
elevating privileges, changing roles, or expanding scope.

## 3. Verify Identity and Destination

1. Use already configured and approved credentials. Do not request, print, copy, or persist secrets.
2. Confirm the effective identity, account/project, region, endpoint, and resource in the same session.
3. Compare those values with the authorization. Stop on any mismatch.
4. Use the least-privileged available role. Having write permissions does not make an operation
   safe; continue enforcing this protocol's prohibitions.

## 4. Record Evidence Without Leaking Data

Record the source, environment, non-sensitive identity, time range, sanitized query, limits,
aggregate result, and limitations in the review. Do not include tokens, connection strings, complete
payloads, PII, or financial data. Redact identifiers when their literal value is not necessary to
support the evidence.

## Database

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
unapproved operational impact. Record `I could not verify X`.

## CloudWatch Logs Insights

Applies only when AWS CloudWatch logs are in scope. For other log systems (GCP, Azure,
Datadog, Grafana, self-hosted), apply the same principles with the native read-only
tooling: explicit log sources, bounded UTC window, concrete IDs, minimal fields,
recorded volume.

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
