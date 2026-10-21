# Implementation Plan: SMS Allow List

**Spec**: `.speckit/specs/001-sms-allow-list/spec.md`

## Summary

Adds `POST /allow-list` and an expiry sweep to the SMS service (R-G01, R-FR01, R-FR02), writing the local entry before every provider call.

## Technical Context

**Language/Version**: Node.js 20 (package.json `engines`)
**Primary Dependencies**: express 4.19, sms-sdk 3.2, knex 3.1 (lockfile)
**Storage**: PostgreSQL via knex
**Testing**: jest 29
**Target Platform**: Linux container behind an ALB with a 60 s idle timeout
**Project Type**: single project
**Performance Goals**: allow request within 10 s (R-QR01)
**Constraints**: S-SG02, S-SG04
**Scale/Scope**: tens of requests per day

## Constitution Check — Gate 1 (before Phase 0)

N/A — sin constitución

## Phase 0: Research

See `research.md` (RS-01–RS-03).

## Phase 1: Design

### Project Structure

```text
src/sms/allowList/route.js        # new
src/sms/allowList/service.js      # new
src/sms/allowList/sweep.js        # new
src/sms/providerClient.js         # existing, gains add/remove
migrations/20261001_allow_list.js # new
```

This is the expected change surface, not a prohibition.

**Structure Decision**: new `src/sms/allowList/` module beside the existing provider client.

## Constitution Check — Gate 2 (re-check after Phase 1)

N/A — sin constitución

## Key Decisions and Trade-offs

| ID | Decision | Alternatives Considered | Rationale | Consequences | Evidence | Evidence level |
| -- | -------- | ----------------------- | --------- | ------------ | -------- | -------------- |
| PL-D01 | Cap SDK retries at 3 with a 2 s timeout | SDK defaults (60 s × 3) | Keeps R-QR01 under 10 s | Slower providers fail as ambiguous | RS-01 | executed |
| PL-D02 | Mask the phone inside the allow-list route handler before the request is logged | Register a serializer in the app setup | The logger is assumed to serialize the request at response finish (RS-02) | No change outside the module | RS-02 | assumption |
| PL-D03 | Map 429 and timeouts to ambiguous, other 4xx to definitive | Treat every error as definitive | R-AC02/R-AC03 | Ambiguous entries wait for the sweep | S1 | read |

## Operations

| ID | Operation | Realizes (spec) | Applies | Expected files/components | Validation |
| -- | --------- | --------------- | ------- | ------------------------- | ---------- |
| PL-O01 | Create the allow_list_entries table | O-01, R-FR01 | — | migrations/20261001_allow_list.js | migration runs up and down |
| PL-O02 | Add the allow endpoint and service | O-01, R-AC01, R-AC02, R-AC03 | PL-D01, PL-D03 | src/sms/allowList/route.js, src/sms/allowList/service.js | integration tests for the three outcomes |
| PL-O03 | Mask phones in request logs | O-01, S-SG02 | PL-D02 | src/sms/allowList/route.js | request log shows `+…1234` only |
| PL-O04 | Add the expiry sweep | O-02, R-FR02, R-AC04 | — | src/sms/allowList/sweep.js | sweep test with expired active and pending entries |

## Safe Deferral

| Operation (PL-O##) | Deferred To | Condition | Justification |
| ------------------ | ----------- | --------- | ------------- |
| PL-O04 | US2 | Additive | The sweep only reads and expires entries; nothing in US1 calls it |

## Compatibility and Evolution

The endpoint is registered only when `SMS_ALLOW_LIST_ENABLED` is true (A-C01); S-SG05 holds with the flag off.
