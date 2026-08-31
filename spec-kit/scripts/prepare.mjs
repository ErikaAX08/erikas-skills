import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DEST = path.resolve(__dirname, "..");

const SKILLS = [
  "spec-kit-establish-constitution",
  "spec-kit-generate-spec",
  "spec-kit-generate-plan",
  "spec-kit-generate-tasks",
  "spec-kit-analyze-consistency",
  "spec-kit-sync-artifacts",
  "spec-kit-execute-tasks",
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (e.isFile()) fs.copyFileSync(s, d);
  }
}

for (const skill of SKILLS) {
  const src = path.join(ROOT, skill);
  const dest = path.join(DEST, skill);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  if (fs.existsSync(src)) copyDir(src, dest);
}

const sharedSrc = path.join(ROOT, "spec-kit-shared");
const sharedDest = path.join(DEST, "spec-kit-shared");
if (fs.existsSync(sharedDest)) fs.rmSync(sharedDest, { recursive: true, force: true });
if (fs.existsSync(sharedSrc)) copyDir(sharedSrc, sharedDest);

// README for the package
const readme = `# @erikaax/spec-kit\n\nComplete Spec Kit bundle — 7 skills + spec-kit-shared. Atomic installation.\n\nSee https://github.com/ErikaAX08/erikas-skills/tree/main/spec-kit-shared for the full workflow.\n`;
if (!fs.existsSync(path.join(DEST, "README.md"))) fs.writeFileSync(path.join(DEST, "README.md"), readme);

console.log("spec-kit prepack: copied", SKILLS.length, "skills + spec-kit-shared");
