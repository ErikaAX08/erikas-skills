# Data, Configuration & Environments

> Loaded by `project-intelligence` when mapping databases, schemas, environment variables, and
> environments. Produces `database.md` and `environments.md`.

Three questions this file exists to answer with evidence: **where does the data live and who touches
it · what configuration does this system need and where does each value come from · which
environments exist and how do you tell them apart.**

---

# Part 1 — Databases → `database.md`

## 1.1 Identify the engines

Never assume one database. A single service commonly has a relational store, a cache, a queue-backed
store, and an object store, and calling all of them "the database" hides real behavior.

| Signal                                                                | Engine                       |
| ----------------------------------------------------------------------- | ---------------------------- |
| `pg`, `psycopg`, `postgresql://`, `provider = "postgresql"`           | PostgreSQL                   |
| `mysql2`, `mysql://`, `mariadb`                                       | MySQL / MariaDB              |
| `mongodb://`, `mongoose`, `pymongo`                                   | MongoDB                      |
| `redis://`, `ioredis`, `redis-py`                                     | Redis (cache · sessions · queue backend — establish which) |
| `@aws-sdk/lib-dynamodb`, `boto3.resource('dynamodb')`                 | DynamoDB                     |
| `better-sqlite3`, `sqlite3`, `*.db` / `*.sqlite` files                | SQLite (often tests only)    |
| `@elastic/elasticsearch`, `opensearch`                                | Elasticsearch / OpenSearch   |
| `clickhouse`, `bigquery`, `snowflake`                                 | Analytics store              |

For each engine record: **why it exists** (source of truth · cache · search index · queue · analytics),
who owns the data in it, and whether it is authoritative or derived. A cache treated as a source of
truth is a bug waiting to be found; a source of truth treated as a cache is worse.

## 1.2 Access layer

Determine how the application actually reaches the data, and note it exactly — the answer decides how
anything can be safely tested:

- **ORM / query builder**: Prisma · TypeORM · Sequelize · Drizzle · Knex · SQLAlchemy · Django ORM ·
  ActiveRecord · GORM · Hibernate · Eloquent.
- **Raw SQL**, and where it lives (raw SQL scattered through services is a fragility worth recording).
- **Connection management**: pool size, timeouts, where the client is instantiated, whether it is a
  singleton, how it behaves in Lambda (connection reuse across invocations, or exhausting the pool).
- **Read replicas**, sharding, or multi-tenancy — and how a tenant is selected.
- **Transactions**: are they used, at which layer, and does the application rely on them for
  correctness? This determines whether an operation can be rolled back (§ `safe-operations.md`).

```bash
rg -n 'new Pool|createConnection|PrismaClient|createClient|sessionmaker|DataSource\(' -g '!node_modules'
rg -n 'transaction|\$transaction|BEGIN|atomic\(' -g '!node_modules' -l
```

## 1.3 Schema, migrations, seeds

The schema file is executable and versioned, so it beats every prose description of the data model.
Read it first, then read the **most recent migrations** — they show where the model is going, and
frequently contradict older documentation.

Record: the migration tool and its command · whether migrations run automatically on deploy or
manually · where seeds live and what they assume · whether the seed is safe to re-run (idempotent) ·
whether there are destructive migrations in the history.

## 1.4 The logical data map — the part that is genuinely hard to rediscover

Per significant table or collection, record who touches it and how. Column-by-column documentation is
noise: the schema already has it and it will drift. **Ownership and relationships are the value.**

```md
## users

Source:      prisma/schema.prisma:24
Primary key: id (ULID)
Unique:      email
Relations:   users.id → orders.user_id (1:N, ON DELETE RESTRICT)
             users.id → sessions.user_id (1:N, ON DELETE CASCADE)
Soft delete: deleted_at — every read path must filter it (see architecture.md § conventions)

Written by:  CreateUserUseCase        src/modules/users/application/create-user.use-case.ts:31
             UpdateProfileService     src/modules/users/application/update-profile.service.ts:18
             Cognito post-confirm λ   infra/functions/post-confirmation.ts:44   ← writes outside the API
Read by:     AuthService · UserService · OrdersService · the nightly report job

Side effects on insert: UserCreated event → EmailListener → SES welcome email
Constraints that bite:  email is case-sensitively unique; org_id is required and has no default
```

The two lines that pay for the whole document are **"writes from outside the obvious path"** (a
Lambda, a job, a migration, another service) and **"side effects on insert"**. Both are invisible from
the schema, and both are exactly what breaks a "quick test insert".

