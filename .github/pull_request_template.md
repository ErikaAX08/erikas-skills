<!-- Use Conventional Commits for the title: feat/fix/docs/chore/refactor/test -->
<!-- This template is auto-applied when creating a PR. Remove sections that don't apply. -->

## What changed

<!-- Summary in 1-3 lines -->

## Why

<!-- Context / related issue: Closes #... -->

## How it was tested

- [ ] `pnpm run validate` passes
- [ ] `pnpm pack --dry-run` reviewed (if `files` or `package.json` changed)
- [ ] Tested `npx erikas-skills install --dry-run --target claude`

## Checklist

- [ ] Title follows Conventional Commits
- [ ] `pnpm run sync:versions` executed if `version` changed
- [ ] Docs updated (README / SKILL.md) if applicable
- [ ] No file paths listed as "changes" — behavior is described instead

## Breaking changes

<!-- If any, describe migration. Otherwise delete this section. -->
