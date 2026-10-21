# Plan Quality Checklist Template

Write it as `checklists/plan-quality.md` (`SKILL.md` § Validate and Iterate).

```markdown
# Plan Quality Checklist: [Feature Name]

**Purpose**: Validate technical soundness, constitution compliance, and traceability before task decomposition
**Plan**: [Relative link to plan.md]
**Status**: [READY / DRAFT — NEEDS CLARIFICATION]

## Technical Context

- [ ] Every Technical Context field is verified or explicitly `NEEDS CLARIFICATION`
- [ ] No field contains a plausible-sounding guess unsupported by a manifest/lockfile/spec citation

## Evidence

- [ ] Every `RS-##` and `PL-D##` states its evidence level (`executed` / `read` / `assumption`)
- [ ] Every runtime premise is `executed` (probe/test command + output cited) or is an `assumption` with a `[SONDA]` required
- [ ] No claim is labeled "Verified" without a level

## Constitution

- [ ] Gate 1 and Gate 2 are both reported as PASS/FAIL tables (or `N/A — sin constitución`)
- [ ] Every Gate FAIL has a corresponding Complexity Tracking row with a concrete justification
- [ ] No gate was skipped or merged into a vague summary

## Design

- [ ] Data Model entities all trace to `spec.md` §E — no invented entities
- [ ] Contracts cite a verified source or are explicitly marked "new — proposed"
- [ ] Project Structure documents the real, verified tree (or a justified greenfield choice)
- [ ] Project Structure says which files/components may change; every "does not change" clause cites an `S-SG##`
- [ ] Operations lists every `PL-O##`, each citing its spec `O-##`, `R-FR##`/`R-AC##`, files, and validation
- [ ] Structure Decision references the actual tree, with no unresolved Option labels

## Convention Enforcement

- [ ] Every new/modified component cites a concrete existing pattern or constitution principle
- [ ] Every deviation is recorded as an explicit decision, not a silent omission

## Safe Deferral

- [ ] Every deferred operation has a valid Dormant/Flagged/Additive justification
- [ ] No operation is deferred without one of the three conditions holding

## Traceability

- [ ] Every plan entry cites its source requirement/acceptance criterion/entity
- [ ] No component or operation introduces scope absent from `spec.md`

## Governance

- [ ] The plan contains no TODOs, placeholders, or unresolved template labels
- [ ] `state.json` was created/updated with `fingerprint.mjs --record <feature-dir> plan` (content hash, `based_on_spec_hash`, `sections`)
- [ ] `lint-artifacts.mjs` reports no `BLOCKING` finding in `plan.md` or `research.md` (IDs, runtime premises, evidence levels)

## Agent Portability

- [ ] If a `plan-reviewer` (or other agent) was generated, both Kiro and Claude definitions exist and validated per `spec-kit-shared/agent-portability.md`, or `AGENTS: none` is reported

## Notes

[Specific failures, evidence, and remaining decisions]
```
