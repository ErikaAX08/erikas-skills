<!--
Target: .ai/flows/<flow-name>.md
One business flow, traced end to end by following the call chain — never guessed. Write this
file only for a flow you actually traced; a speculative flow document is worse than none.
The Side Effects and Failure Behavior sections are why this file exists: they are invisible
from any single file and they are what an impact analysis and a safe test operation need.
-->

# Flow: <name>

**Last verified:** <YYYY-MM-DD>
**Trigger:** <HTTP request · queue message · schedule · webhook · CLI · user action>
**Entry point:** `<method + route or handler>` → `<path:line>`

## Steps

```text
1. <HTTP POST /users>
2. <UserController.create()>                    src/modules/users/user.controller.ts:24
3. <CreateUserUseCase.execute()>                src/modules/users/application/create-user.use-case.ts:31
4. <UserRepository.existsByEmail()>             src/infrastructure/db/user.repository.ts:18
5. <PasswordHasher.hash()>                      src/modules/auth/password-hasher.ts:9
6. <UserRepository.create()>                    src/infrastructure/db/user.repository.ts:44
7. <EventBus.publish(UserCreated)>              src/modules/users/events/user-created.ts:7
8. <EmailListener handles UserCreated>          src/modules/notifications/email.listener.ts:22
9. <SES sends the welcome email>                src/infrastructure/aws/ses.client.ts:15
```

## Components Involved

| Step | Component | Path     | Layer  |
| ---- | --------- | -------- | ------ |
| <n>  | `<name>`  | `<path>` | <layer>|

## Data Touched

| Table / collection | Operation | When                | Notes                     |
| ------------------ | --------- | ------------------- | ------------------------- |
| `<name>`           | <read/write> | <step n>         | <constraints that apply>  |

**Transactional boundary:** <where it opens and commits, or "none — steps are not atomic">

## External Calls

| Service  | Call      | Step | Synchronous? | On failure         |
| -------- | --------- | ---- | ------------ | ------------------ |
| `<name>` | `<op>`    | <n>  | <yes/no>     | <what happens>     |

## Events Emitted

| Event    | Published at | Consumers | Delivery              |
| -------- | ------------ | --------- | --------------------- |
| `<name>` | <step n>     | `<path>`  | <in-process / SQS / SNS> |

## Side Effects

<!-- Everything that happens beyond the primary write. The list a test operation must read first. -->

- <e.g. "a real email is sent via SES to the address supplied"> — `<path:line>`
- <e.g. "the search index is updated asynchronously; a failure here is logged and swallowed">

## Validation & Authorization

| Where    | Checks    | On failure           |
| -------- | --------- | -------------------- |
| `<path>` | <rules>   | <status / exception> |

## Failure Behavior

| Failure point | What the caller sees | Is state left partial? | Retried? |
| ------------- | -------------------- | ---------------------- | -------- |
| <step n>      | <status / error>     | <yes/no — what>        | <policy> |

**Idempotent?** <yes/no — evidence>
**Known gaps:** <e.g. "if step 7 succeeds and step 8 fails, the user exists with no welcome email
and no retry">

## Environment Variables Used

`<NAME>` · `<NAME>`   <!-- names only -->

## Tests Covering It

| Test     | Covers      | Path     |
| -------- | ----------- | -------- |
| `<name>` | <behavior>  | `<path>` |

## How to Exercise It Safely

<!-- Per environment, following references/safe-operations.md — highest safe rung first. -->

```md
local:   <command or request that runs the flow>
staging: <what is safe, what is not, and what fires for real>
```

## Known Unknowns

- UNKNOWN: <what could not be determined> — <why it matters>
