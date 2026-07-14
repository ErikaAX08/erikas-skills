---
name: git-commits
description: Write clear, semantic git commit messages and PR descriptions following Conventional Commits. Use when the user asks to write commit messages, create PR descriptions, format git history, improve commit quality, or mentions "commit message", "conventional commits", "PR description", "merge message", or "git history". Generates professional, consistent commit messages that make project history easy to understand.
license: MIT
---

# GIT-COMMITS.md — Conventional Commits Engineering Skill

> **Purpose:** this is the operational rulebook an AI agent (or a human) follows to write commit
> messages, PR descriptions, and merge messages that make project history easy to read, bisect, and
> automate against — without the vagueness, mixed concerns, and inconsistency that make git history
> useless six months later.
>
> **This file is self-contained by design.** It doesn't assume access to any specific repo's own
> `CONTRIBUTING.md` or commit conventions. If the target repo has its own documented commit
> conventions, those win over this file wherever they conflict — this file is the default, not an
> override.

---

## 0. How to use this file

1. **Before writing a commit message**, identify: is this one logical change or several unrelated
   ones? Use §6 ("Multiple Related vs. Unrelated Changes") to decide whether to split into multiple
   commits before drafting any message.
2. **While drafting**, follow §2–§4 for type, scope, description, body, and footer. Check §1's
   non-negotiables first — they catch the mistakes that are easiest to make on autopilot.
3. **For anything other than a plain new commit** (a revert, a merge, an amend, a squash, a hotfix,
   a dependency bump), check §5 — these have their own shape and their own rules about what's safe to
   rewrite.
4. **Before opening a PR**, use §7 for the PR title/description template and §8 for real scenario
   examples.
5. **Before delivering the final message**, run it through §10 (quality checklist) and follow §11's
   delivery rules for *where* the result goes (file vs. terminal).
6. If the user's repo has its own commit convention that conflicts with this file, **the repo's own
   convention wins** — treat this file as the default for repos with no stated convention of their
   own, not as an override.

---

## 1. Non-negotiables (would make a commit message wrong, not just imperfect)

- **Never fabricate scope, issue numbers, or breaking-change claims.** If you don't know the ticket
  number or whether a change is actually breaking, don't guess one to fill the template — omit the
  field or ask.
- **Never include an AI co-author trailer.** No `Co-Authored-By: <AI name>` or similar attribution to
  the assistant/tool that helped draft the message, in the commit body, footer, or PR description —
  the human author is the sole author of record.
- **Never cite external URLs or outside sources as justification** for a change (Stack Overflow, blog
  posts, RFC links, library docs). Describe the change in terms of the codebase itself. The only
  exception is links to the repo's *own* issue/PR tracker in the footer (`Closes #123`).
- **Never mix unrelated changes in one commit.** A commit is atomic: one logical change, one
  reviewable unit, one thing to revert if it's wrong.
- **Never rewrite history that's already pushed to a shared branch** (`git commit --amend`,
  `git rebase`, `git push --force`) without the user's explicit go-ahead for that specific action —
  this applies even if the user approved a similar rewrite earlier in the session. See §5.4.
- **Never use vague or generic descriptions** ("fix bug", "update code", "changes") — a description
  that doesn't tell a reader *what* changed without opening the diff has failed its one job.
- **Never claim a `BREAKING CHANGE` footer or `!` marker on a change that isn't actually breaking**,
  and never omit one on a change that is — this directly feeds automated semantic-version bumps
  (§9), so getting it wrong corrupts the next release number, not just the changelog.

---

## 2. Conventional Commits Format

### 2.1 Basic Structure

```
<type>(<scope>)!: <description>

[optional body]

[optional footer(s)]
```

### 2.2 Commit Types

