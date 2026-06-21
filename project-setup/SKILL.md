---
name: project-setup
description: Standard for initializing new projects by asking which architecture skills to apply and providing setup commands with latest library versions. Never generates the project directly; always provides commands for the user to execute. Ensures libraries are always at their latest versions without hardcoding version numbers.
license: Complete terms in LICENSE.txt
---

# Project Setup Skill

## Overview

This skill standardizes the initialization of new projects by always asking which architecture skills to apply and providing setup commands instead of generating the project directly. It ensures libraries are installed at their latest versions without hardcoding version numbers that may become outdated.

**Keywords**: project setup, initialization, scaffolding, new project, boilerplate, create project, setup commands, project structure

## Critical Rules

### Rule 1: Never Generate Project Files Directly

**This skill must NEVER generate project files, create directories, or write code directly.**

Instead, always provide the commands the user needs to run in their terminal. The user is responsible for executing these commands in their environment.

### Rule 2: Never Hardcode Library Versions

**Never specify exact version numbers for libraries or dependencies.**

Always use the latest version by omitting the version number or using the appropriate syntax to get the latest:

```bash
# Correct - Always gets latest
pnpm add react
pnpm add @nestjs/core
pip install fastapi
composer require laravel/framework

# Incorrect - Version may be outdated
pnpm add react@18.2.0
pnpm add @nestjs/core@10.3.0
pip install fastapi==0.109.0
composer require laravel/framework:10.0.0
```

If the package manager requires a version or the user asks for a specific one, use version ranges:

```bash
# Only if necessary
pnpm add react@^18
pnpm add @nestjs/core@^10
```

### Rule 3: Always Ask Which Architecture Skills to Apply

**Before providing setup commands, always ask the user which architecture or standards skills they want to apply.**

### Rule 4: Prefer pnpm Over npm

**For any Node.js / JavaScript / TypeScript project, default to `pnpm` instead of `npm`.**

`pnpm` is faster, uses a content-addressable store to save disk space, and provides
stricter, more reliable dependency resolution. Always provide `pnpm` commands by default
and only fall back to `npm` (or `yarn`) if the user explicitly requests it.

```bash
# Preferred
pnpm add react
pnpm add -D vitest
pnpm create vite@latest my-app --template react-ts
pnpm dev

# Avoid unless the user explicitly asks for npm
npm install react
```

If `pnpm` is not installed, provide the install command first:

```bash
npm install -g pnpm
# or
corepack enable pnpm
```

## Required Questions

When invoked, this skill must ask the user the following questions in order:

### Question 1: Project Type

```
What type of project are you creating?

- Frontend application (React, Vue, Svelte, etc.)
- Backend API (Express, Fastify, NestJS, Django, Laravel, etc.)
- Fullstack application
- Mobile application
- CLI tool
- Desktop application
- Library/Package
- Other: [please specify]
```

### Question 2: Framework and Language

```
What framework and language do you want to use?

[Show relevant options based on project type]

Frontend:
- React with TypeScript
- React with JavaScript
- Vue with TypeScript
- Vue with JavaScript
- Svelte with TypeScript
- Next.js with TypeScript
- Other: [please specify]

Backend:
- Express with TypeScript
- Fastify with TypeScript
- NestJS with TypeScript
- Django with Python
- FastAPI with Python
- Laravel with PHP
- Other: [please specify]
```

### Question 3: Architecture and Standards Skills

```
Which architecture and standards skills do you want to apply to this project?

Available skills:

Frontend:
- [ ] frontend-architecture (Clean Architecture for frontend with component patterns)

Backend:
- [ ] backend-api-standards (API standards with OpenAPI, unified responses, ULID, JWT, Argon2)

Documentation:
- [ ] module-integration-docs (Integration documentation organized by modules and phases)

Styling:
- [ ] brand-guidelines (Brand colors and typography)

Other:
- [ ] None, just basic setup
- [ ] Custom: [describe your architecture requirements]

You can select multiple skills. Type the names separated by commas.
Example: "frontend-architecture, backend-api-standards"
```

### Question 4: Package Manager

```
Which package manager do you prefer?

- pnpm (recommended for Node.js / JS / TS projects)
- npm
- yarn
- pip (Python)
- composer (PHP)
- cargo (Rust)
- Other: [please specify]

For Node.js projects, pnpm is the default unless you choose otherwise.
```

### Question 5: Additional Tools

