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
└── latex-academic-reports/SKILL.md        # Academic reports & papers in LaTeX
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

# Fullstack
Use all project skills for [task]
```

---

## Notes

- Skills are **self-contained** in their `.md` files
- Each skill includes description, when to use, rules, and examples
- Rules are **non-negotiable** within the skill context
- Keep skill files versioned in the repository alongside the codebase
