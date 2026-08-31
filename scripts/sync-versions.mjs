import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = rootPkg.version;
const ws = fs.readFileSync(path.join(ROOT, "pnpm-workspace.yaml"), "utf8");
const skills = ws.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);

for (const skill of skills) {
  const pkgPath = skill === "spec-kit" ? path.join(ROOT, "spec-kit", "package.json") : path.join(ROOT, skill, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.version !== version) {
    pkg.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ↻ ${skill}: version -> ${version}`);
  } else {
    console.log(`  = ${skill}: ${version} already in sync`);
  }
}
console.log(`\nSynced ${skills.length} packages to ${version}`);
