---
name: git-commits
description: Write clear, semantic git commit messages and PR descriptions following Conventional Commits. Use when the user asks to write commit messages, create PR descriptions, format git history, improve commit quality, or mentions "commit message", "conventional commits", "PR description", "merge message", or "git history". Generates professional, consistent commit messages that make project history easy to understand.
license: MIT
---

This skill guides the creation of clear, semantic git commit messages and pull request descriptions following Conventional Commits specification.

The user may provide code changes, context about what they did, or ask for help writing commits or PR descriptions. They may specify the scope, type, or level of detail needed.

## Delivering the Result

Once the commit message (or PR description) is drafted, deliver it according to these rules, in order:

1. **Prefer writing it to a Markdown file.** Default to saving the result in a `.md` file rather than only printing it in the chat.
2. **If the user didn't say where to save it, ask.** Prompt for the destination folder/path before writing anything.
3. **If the user has no preference or skips the question, print it in the terminal instead.** Don't guess a path or silently create files/folders the user never confirmed — fall back to plain terminal output.

Do not apply a text-width wrap when writing the message (see below) — this applies whether the final output lands in a file or the terminal.

## Conventional Commits Format

### Basic Structure

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

| Type       | When to Use                                       | Examples                         |
| ---------- | ------------------------------------------------- | -------------------------------- |
| `feat`     | New feature or functionality added                | New API endpoint, UI component   |
| `fix`      | Bug fix or error correction                       | Resolve crash, fix validation    |
| `docs`     | Documentation changes only                        | README updates, code comments    |
| `style`    | Code formatting, whitespace (no logic changes)    | Linting fixes, formatting        |
| `refactor` | Code restructuring without changing functionality | Extract method, rename variables |
| `test`     | Adding or modifying tests                         | Unit tests, integration tests    |
| `chore`    | Maintenance, configuration, dependencies          | Update packages, config changes  |

**Choose the RIGHT type**: If you changed functionality, it's `feat` or `fix`, not `refactor`. If you only reformatted, it's `style`, not `refactor`.

### Scope (optional but recommended)

The scope indicates what part of the codebase is affected:

- **Module/Feature**: `auth`, `api`, `dashboard`, `payments`
- **Component**: `button`, `navbar`, `form`
- **File/Area**: `utils`, `middleware`, `models`

**Rules**:

- Use lowercase
- Be specific but not too granular: `auth` not `auth/login/validation`
- Omit scope only if change affects multiple areas equally

## Writing Effective Commits

### Description (required)

The first line after `type(scope):` — **50 characters or less**.

**GOOD descriptions**:

- Use imperative mood: "add", "fix", "update" (not "added", "fixes", "updating")
- Be specific about WHAT changed: "add JWT authentication" not "add auth"
- Start with lowercase (after the colon)
- No period at the end
- Describe the change, not the problem

```bash
feat(auth): add JWT authentication with refresh tokens
fix(api): resolve 500 error when user email is missing
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

### Body (optional, use when needed)

Add a body when:

- The "why" is not obvious from the description
- Multiple changes need explaining
- Context or reasoning is important
- Breaking changes need details

**Format**:

- Blank line after description
- Do not hard-wrap lines to a fixed width (e.g. 72 chars) — let each line run the full width of the file/terminal
- Use bullet points for multiple items
- Explain WHY, not WHAT (code shows what)

```bash
feat(auth): add JWT authentication with refresh tokens

Implement JWT-based authentication to replace session cookies.
This improves scalability for distributed deployments.

- Generate access tokens (15min expiry)
- Generate refresh tokens (7 day expiry)
- Add token refresh endpoint
- Store refresh tokens in httpOnly cookies
```

**When to skip the body**: If the description is self-explanatory, skip it. Don't add a body just to add one.

### Footer (optional, use for metadata)

Use footer for:

- **Breaking changes**: `BREAKING CHANGE: description`
- **Issue references**: `Closes #123`, `Fixes #456`, `Refs #789`
- **Reviewed by**: `Reviewed-by: @username`

**Never add an AI co-author trailer.** Do not include `Co-Authored-By: <AI name>` (or any similar attribution to the AI/assistant that helped draft the change) in the commit message, footer, or PR description — the human author is the sole author of record, regardless of which tool was used to write the message.

```bash
feat(api): change user endpoint response format

BREAKING CHANGE: User endpoint now returns `userId` instead of `id`

Closes #234
```

## Complete Examples

### Simple Commit (no body needed)

```bash
fix(auth): prevent duplicate user registration
```

### Medium Commit (with body)

```bash
feat(dashboard): add user activity metrics chart

Implement interactive chart showing user activity over time
with daily, weekly, and monthly views.

- Use Chart.js for visualization
- Add date range selector
- Cache data for 5 minutes
```

### Complex Commit (with footer)

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

### Breaking Change Indicator

Use `!` after type/scope for breaking changes:

```bash
feat(api)!: require authentication for all endpoints
```

## Pull Request / Merge Message Format

### PR Title

Same format as commit:

```
<type>(<scope>): <brief description>
```

### PR Description Template

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

### PR Examples

**Simple PR**:

```markdown
fix(auth): resolve login redirect loop

## Changes

- Fix infinite redirect when session expires
- Add proper error handling for expired tokens
- Update tests

Closes #45
```

**Feature PR**:

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

## Common Scenarios

### Multiple Related Changes

If changes are related, use ONE commit:

```bash
feat(auth): add password reset functionality

- Create reset token generation
- Add email sending service
- Implement reset verification
- Add reset form UI
```

### Multiple Unrelated Changes

If changes are unrelated, use SEPARATE commits:

```bash
git commit -m "fix(api): resolve CORS issue"
git commit -m "docs(readme): update API examples"
git commit -m "chore(deps): update eslint to v8"
```

### Dependency Updates

```bash
# Single package
chore(deps): upgrade react to v18.2.0

# Multiple security updates
chore(deps): update security dependencies

- axios: 0.21.1 -> 1.6.0
- express: 4.17.1 -> 4.18.2
```

### Configuration Changes

```bash
chore(config): update ESLint rules for TypeScript

- Enable strict type checking
- Add import sorting rules
- Update prettier integration
```

## Anti-Patterns to Avoid

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

## Quality Checklist

Before committing, verify:

- [ ] Type accurately reflects the change
- [ ] Scope is specific and lowercase
- [ ] Description is imperative, specific, and under 50 chars
- [ ] Body explains WHY if not obvious (optional)
- [ ] Footer includes issue references if applicable
- [ ] Breaking changes are clearly marked
- [ ] Commit is atomic (one logical change)
- [ ] Message would make sense in git history

## Git History Impact

Remember: commit messages are for your FUTURE SELF and TEAMMATES.

**Good commit history enables**:

- Quick understanding of project evolution
- Easy rollback to specific features
- Automated changelog generation
- Semantic versioning automation
- Better code review process

**Your commit message should answer**:

1. **What** changed? (description)
2. **Why** did it change? (body, if not obvious)
3. **What's** the impact? (breaking changes, issue references)

---

> "A well-crafted commit message is the best way to communicate context about a change to fellow developers (and your future self)." — Conventional Commits

**Write commits as if you're explaining to a teammate who joined the project today.**
