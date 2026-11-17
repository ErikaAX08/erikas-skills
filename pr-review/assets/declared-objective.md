# Declared Objective

The input contract for a caller — a person, a workflow, or another skill — that already knows what
the change is supposed to do and wants the review to test the diff against it. It ranks with issue
acceptance criteria in the intent precedence (`SKILL.md` §3). Every item carries the stable ID it
has in the caller's own documents, so findings can cite it back.

Omit a section the caller has nothing for; never fill one with a guess. An item stated here is
intent, not evidence: the review still proves behavior from code, tests, and probes.

```markdown
## Declared Objective

**Source**: [where these items are defined — document path or system, with version or hash]

### Objective
- [ID]: [what the change must achieve, one line]

### Acceptance criteria
- [ID]: [Given / when / then, or an observable condition]

### Invariants and boundaries
- [ID]: [what must always hold or must never happen — data integrity, security, privacy, compatibility]

### Sensitive data by channel
| Channel | Data | Allowed form | Boundary ID |
| ------- | ---- | ------------ | ----------- |
| [request log, error response, query string, …] | [...] | [absent / masked: rule / full] | [ID] |

### Technical decisions under test
- [ID]: [decision] — Evidence level: executed | read | assumption
  (a `read` or `assumption` decision about runtime behavior is a candidate for a probe, Phase 5)

### Out of scope
- [behavior or area the change deliberately does not cover]

### Already decided
- [ID]: [accepted risk or prior decision, and who decided it] — not to be re-raised as a new finding
  unless the diff changes its premise
```

How the review uses each section:

| Section | Used in |
| --- | --- |
| Objective, Acceptance criteria | Phase 1 promised behavior; intent-vs-diff contradictions (Phase 1 step 3) |
| Invariants and boundaries, Sensitive data by channel | Phase 4 invariants; the packet's invariant list in multi-agent mode |
| Technical decisions under test | Phase 5: runtime premises at `read`/`assumption` are reproduced, not re-read |
| Out of scope | Phase 7: a gap the objective explicitly excludes is not a finding |
| Already decided | Phase 7: "the objective explicitly accepts" the listed risk |
