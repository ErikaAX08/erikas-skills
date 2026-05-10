# Project Skills Configuration

This document explains how to configure and use project skills across different AI assistants.

## Skills Structure

The project includes two main skills:

```
skills/
├── frontend-architecture.md    # Clean Architecture for frontend
└── backend-api-standards.md    # REST API standards for backend
```

---

## Claude Code (VS Code / Terminal)

Claude Code automatically loads instruction files from the `skills/` folder or a `CLAUDE.md` file at the project root.

### Configuration

**Option 1: CLAUDE.md file (recommended for a single skill)**

Create a `CLAUDE.md` file at the project root:

```markdown
# Project Instructions

Always follow the Frontend Architecture standards defined in this project:

- Use Clean Architecture layers (domain, application, infrastructure, presentation)
- Pages must not contain domain logic or direct fetch calls
- Tables, lists, and item cards must be separate components receiving data via props
- All create/edit forms must go inside Dialog components
- Each module has its own folder with Page and components/ subfolder
```

**Option 2: skills/ folder (recommended for multiple skills)**

1. Create a `skills/` folder at the project root
2. Place the `.md` skill files inside it
3. Claude Code will automatically read them as project instructions

**Option 3: Direct prompt instruction**

```
Apply the frontend-architecture skill to this task
```

Or mention the skill directly:

```
I want to create a products page following the frontend-architecture skill
```

### Useful Claude Code commands

```bash
# Check which skills are loaded
/status

# Reload skills
/clear

# Initialize project with skills
/init
```

---

## ChatGPT (Custom GPTs / GPT-4)

### Option 1: Custom GPT with uploaded knowledge

1. Go to [ChatGPT Custom GPTs](https://chat.openai.com/gpts/editor)
2. Create a new GPT
3. In the **Knowledge** section, upload the `frontend-architecture.md` or `backend-api-standards.md` file
4. In **Instructions**, add:

```
You are a senior developer assistant. Always follow the Frontend Architecture
and Backend API Standards documents uploaded in your knowledge base.
Apply these rules consistently in every code suggestion.
```

5. Name it (e.g., "Fullstack Clean Architecture Assistant")
6. Save and use

### Option 2: System prompt in conversation

When starting a conversation, paste the skill content as the first message:

```
From now on, follow these frontend architecture rules:

[Paste content of frontend-architecture.md]

Confirm you understood the rules before continuing.
```

### Option 3: Mentions in regular chat

```
I need to create a component following my frontend architecture skill.
Can you apply these rules?

[Paste the main rules from the skill]
```

---

## GitHub Copilot (VS Code / JetBrains)

### Custom instructions configuration

1. Open VS Code
2. Go to Settings > `github.copilot.chat.codeGeneration.instructions`
3. Add the main instructions:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": ".github/copilot-instructions.md"
    }
  ]
}
```

4. Create `.github/copilot-instructions.md` file:

```markdown
## Frontend Architecture Rules

- Use Clean Architecture: domain, application, infrastructure, presentation layers
- Pages must NOT contain domain logic or direct fetch
- Tables and lists are separate components receiving data via props
- Create/edit forms ALWAYS inside Dialog components
- Hooks orchestrate use cases (bridge between UI and business logic)
- Use ULID for all primary keys instead of auto-increment integers

## Backend API Standards

- Every API response MUST use format: { status, message, data, meta }
- Always use OpenAPI 3.0+ for documentation
- Use JWT for authentication (Bearer token)
- Use Argon2id for password hashing
- Every endpoint must be fully documented with OpenAPI
```

### In Copilot Chat

```
@workspace Create a products page following the architecture rules
defined in .github/copilot-instructions.md
```

---

## Cursor AI

### Project rules configuration

1. Create `.cursor/rules/` folder at the project root
2. Create `frontend-architecture.mdc` file:

```markdown
---
description: Clean Architecture standards for frontend
globs: src/**/*.{ts,tsx,js,jsx}
---

# Frontend Architecture Rules

- Use Clean Architecture layers: domain, application, infrastructure, presentation
- Pages must NOT contain domain logic or direct fetch calls
- Tables/lists are separate components, receive data via props
- Item cards are also separate components
- Every create/edit form MUST be inside a Dialog component
- Use cases are classes or pure functions independent of UI
- Each module has its own folder with Page and components/ subfolder
```

3. Create `backend-api-standards.mdc` file:

```markdown
---
description: API standards for backend
globs: api/**/*.{ts,js,py,php}
---

# Backend API Standards

- Every response MUST follow: { status, message, data, meta }
- Always document endpoints with OpenAPI 3.0+
- Use ULID for primary keys (never auto-increment)
- Use JWT for authentication (Authorization: Bearer <token>)
- Use Argon2id for password hashing
```

### Cursor commands

```
@frontend-architecture Create a users page with table and dialog
```

```
@backend-api-standards Create an endpoint to list users
```

---

## Windsurf (Codeium)

### Rules configuration

1. Create `.windsurf/rules/` folder
2. Add `.md` or `.txt` files with the rules
3. Windsurf will automatically read them as project context

### `.windsurfrules` file

```yaml
rules:
  frontend:
    - Use Clean Architecture layers (domain, application, infrastructure, presentation)
    - Pages must not contain domain logic or fetch directly
    - Tables and lists are independent components
    - Create/edit forms always in Dialogs
    - Hooks bridge UI with use cases

  backend:
    - Response format: { status, message, data, meta }
    - Primary keys: ULID (never integer)
    - Auth: JWT Bearer tokens
    - Passwords: Argon2id hashing
    - Documentation: OpenAPI 3.0+ mandatory
```

---

## Cline (VS Code Extension)

### Configuration

1. Create `.clinerules` file at the project root:

```markdown
# Frontend Architecture

- Apply Clean Architecture layers: domain, application, infrastructure, presentation
- Pages orchestrate use cases, never fetch directly
- Components (tables, cards, dialogs) receive data via props
- Forms always inside Dialog components

# Backend API Standards

- Response format: { status, message, data, meta }
- Use ULID for primary keys
- JWT authentication required
- Argon2id for passwords
- OpenAPI documentation mandatory
```

---

## Configuration Files Summary

| Tool                     | File(s)                                    | Location             |
| ------------------------ | ------------------------------------------ | -------------------- |
| **Claude Code**          | `CLAUDE.md` or `skills/*.md`               | Project root         |
| **GitHub Copilot**       | `.github/copilot-instructions.md`          | Project root         |
| **Cursor**               | `.cursor/rules/*.mdc`                      | `.cursor/rules/`     |
| **Windsurf**             | `.windsurf/rules/*.md` or `.windsurfrules` | Root or `.windsurf/` |
| **Cline**                | `.clinerules`                              | Project root         |
| **ChatGPT (Custom GPT)** | Upload in Knowledge                        | GPT configuration    |

---

## Quick Usage

### When starting a conversation with any AI:

**Frontend:**

```
Apply the frontend-architecture skill for [specific task]
```

**Backend:**

```
Follow the backend API standards for [specific task]
```

**Fullstack:**

```
Use both project skills (frontend architecture and backend API) for [task]
```

---

## Notes

- Skills are designed to be **self-contained** in their `.md` files
- Each skill includes its own description, when to use it, rules, and examples
- Rules are **non-negotiable** within the skill context
- For fullstack projects, it is recommended to load both skills simultaneously
- Keep skill files versioned in the repository alongside the codebase