Also record, when present: indexes that a query pattern depends on · check constraints · triggers ·
stored procedures and views · enums whose values are duplicated in application code · any table
written by more than one service.

---

# Part 2 — Environment variables → `environments.md`

## 2.1 Discover from every source

`.env.example` · `.env.*` (names only) · code reads · Docker and compose · CI/CD workflow env and
secrets · Terraform/CDK variables and outputs · Kubernetes ConfigMaps and Secrets · task definitions ·
start scripts · framework config files · a validation schema if one exists.

```bash
rg -n 'process\.env\.[A-Z0-9_]+' -o -g '!node_modules' | sort -u
rg -n "os\.environ(\.get)?\[?['\"][A-Z0-9_]+" -o | sort -u
rg -n 'z\.object\(|envalid|BaseSettings|joi\.object\(' -l     # a schema is the authoritative list
```

If the project validates its configuration at startup (zod, envalid, pydantic `BaseSettings`,
`@nestjs/config` with a schema), **that schema is the authoritative inventory** — it states what is
required, what has a default, and what type each value is. Use it and say so.

## 2.2 What to record — never a value

```md
DATABASE_URL
Purpose:      PostgreSQL connection string
Used in:      src/database/prisma.ts:8
Required:     yes — startup fails without it (config.schema.ts:14)
Environments: local · test · staging · production
Source:       local → .env  ·  staging/prod → AWS Secrets Manager, injected by the ECS task definition
              (infra/ecs.tf:88)
Value:        [SECRET — NOT STORED]
```

Then record the two mismatches, which are always findings:

- **Declared but unused** — dead config, or a stale example file.
- **Used but undeclared** — the classic cause of a broken new-dev setup and a broken deploy.

## 2.3 Grouping

Group variables by concern — database · auth · AWS · external services · feature flags · observability
· runtime tuning. A flat alphabetical list of forty names is technically complete and practically
unreadable.

---

# Part 3 — Environments → `environments.md`

## 3.1 How the environment is selected

Find the switch before describing the environments:

```bash
rg -n 'NODE_ENV|APP_ENV|ENVIRONMENT|STAGE|DJANGO_SETTINGS_MODULE|RAILS_ENV|SPRING_PROFILES_ACTIVE|--stage'
```

Also check: Terraform workspaces or per-environment `tfvars` · CDK stacks per environment ·
Serverless `--stage` · Kubernetes namespaces or overlays · per-environment compose files ·
branch-driven CI/CD deployment. Note when environments differ in *structure*, not only in values —
e.g. staging runs one container while production runs six.

## 3.2 Record per environment

```md
## Staging

Selected by:    APP_ENV=staging, set in the ECS task definition (infra/ecs.tf:64)
Runs on:        AWS ECS Fargate, service `api-staging`                    [CONFIRMED infra/ecs.tf:41]
Database:       RDS PostgreSQL `app-staging`                              [CONFIRMED infra/rds.tf:22]
Data:           anonymized copy of production, refreshed weekly           [INFERRED — scripts/refresh-staging.sh]
External svcs:  Stripe test mode · SES sandbox · real Cognito staging pool
Config source:  AWS Secrets Manager + SSM Parameter Store
Deployed by:    push to `develop` → .github/workflows/deploy.yml:12
Migrations:     run automatically in the deploy job, before the new task set goes live
Access:         requires VPN                                             [INFERRED — no public ingress in the SG]
Run tests:      npm run test:e2e -- --env=staging
Classification: NON-PRODUCTION, but shares the Cognito pool with production → treat writes as risky
```

The **Classification** line is what `safe-operations.md` consumes. Write it for every environment, and
write down the shared resources: an environment that shares a user pool, a bucket, a payment account,
or an email domain with production is only partly non-production.

## 3.3 Local development

Give the exact working sequence, verified against the repository rather than copied from the README:
prerequisites · how dependencies start (`docker compose up`) · how config is created
(`cp .env.example .env`) · migrations · seeds · how the app starts · the port · how to run tests · and
what local **cannot** do (real AWS, real payments, real email). Note where the README's instructions
disagree with the scripts that exist — that gap is a finding, and it is why the last new developer
lost a day.

## 3.4 Environment quality gate

- [ ] Every environment names how it is selected, and by what evidence.
- [ ] Every environment names its database and its configuration source.
- [ ] Environments sharing a resource with production are flagged.
- [ ] Every environment has a classification line.
- [ ] Commands to run and to test are stated per environment, and are the ones that exist.
- [ ] Environments named in CI/CD, in IaC, and in `.env.*` reconcile — or the discrepancy is recorded.
