<!--
Target: .ai/integrations.md
Every third-party service this project talks to, in either direction. See
references/infrastructure-inventory.md § 9.
The failure mode and sandbox lines matter more than the operation list: they are what someone
needs before touching the integration, and they are the hardest facts to rediscover.
Credentials are recorded by NAME only, never by value.
-->

# External Integrations

**Last verified:** <YYYY-MM-DD> against <paths>

## Summary

| Service   | Type                   | Direction        | Criticality           | Sandbox available |
| --------- | ---------------------- | ---------------- | --------------------- | ----------------- |
| `<name>`  | <payments / email / auth / storage / analytics> | outbound / inbound / both | <blocks checkout / degrades gracefully> | <yes/no/UNKNOWN> |

---

## <Service name>

```md
Type:          <what it provides>
SDK/client:    <library + version> — <path:line where the client is constructed>
Used in:       <paths>
Operations:    <the calls this project actually makes>
Inbound:       <webhook route + how the signature is verified, or "none">
Credentials:   <VAR_NAME> · <VAR_NAME>            [values NOT stored]
Configured in: <where the values come from, per environment>
Environments:  <which environments use test vs. live credentials, and how you can tell>
Flows:         flows/<flow>.md
Failure mode:  <timeout · retries · circuit breaker · what the caller sees on failure>
Rate limits:   <known limits and how the project respects them, or UNKNOWN>
Sandbox:       <test mode, test data, how to exercise it safely>
Data sent:     <what leaves the system — relevant for privacy review>
Confidence:    CONFIRMED | INFERRED — <evidence>
```

---

## Inbound Webhooks

| Endpoint  | Sender    | Verification        | Handler   | Idempotent? | Retry behavior |
| --------- | --------- | ------------------- | --------- | ----------- | -------------- |
| `<route>` | `<name>`  | <signature header>  | `<path>`  | <yes/no>    | <sender's policy> |

## Integration Risks

- <e.g. "no timeout configured on the `<name>` client — a slow response blocks the request thread">
  `<path:line>` · CONFIRMED

## Known Unknowns

- UNKNOWN: <what could not be determined> — <why it matters>
