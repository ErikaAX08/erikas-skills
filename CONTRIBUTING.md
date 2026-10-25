# Contributing

## Requirements

- Node >= 18, pnpm >= 9 (`corepack enable pnpm`)

## Workflow

```bash
pnpm install
pnpm run validate          # frontmatter + synchronized versions + Spec Kit cross-references
pnpm run test:cli          # installer tests (what lands in a user's project), also run in CI
pnpm run test:spec-kit     # Spec Kit script tests (fingerprint, lint, run log, reference check), also run in CI
pnpm run sync:versions     # if you change the version in the root
pnpm pack --dry-run        # inspect tarball contents
npx erikas-skills install --dry-run --target claude
```

## Rules

- One skill = one top-level folder with `SKILL.md` (frontmatter `name`/`description`) + `package.json` (`@erikaax/<folder>`), listed in `pnpm-workspace.yaml`. `package.json`, the skill's own `README.md`, `evals/`, and any `test/` folder are repo-only: the installer does not copy them into users' projects.
- Spec Kit is atomic: do not publish a single skill from the kit. Use `@erikaax/spec-kit` (includes every kit skill + `spec-kit-shared`). The kit's skill list lives only in `speckit.skills` of `spec-kit/package.json`; installer, validator, and packaging scripts read it from there.
- Spec Kit documents cite each other by file path or `` `file` § Heading `` (a bare `§ Heading` means the same file); `pnpm run validate` fails when a cited path or heading no longer exists, so rename both together. Commands that run a shared script write `node <skills-root>/spec-kit-shared/scripts/<script>.mjs` — the kit is installed next to the user's project, not inside it — and `validate` rejects a bare `node spec-kit-shared/…`.
- A change to Spec Kit's artifact grammar or mechanical checks updates `spec-kit-shared/artifact-conventions.md`, the scripts, and their tests together; behavior the scripts cannot check gets a case in that skill's `evals/` (see `spec-kit-shared/evals/README.md`).
- If you change `version` in the root `package.json`, run `pnpm run sync:versions` to propagate it to every workspace in `pnpm-workspace.yaml`.
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
