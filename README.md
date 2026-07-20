# Project Skills Configuration

This repository contains reusable AI skills for consistent code generation across different tools and assistants.

## Skills

```
skills/
├── frontend-architecture/SKILL.md         # Clean Architecture for frontend
├── frontend-design/SKILL.md               # High-quality UI design standards
├── brand-guidelines/README.md             # Brand colors and typography
├── backend-api-standards/SKILL.md         # REST API contract standards
├── project-setup/SKILL.md                 # Project initialization standard
├── verify-before-implement/SKILL.md       # Verification protocol before coding
├── pre-pr-review/SKILL.md                 # Self-review before opening a PR
├── code-architecture-explainer/SKILL.md   # Explain code & architecture
├── code-documentation/SKILL.md            # Document code professionally
├── git-commits/SKILL.md                   # Conventional commits & PR descriptions
├── latex-academic-reports/SKILL.md        # Academic reports & papers in LaTeX
│
│   Spec Kit — spec-driven development chain (see spec-kit-shared/README.md), one flat
│   top-level folder per skill like everything else above:
├── spec-kit-establish-constitution/SKILL.md        # Make project conventions explicit (optional)
├── spec-kit-generate-spec/SKILL.md                 # Requirement/PRD → governed spec.md
├── spec-kit-generate-plan/SKILL.md                 # spec.md → verified technical plan.md
├── spec-kit-generate-tasks/SKILL.md                # plan.md → per-user-story tasks.md
├── spec-kit-analyze-consistency/SKILL.md           # Read-only spec/plan/tasks consistency check
├── spec-kit-sync-artifacts/SKILL.md                # Drift detection between artifacts and sources
├── spec-kit-execute-tasks/SKILL.md                 # tasks.md → real code, sequential or parallel
└── spec-kit-shared/                       # Agent portability & artifact contracts (not a skill)
```

### Frontend

#### 1. Frontend Architecture

Defines Clean Architecture and reusable component structures for frontend. Organizes pages, tables, lists, item cards, subpages, and modal dialogs in a predictable and maintainable way. Applies to React, Vue, Svelte, or similar frameworks.

**Use when:** starting a new frontend project, organizing screens with lists/tables/cards/dialogs, or applying clean architecture layers (domain, application, infrastructure, presentation).

#### 2. Frontend Design

Creates distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code and UI design that avoids generic AI aesthetics.

**Use when:** building web components, pages, landing pages, dashboards, or when styling/beautifying any web UI with bold aesthetic direction.

#### 3. Brand Guidelines

Applies brand colors and typography to any artifact requiring visual styling. Works with any brand palette, not just a single predefined one.

**Use when:** applying brand colors, style guidelines, visual formatting, or design standards to any visual artifact.

### Backend

#### 4. Backend API Standards

Defines mandatory standards for REST API contracts and data format: unified response structure, OpenAPI documentation, ULID identifiers, JWT auth headers, mandatory entity fields, and HTTP status codes. Framework-agnostic — describes what the API must return, not how to build it.

**Use when:** designing or documenting API endpoints, defining request/response schemas, or ensuring consistent API contracts.

### Workflow & Quality

#### 5. Project Setup

Standard for initializing new projects by asking which architecture skills to apply and providing setup commands with latest library versions. Never generates the project directly; always provides commands for the user to execute, without hardcoding version numbers.

**Use when:** bootstrapping a new project, choosing a stack, or generating setup/install commands.

#### 6. Verify Before Implement

Analyzes and implements code changes with a strict verification protocol. Enforces reality-checking against the actual codebase, contracts, and specs before making changes, preventing assumption-based development and invented parameters/entities.

**Use when:** implementing features, fixing bugs, or modifying existing code.

#### 7. Pre-PR Review

Analyzes code changes before creating a PR with a production-impact focus. Identifies breaking changes, integration bugs, missing validations, and regressions by verifying against the actual codebase, contracts, and production flows. Generates detailed, actionable feedback organized by severity.

**Use when:** reviewing your own changes, preparing a PR, or doing a self-review before requesting team review.

### Documentation & Explanation

#### 8. Code Architecture Explainer