```
Do you want to include any additional tools?

- [ ] ESLint for linting
- [ ] Prettier for formatting
- [ ] Jest for testing
- [ ] Vitest for testing
- [ ] Playwright for E2E testing
- [ ] Storybook for component development
- [ ] Docker for containerization
- [ ] GitHub Actions for CI/CD
- [ ] Other: [please specify]
```

## Setup Command Generation

After collecting the user's answers, generate the setup commands following this structure:

### 1. Project Initialization Commands

Generate the base project creation commands without hardcoding versions.

### 2. Dependency Installation Commands

Generate commands to install dependencies at their latest versions.

### 3. Architecture Folder Structure Creation

Generate `mkdir` commands to create the folder structure required by the selected architecture skills.

### 4. Configuration File Downloads

Provide URLs or commands to download standard configuration files (ESLint, Prettier, TypeScript configs).

### 5. Skill File Setup Commands

Generate commands to download or create the skill files in the project.

## Output Format

Always present the setup as a sequence of command blocks with clear explanations:

### Step 1: Create Project

```bash
[commands to scaffold the project]
```

### Step 2: Navigate to Project

```bash
cd [project-name]
```

### Step 3: Install Dependencies

```bash
[commands to install dependencies at latest versions]
```

### Step 4: Create Architecture Structure

```bash
[commands to create folders per selected architecture skills]
```

### Step 5: Initialize Git and Skills

```bash
[commands to set up version control and download skills]
```

### Step 6: Run Development Server

```bash
[commands to start the development server]
```

## Commands to Run

[Summary of all commands in order, ready to copy-paste]

---

## Examples

### Example 1: React Frontend with Frontend Architecture Skill

**User says:** "I want to create a new React frontend project"

**Skill responds with the questions, then based on answers (React, TypeScript, frontend-architecture, pnpm):**

#### Project Setup: React Frontend with Clean Architecture

**Prerequisites:**
- Node.js 18 or later installed
- pnpm installed (`npm install -g pnpm` or `corepack enable pnpm`)

**Step 1: Create React TypeScript Project**

```bash
pnpm create vite@latest my-app --template react-ts
```

### Step 2: Navigate to Project

```bash
cd my-app
```

### Step 3: Install Core Dependencies

```bash
# React Router for routing
pnpm add react-router-dom

# State management (choose one)
pnpm add zustand
# or
pnpm add @reduxjs/toolkit react-redux

# HTTP client
pnpm add axios
```

### Step 4: Install Development Dependencies

```bash
# TypeScript type definitions
pnpm add -D @types/react @types/react-dom

# ESLint and Prettier (if selected)
pnpm add -D eslint prettier eslint-config-prettier

# Testing (if selected)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

### Step 5: Create Clean Architecture Structure

```bash
mkdir -p src/domain/entities
mkdir -p src/domain/repositories
mkdir -p src/application/useCases
mkdir -p src/infrastructure/repositories
mkdir -p src/presentation/shared/components
mkdir -p src/presentation/hooks
mkdir -p src/presentation/contexts
mkdir -p src/config
```

### Step 6: Initialize Git and Download Skills

```bash
git init

# Create skills directory
mkdir skills

# Download skills (replace with your actual skill URLs)
curl -o skills/frontend-architecture.md [URL_TO_SKILL]
```

### Step 7: Start Development Server

```bash
pnpm dev
```

### Architecture Structure Created

```
my-app/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/
│   ├── application/
│   │   └── useCases/
│   ├── infrastructure/
│   │   └── repositories/
│   ├── presentation/
│   │   ├── shared/
│   │   │   └── components/
│   │   ├── hooks/
│   │   └── contexts/
│   └── config/
├── skills/
│   └── frontend-architecture.md
└── package.json
```

### All Commands (Copy-Paste Ready)

```bash
pnpm create vite@latest my-app --template react-ts
cd my-app
pnpm add react-router-dom axios zustand
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
mkdir -p src/domain/entities src/domain/repositories src/application/useCases src/infrastructure/repositories src/presentation/shared/components src/presentation/hooks src/presentation/contexts src/config
git init
mkdir skills
pnpm dev
```

---

### Example 2: NestJS Backend with API Standards

**User says:** "I want to create a new backend API with NestJS"

**Skill asks questions, then based on answers (NestJS, TypeScript, backend-api-standards, pnpm):**

#### Project Setup: NestJS Backend with API Standards

**Prerequisites:**
- Node.js 18 or later installed
- pnpm installed (`npm install -g pnpm` or `corepack enable pnpm`)
- PostgreSQL installed (for ULID support)

**Step 1: Install NestJS CLI (if not installed)**

```bash
pnpm add -g @nestjs/cli
```

### Step 2: Create NestJS Project

```bash
nest new my-api --package-manager pnpm
```

### Step 3: Navigate to Project

```bash
cd my-api
```

### Step 4: Install Core Dependencies

```bash
# ULID generation
pnpm add ulid

