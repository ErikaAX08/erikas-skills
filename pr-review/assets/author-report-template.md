<!--
Author report: the first part of every completed response (SKILL.md §8). It is written AFTER the audit report
(assets/review-template.md) passes, and only restates it in the review format a tech lead shares with the PR
author: no fact, finding, risk, validation, or checklist item that the audit does not hold. Translate headings
and labels per SKILL.md §2; keep `## 1.` … `## 6.`, markers, `F-n`, severity values, the verdict key, and the
review labels byte-identical. Third person, no praise, no `LGTM`. Fill every <placeholder>; delete nothing
structural; an empty section says `None — <reason>`.
-->
## 1. Summary

- Changes: <the audit's Changes sentence, without the `[risks: …]` tag>
- Main problems: <F-n — title, for each 🔴 and 🟡, highest first | none>
- Risks of the current implementation: <the impact of the highest-ranked findings and prerequisites, one sentence | none found in the traced flows>
- Blocking conditions: <what stops the approval or the merge — every 🔴, 🟡, and `[prerequisite]` by ID | none>

## 2. Code Review Findings

<!--
Every audit finding, in the audit's order and with its marker, ID, and severity. Low is never used (§3).
Obligation by marker: 🔴 mandatory fix before merge · 🟡 mandatory decision before merge · 🚀 mandatory during
deploy · ⚪ improvement suggestion. Field sources: 🔴 Description = What changed + Activating condition;
🟡 Description = Facts + Activating condition, Recommendation = decider role + options + the option the evidence
favors; 🚀 Description = why the order matters, Impact = If skipped, Recommendation = Step + Rollback;
⚪ Description and Impact = Bounded risk.
-->

Low: not applicable — style, formatting, and readability are out of scope (linters).

### 🔴 F-1 · <Critical | High> — <title, as in the audit>

- Obligation: <mandatory fix before merge>
- Location: <the audit's Location citation>
- Description: <technical explanation>
- Impact: <what breaks, for whom, bounded population>
- Recommendation: <the concrete change and the evidence that closes it>

### ✅ Ruled out

<!-- Only when the audit has ✅ findings. One heading per finding. -->

### ✅ F-5 — <title>

- <original hypothesis> — <refuting evidence>

### Provided findings

<!-- Only when the caller supplied findings: the audit's Provided Findings lines, verbatim. -->

- <caller ID> → F-<n>

## 3. Mandatory Validations Before Merge

<!--
Only validations the audit justifies: Tests (Build, Typecheck, Executed, Missing), CI checks, every
`[prerequisite]`, an unconfirmed base, required approvals, and the before-merge checks the audit's findings
require. Never mark a validation satisfied without the audit's executed evidence; a green CI satisfies only what
it ran.
-->

### V-1 — <what must be verified>

- Status: <satisfied — <command, exit code | evidence> | pending>
- Why it matters: <the risk it closes, with F-n or the Still Open item>
- How to check: <exact command, query, or evidence | not determinable from the review: <reason>>
- Pass condition: <the observable result that satisfies it>

## 4. Pre-Deploy Risks and Considerations

<!--
Every 🚀, every Conditional risk or Open question, every Still Open item that affects the deploy, and the
rollback path. Confirmed = Fact or Inference in the audit; pending validation = Conditional risk, Open question,
or a Still Open item.
-->

### R-1 — <risk>

- Status: <confirmed | pending validation>
- Source: <F-n | still-open <name>>
- Impact: <what happens after deploy, for whom>
- Preventive action: <deploy order, flag, check, or close-out>

Rollback: <the audit's Rollback line, tag included>

## 5. Approval Checklist

<!-- The audit's Checklist items, verbatim and complete, grouped. An empty group says `None.` -->

### Before merge

- [ ] [before-merge] <action> — anchor: F-<n>

### Before deploy

- [ ] [before-deploy] <action> — anchor: F-<n>

### After deploy

- [ ] [after-deploy] <action> — anchor: flow <name>

## 6. Final Verdict

**<APPROVE | APPROVE WITH SUGGESTIONS | REQUEST CHANGES | BLOCKED – PENDING VALIDATION>** (`<verdict key>`)

<!-- Label from the verdict key (SKILL.md §2): changes required → REQUEST CHANGES; verification required or
decision required → BLOCKED – PENDING VALIDATION; ready to merge → APPROVE, or APPROVE WITH SUGGESTIONS when a ⚪
exists. -->

- Next: **<owner>** — <the audit's Next action>
- Justification: <the audit's Reason, citing the F-n and validations that drive it>
- Unblocks when: <the audit's outcome map>

<details>
<summary>Full audit report</summary>

<!-- The audit report that passed scripts/check-report.mjs, verbatim, starting with its Scope line. -->

</details>
