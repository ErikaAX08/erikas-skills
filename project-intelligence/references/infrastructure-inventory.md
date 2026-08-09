# Infrastructure & Integrations Inventory

> Loaded by `project-intelligence` when mapping cloud services, containers, CI/CD, queues, storage,
> observability, and the external APIs the project consumes. Produces `infrastructure.md` and
> `integrations.md`.

An inventory is not a list of services. It is a map of **what exists, what it is for, who uses it,
how it authenticates, and what depends on it.** A name with no consumer and no purpose is noise.

## 1. Two sources, two different truths

| Source                                   | Proves                                              | Does not prove                          |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| **Code** (SDK clients, config, env vars) | The application *intends* to use this service        | That it exists, or is provisioned         |
| **IaC** (Terraform/CDK/CFN/SAM/K8s)      | The resource is *declared*                           | That it is deployed, or that anything uses it |

**Every mismatch is a finding worth recording:**

- Declared in IaC, referenced by no code → possibly orphaned, possibly used by another repository.
- Used in code, declared in no IaC → provisioned manually, or in a repository you cannot see. Mark
  the provisioning source `UNKNOWN` rather than assuming it is missing.

Only what both sources agree on is `CONFIRMED`. Everything else is `INFERRED`, with the gap stated.

## 2. What to record per cloud service

```md
## <Service> — <resource name or identifier>

Purpose:        what it does for this system, in one line
Declared in:    infra/....tf:LN  ·  or "not found in IaC — provisioned outside this repo"
Used by:        the components that call it, with paths
Triggers:       what invokes it (if it is compute)
Depends on:     other services it calls
Auth:           IAM role · task role · instance profile · static keys · OIDC federation · UNKNOWN
Env vars:       NAMES only
SDK/client:     the library and where the client is constructed
Region:         only if determinable — otherwise UNKNOWN
Environments:   which of local/dev/staging/prod have it
Confidence:     CONFIRMED | INFERRED  (+ evidence)
```

## 3. AWS detection signals

Search for both the SDK usage and the IaC resource type. The IaC column covers Terraform resource
names, CDK constructs, and CloudFormation types alike.

| Service               | Code signals                                                        | IaC signals                                       |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| **Lambda**            | `exports.handler`, `def lambda_handler`, `@aws-sdk/client-lambda`   | `aws_lambda_function`, `NodejsFunction`, `AWS::Serverless::Function`, `serverless.yml: functions:` |
| **API Gateway**       | route/handler mappings, `event.requestContext`                      | `aws_api_gateway_*`, `aws_apigatewayv2_*`, `RestApi`, `HttpApi`, `events: - http` |
| **ECS / Fargate**     | container start command, `ECS_CONTAINER_METADATA_URI`               | `aws_ecs_service`, `aws_ecs_task_definition`, `FargateService` |
| **EKS / Kubernetes**  | in-cluster config, service accounts                                 | `aws_eks_cluster`, `IRSA` annotations, manifests, Helm charts |
| **EC2**               | instance metadata calls, user-data scripts                          | `aws_instance`, `aws_launch_template`, `aws_autoscaling_group` |
| **RDS / Aurora**      | `DATABASE_URL`, Postgres/MySQL driver, `rds.amazonaws.com` host     | `aws_db_instance`, `aws_rds_cluster`, `DatabaseInstance` |
| **DynamoDB**          | `@aws-sdk/lib-dynamodb`, `DocumentClient`, `boto3.resource('dynamodb')` | `aws_dynamodb_table`, `Table`, `AWS::DynamoDB::Table` |
| **S3**                | `@aws-sdk/client-s3`, `PutObject`, presigned URLs, `boto3.client('s3')` | `aws_s3_bucket`, `Bucket`                       |
| **CloudFront**        | CDN URLs, signed cookies/URLs, cache invalidation calls             | `aws_cloudfront_distribution`, `Distribution`     |
| **Cognito**           | `amazon-cognito-identity-js`, `@aws-sdk/client-cognito-identity-provider`, JWKS URL with `cognito-idp` | `aws_cognito_user_pool`, `UserPool` |
| **SNS**               | `@aws-sdk/client-sns`, `Publish`, topic ARNs                        | `aws_sns_topic`, `aws_sns_topic_subscription`     |
| **SQS**               | `@aws-sdk/client-sqs`, `SendMessage`, `ReceiveMessage`, queue URLs  | `aws_sqs_queue`, `Queue`, `events: - sqs`         |
| **EventBridge**       | `PutEvents`, rule/bus names, scheduled rules                        | `aws_cloudwatch_event_rule/_target`, `aws_scheduler_schedule`, `EventBus` |
| **SES**               | `@aws-sdk/client-ses(v2)`, `SendEmail`, verified identities         | `aws_ses_domain_identity`, `aws_sesv2_*`          |
| **Secrets Manager**   | `GetSecretValue`, `secretsmanager` ARNs                             | `aws_secretsmanager_secret`, `Secret`             |
| **SSM Parameter Store** | `GetParameter(s)`, `/app/env/...` paths                           | `aws_ssm_parameter`, `StringParameter`            |
| **CloudWatch**        | metric/log calls, log group names, embedded metric format           | `aws_cloudwatch_log_group`, `_metric_alarm`, `_dashboard` |
| **Step Functions**    | state machine ARNs, `StartExecution`, ASL JSON                      | `aws_sfn_state_machine`, `StateMachine`           |
| **IAM**               | assumed roles, `sts:AssumeRole`                                     | `aws_iam_role`, `_policy`, `_role_policy_attachment` |
| **Route 53**          | hosted-zone / domain references                                     | `aws_route53_zone`, `aws_route53_record`          |
| **AppSync**           | GraphQL endpoint with `appsync-api`, resolvers, VTL                 | `aws_appsync_graphql_api`, `_resolver`            |
| **ElastiCache**       | `REDIS_URL`, Redis/Memcached client, `cache.amazonaws.com` host     | `aws_elasticache_cluster`, `_replication_group`   |
| **Kinesis**           | `PutRecord(s)`, shard iterators, stream names                       | `aws_kinesis_stream`, `_firehose_delivery_stream` |
| **Amplify / AppRunner / Batch / Glue / Athena / OpenSearch / MQ / Textract / Bedrock / Rekognition** | its own SDK client package or endpoint | its own resource type |

