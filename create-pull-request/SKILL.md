---
name: create-pull-request
description: Create Pull Request descriptions grounded in the actual git diff, first looking for the PR template defined in the repository (GitHub, GitLab, Azure DevOps, or CONTRIBUTING.md) and falling back to an improved default template only when the repo defines none. Use when the user asks to create/open/draft a pull request, write a PR description, prepare a PR for review, or mentions "create PR", "pull request", "open PR", "PR description", "merge request", or "merge description". Generates professional PR titles and bodies grounded in the actual git diff, never inventing files, test results, issue numbers, or breaking-change claims.
license: MIT
---

# CREATE-PULL-REQUEST — Pull Request Creation Skill

> **Purpose:** operational rulebook for drafting the title and description of a Pull
> Request (or Merge Request) grounded in the repository's actual git diff — always
> following **first** the template the repository itself defines, and only in its
> absence the improved default template in this file.
>
> **Golden rule:** the repository's template wins. This file is the default, never an
> override. If the repo defines its own PR template, you fill **that one** and do not
> mix it with the one here.

---

## 0. How to Use This File

1. **Before writing anything**, determine the real scope of the changes in git (§3,
   Step 1): the description must be anchored to the diff, not to memory.
2. **Look for the repo's template** (§3, Step 2). If it exists: use it exactly as it
   is. If not: use the default template in §4 (copy its shape, don't improvise).
3. **Fill in only what you can verify** — from the diff, from commands you ran, or
   from what the user said explicitly. Anything unverifiable is omitted or marked as
   pending. It is never invented.
4. **Deliver per §3, Step 6**: the result is always saved as a numbered Markdown
   file in the `.pr-suggestions/` folder, and the PR is never opened on your own.

---

## 1. Non-Negotiables

- **Never fabricate** issue numbers, file paths, changes, test results, executed
  commands, screenshots, or breaking-change claims without evidence. A `Closes #123`
  that doesn't come from the repo or the user is a serious error.
- **The repo's template always wins.** If the repository defines its own PR template,
  or its `CONTRIBUTING.md` specifies the format, follow that. This file is the default
  for repos with no stated convention, not an override.
- **Every "Change" listed must exist in the actual diff.** Describing a change that
  was never made is fabrication — each bullet under Changes made must map to a real
  behavioral/functional difference in the diff.
- **Never report tests you did not run.** Write only results whose output you read in
  the session. If not run, write `Not run — pending in CI` and leave the checkbox
  unchecked.
- **No AI co-authorship.** No `Co-Authored-By: <AI>` or any mention of this kind in
  the PR body.
- **No placeholders in the final output.** An empty section is removed (no dangling
  `[complete]` or `<!-- ... -->`); an empty bullet is deleted.
- **Use the repository's language.** Write the description in the repo's dominant
  language (documentation, commit history, previous PR titles). One language per PR;
  never mix.
- **Never reinterpret already established facts.** If a commit says `fix(auth): ...`,
  the PR reflects exactly that; don't rewrite it as something broader or different to
  "sound better."
- **Always write the PR description to a Markdown file in `.pr-suggestions/`.**
  The description is never delivered only in the terminal or saved anywhere else;
  the folder (and file) is created if missing.
- **Number every PR file sequentially.** Files are `PR-001.md`, `PR-002.md`, … — one
  per suggestion, never overwritten and never reused. The highest number is always
  the most recent PR created.
- **Never constrain paragraph width.** No manual line wrapping/breaks inside
  paragraphs (e.g. hard-wrapping at 80 columns); write each paragraph as a single
  continuous line and let the renderer wrap it.
- **Always suggest a branch name.** Every PR description includes a proposed branch
  name (§3, Step 3), following the repo's own naming convention when one is
  detectable, or the `<type>/<scope>-<short-description>` kebab-case default
  otherwise. Never skip it, and never invent one unrelated to the actual change.

---

## 2. Workflow — Overview

```text
Determine scope (git status/diff/log)  →  Search for repo template
  →  Template found: fill it EXACTLY
  →  No template: use the default template in §4
  →  Final verification (§3, Step 5) → Save to .pr-suggestions/PR-00N.md (§3, Step 6)
```

---

## 3. Working Procedure

### Step 1 — Determine the Real Scope (never skip)

Run, in order:

```bash
git status                          # current branch, uncommitted files
git branch --show-current           # branch the work is on
git merge-base <base> HEAD          # common ancestor, for the diff against the base
git log --oneline <base>..HEAD      # commits the PR will include
git diff --stat <base>..HEAD        # files and volume of changes
git diff <base>..HEAD               # full detail: slow to read entirely, but
                                    # mandatory to be able to cite any change
git diff <base>..HEAD --name-only   # exact 1:1 list of touched paths (internal verification only)
```

Notes:

- Typical base: `main`, `master`, or `develop` — confirm with
  `git branch --show-current` and the user's conversation.
- **Untracked files**: `git status` shows them; they don't appear in
  `git diff <base>..HEAD`. Add them to the scope (as "Added") and read them directly.
- Extract the raw material of the description from the diff: what kind of change
  (added/modified/removed/refactored) and its functional effect, plus affected
  config (`package.json`, `.env*`, CI), migrations, public contracts, and touched
  `**/test*`/`*spec*` files. Use `git diff --name-only` / `--stat` only for
  internal scope analysis — do not copy file paths verbatim into the final
  Changes made section (see §4).
- Recur to the branch history (`git log --oneline <base>..HEAD -p`) for the "why":
  each commit message and the reasoning behind technical decisions.

### Step 2 — Search for the Repository Template

Walk the list in this order. First hit wins:

```text
.github/pull_request_template.md            ← GitHub standard, highest priority
.github/PULL_REQUEST_TEMPLATE.md
.github/PULL_REQUEST_TEMPLATE/pull_request_template.md
.github/PULL_REQUEST_TEMPLATE/*.md
PULL_REQUEST_TEMPLATE.md                     (repo root)
pull_request_template.md                     (repo root)
docs/pull_request_template.md
.gitlab/merge_request_templates/*.md         ← GitLab
.azuredevops/pull_request_template.md        ← Azure DevOps
```

Quick search command:

```bash
git ls-files '*ull*request*mplate*' 'merge_request*' | rg -i 'template'; ls .github 2>/dev/null
```

(Templates are normally committed, so `git ls-files` is enough. If there is a
`CONTRIBUTING.md`, read it: it often defines the PR format and wins the same way.)

Cases:

- **One template**: use it as the single source of structure. Do not add or remove
  sections; if it has placeholders you cannot fill from the diff, leave them marked
  as pending for the reviewer/user instead of inventing content.
- **Several templates**: prioritize `.github/pull_request_template.md` (GitHub's
  standard location); otherwise take the one `CONTRIBUTING.md` points to.
- **No template**: say "No PR template found in the repo — using the skill's default
  template." and use §4.

### Step 3 — PR Title

Format follows `git-commits` — `<type>(<scope>): <description>`:

```text
feat(auth): add Google login
fix(api): resolve 500 on user endpoint
refactor(utils): simplify email validation
chore(deps): upgrade react to 18.2
```

- `type` must match the real kind of change (feat/fix/refactor/perf/docs/chore…),
  never the closest-sounding one.
- `scope` consistent with the repo's existing vocabulary — check
  `git log --oneline -20` before inventing one.
- Description: imperative, short, no trailing period, in the repo's language.

**Branch name suggestion (mandatory, alongside the title):**

- First check the naming convention already in use: `git branch -a` /
  `git log --all --oneline --decorate` for recently merged branch names (e.g.
  `feature/...`, `feat/...`, `fix/JIRA-123-...`). If the repo has a clear pattern,
  follow it.
- If no convention is detectable, default to
  `<type>/<scope>-<short-kebab-case-description>` (e.g. `feat/auth-google-login`),
  reusing the same `type`/`scope` chosen for the PR title.
- If an issue number is known (§ Step 4, "Related issue"), include it when that
  matches the repo's own pattern (e.g. `fix/123-resolve-500-on-user-endpoint`) —
  never invent one to include it.
- Report the suggested branch name in the chat next to the title; it is a
  suggestion only — never create or rename a branch on the user's behalf without
  explicit instruction.

### Step 4 — PR Body

- If the repo has a template: follow **only** its structure. Nothing else, no
  additions. Without a template, use §4. For each section of the template being
  filled:

| Section              | Content source                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| Summary/Objective    | the "why": problem solved, commit rationale / what the user stated. 2–3 lines, not an implementation recap                            |
| Changes made         | summary of functional/behavioral changes grouped by type (Added/Modified/Removed/Refactored) — describe *what* changed and *why*, without listing individual file paths |
| Technical decisions  | motivation, alternatives evaluated and why rejected — from commits/history/discussion, never invented |
| Automated tests      | **real** outputs you ran; anything not run is marked pending             |
| How to test it       | setup/start commands, numbered steps 1..n, expected result                  |
| Impact / Risks        | derived from the diff (env/migrations/deps/API) + rollback — see §4   |
| Related issue        | number from the branch name (`fix/123-slug`), a footer in the commits, or the conversation — never guessed |

### Step 5 — Final Verification (before delivering)

- [ ] Every bullet under "Changes made" corresponds to a real change in the diff (functional/behavioral, not invented) — no file-path listing required.
- [ ] Every testing claim = command actually run in the session + output read.
- [ ] No placeholders (`[complete]`, `...`, empty bullets) or unevaluated `[ ]` left in.
- [ ] Title: type/scope correct and inside the repo's vocabulary.
- [ ] Issue number verified (known, safe provenance).
- [ ] No empty sections remain (removed).
- [ ] One single language across the whole PR.

### Step 6 — Output and Delivery

1. **Always save the PR description as a Markdown file in the `.pr-suggestions/`
   folder** (at the repo root; create the folder if it doesn't exist):
   - Numbering: `PR-001.md`, `PR-002.md`, … — compute the highest existing number
     in `.pr-suggestions/` and add 1. Start at `PR-001.md` when the folder is empty
     or missing.
   - Never overwrite an existing numbered file and never reuse a number.
   - The suffix `N` of the file name grows with each suggestion, so the user can
     tell at a glance which is the most recent PR created (the highest number).
2. Report the saved path in the chat (e.g. "Saved to `.pr-suggestions/PR-004.md`").
   The Markdown file is the only destination for the description — the terminal is
   never the final output.
3. **Never create or open the PR on your behalf**: wait for an explicit instruction.
   When the user asks, open it with
   `gh pr create --title "<title>" --body-file .pr-suggestions/PR-00N.md` and report
   the URL.

---

## 4. Default Template — only when the repo defines none

```markdown
# <type>(<scope>): <short descriptive title>

## Objective

Briefly explain what problem or need this PR solves and why it was necessary
(focused on the "why", not the "how" — two or three lines).

## Changes made

- **Added**: what was added and what it's for.
- **Modified**: what changed and how it differs from before.
- **Removed**: what was removed and why, and what replaces it if applicable.
- **Refactored**: what was reorganized with no behavior change.

> Do not list individual file paths — keep bullets focused on the functional change grouped by type. This avoids an excessively long list when many files are touched.

## Technical decisions

Explain decisions that aren't obvious from the code: why this approach over the
alternatives, and what was ruled out (and why).

Example:
Authentication logic was moved into `AuthService` to avoid duplication between
controllers. Extracting it into a middleware was ruled out because the session
flow differs per endpoint (different roles), and a global middleware would have
hidden that difference.

## Validation

Automated tests run locally, with their real outputs:

- [ ] `npm test` — 42 passed, 0 failed
- [ ] `npm run lint` — no errors
- [ ] `npm run typecheck` — no errors

If any check was not run: `Not run — pending in CI` and leave its box unchecked.

### How to test it locally

1. Run ...
2. Open ...
3. Perform ...
4. Check that ...

### Expected result

Describe exactly what should happen: what state, what response, what UI, what
log. If something should NOT happen, say it explicitly.

## Evidence

<!-- If applicable: screenshots / GIFs / logs / API responses with real data -->

## Impact / Risks

- Does it break compatibility? (breaking change in public APIs, contracts or
  shared dependencies feeding previous consumers?)
- Does it modify the database? (migration needed? backfill / rollback available?)
- Does it add environment variables? (list them and confirm they are documented
  in `.env.example`)
- Does it change an API? (endpoints added/removed, response shape, HTTP codes)
- New dependencies? (why are they needed? stable versions?)
- Does it affect other features, consumers, performance or security?

If none of the above applies: **No known breaking changes.**

**Rollback plan**: [which commit or PR to revert to undo this change, and what
risk reverting it involves]

## Related issue

Closes #123

## Checklist

- [ ] The project compiles
- [ ] Tested the changes locally
- [ ] Added/updated tests where applicable
- [ ] Tests pass locally (or CI is green)
- [ ] Lint and typecheck pass
- [ ] No debug, mock, or leftover code
- [ ] No secrets or credentials included
- [ ] Reviewed my own diff
- [ ] Documentation updated if applicable
```

Rules for this template:

- Only mark **boxes you have verified** (Step 5). An unchecked box is fine; a false
  one is not.
- Delete any section that doesn't apply (**Evidence**, **Technical decisions**,
  **How to test it** when already covered for validation); the **Impact / Risks**
  section is always kept, even when it says "No known breaking changes."
- Keep the leading bullet prefixes (**Added**/Modified/Removed/Refactored) — they make review easier. Do not add `path/to/file` or any individual file listings to these bullets.

---

## 5. Anti-Patterns to Avoid

- **Writing without reading the diff** — describing code you never saw.
- **Inventing templates** — mixing your own sections with the repo's, or using a
  default section when the repo has its own.
- **Leftover placeholders**: `[complete]`, `...` empty bullets → delete them.
- **Fake validation results**: marking a checkbox because "it surely passes" is
  fabricating evidence.
- **Invented numbers**: `Closes #999` without provenance. Better to omit the line
  than guess.
- **False or omitted breaking-change claims** — a wrong type or `BREAKING CHANGE:`
  marker still triggers the wrong release version bump.
- **AI co-author trailers** and external references used as justification.
- **Copying another PR's description**: each PR describes exactly the changes it
  contains, nothing more.
- **Saving the PR description outside `.pr-suggestions/`**, printing it only in the
  terminal, overwriting an existing numbered file, or reusing a number — the
  `.pr-suggestions/PR-00N.md` sequence is the only delivery contract.

---

## 6. Relationship with Other Skills

- **git-commits** — title format (`<type>(<scope>): …`) and shared anti-patterns.
  This skill adds repo-template detection, the diff-anchored body, and the default
  template.
- **pre-pr-review** — run it before creating the PR to catch blockers; if the user
  asks for a prior review, run it for real and don't invent its output.
- **verify-before-implement** — the same principle applied to writing: every claim
  is verified against the actual code before it enters the PR.