# Password hashing (Argon2)
pnpm add argon2

# JWT authentication
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt

# Validation
pnpm add class-validator class-transformer

# OpenAPI documentation
pnpm add @nestjs/swagger swagger-ui-express
```

### Step 5: Install Development Dependencies

```bash
# TypeScript type definitions
pnpm add -D @types/passport-jwt @types/ulid

# Testing
pnpm add -D @nestjs/testing
```

### Step 6: Create Architecture Structure

```bash
mkdir -p src/domain/entities
mkdir -p src/domain/repositories
mkdir -p src/application/use-cases
mkdir -p src/infrastructure/database/migrations
mkdir -p src/infrastructure/repositories
mkdir -p src/infrastructure/auth
mkdir -p src/presentation/controllers
mkdir -p src/presentation/middlewares
mkdir -p src/presentation/dtos
mkdir -p src/shared/interfaces
mkdir -p src/shared/helpers
mkdir -p src/config
mkdir -p docs/openapi/paths
mkdir -p docs/openapi/schemas
```

### Step 7: Generate NestJS Modules

```bash
# Generate core modules (replace with your actual modules)
nest g module auth
nest g controller auth --no-spec
nest g service auth --no-spec

nest g module users
nest g controller users --no-spec
nest g service users --no-spec
```

### Step 8: Initialize Git and Download Skills

```bash
git init

# Create skills directory
mkdir skills

# Download skills (replace with your actual skill URLs)
curl -o skills/backend-api-standards.md [URL_TO_SKILL]
```

### Step 9: Start Development Server

```bash
pnpm start:dev
```

### Architecture Structure Created

```
my-api/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/
│   ├── application/
│   │   └── use-cases/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── repositories/
│   │   └── auth/
│   ├── presentation/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── dtos/
│   ├── shared/
│   │   ├── interfaces/
│   │   └── helpers/
│   └── config/
├── docs/
│   └── openapi/
│       ├── paths/
│       └── schemas/
├── skills/
│   └── backend-api-standards.md
└── package.json
```

### All Commands (Copy-Paste Ready)

```bash
pnpm add -g @nestjs/cli
nest new my-api --package-manager pnpm
cd my-api
pnpm add ulid argon2 @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer @nestjs/swagger swagger-ui-express
pnpm add -D @types/passport-jwt @types/ulid
mkdir -p src/domain/entities src/domain/repositories src/application/use-cases src/infrastructure/database/migrations src/infrastructure/repositories src/infrastructure/auth src/presentation/controllers src/presentation/middlewares src/presentation/dtos src/shared/interfaces src/shared/helpers src/config docs/openapi/paths docs/openapi/schemas
nest g module auth
nest g controller auth --no-spec
nest g service auth --no-spec
nest g module users
nest g controller users --no-spec
nest g service users --no-spec
git init
mkdir skills
pnpm start:dev
```

---

### Example 3: Fullstack Project

**User says:** "I want to create a fullstack project with React frontend and FastAPI backend"

**Skill asks questions, then provides commands for both frontend and backend:**

#### Project Setup: Fullstack with React Frontend and FastAPI Backend

**Prerequisites:**
- Node.js 18 or later installed
- Python 3.11 or later installed
- pnpm and pip installed (`npm install -g pnpm` or `corepack enable pnpm`)

#### Frontend Setup

**Step 1: Create React Project**

```bash
pnpm create vite@latest client --template react-ts
cd client
pnpm install
```

### Step 2: Install Frontend Dependencies

```bash
pnpm add react-router-dom axios zustand
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

### Step 3: Create Frontend Structure

```bash
cd client
mkdir -p src/domain/entities src/domain/repositories src/application/useCases src/infrastructure/repositories src/presentation/shared/components src/presentation/hooks src/config
cd ..
```

## Backend Setup

### Step 4: Create Python Virtual Environment

