# Risk Checklist

How to use: apply the sections mapped to the lenses activated by the Phase 2 inventory (see
`references/multi-agent-review.md` §3). Binding rule from `SKILL.md` §7: every
activated lens must leave at least one trace in the report — a Verified bullet, a
finding, or a Still Open item. Silence from an activated lens is a coverage gap, not a
pass. A question applies when the diff changes what it asks about. For each question
below, the parenthetical names the evidence that closes it (code citation, contract,
executed test, read config/flag, query). A severity marker inside a parenthetical is the
proposed category for the candidate; the final category always comes from `SKILL.md`
Phase 7.

## Architecture and Flow

- Did the durable order of operations or transaction boundary change? (before/after code citations at base and head)
- Is state persisted before or after an external effect, and is that order crash-safe? (traced flow + failure-path analysis)
- Is rollback real, and are intermediate states enumerated and recoverable? (rollback path citation or Still Open)
- Does the new flow preserve compatibility with in-flight and previous behavior? (base-vs-head comparison + old-client/worker check; rate any mixed-version effect with the `SKILL.md` Phase 7 severity rubric — which caller hits it in the window, how long, reversible or not)

## APIs and Contracts

- Did the request, response, status code, headers, pagination, nullability, defaults, or auth change? (OpenAPI/schema diff + code citation)
- Who are the real consumers (named, with call sites), and do they remain compatible? (caller search, not folder inference)
- Do OpenAPI, contractual documentation, and tests reflect the change? (doc/test citations; a doc that contradicts the code is a ⚪ candidate, a published contract that contradicts it is a 🔴 candidate)
- Are there consumers outside this repository (other services, published SDKs, mobile clients, partners)? (consumer registry, docs, or contract tests; when the contract changes and those consumers cannot be searched, a Still Open item owned by `operations` or `architecture` that names how to enumerate them)

## Auth and Permissions

- Was access opened or closed on any route, handler, job, or object? (guard diff before/after)
- Who calls this today, and can every real caller pass the new guard? (caller list + permission matrix)
- Is a compatible transition required (dual-write, grace period, migration of grants)? (decision with named decider if ambiguous)

## Security and Secrets

- Does the diff introduce secrets, tokens, keys, or credentials into code, tests, fixtures, logs, or error payloads? (secret scan of diff + log/error output check; any hit is a 🔴 candidate)
- Does it add an injection surface (SQL, shell, template, HTML/JS, URL/SSRF, deserialization) without parameterized handling and tests? (taint path input→sink + executed negative test)
- Do validation, encoding, and authorization happen server-side at the trust boundary, not only in the client? (boundary citation)

## Feature Flags

- Does the flag exist in code and in the relevant environment, with its default read from code? (`flag: <name> = <default> @ <env>` with file:line)
- What is its real value in each environment, and what happens when it is absent or misspelled? (executed config read; a `[prerequisite]` only when the value lives in an environment the repository does not pin and the wrong value would be 🔴)
- Which branch receives real traffic today, and is the OFF branch actually safe (old code path still exercised)? (traffic/flag evidence + OFF-branch trace)
- Does a high-risk flow (auth, payments, data writes, external effects) change without a flag or kill switch while its rollback is costly or irreversible? (flow trace + rollback analysis; a ⚪ candidate naming the missing kill switch, or a 🟡 candidate with decider `architecture` when the exposure is irreversible)

## Database and Migrations

- Does the migration provide value against real data shape and volume, not just empty-schema tests? (shape/volume evidence or Still Open)
- Is it idempotent and re-runnable; does it lock, block writes, touch many rows, or rebuild indexes? (migration code + engine lock semantics + plan review)
- Does it preserve evidence and temporal semantics, including `ON UPDATE`, audit rows, and soft-delete meaning? (schema before/after)
- Does it require batching, a backfill, a maintenance window, or separation from the code deploy (expand-then-contract)? (deployment-order statement; ordering problems use the fixed phrase from `SKILL.md` §3)
- Is the code compatible before, during, and after the migration (old code×new schema, new code×old schema)? (compat matrix; an incompatibility a deploy order avoids is a 🚀 candidate, one no order avoids is a 🔴 candidate)

## Jobs, Queues, and Events

- Is the new message compatible with old producers and consumers (unknown-field tolerance, versioning)? (schema diff + consumer list)
- Are retries and duplicates safe and idempotent end to end, with a stable idempotency key? (key citation + duplicate test or Still Open)
- What happens to in-flight messages during deploy, poison messages, and the DLQ (visibility, alerting, replay)? (queue/consumer config + alert citation)

## External Integrations and Payments

- Is there a stable idempotency key spanning retries, webhooks, and reconciliation? (key citation across all three paths)
- What happens after an ambiguous response (timeout, 5xx, webhook lost) or a failure after charging, sending, or creating? (ambiguous-path trace; an unhandled ambiguous path on a write with external effect is a 🔴 candidate)
- Is reconciliation and automatic recovery available and monitored (not manual-only)? (reconciler citation + metric/alert)
- Are precision, currency, timezone, references, and traceability (correlation IDs) preserved across the boundary? (type/format citations + executed edge test)

## Frontend

- Do shared state, routing, permissions, or flags change for any real user segment? (route/guard diff + affected segments)
- Are loading, error, empty, and historical-data (pre-change shape) states handled? (state-by-state citations; an unhandled state is a candidate classified by impact)
- Do analytics, attribution, deep links, or backend contracts change for existing clients? (contract + analytics diff)

## Performance and Cost

- Does the change add N+1 access, unbounded pagination, full scans, or hot-path fan-out? (query/loop citation + plan or executed measurement)
- Are new indexes, caches, or queries bounded (limits, keysets, TTLs) and invalidated correctly? (index/cache citations + invalidation path)
- Does it materially change infra or observability cost (log volume, metric cardinality, query scan)? (volume estimate or ⚪ with bound)

