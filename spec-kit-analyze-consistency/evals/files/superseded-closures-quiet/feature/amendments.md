# Amendments: SMS Allow List

## AM-01 — 429 is ambiguous, not definitive

- **Origin**: pre-pr-review F-2 @ 3a1f9c2
- **Decision**: map a provider 429 to the ambiguous outcome — Decided by: user
- **Recorded in**: amendments.md only
- **Layer**: tasks
- **IDs changed**: T009 (new), T002 → Superada por T009
- **Base hashes**: spec sha256:aaaa · plan sha256:bbbb · tasks sha256:cccc
- **Layers done**: tasks
- **Closure re-walk**: T005 [CIERRE] re-walked 2026-10-10: holds
- **Status**: verified

## AM-02 — Tell the agent a 429 will be retried

- **Origin**: user request
- **Decision**: add R-AC05 so the agent sees that a 429 is retried — Decided by: user
- **Recorded in**: spec.md R-AC05
- **Layer**: spec
- **IDs changed**: R-AC05, O-01, PL-O02, T010 (new), T011 (new), T005 → Superada por T011
- **Base hashes**: spec sha256:dddd · plan sha256:eeee · tasks sha256:ffff
- **Layers done**: spec, plan, tasks
- **Status**: applied
