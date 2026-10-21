# Tasks: SMS Allow List

## Phase 1: Setup (Shared Infrastructure)

No setup tasks required — structure and dependencies already match plan.md.

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T001 Create the allow_list_entries migration
      Traza a: R-FR01, PL-O01
      Archivo(s): nuevo: migrations/20261001_allow_list.js
      Depende de: ninguna
      Validación: `npm run migrate:up && npm run migrate:down` exits 0

**Checkpoint**: foundation ready — user stories may start.

## Phase 3: US1 — Allow a blocked number (Priority: P1) 🎯 MVP

- [ ] T002 [US1] Add the allow service with the provider outcome mapping
      Traza a: R-AC01, R-AC02, R-AC03, PL-O02
      Archivo(s): nuevo: src/sms/allowList/service.js
      Depende de: T001
      Validación: `npm test -- allowList.service` passes the accepted, rejected, and timeout cases
- [ ] T003 [US1] Add the POST /allow-list route behind the flag
      Traza a: R-FR01, PL-O02
      Archivo(s): nuevo: src/sms/allowList/route.js
      Depende de: T002
      Validación: `npm test -- allowList.route` returns 201 with the flag on and 404 with it off
- [ ] T004 [P] [US1] Mask phone numbers in the allow-list route handler
      Traza a: S-SG02, PL-O03
      Archivo(s): src/sms/allowList/route.js
      Depende de: T003
      Validación: `src/app.js` sin cambios (`git diff --stat src/app.js` vacío) y el handler llama a `maskPhone(now)` antes de registrar
- [ ] T005 [US1] [CIERRE] Verificar consistencia de cierre de US1
      Verifica:
        - Ninguna referencia colgante a código de una historia futura no marcada Dormant/Flagged/Aditiva
        - Ninguna rama/ruta alcanzable queda a medio conectar
        - R-AC01, R-AC02, R-AC03 satisfechos
      Validación: recorrido explícito de las condiciones anteriores, no una inferencia

**Checkpoint**: US1 works and is independently verifiable.

## Phase 4: US2 — Remove expired entries (Priority: P2)

- [ ] T006 [US2] Add the expiry sweep
      Traza a: R-FR02, R-AC04, PL-O04
      Archivo(s): nuevo: src/sms/allowList/sweep.js
      Depende de: T001
      Validación: `npm test -- allowList.sweep` expires an active and a pending entry and calls remove for both
- [ ] T007 [US2] [CIERRE] Verificar consistencia de cierre de US2
      Verifica:
        - Ninguna referencia colgante a código de una historia futura no marcada Dormant/Flagged/Aditiva
        - Ninguna rama/ruta alcanzable queda a medio conectar
        - R-AC04 satisfecho
      Validación: recorrido explícito de las condiciones anteriores, no una inferencia

**Checkpoint**: US1 and US2 work independently.

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T008 Run quickstart.md validation
      Traza a: R-G01, PL-O02, PL-O04
      Archivo(s): ninguno
      Depende de: T005, T007
      Validación: every quickstart step shows its expected result