## Privacy and Data Protection

- Does personal, financial, or health data appear in logs, errors, URLs, analytics, or exports? (output-field audit; a hit is a 🔴 candidate unless a repository policy or config explicitly allows that field there, then a 🟡 candidate with decider `product`)
- Are retention, redaction, and access-scope rules for that data preserved? (policy/config citation)
- Do cross-border, third-party, or subprocessors change? (integration list; a new or changed recipient is a 🟡 candidate with decider `product`)

## Environment and Configuration

- Does the code read a new or renamed environment variable or config key? (changed-line citation of the read, e.g. `process.env.X`, `os.getenv`)
- Is it defined in every environment the repository pins — `.env.example`, Helm values, Kubernetes manifests, task definitions, `tfvars`, workflow `env:` blocks? (file citations per environment; name the variable, never print its value)
- What happens when it is absent or empty: a safe default, a crash at startup, or a silent wrong behavior? (code citation of the default or the failure path)
- A required variable with no default that is undefined in every environment definition the repository pins is a 🔴 candidate: the deploy as configured breaks. It is a `[prerequisite]` owned by `operations`, with an outcome map, only when runtime configuration lives outside the repository (a secrets manager, a platform console) or the repository pins no environment definition. With a safe default it is a ⚪ candidate.

## Containers

- Did the base image or its tag change (`latest`, a floating tag, a major version)? (Dockerfile diff)
- Does the image still run as a non-root user? (`USER` directive before and after)
- Do exposed ports, health checks, `ENTRYPOINT`, and `CMD` still match the service configuration that runs the container? (Dockerfile + compose/Helm/task definition citations)
- Can files copied into the image carry secrets or local state (`.env`, keys, build caches)? (`COPY` lines + `.dockerignore`; a secret in the image is a 🔴 candidate)
- Do build stages still keep build-only tools out of the runtime image? (multi-stage citation)

## CI/CD Pipelines

- Was a step removed or weakened — tests, lint, scans, required approvals, `continue-on-error`? (workflow diff; a removed gate on a protected branch is a 🔴 candidate)
- Did triggers or branch filters change, and does a fork-triggered event (`pull_request_target`, `workflow_run`) now reach secrets or a write token? (trigger + `permissions:` + secrets usage; that combination is a 🔴 candidate)
- Did token permissions widen? (`permissions:` block before and after)
- Are third-party actions or images pinned to an immutable reference (commit SHA or digest)? (`uses:` lines; an unpinned new action is a ⚪ candidate)
- Did the order between migrate, build, and deploy steps change? (job dependency citations; ordering problems use the fixed phrase from `SKILL.md` §3)

## Infrastructure as Code

- Does the change destroy or replace a resource — a renamed resource, a changed attribute that forces replacement, a removed block? (plan output when readable; otherwise the resource diff and the provider's replacement rule)
- Is a stateful resource (database, bucket, volume, queue) affected without deletion protection or a backup? (`prevent_destroy`, `deletion_protection`, snapshot settings; replacing stateful data is a 🔴 or 🚀 candidate per `SKILL.md` Phase 7 rule 4)
- Do access policies, security groups, or network rules widen (`*` actions or principals, `0.0.0.0/0`)? (policy diff)
- Did the state backend, workspace, or provider versions change? (backend/provider blocks + lockfile)
- Without a readable plan output, the plan is always a Still Open item naming the exact command that closes it (e.g. `terraform plan -out=… && terraform show -json …` for the named workspace) — not only a Tests line or a close-out — and the impact rests on the resource diff and the provider's documented replacement rules, never on a guess.
- Never run `terraform` or `tofu` `init`, `plan`, or `apply` in a probe: they download providers or need credentials (`SKILL.md` §10). Read the plan only when the caller supplies its output.

## Cloud Permissions

- Which roles, policies, or scopes are new or wider? (policy/role diff with the exact actions and resources)
- Is each new permission the least needed by a cited call site? (code citation of the API call that needs it; an unused broad grant is a ⚪ candidate, a grant that exposes data or write access beyond the need is a 🔴 candidate)
- Who or what assumes the role or uses the scope? (trust policy, service account binding, or workload identity citation)

## Observability and Operations

- Do logs distinguish caller, flag/branch, state, attempt, and error with actionable codes? (log-line citations)
- Are metrics/signals sufficient to detect impact and decide rollback (SLO, error rate, lag, duplicate rate)? (metric/alert citations or ⚪ with bound)
- Can on-call diagnose from the emitted context alone, without querying PII or raw payloads? (sample redacted event)

## Deployment and Rollback

- What is the required deploy order (migration vs code, workers vs web, flags vs code), and what breaks if it is violated? (ordered steps + violation impact)
- Can rollback execute without data loss or version incompatibility (forward-incompatible schema, old workers vs new messages)? (rollback rehearsal reasoning; a safe rollback order is a 🚀 candidate, none is a 🔴 candidate)
- Are feature flags, config, and IaC changes applied and reverted through the same path as code? (release pipeline citation)

## Dependencies

- Which direct dependencies were added, removed, or changed version, and which changes cross a major version? (manifest diff citations; resolved versions from the lockfile diff)
- Do manifest and lockfile agree (no manifest change without a lockfile update and vice versa, when the project uses a lockfile)? (both files at head)
- Do new or changed packages add install/postinstall scripts, native binaries, or a new registry or source? (lockfile entries)
- For each major-version change, are the breaking changes that affect APIs used in this repository handled? (call-site citations + changelog when readable; an unreadable changelog is a Still Open item)
- Do runtime or engine constraints (language/runtime versions) still match the deploy environment? (engines/runtime config citations)
