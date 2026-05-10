# Project Skills Configuration

This repository contains reusable AI skills for consistent code generation across different tools and assistants.

## Skills

```
skills/
├── frontend-architecture/SKILL.md   # Clean Architecture for frontend
├── frontend-design/SKILL.md         # High-quality UI design standards
├── backend-api-standards/SKILL.md   # REST API contract standards
└── brand-guidelines/README.md       # Brand colors and typography
```

### 1. Frontend Architecture

Defines Clean Architecture and reusable component structures for frontend. Organizes pages, tables, lists, item cards, subpages, and modal dialogs in a predictable and maintainable way. Applies to React, Vue, Svelte, or similar frameworks.

**Use when:** starting a new frontend project, organizing screens with lists/tables/cards/dialogs, or applying clean architecture layers (domain, application, infrastructure, presentation).

### 2. Frontend Design

Creates distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code and UI design that avoids generic AI aesthetics.

**Use when:** building web components, pages, landing pages, dashboards, or when styling/beautifying any web UI with bold aesthetic direction.

### 3. Backend API Standards

Defines mandatory standards for REST API contracts and data format: unified response structure, OpenAPI documentation, ULID identifiers, JWT auth headers, mandatory entity fields, and HTTP status codes. Framework-agnostic.

**Use when:** designing or documenting API endpoints, defining request/response schemas, or ensuring consistent API contracts.

### 4. Brand Guidelines

Applies brand colors and typography to any artifact requiring visual styling. Works with any brand palette, not just a single predefined one.

**Use when:** applying brand colors, style guidelines, visual formatting, or design standards to any visual artifact.

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

# Backend API
Follow the backend-api-standards skill for [task]

# Brand styling
Apply the brand-guidelines skill for [task]

# Fullstack
Use all project skills for [task]
```

---

## Notes

- Skills are **self-contained** in their `.md` files
- Each skill includes description, when to use, rules, and examples
- Rules are **non-negotiable** within the skill context
- Keep skill files versioned in the repository alongside the codebase
