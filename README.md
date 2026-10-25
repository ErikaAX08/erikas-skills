# erikas-skills

[![npm version](https://img.shields.io/npm/v/erikas-skills?color=cb0000)](https://www.npmjs.com/package/erikas-skills)
[![license: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/ErikaAX08/erikas-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/ErikaAX08/erikas-skills/actions/workflows/ci.yml)

Reusable skills for AI coding assistants (Claude Code, OpenCode, Cursor, Windsurf, Codex) — frontend architecture, API standards, spec-driven development, orchestration and code quality.

## Installation

Requires Node >= 18.

```bash
pnpm add -D erikas-skills

npx erikas-skills install                    # all skills → .claude/skills/
npx erikas-skills install --global           # all skills → ~/.claude/skills/
npx erikas-skills install --skills frontend-architecture,git-commits
npx erikas-skills list                       # show available skills
```

Options: `--target claude | opencode | cursor | windsurf | codex | all | dir` (with `--dir <path>`), `--dry-run`.

Each skill is also published on its own as `@erikaax/<skill-name>`. Spec Kit is installed as a whole: `@erikaax/spec-kit` or `--skills spec-kit`.

## Skills

| Skill | What it does |
| --- | --- |
| **Frontend** | |
| `frontend-architecture` | Clean Architecture and reusable structures for pages, tables, cards and dialogs |
| `frontend-design` | Distinctive, production-grade UI that avoids generic AI aesthetics |
| `brand-guidelines` | Applies brand colors and typography to any visual artifact |
| **Backend** | |
| `backend-api-standards` | REST contracts: unified responses, OpenAPI, ULIDs, JWT, status codes |
| **Workflow & quality** | |
| `project-setup` | Bootstraps projects with setup commands for the latest library versions |
| `verify-before-implement` | Checks the real codebase and contracts before changing code |
| `pre-pr-review` | Evidence-based audit of a diff before merging or deploying |
| **Documentation** | |
| `code-architecture-explainer` | Explains code from implementation details to system architecture |
| `code-documentation` | Concise, professional comments and docstrings |
| `git-commits` | Conventional Commits messages and PR titles |
| `create-pull-request` | PR descriptions grounded in the diff, using the repo's template first |
| `latex-academic-reports` | Academic papers and reports in LaTeX |
| **Orchestration** | |
| `brain-orchestrator` | Investigates, plans and delegates complex multi-agent work ([README](./brain-orchestrator/README.md)) |
| `project-intelligence` | Evidence-backed living memory of a project's stack and infrastructure ([README](./project-intelligence/README.md)) |

### Spec Kit

A chain for spec-driven development. Run the steps in order; each needs the `READY` output of the previous one.

```
1. spec-kit-establish-constitution   (optional) project principles
2. spec-kit-generate-spec            requirement → spec.md
3. spec-kit-generate-plan            spec.md → plan.md
4. spec-kit-generate-tasks           plan.md → tasks.md
5. spec-kit-analyze-consistency      (optional) consistency check
6. spec-kit-execute-tasks            tasks.md → code

spec-kit-sync-artifacts  — run anytime after editing a source, spec or plan to see what's stale.
spec-kit-amend-artifacts — apply an already-decided change (e.g. a review finding) in one pass,
                           starting at the lowest artifact it affects.
```

See [`spec-kit-shared/README.md`](./spec-kit-shared/README.md) for details.

## Usage

Once installed, assistants pick skills up automatically. You can also ask for one explicitly:

```
Use the frontend-architecture skill to create a users page
Run the pre-pr-review skill on my changes
Use the spec-kit-generate-spec skill for docs/prd.md
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Licensed under [Apache 2.0](./LICENSE) — you may use and modify these skills freely, as long as you keep the attribution in [NOTICE](./NOTICE).
