# Changelog

Todos los cambios notables se documentan aquí. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [0.1.0] - 2026-08-30

### Added
- Monorepo `pnpm` con 14 paquetes `@erikaax/*` (13 skills standalone + `@erikaax/spec-kit` kit atómico).
- CLI `erikas-skills` (`bin/cli.mjs`): `install`, `list`, `validate` con targets `claude | opencode | cursor | windsurf | codex | all | dir` y soporte `--global`.
- Scripts `install.mjs`, `validate.mjs`, `sync-versions.mjs`.
- Skills: `frontend-architecture`, `frontend-design`, `backend-api-standards`, `verify-before-implement`, `pre-pr-review`, `code-architecture-explainer`, `code-documentation`, `git-commits`, `create-pull-request`, `latex-academic-reports`, `project-setup`, `brain-orchestrator`, `project-intelligence` + suite Spec Kit (7 skills + `spec-kit-shared`).
- `brand-guidelines` como recurso compartido.
