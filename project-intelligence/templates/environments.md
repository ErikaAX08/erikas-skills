<!--
Target: .ai/environments.md
Which environments exist, how they differ, and every environment variable — by NAME, never by
value. See references/data-and-config.md, Parts 2 and 3.
The Classification line on each environment is what safe-operations.md consumes before any real
operation: fill it for every environment, and flag anything shared with production.
-->

# Environments & Configuration

**Last verified:** <YYYY-MM-DD> against <paths>

## How the Environment Is Selected

```md
Switch:      <NODE_ENV | APP_ENV | STAGE | SPRING_PROFILES_ACTIVE | terraform workspace | …>
Set by:      <where it is set, per environment, with paths>
Consequence: <what actually changes — config file loaded, stack deployed, endpoints used>
```

---

## <Environment name>

```md
Selected by:    <how, with evidence>
Runs on:        <local Docker | ECS | K8s | Lambda | …>          [CONFIRMED <path:line>]
Database:       <engine + instance/name>                         [CONFIRMED <path:line>]
Data:           <synthetic | anonymized copy | real customer data>
External svcs:  <test mode or live, per integration>
Config source:  <.env file | Secrets Manager | SSM | K8s Secret | CI variables>
Deployed by:    <trigger → pipeline>                             [<path:line>]
Migrations:     <when they run>
Access:         <how a developer reaches it; VPN, bastion, credentials>
Start:          `<command>`
Run tests:      `<command>`
Shared with production: <none | Cognito pool | S3 bucket | payment account | email domain>
Classification: <LOCAL | TEST | NON-PRODUCTION | PRODUCTION> — <caveats>
```

<!-- Repeat per environment: local · test · development · staging · production, as they exist.
     Do not invent an environment because it is conventional; list the ones with evidence. -->

---

## Environment Comparison

| Aspect           | local   | test    | staging | production |
| ---------------- | ------- | ------- | ------- | ---------- |
| Database         |         |         |         |            |
| Real AWS?        |         |         |         |            |
| Real payments?   |         |         |         |            |
| Real email?      |         |         |         |            |
| Real user data?  |         |         |         |            |
| Deployed by      |         |         |         |            |

<!-- This table is the fastest way to answer "is it safe to test this here?" -->

## Environment Variables

<!-- Grouped by concern. Names, purpose, consumer, source. NEVER values.
     A startup validation schema, if one exists, is the authoritative list — cite it. -->

**Validation schema:** `<path>` | none found

### <Group, e.g. Database>

```md
<VAR_NAME>
Purpose:      <what it configures>
Used in:      <path:line>
Required:     <yes / no — default: …>
Environments: <where it is defined>
Source:       <where each environment's value comes from>
Value:        [SECRET — NOT STORED]   <!-- omit this line for non-sensitive values -->
```

### <Group, e.g. AWS>

<!-- … -->

## Configuration Mismatches

| Variable   | Declared in `.env.example` | Read in code | Reading                            |
| ---------- | -------------------------- | ------------ | ---------------------------------- |
| `<NAME>`   | yes                        | no           | dead config, or a stale example    |
| `<NAME>`   | no                         | yes          | undocumented — breaks new setups   |

## Known Unknowns

- UNKNOWN: <what could not be determined> — <why it matters>
