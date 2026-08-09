# Discovery Protocol

> Loaded by `project-intelligence` during BOOTSTRAP and any deepening pass. It defines **what to
> read, in what order, what each artifact actually tells you, and when to stop.**

The goal of discovery is not to see every file. It is to build the smallest true model that answers
the questions this project will actually be asked. Reading everything is how a discovery pass burns
its whole context before producing a single answer.

## 0. Order of reading

Cheap and structural first; expensive and specific last. Each level can answer questions on its own —
stop at the level that answers yours.

```text
L0  Shape        repo layout · git history · README · manifests · lockfiles
L1  Runtime      language · runtime version · framework · entry points · run/test commands
L2  Config       .env.example · framework config · environments · secrets sources
L3  Infra        Docker · compose · IaC · K8s · CI/CD · deploy scripts
L4  Data         ORM · schema · migrations · seeds · connections
L5  Structure    module layout · dependency direction · layers · boundaries
L6  Flows        one traced path per business flow, entry → persistence → side effects
```

**Stop rule.** Stop when every remaining unknown, resolved either way, would not change (a) the
answer you owe, (b) a document you would write, or (c) a risk you would flag. Certainty beyond that
point is procrastination — record it as `UNKNOWN` in `investigation-log.md` and move on.

## 1. L0 — Shape

```bash
git log --oneline -20                     # what is alive, and who moves it
git log --format='%ad' --date=short -1    # is this project still maintained?
ls -A                                     # the real top level, dotfiles included
```

Read the root listing as a claim about the project and verify it. A root with `apps/` + `packages/` +
a workspace field is a monorepo, and everything below must then be answered **per package**, not once.

| Artifact                                     | What it actually tells you                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `README.md`, `docs/`, `CONTRIBUTING.md`      | Intended design and commands. **Treat as a claim, not as truth** — verify each one.  |
| `package.json`                               | Runtime, framework, scripts (the real entry commands), workspaces, engines           |
| `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` | Which package manager is actually used — the lockfile decides, not the docs |
| `requirements.txt` / `pyproject.toml` / `poetry.lock` | Python stack, tooling, and whether dependencies are pinned                  |
| `go.mod` / `Cargo.toml` / `pom.xml` / `build.gradle` | Module name, language version, framework, dependency set                     |
| `.nvmrc` / `.python-version` / `.tool-versions` | The runtime version the team actually uses                                       |
| `.gitignore`                                 | What exists locally but is not committed — usually `.env`, build output, credentials |
| `CODEOWNERS`                                 | Real module ownership boundaries, often more honest than the folder structure        |

Distinguish **core dependencies** (framework, ORM, HTTP client, auth, queue, cloud SDK) from
**auxiliary** ones (lint, formatters, types, small utilities). Only core ones belong in
`project-overview.md`.

## 2. L1 — Runtime, framework, entry points

The framework is decided by the dependency plus its config file, never by the folder layout:

| Signal                                            | Conclusion                     |
| -------------------------------------------------- | ------------------------------ |
| `@nestjs/core` + `nest-cli.json`                  | NestJS                         |
| `next` + `next.config.*`                          | Next.js (check App vs Pages)   |
| `express` / `fastify` / `koa` as a direct dep     | A hand-rolled HTTP layer       |
| `django` + `manage.py` / `fastapi` / `flask`      | The Python web framework       |
| `spring-boot-starter-*`                           | Spring Boot                    |
| `serverless.yml` / `template.yaml` / `cdk.json`   | Serverless — handlers, not a long-running server |
| `laravel/framework` + `artisan`                   | Laravel                        |

**Find the real entry points** — where execution begins, not where you would expect it to:

```bash
rg -l 'listen\(|createServer|app\.run|uvicorn|gunicorn|SpringApplication' --hidden
rg -l 'exports\.handler|def handler|lambda_handler'          # serverless handlers
rg -n '"(start|dev|build|test|migrate|seed)":' package.json  # the commands that actually exist
```

Enumerate every kind of entry point, not only HTTP: **HTTP/GraphQL routes · CLI commands · queue and
stream consumers · cron and scheduled jobs · Lambda handlers · webhook receivers · websocket
handlers · event listeners**. A project understood only through its HTTP surface is a project half
understood, and the missing half is usually where the surprising behavior lives.

## 3. L2 — Configuration

```bash
ls -a | rg '^\.env'
rg -n --no-heading -o '\b[A-Z][A-Z0-9_]{2,}\b' .env.example | sort -u   # declared names
rg -n 'process\.env\.|os\.environ|getenv|ENV\[|Deno\.env|System\.getenv' -g '!node_modules'
```

Cross-reference both directions — each mismatch is a real finding:

- Declared in `.env.example` but never read in code → dead configuration, or a stale example file.
- Read in code but absent from `.env.example` → an undocumented variable, the classic cause of a
  broken new-developer setup and a broken deploy.

Then find where values come from in each environment: `.env` files, CI/CD secrets, AWS Secrets
Manager, SSM Parameter Store, Kubernetes Secrets/ConfigMaps, Vault, Doppler, task-definition
environment blocks. Details in `references/data-and-config.md`. **Names and sources only — never
values.**

## 4. L3 — Infrastructure