The list is not exhaustive. Anything imported from `@aws-sdk/client-*`, `aws-sdk`, `boto3.client(*)`,
`software.amazon.awssdk.*`, or declared as an `aws_*` / `AWS::*` resource belongs in the inventory,
listed or not.

**Useful sweeps:**

```bash
rg -o '@aws-sdk/client-[a-z0-9-]+' -g '!node_modules' | sort -u
rg -o "boto3\.(client|resource)\(['\"][a-z0-9-]+" | sort -u
rg -o 'resource "aws_[a-z0-9_]+"' -g '*.tf' | sort -u
rg -o 'AWS::[A-Za-z]+::[A-Za-z]+' -g '*.y*ml' -g '*.json' | sort -u
```

## 4. Authentication and region — get this right or say UNKNOWN

**How the project authenticates to AWS** determines everything about how it can be run and tested:

| Signal                                                          | Conclusion                             |
| ----------------------------------------------------------------- | -------------------------------------- |
| No credentials anywhere; SDK constructed with no explicit config | Default chain — role in the cloud, local profile on a laptop |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in config          | Static keys — note it, they are a risk and they gate local runs |
| `AWS_PROFILE`                                                    | Local development via a named profile  |
| `aws_iam_role` attached to a task/function/instance              | Role-based, in-cloud                   |
| `role-to-assume` + `id-token: write` in a GitHub workflow        | OIDC federation from CI — no long-lived keys |
| `IRSA` / `eks.amazonaws.com/role-arn` annotation                 | Kubernetes service account → IAM role  |
| `LOCALSTACK`, `endpoint:` overrides, `localhost:4566`            | Local AWS emulation — local does **not** touch real AWS |

**Region** comes from an explicit SDK config, `AWS_REGION`/`AWS_DEFAULT_REGION`, a Terraform provider
block, a CDK env, or a CI variable. If none of those is present, the region is `UNKNOWN` — do not
guess `us-east-1` because it is common.

## 5. Containers, orchestration, deployment

| Question                              | Where the answer is                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| How is the app packaged?              | `Dockerfile` — base image, build stages, final `CMD`/`ENTRYPOINT`, user, port |
| What does local depend on?            | `docker-compose.y*ml` services — DBs, caches, brokers, LocalStack, mocks     |
| What runs in the cloud?               | ECS task definitions · K8s Deployments · Lambda functions · App Runner       |
| How does traffic reach it?            | ALB/NLB · API Gateway · Ingress · CloudFront · Route 53                      |
| How does it scale?                    | ASG · ECS desired count + autoscaling · HPA · Lambda concurrency             |
| How is config injected?               | Task-definition env/secrets · ConfigMap/Secret · SSM/Secrets Manager refs    |
| How does it deploy?                   | The CI/CD job that performs it, with its trigger                             |
| How does it roll back?                | Deployment strategy, previous task definition/revision, or `UNKNOWN`         |

