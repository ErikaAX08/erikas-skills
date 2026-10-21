# Requirements Checklist Template

Write it as `<feature-directory>/checklists/requirements.md` (`SKILL.md` Phase 7).

```markdown
# REASONS Specification Quality Checklist: [Feature Name]

**Purpose**: Validate intent, design, execution, and governance before planning or code generation
**Feature**: [Relative link to spec.md]
**Status**: [READY / DRAFT — NEEDS CLARIFICATION]

## Source Integrity

- [ ] Every explicit source was read successfully or an access failure is disclosed
- [ ] The persisted Evidence Catalog resolves every `[S#]` and `[P#]` citation
- [ ] Every catalog row has a source fingerprint computed per the Source Fingerprint Policy, or an explicit stated reason it could not be computed
- [ ] Source-derived claims use traceability IDs
- [ ] Conflicts are resolved or clearly marked as blocking
- [ ] Facts, assumptions, proposals, and verified project evidence are distinguishable

## Requirements and Alignment

- [ ] The problem, value, actors, scope, and out-of-scope boundaries are explicit
- [ ] Functional and quality requirements are testable
- [ ] Acceptance criteria cover primary, error, boundary, and permission-sensitive scenarios as applicable
- [ ] Definition of done is measurable
- [ ] No blocking decision remains hidden

## Abstraction and Design

- [ ] Entities use consistent domain language and define relevant invariants
- [ ] Every terminal or persistent state an `R-AC` produces is compatible with every `E-I` invariant, including under ambiguous outcomes (timeout, network error, 5xx)
- [ ] Approach, Structure, and Operations stay at the capability level; no file-level constraint or runtime premise is pinned in the spec
- [ ] Approach explains key decisions, rationale, alternatives, and trade-offs
- [ ] Structure defines cohesive responsibilities and valid dependencies
- [ ] Existing architecture and contracts are represented accurately
- [ ] No unnecessary abstraction or speculative refactor is introduced

## Execution

- [ ] Operations are ordered, concrete, bounded, and independently verifiable
- [ ] Every operation traces to requirements and acceptance criteria
- [ ] Exact paths, APIs, fields, types, and signatures are verified rather than guessed
- [ ] Testing, migration, documentation, observability, and rollout work are included when required

## Governance

- [ ] Norms are applicable, enforceable, and source-backed or labeled Proposed
- [ ] Safeguards are explicit and verifiable
- [ ] When sensitive data is in scope, the Sensitive Data by Channel table has every row filled (safeguard ID or narrow `N/A` reason)
- [ ] Prohibited Changes protect behaviors or contracts, not files
- [ ] Security, privacy, integrity, reliability, compatibility, and scope risks are addressed as applicable
- [ ] The specification contains no TODOs, placeholders, contradictions, or accidental implementation
- [ ] The artifact is ready to be versioned and reviewed independently of chat history

## Traceability

- [ ] Every in-scope functional requirement maps to at least one acceptance criterion
- [ ] Every acceptance criterion maps to at least one operation or explicit verification activity
- [ ] Every critical risk maps to an approach decision, operation, or safeguard

## Agent Portability

- [ ] No unresolved or non-standard agent handoff reference was introduced
- [ ] If agents were generated, every role has both `.kiro/agents/<name>.json` and `.claude/agents/<name>.md`
- [ ] Paired agents use the same lowercase kebab-case name and semantically equivalent prompts
- [ ] Tool permissions are least-privilege and mapped to the correct platform-specific names
- [ ] Kiro validation and Claude static/runtime validation results are recorded truthfully

## Notes

[Specific failures, evidence, and remaining decisions]
```
