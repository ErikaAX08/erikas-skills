# Contributing

## Requirements

- Node >= 18, pnpm >= 9 (`corepack enable pnpm`)

## Workflow

```bash
pnpm install
pnpm run validate          # frontmatter + synchronized versions
pnpm run sync:versions     # if you change the version in the root
pnpm pack --dry-run        # inspect tarball contents
npx erikas-skills install --dry-run --target claude
```

## Rules

- One skill = one top-level folder with `SKILL.md` (frontmatter `name`/`description`) + `package.json` (`@erikaax/<folder>`).
- Spec Kit is atomic: do not publish a single skill from the kit. Use `@erikaax/spec-kit` (includes 7 skills + `spec-kit-shared`).
- If you change `version` in the root `package.json`, run `pnpm run sync:versions` to propagate it to all 14 workspaces.
- Commits and PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/).
- Do not list file paths as "changes" in a PR — describe behavior instead.

## Publishing

```bash
pnpm -r publish --access public   # skills + spec-kit
pnpm publish --access public      # erikas-skills bundle
# or push a v* tag and .github/workflows/release.yml will handle it
```

## Bug reports / proposals

Use the issue templates in `.github/ISSUE_TEMPLATE/`.
