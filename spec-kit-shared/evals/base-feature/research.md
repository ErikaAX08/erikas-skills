# Research: SMS Allow List

| ID | Question | Answer | Runtime premise | Evidence level | Evidence |
| -- | -------- | ------ | --------------- | -------------- | -------- |
| RS-01 | Worst-case duration of one provider call with the SDK's retries | 3 attempts × 2 s timeout; the SDK waits `retry-after` (capped at 1 s) between attempts → ~8 s | yes | executed | `node probe-retries.js` against the installed SDK printed `attempts=3 total_ms=7940` |
| RS-02 | When the request logger captures the request URL | At request start, when the child logger is created | yes | executed | `node probe-logger.js` printed the URL before the handler ran |
| RS-03 | Name of the SDK's allow-list delete method | `client.allowList.remove(phone)` | no | read | node_modules/sms-sdk/lib/allowList.d.ts:14 |
