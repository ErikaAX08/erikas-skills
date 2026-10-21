# Research: SMS Allow List

| ID | Question | Answer | Runtime premise | Evidence level | Evidence |
| -- | -------- | ------ | --------------- | -------------- | -------- |
| RS-01 | Worst-case duration of one provider call with the SDK's retries | 3 attempts × 2 s timeout; the SDK waits `retry-after` (capped at 1 s) between attempts → ~8 s | yes | executed | `node probe-retries.js` against the installed SDK printed `attempts=3 total_ms=7940` |
| RS-02 | When the request logger captures the request URL | Assumed at response finish — not yet run | yes | assumption | to be confirmed by the [SONDA] task with `node probe-logger.js` |
| RS-03 | Name of the SDK's allow-list delete method | `client.allowList.remove(phone)` | no | read | node_modules/sms-sdk/lib/allowList.d.ts:14 |