```bash
fd -H -t f 'Dockerfile|docker-compose.ya?ml|Makefile|Procfile'
fd -H -e tf -e tfvars ; fd -H 'cdk.json|serverless.ya?ml|template.ya?ml|Pulumi.ya?ml'
fd -H -t d '.github/workflows|.gitlab-ci*|k8s|kubernetes|charts|helm|deploy|scripts'
```

| Artifact                     | Read it for                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `Dockerfile`                 | Base image, runtime version, build steps, the actual start command, exposed ports |
| `docker-compose.y*ml`        | The **local environment's** real dependencies: DBs, caches, brokers, LocalStack   |
| Terraform / CDK / CFN / SAM  | The declared cloud reality: services, names, wiring, IAM, regions, per-environment stacks |
| K8s manifests / Helm         | Deployments, services, ingress, config/secret mounts, replicas, resource limits    |
| CI/CD workflows              | The truth about environments: which branch deploys where, with which secrets, gated how |
| `Makefile` / `Procfile` / `scripts/` | The commands humans on this team actually run                             |

CI/CD is the highest-yield artifact for questions about environments and deployment, because it is
executable and therefore cannot be as stale as a README. Read the job names, the branch/tag triggers,
the environment names, and the deploy step. Full inventory rules in
`references/infrastructure-inventory.md`.

## 5. L4 — Data

```bash
fd -H 'schema.prisma|schema.rb|models.py|entities?|*.entity.*|knexfile*|ormconfig*|alembic.ini'
fd -H -t d 'migrations|migrate|seeds|seeders|fixtures'
rg -n 'createPool|createConnection|new Pool|DATABASE_URL|MONGO_URI|REDIS_URL|DynamoDB'
```

The schema is the most reliable document in most projects: it is executable, it is versioned, and it
cannot drift from itself. Read it before believing any prose about the data model. Then read the
**latest migrations** — they show where the model is heading, and often contradict older docs.
Details in `references/data-and-config.md`.

## 6. L5 — Structure and dependency direction

Do not infer architecture from folder names (`SKILL.md`, Rule 3). Derive it:

```bash
rg -n "^import .*(infrastructure|prisma|axios|aws-sdk)" src/domain src/core 2>/dev/null
rg -n "from ['\"].*(repository|prisma|client)" src/**/controllers 2>/dev/null
```

Pick 3–5 representative files per apparent layer, read their imports, and answer:

- Which direction do dependencies actually point?
- Does the domain know about the database, HTTP, or a cloud SDK? (If yes, it is not hexagonal or
  clean, whatever the folders are named.)
- Do controllers reach the database directly, bypassing the service layer?
- Are there interfaces between layers, and are they injected or imported concretely?
- Is the pattern consistent across modules, or only in the newest one?

The honest answer is often **"layered in the newer modules, direct access in the older ones"**.
Record that, with examples on both sides. Consistency claimed but not held is the finding.

## 7. L6 — Flows

Trace a flow only when it is needed — for a question, an impact analysis, or a change. Trace it end
to end, following the call chain rather than guessing it:

```text
trigger → entry point → validation → application logic → domain → persistence
        → events emitted → consumers → external calls → response
        → side effects (email, queue, webhook, cache invalidation, audit)
```

Record what tests cover it, what errors it defines, and what it does on partial failure. Write it to
`flows/<name>.md` using `templates/flow.md`.

## 8. Monorepos

Answer per package, and say which package each answer belongs to. Establish first:

```bash
rg -n '"workspaces"|packages:' package.json pnpm-workspace.yaml lerna.json turbo.json nx.json 2>/dev/null
```

Then: which packages are deployable applications vs. shared libraries · which share a database ·
which depend on which internally · whether they deploy together or independently · whether each has
its own environment configuration. A monorepo answered as if it were one application is wrong in a
way that is hard to notice and expensive to correct.

## 9. Git history as evidence

History answers questions no file can: what changed recently, what churns, what is dead.

```bash
git log --since='3 months ago' --name-only --format= | sort | uniq -c | sort -rn | head -20
git log -1 --format=%cI -- <path>            # staleness check for a stored claim
git log -S '<symbol>' --oneline              # when a symbol appeared or disappeared
git log --oneline -- <path>                  # why this file looks the way it does
```

A commit message is `INFERRED` evidence about intent, never `CONFIRMED` evidence about behavior.

## 10. Cross-checks worth running once

Each of these routinely finds a real problem, and each result belongs in `investigation-log.md`:

- Declared env vars vs. env vars actually read (§3).
- Dependencies declared vs. imported — and imported vs. declared (a transitive import is a latent
  break).
- IaC-declared services vs. services referenced in code (drift in either direction).
- Migrations present vs. entities/models defined.
- Documented commands vs. the scripts that exist.
- Environments named in CI/CD vs. environments named in IaC vs. `.env.*` files present.

## 11. Coverage statement

Every bootstrap ends by stating its own edges, because a model that hides its blind spots is more
dangerous than one that admits them:

```md
Coverage
Inspected:      root manifests · docker-compose · infra/*.tf · .github/workflows · prisma/schema.prisma
                · src/modules/{auth,orders} · .env.example
Not inspected:  src/modules/reporting · legacy/ · the mobile client
Blind spots:    no access to the AWS console; production values are UNKNOWN
```