Analyzes and explains code from multiple levels — from implementation details to software architecture. Provides technical deep-dives, architectural overviews, flow diagrams, and concrete examples at any abstraction level.

**Use when:** understanding new codebases, explaining system design, documenting architecture, learning patterns, or analyzing technical decisions.

#### 9. Code Documentation

Documents code clearly, concisely, and professionally. Generates documentation (comments, docstrings, JSDoc) that other engineers can quickly understand without being verbose.

**Use when:** documenting functions, classes, modules, or files; adding comments; or improving existing documentation.

#### 10. Git Commits

Writes clear, semantic git commit messages and PR descriptions following Conventional Commits.

**Use when:** writing commit messages, creating PR descriptions, formatting git history, or improving commit quality.

#### 11. LaTeX Academic Reports

Generates academic reports, papers, theses, and technical documentation using LaTeX, producing publication-quality PDFs with proper formatting, citations, figures, tables, and mathematical notation. Ideal for Computer Science, Engineering, and scientific documents.

**Use when:** creating research papers, lab reports, theses, IEEE-style papers, or any academic document requiring professional typesetting.

### Spec Kit

A sequential chain of skills for specification-driven development — from a requirement or document, through a governed spec, a verified technical plan, and an executable task list, to real code. Every skill verifies real project context before writing anything, enforces that no phase or story closes in a broken state, detects drift when a source document or upstream artifact changes, and generates matching Kiro CLI + Claude Code agent definitions whenever a support agent is needed. Each skill below is its own top-level folder, exactly like every other skill in this repo — copy `spec-kit-shared/` alongside whichever of them you use; see `spec-kit-shared/README.md` for the full flow diagram and reuse map.

**Order of execution** — run these in sequence, not independently:

```
1. spec-kit-establish-constitution   (optional, once per project)
2. spec-kit-generate-spec            → spec.md
3. spec-kit-generate-plan            → plan.md          (needs a READY spec.md)
4. spec-kit-generate-tasks           → tasks.md         (needs a READY plan.md)
5. spec-kit-analyze-consistency      (optional gate)     (needs a READY tasks.md)
6. spec-kit-execute-tasks            → real code        (needs a READY tasks.md)

spec-kit-sync-artifacts — not a numbered step; run it any time after editing a
source document, spec.md, or plan.md by hand, to see what's now stale.
```

Skip step 1 if the project has no established conventions yet, and skip step 5 if you're
confident `tasks.md` is already consistent — every other step depends on the `READY` output of
the one before it.

#### 12. Establish Constitution

Creates or updates a project's `constitution.md` — non-negotiable architecture/security/quality principles — from explicit documentation and/or by mining consistent patterns across existing code, with evidence, coverage, and confidence for every mined principle. Nothing mined becomes binding without explicit confirmation. Optional; re-invocable to check for drift.

**Use when:** starting spec-driven work on a project that already has established conventions, or checking whether code has drifted from a previously established constitution.

#### 13. Generate Spec

Generates or updates a governed specification (a REASONS Canvas) from a PRD, free-form text, or referenced documents — with a source Evidence Catalog, conflict resolution, and a quality checklist. Does not implement code.

**Use when:** starting a new feature from a requirement or document, or updating an existing specification after a material change.

#### 14. Generate Plan

Converts a `READY` specification into a verified technical plan — real Technical Context, a two-gate Constitution Check, verified Project Structure, and an explicit Safe Deferral table for any phased rollout. Does not implement code.

**Use when:** a specification is approved and you need a technically grounded implementation plan before task breakdown.

#### 15. Generate Tasks

Decomposes a `READY` plan into an ordered task list organized by user story (priority order), with a mandatory closure checkpoint per story — never a flat task list, never an unsafe "later" deferral.

**Use when:** a plan is approved and you need executable, independently verifiable tasks.

#### 16. Analyze Consistency

Read-only cross-check of `spec.md`/`plan.md`/`tasks.md` for coverage gaps, orphan tasks, unsafe deferrals, and incomplete story checkpoints, with a `READY_FOR_EXECUTION` verdict.

**Use when:** before executing tasks, to catch a gap upstream skills' own checklists might have missed.

#### 17. Sync Artifacts

