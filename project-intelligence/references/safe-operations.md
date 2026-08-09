# Safe Operations — Real Databases & Real Infrastructure

> Loaded by `project-intelligence` in OPERATE mode, **before** any command that reads from or writes
> to a real database, cloud resource, or external service. Not optional, not summarizable.

The failure this file prevents is specific and common: an agent that understands the code perfectly
runs a "harmless test insert" against what turns out to be production, and emails four thousand real
customers. Knowing the system is exactly what makes an agent dangerous enough to need this gate.

## 1. What counts as a real operation

Anything that leaves the repository and touches live state:

```text
SQL against any non-local database          ORM/console writes (rails c, django shell, prisma studio)
Migrations, rollbacks, seeds                Redis/Mongo/DynamoDB commands
aws / gcloud / az CLI mutations             terraform apply · cdk deploy · serverless deploy
kubectl apply/delete/scale/exec             Publishing to a queue, topic, or event bus
Calling an external API with real creds     Triggering a job, workflow, or pipeline
Deleting or overwriting an object in storage  Rotating or writing a secret
```

Reading source code, reading committed configuration, and running the local test suite are not real
operations. Everything above is.

## 2. Identify the target — a name is not evidence

**Rule: never conclude the environment from a name.** `dev-db`, `test-cluster`, `sandbox-2`, and
`staging` are strings someone typed. Production data lives behind all four somewhere in the world.

Resolve the target by following the configuration chain to its source:

```text
Which command/tool?  →  Which config or profile does it load?  →  Which variable holds the target?
                     →  Where does that variable's value come from, in this shell, right now?
```

| Signal                                                                    | Reading                                     |
| --------------------------------------------------------------------------- | ------------------------------------------- |
| Host is `localhost`/`127.0.0.1`/a compose service name, port from compose  | `local` — strong                            |
| Endpoint override to LocalStack (`:4566`) or a mock                        | `local` — strong                            |
| Value comes from `.env.test`, and the DB name ends in `_test`              | `test` — likely, verify it is not shared    |
| Value comes from a real cloud secret store or a task definition            | Deployed environment — **at least** staging |
| Host is `*.rds.amazonaws.com`, `*.cluster-*`, a managed provider hostname  | Deployed environment                        |
| `AWS_PROFILE` / `kubectl` context / `terraform workspace` names an env     | That environment — verify, do not trust     |
| Live credentials present (`sk_live_`, prod OIDC role, prod account id)     | **Production**                              |
| Any part of the chain cannot be resolved                                   | **UNKNOWN → treat as production**           |

Cheap disambiguating checks, in order of preference, run **before** the operation:

```bash
aws sts get-caller-identity            # which account and role am I actually acting as?
kubectl config current-context         # which cluster?
terraform workspace show               # which workspace?
echo "$AWS_PROFILE" "$NODE_ENV" "$APP_ENV" "$STAGE"
```

For a database, prefer a read that identifies it without exposing data — current database name, row
counts of a couple of tables, the newest `created_at`. A "development" database holding two million
rows and yesterday's real customer records is production wearing a costume; say so before proceeding.

**Never print, echo, or paste a resolved secret or full connection string to establish the
environment.** Establish it from the *source* of the value, not from the value.

## 3. Risk tiers

| Target                          | Read                | Scoped write (1–N known rows) | Bulk / destructive / DDL          |
| ------------------------------- | ------------------- | ------------------------------ | ---------------------------------- |
| `local`                         | free                | proceed                        | proceed, state what it does        |
| `test`                          | free                | proceed                        | proceed if the suite owns the data |
| `development`                   | preamble            | preamble                       | ask first                          |
| `staging`                       | preamble            | preamble + confirm             | explicit authorization             |
| `production`                    | preamble + minimal  | explicit authorization         | explicit authorization, per operation |
| `UNKNOWN`                       | treat as production | treat as production            | treat as production                |

**Explicit authorization** means the user was shown the exact operation and said yes to it. It never
transfers: authorization to update one row is not authorization to update the next one, and approval
for one environment is not approval for another. When authorization is required, ask once, with the
full preamble, and wait.

## 4. The preamble — state it before executing

```text
Environment:      production                 [CONFIRMED — aws sts shows account 1234…, role prod-deploy]
Target:           RDS PostgreSQL `app_prod` via $DATABASE_URL (value not read)
Operation:        UPDATE orders SET status='shipped' WHERE id IN (…3 ids…)
Scope:            3 rows — verified by SELECT, ids listed above
Side effects:     OrderShipped event → SQS → notification worker → real customer emails
Reversible:       partially — the rows can be restored; the emails cannot be recalled
Rollback:         previous values captured above; transaction available
Risk:             HIGH — irreversible outbound side effect
Authorization:    REQUIRED — not yet granted
```

Every line is mandatory. A line you cannot fill is `UNKNOWN`, and an `UNKNOWN` on `Environment`,
`Scope`, or `Side effects` blocks the operation until it is resolved.

## 5. Side effects the database does not show

This is the check only this skill can make well, because it already knows the flows. Before any
write, ask what else fires:

