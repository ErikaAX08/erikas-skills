<!-- Required header, no preamble. Fill every <placeholder>; delete nothing structural. -->
Scope: repo `<repo path>` · entry point `<A pre-PR | B pre-merge>` · base `<base ref> (confirmed via <method> | unconfirmed: detected via <method>)` · merge-base `<sha>` · head `<sha>` · PR `<number/link, state, draft?, CI <passing|failing|pending|none> | none (entry point A) | not resolved (<reason>)>` · issue `<link | none | not readable>` · local changes `<included, labeled local-only | excluded | none>` · worktree `<path, removed | none>` · date `<UTC>`.

Sources consulted beyond the diff: <issue, logs, production queries, executed tests, base-branch files — or `none`>.

Verdict: **<request changes | approve with conditions | approve | do not approve until X is verified>**

Reason: <one or two direct sentences>.

Method: size `<S | M | L | docs-only | noise-only>` (`H` = `<n>` hand-reviewed lines, noise `<m>` lines spot-checked) · mode `<single agent | multi-agent>` [override: <reason>] · lenses `<activated lenses>` · candidates `<N>`: confirmed `<K>`, refuted `<J>`, unresolved `<L>` [· narrow-change exception: <test citation>] [· noise promoted: <paths>] [· Untrusted instruction ignored: <citation>].

Coverage: lens traces `<lens → F-n | Verified | Still Open, one per activated lens>` · flows fully traced `<list>` · flows sampled `<list | none>` · invariants not applicable `<I-n, … | none>` · base drift `<none | overlapping files checked: outcome>` [· interactions `<pair: outcome, …>` (multi-agent)].

<!-- Always show: Verified, Blockers (or None), Open Decisions (or None), Tests, Still Open, Decision. Omit Non-Blocking and Ruled Out only when empty. Operational Queries: one block per executed query; omit the section when none was executed. -->

## Verified

- <verified fact and brief evidence, e.g. `Flag checkout_v2 defaults OFF in code (flag: checkout_v2 = false @ prod, src/flags.ts:12 @ a1b2c3d (head))`>

## Blockers

<!-- If none: write exactly `None — <one-line coverage claim, e.g. no reachable production/data/auth/contract breakage in the traced flows>`. -->

### 🔴 F-1 — <concrete title>

Location: `path:line[-end] @ <sha> (base|head)` or `flow: <entry> → <exit>`

Certainty: <Fact | Inference>

What changed:
<before vs. now, with base/head citations>

Activating condition:
<when it happens in the real flow, with caller/flag/data condition>

Impact:
<what breaks, for whom, bounded population>

Evidence:
<cited code, contract, executed test, log, metric, or sanitized query>

Refutation attempt:
<what was checked to disprove it and why it survived>

Recommendation:
<exact change: file, behavior, and close-out evidence required>

## Open Decisions

<!-- If none: write exactly `None — <why no product/operations/architecture decision is pending>`. -->

### 🟡 F-2 — <concrete title>

Location: `path:line @ <sha> (head)` or `flow: <entry> → <exit>`

Certainty: <Fact | Inference | Conditional risk>

Facts:
<cited facts, no judgement; for Conditional risk, the named condition and how to verify it>

Activating condition:
<when the behavior applies in the real flow>

Impact:
<who is affected and how, bounded population>

Refutation attempt:
<what was checked to disprove the facts and why they stand>

Decision needed:
<the options, the decider role (product|operations|architecture), and why this is not a technical bug>

## Non-Blocking

### ⚪ F-3 — <concrete title>

Location: `path:line @ <sha> (head)`

Certainty: <Fact | Inference | Conditional risk>

Bounded risk or improvement:
<what, for whom, at most what cost; or the improvement with file-level pointer>

Close-out:
<test, metric, verification, or follow-up that settles it without gating the merge>

## Ruled Out

### ✅ F-4 — <concrete title>

Original hypothesis:
<what was suspected>

Refuting evidence:
<the cited fact that disproves it, with the fixed phrase `I was wrong: …` where a prior claim is corrected>

## Tests

- Executed: <command, exit code, duration, result> (one line per run; or `none — <failed Phase 6 condition, and what would enable it>`)
- Inspected: <relevant coverage with file::test citations; CI checks with status>
- Missing: <concrete applicable cases with the risk each leaves open>

## Operational Queries

### Query Q-1

- Authorization: <who authorized and the scope, no secrets>
- Destination: <verified environment/resource and non-sensitive identity>
- Operation: <sanitized query or command, UTC range, row/timeout limits>
- Result: <aggregate fact, rows examined/returned, duration/volume, complete|sampled>
- Limitations: <retention, delay, sampling, or access limits affecting the conclusion>

## Still Open

<!-- One entry per open item. Tag `[prerequisite]` exactly the items defined as deployment-safety prerequisites in SKILL.md §1; the verdict's X lists their short names. If none: write exactly `Nothing open — <why the safety prerequisites are all closed>`. -->

- [prerequisite] <short name>: I could not verify <fact or condition>. To close it: <exact query, test, or evidence, with source and limits>.
- <short name>: I could not verify <fact or condition>. To close it: <exact query, test, or evidence>.

## Decision

**<request changes | approve with conditions | approve | do not approve until X is verified>**

<exact condition or next action with owner role and close-out evidence; for `approve`, write `No conditions.`>