Detects drift between a source document and the spec/plan/tasks chain via content-hash comparison, and recommends the nearest upstream skill to re-invoke — one hop at a time, never a silent cascade.

**Use when:** a source document, spec, or plan changed and you need to know exactly what's now stale downstream.

#### 18. Execute Tasks

Executes a `READY` task list into real code, delegating implementation discipline, commit messages, documentation, and final review to the skills that already own those concerns — sequentially by default, or in parallel across genuinely independent user stories.

**Use when:** tasks are approved and ready to implement.

---

## How to Use with AI Tools

| Tool                     | File(s)                                    | Location             |
| ------------------------ | ------------------------------------------ | -------------------- |
| **Claude Code**          | `CLAUDE.md` or `skills/*.md`               | Project root         |
| **GitHub Copilot**       | `.github/copilot-instructions.md`          | Project root         |
| **Cursor**               | `.cursor/rules/*.mdc`                      | `.cursor/rules/`     |
| **Windsurf**             | `.windsurf/rules/*.md` or `.windsurfrules` | Root or `.windsurf/` |
| **Cline**                | `.clinerules`                              | Project root         |
| **ChatGPT (Custom GPT)** | Upload in Knowledge                        | GPT configuration    |

---

## Claude Code

Claude Code automatically loads instruction files from the `skills/` folder or a `CLAUDE.md` file at the project root.

**Option 1: skills/ folder (recommended)**

Place `.md` skill files inside a `skills/` folder — Claude Code reads them automatically as project instructions.

**Option 2: CLAUDE.md file**

Create a `CLAUDE.md` at the project root with the rules you want applied.

**Option 3: Direct prompt**

```
Apply the frontend-architecture skill to this task
```

---

## GitHub Copilot

Add to VS Code settings:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": ".github/copilot-instructions.md" }
  ]
}
```

Then create `.github/copilot-instructions.md` with the relevant rules.

---

## Cursor AI

Create `.cursor/rules/` folder and add `.mdc` files with frontmatter:

```markdown
---
description: Clean Architecture standards for frontend
globs: src/**/*.{ts,tsx,js,jsx}
---

# Rules here...
```

Use in chat: `@frontend-architecture Create a users page`

---

## Windsurf (Codeium)

Create `.windsurf/rules/` folder with `.md` files, or a `.windsurfrules` YAML file at the root.

---

## Cline

Create `.clinerules` file at the project root with the rules.

---

## ChatGPT (Custom GPTs)

1. Create a Custom GPT
2. Upload skill files in the **Knowledge** section
3. Add instructions referencing the uploaded documents

---

## Quick Usage

```
# Frontend architecture
Apply the frontend-architecture skill for [task]

# Frontend design
Apply the frontend-design skill for [task]

# Brand styling
Apply the brand-guidelines skill for [task]

# Backend API
Follow the backend-api-standards skill for [task]

# Project setup
Use the project-setup skill to start [project]

# Verify before implementing
Apply the verify-before-implement skill for [task]

# Pre-PR self review
Run the pre-pr-review skill on my changes

# Explain code / architecture
Use the code-architecture-explainer skill on [file/module]

# Document code
Apply the code-documentation skill to [file/module]

# Commit messages / PRs
Use the git-commits skill for this commit/PR

# Academic report
Use the latex-academic-reports skill for [document]

# Spec Kit — sequential chain
Use the spec-kit-establish-constitution skill for this project        # optional, once
Use the spec-kit-generate-spec skill for [requirement/document]
Use the spec-kit-generate-plan skill for .speckit/specs/[feature]/spec.md
Use the spec-kit-generate-tasks skill for .speckit/specs/[feature]/plan.md
Use the spec-kit-analyze-consistency skill on .speckit/specs/[feature]          # optional gate
Use the spec-kit-sync-artifacts skill on .speckit/specs/[feature]                # after editing a source
Use the spec-kit-execute-tasks skill on .speckit/specs/[feature]/tasks.md

# Fullstack
Use all project skills for [task]
```

---

## Notes

- Skills are **self-contained** in their `.md` files
- Each skill includes description, when to use, rules, and examples
- Rules are **non-negotiable** within the skill context
- Keep skill files versioned in the repository alongside the codebase