| Type       | When to Use                                            | Examples                             |
| ---------- | -------------------------------------------------------- | ------------------------------------- |
| `feat`     | New feature or functionality added                       | New API endpoint, UI component        |
| `fix`      | Bug fix or error correction                               | Resolve crash, fix validation         |
| `perf`     | A code change that improves performance, no behavior change | Add index, memoize, reduce allocations |
| `docs`     | Documentation changes only                                | README updates, code comments         |
| `style`    | Code formatting, whitespace (no logic changes)            | Linting fixes, formatting             |
| `refactor` | Code restructuring without changing functionality         | Extract method, rename variables      |
| `test`     | Adding or modifying tests                                  | Unit tests, integration tests         |
| `build`    | Changes to build system or external dependencies          | Webpack config, package.json          |
| `ci`       | Changes to CI configuration/scripts                        | GitHub Actions, pipeline steps        |
| `chore`    | Maintenance, configuration, dependencies                   | Update packages, config changes       |
| `revert`   | Reverts a previous commit                                  | See §5.1 for the required format      |

**Choose the RIGHT type**: If you changed functionality, it's `feat` or `fix`, not `refactor`. If you
only reformatted, it's `style`, not `refactor`. If nothing about behavior changed but it's faster,
it's `perf`, not `feat`/`fix`. If it only touches pipeline/build tooling, it's `ci`/`build`, not
`chore` — `chore` is for everything else that doesn't fit a more specific type (don't let it become
the default dumping ground; if a more specific type fits, use it).

### 2.3 Scope (optional but recommended)

The scope indicates what part of the codebase is affected:

- **Module/Feature**: `auth`, `api`, `dashboard`, `payments`
- **Component**: `button`, `navbar`, `form`
- **File/Area**: `utils`, `middleware`, `models`
- **Monorepo package**: the package/workspace name (`web`, `mobile`, `shared-ui`) — see §5.5 for how
  to scope a change that spans more than one package.

**Rules**:

- Use lowercase.
- Be specific but not too granular: `auth` not `auth/login/validation`.
- Stay consistent with scopes already used in the repo's history — check `git log --oneline` for the
  existing vocabulary before inventing a new scope name for something that already has one (e.g.
  don't introduce `authentication` if every prior commit used `auth`).
- Omit scope only if the change affects multiple areas equally and no single scope (or `*` in a
  monorepo, per §5.5) would be accurate.

---

## 3. Writing Effective Commits

### 3.1 Description (required)

The first line after `type(scope):` — **50 characters or less**.

**GOOD descriptions**:

- Use imperative mood: "add", "fix", "update" (not "added", "fixes", "updating") — read it as
  completing the sentence "If applied, this commit will **___**."
- Be specific about WHAT changed: "add JWT authentication" not "add auth".
- Start with lowercase (after the colon).
- No period at the end.
- Describe the change, not the problem it was found in ("fix null pointer on empty cart" not "cart
  was crashing").

```bash
feat(auth): add JWT authentication with refresh tokens
fix(api): resolve 500 error when user email is missing
perf(search): memoize tokenizer output to skip re-parsing
docs(readme): update installation instructions for Docker
refactor(utils): simplify email validation logic
test(auth): add integration tests for login flow
chore(deps): upgrade React to v18.2.0
```

**BAD descriptions**:

```bash
feat(auth): Auth stuff                           # Too vague
fix(api): Fixed the bug                          # Not specific
docs(readme): Updated README.md                  # Redundant scope
refactor(utils): Refactored code                 # Says nothing
test(auth): Tests                                # Too generic
chore: changes                                   # Meaningless
```

### 3.2 Body (optional, use when needed)

Add a body when:

- The "why" is not obvious from the description.
- Multiple changes need explaining.
- Context or reasoning is important.
- Breaking changes need details.

**Format**:

- Blank line after description.
- Do not hard-wrap lines to a fixed width (e.g. 72 chars) — let each line run the full width of the
  file/terminal.
- Use bullet points for multiple items.
- Explain WHY, not WHAT (code shows what).

**No external references**: describe the code change itself — never link to or cite external
documentation, blog posts, Stack Overflow answers, RFCs, library docs, or other outside sources as
justification. If a decision needs grounding, explain it in terms of the codebase (what it fixes,
what behavior it changes, what constraint it satisfies), not by pointing outside the repo. Links to
internal issue/PR trackers in the footer (`Closes #123`) are the only exception.

```bash
feat(auth): add JWT authentication with refresh tokens

Implement JWT-based authentication to replace session cookies.
This improves scalability for distributed deployments.

- Generate access tokens (15min expiry)
- Generate refresh tokens (7 day expiry)
- Add token refresh endpoint
- Store refresh tokens in httpOnly cookies
```

**When to skip the body**: if the description is self-explanatory, skip it. Don't add a body just to
add one — a padded body is as much noise as a missing one.

### 3.3 Footer (optional, use for metadata)

Use footer for:

- **Breaking changes**: `BREAKING CHANGE: description` — must explain what breaks and, if possible,
  the migration path.
- **Issue references**: `Closes #123`, `Fixes #456`, `Refs #789`.
- **Reviewed by**: `Reviewed-by: @username`.

**Never add an AI co-author trailer.** Do not include `Co-Authored-By: <AI name>` (or any similar
attribution to the AI/assistant that helped draft the change) in the commit message, footer, or PR
description — the human author is the sole author of record, regardless of which tool was used to
write the message.

```bash
feat(api): change user endpoint response format

BREAKING CHANGE: User endpoint now returns `userId` instead of `id`

Closes #234
```

---

## 4. Breaking Changes

Use `!` after type/scope for breaking changes, and pair it with a `BREAKING CHANGE:` footer that
explains the actual impact — the `!` alone tells a reader *that* something breaks, not *what*:

```bash
feat(api)!: require authentication for all endpoints

BREAKING CHANGE: All API requests now require a valid Bearer token.
Requests without one now return 401 instead of proceeding anonymously.
```

A breaking change to a **public** contract (API response shape, CLI flags, exported function
signature, config file schema, published package's public API) always gets `!` + footer. An internal
refactor that happens to change a private function's signature is not a breaking change in the
Conventional Commits sense, even if it "breaks" callers within the same PR — those callers are being
updated in the same change, so nothing external observes a break.

---

## 5. Special Commit Patterns

### 5.1 Reverts

```
revert: <type>(<scope>): <original description>

This reverts commit <full-commit-hash>.

Reason: <why this is being reverted — regression discovered, wrong approach, blocked by an
incident, etc.>
```

Keep the original commit's type/scope/description in the revert's subject line so history stays
searchable — don't write a fresh description of "what got un-done." Always state *why* in the body;
`git revert`'s auto-generated message alone ("Revert 'feat: add X'") is not sufficient on its own once
a body is added, because a future reader needs to know whether it's safe to re-apply.

### 5.2 Merge commits

Most repos should prefer squash or rebase merges over a merge commit for feature branches (fewer,
cleaner history entries) — but if the repo's workflow uses merge commits, the default merge message
(`Merge branch 'feature-x' into main`) is fine as-is; don't invent a Conventional Commits type for a
merge commit produced by the platform. Only hand-edit a merge commit message when merging resolves a
non-trivial conflict that future readers should know about — in that case, add a short body explaining
the resolution choice.

### 5.3 Squashing multiple commits into one

When a PR's branch has several WIP/fixup commits ("wip", "address review comments", "fix typo") that
should become one commit on `main`, the squashed message should read as if the whole PR had been
written as a single, well-planned commit from the start — not as a concatenation of the WIP subject
lines. Pick the single type/scope/description that best represents the net effect, and use the body to
list the sub-changes as bullets (see the "Medium Commit" example in §8).

### 5.4 Amending and rebasing — when it's safe

- **Amending a commit that hasn't been pushed yet, or only exists on a branch only you are working
  on**, is fine and often better than creating a "fix typo in previous commit" follow-up commit.
- **Amending or rebasing a commit that's already pushed to a shared branch** (anything another
  collaborator may have already pulled, or an open PR others are reviewing) rewrites history other
  people rely on — always confirm with the user before doing this, and never force-push over it
  without explicit confirmation for that specific push (per this skill's git safety rules: creating a
  new commit is always the default; amend/rebase/force-push are opt-in per action, not a standing
  permission).
- If a pre-commit hook rejects a commit, the commit did not happen — fix the issue and create a new
  commit, don't reach for `--amend` believing there's something to amend.

### 5.5 Monorepo / multi-package changes

- If a change is scoped to one package/workspace, use that package's name as the scope:
  `feat(web): add dark mode toggle`.
- If a change is genuinely cross-cutting (a shared lint config, a root-level dependency bump, a CI
  pipeline change affecting every package), either omit the scope or use a repo-wide convention if one
  already exists (e.g. `*` or `repo`) — check `git log` for the existing convention rather than
  inventing one.
- If a change touches two or three related packages for one logical reason (a shared type changes,
  and its two consumers are updated in the same commit because the build would otherwise be broken),
  one commit with the most relevant scope (or the shared dependency's scope) is correct — this is not
  the "unrelated changes" case in §6 that requires splitting.

### 5.6 Hotfixes and cherry-picks

- A hotfix commit follows the same `fix(scope): description` format as any other fix — "hotfix" is a
  workflow label (which branch it targets, how urgently it ships), not a Conventional Commits type.
- A cherry-picked commit keeps its original message. If `git cherry-pick -x` appends a
  `(cherry picked from commit <hash>)` line, leave it — it's useful provenance, not noise to strip.

---

## 6. Multiple Related vs. Unrelated Changes

**Related changes → ONE commit:**

```bash
feat(auth): add password reset functionality

- Create reset token generation
- Add email sending service
- Implement reset verification
- Add reset form UI
```

**Unrelated changes → SEPARATE commits:**

```bash
git commit -m "fix(api): resolve CORS issue"
git commit -m "docs(readme): update API examples"
git commit -m "chore(deps): update eslint to v8"
```

The test: if reverting one of the changes would require also reverting the other to keep the codebase
working, they're related and belong in one commit. If they're independently revertible, split them.

---

## 7. Pull Request / Merge Message Format

### 7.1 PR Title

Same format as a commit:

```
<type>(<scope>): <brief description>
```

### 7.2 PR Description Template

```markdown
## Description

[Brief overview of what this PR does]

## Changes

- Specific change 1
- Specific change 2
- Specific change 3

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)

## Related Issues

Closes #[issue-number]
Refs #[related-issue]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots for UI changes]
```

Fill in only the sections that apply — an empty "Screenshots" section on a backend-only PR is noise,
delete it rather than leaving `[Add screenshots for UI changes]` as a placeholder.

---

## 8. Complete Examples

### 8.1 Simple Commit (no body needed)

```bash
fix(auth): prevent duplicate user registration
```

### 8.2 Medium Commit (with body)

```bash
feat(dashboard): add user activity metrics chart

Implement interactive chart showing user activity over time
with daily, weekly, and monthly views.

- Use Chart.js for visualization
- Add date range selector
- Cache data for 5 minutes
```

### 8.3 Complex Commit (with footer)

```bash
refactor(api)!: restructure error handling

Standardize error responses across all endpoints with consistent
format and HTTP status codes.

- Create centralized error middleware
- Define error response schema
- Update all endpoints to use new format

BREAKING CHANGE: Error responses now use `error.code` instead of `errorCode`

Closes #156
Refs #89
```

### 8.4 Simple PR

```markdown
fix(auth): resolve login redirect loop

## Changes

- Fix infinite redirect when session expires
- Add proper error handling for expired tokens
- Update tests

Closes #45
```

### 8.5 Feature PR

```markdown
feat(dashboard): add user dashboard with analytics

## Changes

- Implement activity charts with Chart.js
- Add date range filters (daily/weekly/monthly)
- Optimize database queries with indexing
- Add loading states and error handling

## Testing

- Added unit tests for chart components
- Added integration tests for data fetching
- Manual testing on Chrome, Firefox, Safari

Closes #23
Refs #67
```

### 8.6 Dependency Updates

```bash
# Single package
chore(deps): upgrade react to v18.2.0

# Multiple security updates
chore(deps): update security dependencies

- axios: 0.21.1 -> 1.6.0
- express: 4.17.1 -> 4.18.2
```

### 8.7 Configuration Changes

```bash
chore(config): update ESLint rules for TypeScript

- Enable strict type checking
- Add import sorting rules
- Update prettier integration
```

### 8.8 Revert

```bash
revert: feat(search): add fuzzy matching to search

This reverts commit a1b2c3d4e5f6.

Reason: caused a 3x latency regression on the search endpoint under
production load; reverting while the indexing strategy is redesigned.
```

### 8.9 Performance fix

```bash
perf(images): lazy-load offscreen thumbnails

Defer decoding of thumbnails outside the viewport instead of loading
all of them on initial render.

- Use IntersectionObserver to trigger load
- Add low-res placeholder to avoid layout shift
```

---

## 9. Anti-Patterns to Avoid

**Vague descriptions**:

```bash
fix: bug fix
feat: new stuff
chore: updates
```

**Too much in one commit**:

```bash
feat: add login, fix dashboard, update docs, refactor utils
# Split into 4 commits!
```

**Wrong verb tense**:

```bash
feat(auth): added login       # Use "add"
fix(api): fixing bug          # Use "fix"
docs: updated README          # Use "update"
```

**Mixing concerns**:

```bash
feat(auth): add login and fix unrelated bug in dashboard
# Split these!
```

**Redundant information**:

```bash
docs(readme): update README.md file with new info
# Better: docs(readme): add Docker installation steps
```

**External references instead of describing the code**:

```bash
fix(api): apply fix as described in https://stackoverflow.com/...
feat(auth): implement per official OAuth2 RFC spec (see link)
# Better: fix(api): correctly encode special characters in query params
# Better: feat(auth): add OAuth2 authorization code flow with PKCE
```

**Wrong type for the actual change**:

```bash
refactor(auth): add rate limiting to login endpoint
# This changes behavior — it's `feat`, not `refactor`.

chore(search): cache tokenizer output to cut p95 latency
# This is a targeted performance improvement — it's `perf`, not `chore`.
```

**Mislabeled breaking change**:

```bash
feat(api): rename internal helper function
# No `!`/BREAKING CHANGE footer needed — nothing external observes this.

fix(api): change response field from `id` to `userId`
# Missing `!` and BREAKING CHANGE footer — this breaks every existing consumer.
```

**Rewriting the WIP history verbatim into the squashed commit**:

```bash
wip
fix typo
address review comments
actually fix the bug this time
# Squash into ONE commit that describes the net change, per §5.3 — not a
# concatenation of these subject lines.
```

---

## 10. Quality Checklist

Before committing, verify:

- [ ] Type accurately reflects the *kind* of change (§2.2) — not just the closest-sounding one.
- [ ] Scope is specific, lowercase, and consistent with the repo's existing scope vocabulary.
- [ ] Description is imperative, specific, and under 50 chars.
- [ ] Body explains WHY if not obvious (optional).
- [ ] Footer includes issue references if applicable.
- [ ] Breaking changes are marked with `!` **and** a `BREAKING CHANGE:` footer explaining the impact
      — and non-breaking changes have neither.
- [ ] Commit is atomic (one logical, independently revertible change).
- [ ] No AI co-author trailer, no external URLs used as justification.
- [ ] If this rewrites history that's already pushed (amend/rebase), the user has explicitly
      confirmed that specific action (§5.4).
- [ ] Message would make sense to a teammate reading it in `git log` with zero other context.

---

## 11. Delivering the Result

Once the commit message (or PR description) is drafted, deliver it according to these rules, in
order:

1. **Prefer writing it to a Markdown file.** Default to saving the result in a `.md` file rather than
   only printing it in the chat.
2. **If the user didn't say where to save it, ask.** Prompt for the destination folder/path before
   writing anything.
3. **If the user has no preference or skips the question, print it in the terminal instead.** Don't
   guess a path or silently create files/folders the user never confirmed — fall back to plain
   terminal output.

Do not apply a text-width wrap when writing the message (§3.2) — this applies whether the final output
lands in a file or the terminal.

---

## 12. Git History Impact

Remember: commit messages are for your FUTURE SELF and TEAMMATES.

**Good commit history enables**:

- Quick understanding of project evolution.
- Easy rollback to specific features.
- Automated changelog generation.
- Semantic versioning automation — `fix` → patch bump, `feat` → minor bump, any `!`/`BREAKING CHANGE`
  → major bump. Getting the type or breaking-change marker wrong doesn't just mislabel history, it
  ships the wrong version number.
- Better code review process — a reviewer should be able to tell what a PR does from its title alone,
  before opening the diff.

**Your commit message should answer**:

1. **What** changed? (description)
2. **Why** did it change? (body, if not obvious)
3. **What's** the impact? (breaking changes, issue references)

---

> "A well-crafted commit message is the best way to communicate context about a change to fellow
> developers (and your future self)." — Conventional Commits

**Write commits as if you're explaining to a teammate who joined the project today.**
