import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.resolve(__dirname, "..");
const SKILLS = [
  "spec-kit-establish-constitution",
  "spec-kit-generate-spec",
  "spec-kit-generate-plan",
  "spec-kit-generate-tasks",
  "spec-kit-analyze-consistency",
  "spec-kit-sync-artifacts",
  "spec-kit-execute-tasks",
  "spec-kit-shared",
];
for (const s of SKILLS) {
  const p = path.join(DEST, s);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}
const readme = path.join(DEST, "README.md");
if (fs.existsSync(readme)) fs.rmSync(readme, { force: true });
console.log("spec-kit postpack: limpiado");