## 6. CI/CD — the most honest document in the repository

Workflows are executable, so they cannot be as stale as prose. For each pipeline record: what
triggers it (branch, tag, PR, manual, schedule) · what it does (test, build, publish, migrate,
deploy) · which environment it targets · where its credentials come from · what gates it (approvals,
required checks) · whether it runs migrations, and when relative to the deploy.

**Branch-to-environment mapping is the single most valuable line in the whole document:**

```md
main    → deploys to production   (.github/workflows/deploy.yml:14, environment: production)
develop → deploys to staging      (.github/workflows/deploy.yml:12)
PRs     → tests only; no deploy
```

## 7. Messaging, jobs, and async work

Async paths are where undocumented behavior hides, and where a "harmless" test write becomes a real
email. Record, for each: producer · consumer · payload shape · trigger · retry policy · dead-letter
destination · idempotency · ordering guarantees · what happens on repeated delivery.

Cover queues (SQS, RabbitMQ, Redis-backed), topics and events (SNS, EventBridge, Kafka, in-process
event buses), streams (Kinesis, DynamoDB Streams, CDC), schedules (EventBridge rules, cron, K8s
CronJobs, `node-cron`, Celery beat), and background workers (BullMQ, Sidekiq, Celery, custom loops).

## 8. Observability

Where do logs go · which log group or platform · what is the log format · is there tracing (X-Ray,
OpenTelemetry, Datadog, Sentry) · which metrics exist · which alarms exist and who they notify · is
there a health/readiness endpoint. Answer "how would I debug this in production?" — if the answer is
`UNKNOWN`, that itself is worth recording as a risk.

## 9. External integrations → `integrations.md`

Detect third parties through: SDK dependencies in the manifest · HTTP clients with a hard-coded or
configured base URL · webhook receiver routes · credential-shaped env var names (`*_API_KEY`,
`*_SECRET`, `*_TOKEN`, `*_WEBHOOK_SECRET`) · adapter/gateway/client/service classes · outbound
allow-lists in infrastructure.

```bash
rg -n "https?://[a-z0-9.-]+\.[a-z]{2,}" -g '!*.lock' -g '!node_modules' -o | sort -u | head -50
rg -n '(API_KEY|_SECRET|_TOKEN|WEBHOOK|CLIENT_ID|CLIENT_SECRET)' .env.example 2>/dev/null
rg -ln 'axios.create|fetch\(|httpx.Client|RestTemplate|HttpClient'
```

Record per integration:

```md
## Stripe

Type:           external API (payments)
SDK/client:     `stripe` v14 — src/infrastructure/payments/stripe.client.ts:12
Used in:        src/modules/payments/payment.service.ts · src/modules/webhooks/stripe.controller.ts
Operations:     create PaymentIntent · capture · cancel · refund · verify webhook signature
Inbound:        POST /webhooks/stripe  (signature verified with STRIPE_WEBHOOK_SECRET)
Credentials:    STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET   [values NOT stored]
Environments:   test keys in dev/staging · live keys in production   [INFERRED from key prefixes in .env.example]
Flows:          flows/checkout.md · flows/refund.md
Failure mode:   payment.service.ts retries 5xx three times; 4xx surfaces to the caller
Sandbox:        yes — Stripe test mode; test cards documented in docs/payments.md
```

The **failure mode** and **sandbox** lines matter more than the operation list: they are what someone
needs before touching the integration, and they are the hardest facts to rediscover.

## 10. Inventory quality gate

- [ ] Every service has a purpose, a consumer, and a location — no bare names.
- [ ] Code-vs-IaC mismatches are recorded as findings, not silently reconciled.
- [ ] Authentication method is identified per service, or explicitly `UNKNOWN`.
- [ ] Regions and account identifiers are recorded only if already committed in the repository.
- [ ] Async paths list their consumers and retry/DLQ behavior.
- [ ] Every external integration names its credentials by name only, and its failure behavior.
- [ ] Branch → environment → deployment mapping is written down.
- [ ] Every claim carries `CONFIRMED` / `INFERRED` with evidence.
