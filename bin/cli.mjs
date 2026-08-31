#!/usr/bin/env node
import { installSkills } from "../scripts/install.mjs";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
erikas-skills — instalador de skills con pnpm

Uso:
  npx erikas-skills install [opciones]
  pnpm dlx erikas-skills install [opciones]
  erikas-skills install [opciones]   (si ya está instalado)

Comandos:
  install     Copia los SKILL.md al destino del asistente
  list        Lista skills disponibles
  validate    Valida frontmatter y package.json de cada skill
  help        Muestra esta ayuda

Opciones de install:
  --skills <lista>   Skills a instalar (coma-separado). Default: todos
                     Ej: --skills frontend-architecture,backend-api-standards
                     Ej: --skills spec-kit (instala las 7 skills del kit + spec-kit-shared)
                     Nota: spec-kit es atómico — pedir spec-kit-generate-spec instala el kit completo
  --target <t>       Destino: claude | opencode | cursor | windsurf | codex | all | dir
                     Default: claude
  --dir <ruta>       Directorio destino (cuando --target dir)
  --global           Instala en el directorio global del usuario en lugar del proyecto
                     (claude: ~/.claude/skills, opencode: ~/.config/opencode/skills)
  --dry-run          Solo muestra qué haría sin copiar archivos
  --force            Sobrescribe skills existentes

Ejemplos:
  pnpm add -D erikas-skills
  npx erikas-skills install
  npx erikas-skills install --skills frontend-architecture,frontend-design --target claude
  npx erikas-skills install --skills spec-kit --target claude   # kit completo (7 skills)
  npx erikas-skills install --target opencode --global
  npx erikas-skills install --target dir --dir ./my-skills
  pnpm add @erikaax/frontend-architecture   # skill suelto
  pnpm add @erikaax/spec-kit                # kit completo (no @erikaax/spec-kit-generate-spec)

Requiere: Node >=18, pnpm >=9
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
  console.error(`Comando desconocido: ${command}\n`);
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
    else console.warn(`Aviso: opción no reconocida ${a}`);
  }
  return opts;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
