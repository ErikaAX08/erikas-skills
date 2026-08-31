#!/usr/bin/env node
import { installSkills } from "../scripts/install.mjs";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
erikas-skills — pnpm skill installer

Usage:
  npx erikas-skills install [options]
  pnpm dlx erikas-skills install [options]
  erikas-skills install [options]   (if already installed)

Commands:
  install     Copy SKILL.md files to the assistant destination
  list        List available skills
  validate    Validate frontmatter and package.json for each skill
  help        Show this help

Install options:
  --skills <list>    Skills to install (comma-separated). Default: all
                     Eg: --skills frontend-architecture,backend-api-standards
                     Eg: --skills spec-kit (installs the 7 kit skills + spec-kit-shared)
                     Note: spec-kit is atomic — requesting spec-kit-generate-spec installs the full kit
  --target <t>       Destination: claude | opencode | cursor | windsurf | codex | all | dir
                     Default: claude
  --dir <path>       Destination directory (when --target dir)
  --global           Install to the user global directory instead of the project
                     (claude: ~/.claude/skills, opencode: ~/.config/opencode/skills)
  --dry-run          Show what would be done without copying files
  --force            Overwrite existing skills

Examples:
  pnpm add -D erikas-skills
  npx erikas-skills install
  npx erikas-skills install --skills frontend-architecture,frontend-design --target claude
  npx erikas-skills install --skills spec-kit --target claude   # full kit (7 skills)
  npx erikas-skills install --target opencode --global
  npx erikas-skills install --target dir --dir ./my-skills
  pnpm add @erikaax/frontend-architecture   # single skill
  pnpm add @erikaax/spec-kit                # full kit (no @erikaax/spec-kit-generate-spec)

Requires: Node >=18, pnpm >=9
Repo: https://github.com/ErikaAX08/erikas-skills
`);
}

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }
  if (command === "list") {
    const { listSkills } = await import("../scripts/install.mjs");
    const skills = listSkills();
    console.log(skills.map((s) => ` - ${s}`).join("\n"));
    process.exit(0);
  }
  if (command === "validate") {
    const { validate } = await import("../scripts/validate.mjs");
    const ok = await validate();
    process.exit(ok ? 0 : 1);
  }
  if (command === "install") {
    const opts = parseInstallArgs(args.slice(1));
    await installSkills(opts);
    process.exit(0);
  }
  console.error(`Unknown command: ${command}\n`);
  printHelp();
  process.exit(1);
}

function parseInstallArgs(argv) {
  const opts = {
    skills: null,
    target: "claude",
    dir: null,
    global: false,
    dryRun: false,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skills" && argv[i + 1]) opts.skills = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--skills=")) opts.skills = a.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--target" && argv[i + 1]) opts.target = argv[++i];
    else if (a.startsWith("--target=")) opts.target = a.split("=")[1];
    else if (a === "--dir" && argv[i + 1]) opts.dir = argv[++i];
    else if (a.startsWith("--dir=")) opts.dir = a.split("=")[1];
    else if (a === "--global") opts.global = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else console.warn(`Warning: unrecognized option ${a}`);
  }
  return opts;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
