<!--
Target: .ai/infrastructure.md
What exists outside the application process: cloud services, containers, orchestration, CI/CD,
messaging, storage, networking, observability. See references/infrastructure-inventory.md.
Every entry needs a purpose, a consumer, and a location — a bare service name is noise.
Record code-vs-IaC mismatches instead of quietly reconciling them: they are real findings.
Never record secret values, and never record identifiers that are not already committed here.
-->

# Infrastructure

**Last verified:** <YYYY-MM-DD> against <paths>
**IaC tooling:** <Terraform | CDK | CloudFormation | Serverless | SAM | Pulumi | none found>
**Cloud provider(s):** <AWS | GCP | Azure | on-prem | none>   **Region(s):** <value | UNKNOWN>
**Authentication to the cloud:** <IAM role | task role | OIDC from CI | static keys | UNKNOWN>

## Service Inventory

| Service      | Identifier        | Purpose         | Declared in   | Used by   | Confidence |
| ------------ | ----------------- | --------------- | ------------- | --------- | ---------- |
| <AWS Lambda> | `<function name>` | <what it does>  | `<path:line>` | `<path>`  | CONFIRMED  |

<!-- Then one detailed section per service that matters. -->

### <Service> — `<identifier>`

```md
Purpose:      <one line>
Declared in:  <path:line | "not found in IaC — provisioned outside this repository">
Used by:      <components, with paths>
Triggered by: <what invokes it, if it is compute>
Depends on:   <other services it calls>
Auth:         <how the project authenticates to it>
Env vars:     <NAMES only>
SDK/client:   <library · where the client is constructed>
Region:       <value | UNKNOWN>
Environments: <which environments have it>
Confidence:   CONFIRMED | INFERRED — <evidence>
```

## Compute & Runtime

| Question             | Answer   | Evidence      |
| -------------------- | -------- | ------------- |
| Packaging            | <image>  | `<path>`      |
| Runs as              | <ECS / K8s / Lambda / VM> | `<path>` |
| Start command        | <cmd>    | `<path:line>` |
| Ports                | <port>   | `<path:line>` |
| Scaling              | <how>    | `<path:line>` |
| Health check         | <path>   | `<path:line>` |

## Local Environment (containers)

| Service   | Image     | Purpose      | Port  |
| --------- | --------- | ------------ | ----- |
| <postgres>| <image>   | <local DB>   | <port>|

**Does local touch real cloud resources?** <yes/no — evidence: endpoint overrides, LocalStack, mocks>

## CI/CD

| Pipeline | Trigger        | Does                    | Target env   | Credentials source | Evidence  |
| -------- | -------------- | ----------------------- | ------------ | ------------------ | --------- |
| `<name>` | <branch/tag/PR>| <test · build · deploy> | <env>        | <OIDC / secrets>   | `<path:line>` |

**Branch → environment:**

```text
<branch> → <environment>    (<path:line>)
```

**Migrations in the pipeline:** <run automatically before/after deploy | manual | none found>
**Rollback:** <how, or UNKNOWN>

## Messaging, Jobs & Async

| Mechanism | Name     | Producer  | Consumer  | Retry / DLQ | Idempotent? |
| --------- | -------- | --------- | --------- | ----------- | ----------- |
| <SQS>     | `<name>` | `<path>`  | `<path>`  | <policy>    | <yes/no/UNKNOWN> |

## Storage & CDN

| Resource  | Purpose  | Access pattern       | Public?  | Lifecycle |
| --------- | -------- | -------------------- | -------- | --------- |
| `<bucket>`| <what>   | <presigned / direct> | <yes/no> | <policy>  |

## Networking

<!-- Only what is committed in the repository: VPC/subnet structure, ingress path, security-group
     intent, DNS. Do not record private hostnames or account identifiers that are not already here. -->

## Observability

| Concern | Tool     | Where       | Notes                       |
| ------- | -------- | ----------- | --------------------------- |
| Logs    | <tool>   | `<group>`   | <format, retention>         |
| Metrics | <tool>   | <where>     |                             |
| Tracing | <tool>   | <where>     |                             |
| Alerts  | <tool>   | <where>     | <who is notified>           |

**How would you debug this in production?** <the honest answer, or UNKNOWN as a recorded risk>

## Code vs. IaC Mismatches

| Resource   | Declared in IaC | Referenced in code | Reading                                   |
| ---------- | --------------- | ------------------ | ----------------------------------------- |
| `<name>`   | yes             | no                 | possibly orphaned, or used by another repo|
| `<name>`   | no              | yes                | provisioned outside this repo — source UNKNOWN |

## Known Unknowns

- UNKNOWN: <what could not be determined> — <why it matters> · <how to resolve it>
