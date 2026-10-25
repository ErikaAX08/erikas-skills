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

- One skill = one top-level folder with `SKILL.md` (frontmatter `name`/`description`) + `package.json` (`@erikaax/<folder>`), listed in `pnpm-workspace.yaml` and in exactly one plugin of `.claude-plugin/marketplace.json` (`pnpm run validate` checks both; `claude plugin validate .` checks the marketplace format). `package.json`, the skill's own `README.md`, `evals/`, and any `test/` folder are repo-only: the installer does not copy them into users' projects.
- Spec Kit is atomic: do not publish a single skill from the kit. Use `@erikaax/spec-kit` (includes every kit skill + `spec-kit-shared`). The kit's skill list lives only in `speckit.skills` of `spec-kit/package.json`; installer, validator, and packaging scripts read it from there.
- Spec Kit documents cite each other by file path or `` `file` § Heading `` (a bare `§ Heading` means the same file); `pnpm run validate` fails when a cited path or heading no longer exists, so rename both together. Commands that run a shared script write `node <skills-root>/spec-kit-shared/scripts/<script>.mjs` — the kit is installed next to the user's project, not inside it — and `validate` rejects a bare `node spec-kit-shared/…`.
- A change to Spec Kit's artifact grammar or mechanical checks updates `spec-kit-shared/artifact-conventions.md`, the scripts, and their tests together; behavior the scripts cannot check gets a case in that skill's `evals/` (see `spec-kit-shared/evals/README.md`).
- If you change `version` in the root `package.json`, run `pnpm run sync:versions` to propagate it to every workspace in `pnpm-workspace.yaml`.
- Commits and PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/).
- Do not list file paths as "changes" in a PR — describe behavior instead.

## Publishing

Releases publish from GitHub Actions with npm trusted publishing (OIDC), so no npm token is stored anywhere:

1. Bump `version` in the root `package.json`, run `pnpm run sync:versions`, and move the CHANGELOG's Unreleased entries under the new version.
2. Push a `v<version>` tag. `.github/workflows/release.yml` checks that the tag matches the version, runs `pnpm test`, publishes every package whose version is not on npm yet (with provenance), and creates the GitHub Release.

### First release only

npm can link a package to the workflow only once the package exists, so the first version goes out from your machine:

1. Create the `erikaax` organization on npmjs.com (it owns the `@erikaax/*` scope) and enable 2FA on your account.
2. Publish every package once:

   ```bash
   npm login
   for dir in $(grep '^  - ' pnpm-workspace.yaml | sed 's/^  - //') .; do
     (cd "$dir" && npm publish --access public)
   done
   ```

3. Link each package to the release workflow (`npm trust` needs npm >= 11.15.0: `npm install -g npm@^11.15.0`). The first call asks for 2FA; accept the offer to skip it for 5 minutes and the loop finishes without more prompts:

   ```bash
   for dir in $(grep '^  - ' pnpm-workspace.yaml | sed 's/^  - //') .; do
     (cd "$dir" && npm trust github --file release.yml --repo ErikaAX08/erikas-skills --allow-publish --yes)
     sleep 2
   done
   ```

From then on, a tag is all a release needs.

## Bug reports / proposals

Use the issue templates in `.github/ISSUE_TEMPLATE/`.
