import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export const SPEC_KIT_SKILLS = [
  "spec-kit-establish-constitution",
  "spec-kit-generate-spec",
  "spec-kit-generate-plan",
  "spec-kit-generate-tasks",
  "spec-kit-analyze-consistency",
  "spec-kit-sync-artifacts",
  "spec-kit-execute-tasks",
];

// Skills instalables = entradas de pnpm-workspace.yaml
// spec-kit es un kit atómico: una sola entrada que expande a las 7 skills + spec-kit-shared
export function listSkills() {
  const ws = fs.readFileSync(path.join(ROOT, "pnpm-workspace.yaml"), "utf8");
  return ws.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
}

export function expandSkills(skills) {
  const out = [];
  for (const s of skills) {
    if (s === "spec-kit") {
      out.push(...SPEC_KIT_SKILLS, "spec-kit-shared");
    } else if (SPEC_KIT_SKILLS.includes(s)) {
      // No se permite instalar una skill suelta del kit — se expande al kit completo
      if (!out.includes("spec-kit")) {
        console.warn(`  ! ${s} es parte del kit spec-kit — se instalará el kit completo (@erikaax/spec-kit)`);
        out.push(...SPEC_KIT_SKILLS, "spec-kit-shared");
      }
    } else {
      out.push(s);
    }
  }
  return [...new Set(out)];
}

function resolveTargetDir(target, global) {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const cwd = process.cwd();
  switch (target) {
    case "claude":
      return global ? path.join(home, ".claude", "skills") : path.join(cwd, ".claude", "skills");
    case "opencode":
      return global ? path.join(home, ".config", "opencode", "skills") : path.join(cwd, ".opencode", "skills");
    case "cursor":
      return global ? path.join(home, ".cursor", "skills") : path.join(cwd, ".cursor", "skills");
    case "windsurf":
      return global ? path.join(home, ".windsurf", "skills") : path.join(cwd, ".windsurf", "skills");
    case "codex":
      return global ? path.join(home, ".codex", "skills") : path.join(cwd, ".codex", "skills");
    case "all":
      return null; // handled separately
    case "dir":
      return null; // caller must provide --dir
    default:
      throw new Error(`Target desconocido: ${target}. Usa claude|opencode|cursor|windsurf|codex|all|dir`);
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

export async function installSkills({ skills, target, dir, global, dryRun, force }) {
  const available = listSkills();
  // Normalizar: si piden una skill suelta de spec-kit, redirigir a spec-kit (atómico)
  let normalizedSkills = skills;
  if (skills) {
    normalizedSkills = skills.map((s) => {
      if (SPEC_KIT_SKILLS.includes(s)) {
        console.warn(`  ! ${s} es parte del kit spec-kit — se instalará el kit completo (@erikaax/spec-kit)`);
        return "spec-kit";
      }
      return s;
    });
    normalizedSkills = [...new Set(normalizedSkills)];
  }
  const toInstallRaw = normalizedSkills ? normalizedSkills.filter((s) => {
    if (!available.includes(s)) {
      console.warn(`  ! skill no encontrado: ${s} (omitido). Disponibles: ${available.join(", ")}`);
      return false;
    }
    return true;
  }) : available;
  const toInstall = expandSkills(toInstallRaw);

  if (toInstall.length === 0) {
    console.error("No hay skills para instalar.");
    process.exit(1);
  }

  // resolver directorios destino
  let targets = [];
  if (target === "all") {
    const allTargets = global
      ? [path.join(process.env.HOME || "", ".claude", "skills"), path.join(process.env.HOME || "", ".config", "opencode", "skills")]
      : [path.join(process.cwd(), ".claude", "skills"), path.join(process.cwd(), ".opencode", "skills")];
    targets = allTargets;
  } else if (target === "dir") {
    if (!dir) {
      console.error("Error: --target dir requiere --dir <ruta>");
      process.exit(1);
    }
    targets = [path.resolve(dir)];
  } else {
    targets = [resolveTargetDir(target, global)];
  }

  for (const destRoot of targets) {
    console.log(`\nDestino: ${destRoot} ${global ? "(global)" : "(proyecto)"}  target=${target}`);
    for (const skill of toInstall) {
      const src = path.join(ROOT, skill);
      const dest = path.join(destRoot, skill);
      const exists = fs.existsSync(dest);
      if (exists && !force && !dryRun) {
        console.log(`  · ${skill} ya existe en ${dest} — usa --force para sobrescribir (omitido)`);
        continue;
      }
      if (dryRun) {
        console.log(`  [dry-run] ${skill}: ${src} -> ${dest}`);
      } else {
        if (exists && force) fs.rmSync(dest, { recursive: true, force: true });
        copyDirRecursive(src, dest);
        console.log(`  ✓ ${skill} -> ${dest}`);
      }
    }
  }

  if (!dryRun) {
    console.log(`\nInstalados ${toInstall.length} skill(s) en ${targets.length} destino(s).`);
    console.log(`Tip: verifica con  ls ${targets[0]}`);
  } else {
    console.log(`\n[dry-run] ${toInstall.length} skill(s) se instalarían.`);
  }
}