```text
Database triggers · CDC / logical replication / outbox tables · ORM lifecycle hooks ·
Domain events and their listeners · Queue and stream consumers · Webhooks to third parties ·
Transactional email (SES, SendGrid) · Payment or billing calls · Push notifications ·
Search index updates · Cache invalidation · Audit logs · Analytics events ·
Scheduled jobs that pick up rows by state
```

```bash
rg -n '@AfterInsert|@BeforeUpdate|post_save|after_create|\.on\(.(created|updated)' -g '!node_modules'
rg -n 'CREATE TRIGGER' -g '*.sql'
rg -n 'eventBus\.publish|emit\(|dispatch\(|sendMessage|publish\(' -g '!node_modules' -l
```

If a write fires an outbound message to a real recipient, say so in the preamble and treat the
operation as irreversible regardless of the transaction — a rolled-back row does not unsend an email
or refund a charge. If a mail catcher, sandbox mode, or suppression list is configured for that
environment, verify it rather than assuming it.

## 6. Reads are not automatically free

- **Personal data.** A `SELECT *` over a users table copies real PII into the transcript, where it
  persists. Select the columns you need, add `LIMIT`, and mask identifiers when they are incidental
  to the question.
- **Cost and load.** A full scan or an unindexed join on a large production table is an outage risk.
  Prefer `EXPLAIN` first, filter on an indexed column, always `LIMIT`, and prefer a replica when one
  exists.
- **Locking.** Avoid `SELECT … FOR UPDATE` and long transactions on shared databases.
- **Secrets.** Never read a secret's value to "check" it. Verify the reference, not the content.

## 7. The safety ladder — always take the highest rung that works

1. **Do it in `local` or `test` instead.** Most requests to touch a shared environment turn out not
   to require one. Offer this first.
2. **Application-level seed, factory, or fixture.** It respects validation, defaults, required
   relations, and the same code path the real flow uses — so it also proves more.
3. **Use the actual flow** (the API endpoint, the CLI command) rather than writing rows underneath
   it. A row inserted behind the application can violate invariants the application relies on.
4. **A transaction with a verified rollback** — for inspection and for "what would this do?".
5. **Clearly identifiable test data**: a marked prefix or a known ULID, recorded so it can be found
   and removed. Never anonymous rows you cannot later distinguish from real ones.
6. **Raw SQL, scoped by primary key**, with the affected rows selected and captured first.

Never: disable foreign keys, triggers, constraints, or `safe-updates`; run an `UPDATE`/`DELETE`
without a `WHERE`; use `TRUNCATE`, `DROP`, or `--force` on shared state; edit rows to "fix" data
whose real cause is a bug you have not diagnosed.

## 8. Transaction pattern

```sql
BEGIN;
SELECT id, status FROM orders WHERE id = '01J...';   -- capture the before state, state it
UPDATE orders SET status = 'shipped' WHERE id = '01J...';
SELECT id, status FROM orders WHERE id = '01J...';   -- verify exactly what changed
-- ROLLBACK;  -- default while verifying
-- COMMIT;    -- only after the user confirms the diff is what they wanted
```

Confirm first that the client is not in autocommit and that the engine supports transactional DDL
before relying on a rollback for a schema change — MySQL does not, and a "rollback" that silently did
nothing is worse than no rollback at all.

## 9. Cloud and infrastructure operations

- **Always plan before apply**: `terraform plan`, `cdk diff`, `kubectl diff`, `--dry-run=client`.
  Read the plan and report **creates / changes / destroys** with counts. Any `destroy` on a stateful
  resource (database, bucket, volume, secret) requires explicit authorization naming that resource.
- **Never** apply with an unresolved diff, a locked state file you force-unlocked, or a workspace you
  did not verify.
- Treat as production-grade regardless of environment: deleting or emptying a bucket, deleting a
  queue with in-flight messages, rotating a secret other services read, scaling to zero, changing a
  security group or IAM policy, deleting a snapshot, modifying DNS.
- Prefer a snapshot or backup before a stateful change, and verify the backup exists rather than
  assuming the schedule ran.

## 10. After the operation

1. **Verify the actual result** — re-read the affected rows or resource state; do not trust the exit
   code.
2. **Clean up test data you created**, in the same session, and confirm the deletion.
3. **Report** what ran, against what, what changed, and what could not be undone.
4. **Record it** only if it produced durable knowledge — a constraint discovered, a side effect
   nobody expected, a seed that works. Not the command itself (§ memory economy).
5. If something went wrong: say so immediately and plainly, state the current state, state the blast
   radius, and propose the recovery. Never quietly retry a destructive operation.

## 11. Operation checklist

- [ ] Environment resolved from the configuration chain, not from a name.
- [ ] `UNKNOWN` environment treated as production.
- [ ] Preamble stated, with every line filled or explicitly `UNKNOWN`.
- [ ] Scope verified by a `SELECT` (or `plan`/`diff`) before the write.
- [ ] Non-database side effects enumerated, including outbound messages to real recipients.
- [ ] The highest safe rung on the ladder was taken, not the most convenient one.
- [ ] Reversibility stated honestly, including what a rollback cannot undo.
- [ ] Explicit authorization obtained where the tier requires it, for this exact operation.
- [ ] No constraint, trigger, or safety setting disabled.
- [ ] No secret value read, printed, or stored.
- [ ] Result verified, test data removed, outcome reported.
