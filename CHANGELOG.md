# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Claude Code plugin marketplace (`.claude-plugin/marketplace.json`): the skills install as six plugins — `frontend`, `backend`, `workflow`, `docs`, `orchestration`, `spec-kit` — with `/plugin install <plugin> --marketplace ErikaAX08/erikas-skills`. `pnpm run validate` checks that every skill is in exactly one plugin.

### Changed
- Releases publish with npm trusted publishing (OIDC) instead of an `NPM_TOKEN` secret, after running the full test suite and checking that the tag matches the version; versions already on npm are skipped.
- The CLI moved from `bin/` to `cli/`, because Claude Code puts a plugin's `bin/` on the shell `PATH` and claude.ai refuses plugins that have one. The `erikas-skills` command is unchanged.

### Fixed
- `brand-guidelines` is now a real skill (`SKILL.md` + `@erikaax/brand-guidelines`) — before, its content lived in `README.md`, so assistants never discovered it and the CLI could not install it.
- The installer no longer copies repo-only files into users' projects: `package.json`, a skill's own `README.md`, `evals/` (with fixture `package.json` and `*.test.js` files a host test runner could pick up), and `test/` folders.
- The CI smoke test now runs the local CLI instead of the npm-published package, and steps fail on errors hidden behind a pipe.
- Spec Kit commands run shared scripts as `node <skills-root>/spec-kit-shared/scripts/…` — before, `node spec-kit-shared/scripts/…` ran against the user's project, where the installed kit does not live, and failed with "Cannot find module". `pnpm run validate` now rejects the bare form.

## [0.1.0] - 2026-08-30

### Added
- `pnpm` monorepo with 14 `@erikaax/*` packages (13 standalone skills + atomic `@erikaax/spec-kit` bundle).
- `erikas-skills` CLI (`bin/cli.mjs`): `install`, `list`, `validate` with targets `claude | opencode | cursor | windsurf | codex | all | dir` and `--global` support.
- Scripts `install.mjs`, `validate.mjs`, `sync-versions.mjs`.
- Skills: `frontend-architecture`, `frontend-design`, `backend-api-standards`, `verify-before-implement`, `pre-pr-review`, `code-architecture-explainer`, `code-documentation`, `git-commits`, `create-pull-request`, `latex-academic-reports`, `project-setup`, `brain-orchestrator`, `project-intelligence` + Spec Kit suite (7 skills + `spec-kit-shared`).
- `brand-guidelines` as a shared resource.
