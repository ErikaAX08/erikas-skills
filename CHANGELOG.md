# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versioning follows [SemVer](https://semver.org/).

## [0.1.0] - 2026-08-30

### Added
- `pnpm` monorepo with 14 `@erikaax/*` packages (13 standalone skills + atomic `@erikaax/spec-kit` bundle).
- `erikas-skills` CLI (`bin/cli.mjs`): `install`, `list`, `validate` with targets `claude | opencode | cursor | windsurf | codex | all | dir` and `--global` support.
- Scripts `install.mjs`, `validate.mjs`, `sync-versions.mjs`.
- Skills: `frontend-architecture`, `frontend-design`, `backend-api-standards`, `verify-before-implement`, `pre-pr-review`, `code-architecture-explainer`, `code-documentation`, `git-commits`, `create-pull-request`, `latex-academic-reports`, `project-setup`, `brain-orchestrator`, `project-intelligence` + Spec Kit suite (7 skills + `spec-kit-shared`).
- `brand-guidelines` as a shared resource.