```bash
python -m venv server/venv
source server/venv/bin/activate
```

### Step 5: Install Backend Dependencies

```bash
pip install fastapi uvicorn sqlalchemy python-ulid python-jose[cryptography] passlib[argon2] python-multipart pydantic
```

### Step 6: Create Backend Structure

```bash
mkdir -p server/src/domain/entities server/src/domain/repositories server/src/application/use_cases server/src/infrastructure/database/migrations server/src/infrastructure/repositories server/src/infrastructure/auth server/src/presentation/controllers server/src/presentation/middlewares server/src/presentation/schemas server/src/shared/interfaces server/src/shared/helpers server/src/config server/docs/openapi/paths server/docs/openapi/schemas
```

## Root Setup

### Step 7: Create Root Configuration

```bash
git init
mkdir skills

# Download skills
curl -o skills/frontend-architecture.md [URL]
curl -o skills/backend-api-standards.md [URL]

# Create root package.json for concurrent scripts
echo '{
  "name": "fullstack-app",
  "scripts": {
    "dev": "concurrently "cd client && pnpm dev" "cd server && uvicorn src.main:app --reload"",
    "install:all": "cd client && pnpm install && cd ../server && pip install -r requirements.txt"
  },
  "devDependencies": {
    "concurrently": "latest"
  }
}' > package.json
```

### Step 8: Start Development

```bash
# Terminal 1: Frontend
cd client && pnpm dev

# Terminal 2: Backend
cd server && source venv/bin/activate && uvicorn src.main:app --reload
```

### Project Structure Created

```
fullstack-app/
├── client/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── docs/
│   ├── venv/
│   └── requirements.txt
├── skills/
│   ├── frontend-architecture.md
│   └── backend-api-standards.md
└── package.json
```

---

## Handling Different Package Managers

### pnpm (default for Node.js projects)

```bash
pnpm add package-name
pnpm add -D dev-package-name
```

### npm

```bash
npm install package-name
npm install -D dev-package-name
```

### yarn

```bash
yarn add package-name
yarn add -D dev-package-name
```

### pip

```bash
pip install package-name
```

### composer

```bash
composer require package-name
composer require --dev dev-package-name
```

## Configuring Skills in the Project

After setup, remind the user how to configure the skills for their AI assistant:

```markdown
### Configuring Skills for AI Assistants

The skills are now in the `skills/` directory. Configure them for your preferred AI assistant:

**Claude Code**: Already reading from `skills/` folder. No additional setup needed.

**Cursor**: Create `.cursor/rules/` and copy relevant skills with `.mdc` extension.

**GitHub Copilot**: Create `.github/copilot-instructions.md` with references to skills.

**Windsurf**: Create `.windsurf/rules/` with skill rules.

See the [Project Skills Configuration README](README.md) for detailed instructions.
```

## Non-Negotiable Rules

1. **Never generate project files directly** - Always provide commands for the user to execute
2. **Never hardcode library versions** - Always use the latest by omitting version numbers
3. **Always ask which architecture skills to apply** - Never assume defaults
4. **Always ask about the tech stack** - Framework, language, package manager
5. **Provide complete folder structure** - Show the result of `mkdir` commands
6. **Include Git initialization** - Always set up version control
7. **Provide copy-paste ready commands** - A single block with all commands at the end
8. **Never assume tools** - Ask about linting, testing, formatting preferences
9. **Use the correct package manager syntax** - Match the user's preference; default to `pnpm` for Node.js projects unless the user chooses otherwise
10. **Remind about skill configuration** - Show how to set up skills for AI assistants

## Quick Start Prompts

Users can invoke this skill with:

```
I want to create a new project
```

```
Set up a new React frontend with Clean Architecture
```

```
Initialize a NestJS backend with API standards
```

```
Create a fullstack project with authentication
```

```
Scaffold a new microservice
```

The skill will always respond by asking the required questions before providing any commands.

This skill ensures that:

1. **Never generates files directly** - Only provides commands for the user to run
2. **Never hardcodes versions** - All install commands use latest versions
3. **Always asks which skills to apply** - Frontend architecture, backend standards, etc.
4. **Always asks about the tech stack** - Framework, language, tools
5. **Provides complete folder creation commands** - Based on selected architecture skills
6. **Includes skill file setup** - Commands to download and configure skills
7. **Gives copy-paste ready command blocks** - Easy for users to execute
