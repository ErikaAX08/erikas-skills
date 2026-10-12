# pre-pr-review evals

`evals.json` follows the skill-creator schema used by `code-documentation/evals/evals.json`. Unlike
that skill, every case here needs a real git repository, so `files[0]` names a fixture directory
instead of a standalone input file.

## Running a case

1. Build the fixture into a fresh directory outside this repository:

   ```bash
   bash evals/build-fixture.sh evals/files/<name> /tmp/pre-pr-review-evals/<name>
   ```

   The script commits `base/` on `main`, commits `head/` on `feature` (when present), copies
   `local/` over the work tree uncommitted (when present), and leaves `feature` checked out.
   Author and dates are fixed, so the SHAs are the same on every machine.

2. Run the case's `prompt` with the built repository as the working directory and the
   `pre-pr-review` skill available.

3. Grade the report and the transcript against `assertions`. Several assertions concern commands
   the agent did or did not run (database access, test execution, git mutations), so the grader
   needs the transcript, not only the final report.

## What each case covers

| Case | Rule under test |
| --- | --- |
| `auth-guard-removed` | 🔴 with base/head citations, intent-vs-diff contradiction, mock smell |
| `migration-deploy-order` | Phase 7 rule 4: deployment-order problem with an achievable safe order → 🟡 `operations` |
| `migration-lock-prerequisite` | Phase 7 rule 6: missing fact whose unfavorable answer is 🔴 → `[prerequisite]`, no DB access |
| `go-build-directive` | Docs-only fast path rejected for a toolchain directive; quick-review override |
| `empty-diff` | `Review not performed` outcome |
| `lockfile-install-script` | Lockfiles activate the Dependencies section even when `H = 0` |
| `fork-sql-injection` | Entry point B, untrusted instruction ignored, no execution of fork code |
| `local-only-pii-logging` | Entry point A local-only changes, worktree citation, read-only safety |
