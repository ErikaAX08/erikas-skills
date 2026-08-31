import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SPEC_KIT_SKILLS = [
  "spec-kit-establish-constitution",
  "spec-kit-generate-spec",
  "spec-kit-generate-plan",
  "spec-kit-generate-tasks",
  "spec-kit-analyze-consistency",
  "spec-kit-sync-artifacts",
  "spec-kit-execute-tasks",
];

export async function validate() {
  const ws = fs.readFileSync(path.join(ROOT, "pnpm-workspace.yaml"), "utf8");
  const skills = ws.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  let ok = true;

  console.log(`Validating ${skills.length} workspace packages — root version ${rootPkg.version}\n`);

  for (const skill of skills) {
    if (skill === "spec-kit") {
      // Validate atomic kit: 7 SKILL.md + kit package + spec-kit-shared
      const pkgPath = path.join(ROOT, "spec-kit", "package.json");
      if (!fs.existsSync(pkgPath)) {
        console.error(`  ✗ spec-kit: missing spec-kit/package.json`);
        ok = false;
      } else {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.version !== rootPkg.version) {
          console.error(`  ✗ spec-kit: version ${pkg.version} != root ${rootPkg.version} — run pnpm run sync:versions`);
          ok = false;
        }
        if (pkg.name !== "@erikaax/spec-kit") console.warn(`  ! spec-kit: package name ${pkg.name} expected @erikaax/spec-kit`);
      }
      for (const sub of SPEC_KIT_SKILLS) {
        const skillPath = path.join(ROOT, sub, "SKILL.md");
        if (!fs.existsSync(skillPath)) {
          console.error(`  ✗ spec-kit/${sub}: missing SKILL.md`);
          ok = false;
          continue;
        }
        const content = fs.readFileSync(skillPath, "utf8");
        const fm = content.match(/^---\n([\s\S]*?)\n---/);
        if (!fm) { console.error(`  ✗ spec-kit/${sub}: missing frontmatter`); ok = false; continue; }
        const get = (k) => {
          const r = fm[1].match(new RegExp("^" + k + ":\\s*(.+)$", "m"));
          return r ? r[1].trim() : "";
        };
        if (!get("name") || !get("description")) { console.error(`  ✗ spec-kit/${sub}: incomplete frontmatter`); ok = false; }
      }
      if (!fs.existsSync(path.join(ROOT, "spec-kit-shared", "README.md"))) {
        console.warn(`  ! spec-kit-shared: missing README.md`);
      }
      if (ok) console.log(`  ✓ spec-kit (full kit: ${SPEC_KIT_SKILLS.length} skills + spec-kit-shared)`);
      continue;
    }

    const skillPath = path.join(ROOT, skill, "SKILL.md");
    const pkgPath = path.join(ROOT, skill, "package.json");
    if (!fs.existsSync(skillPath)) {
      console.error(`  ✗ ${skill}: missing SKILL.md`);
      ok = false;
      continue;
    }
    const content = fs.readFileSync(skillPath, "utf8");
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      console.error(`  ✗ ${skill}: SKILL.md missing YAML frontmatter`);
      ok = false;
      continue;
    }
    const get = (k) => {
      const r = fm[1].match(new RegExp("^" + k + ":\\s*(.+)$", "m"));
      return r ? r[1].trim() : "";
    };
    const name = get("name");
    const desc = get("description");
    if (!name) { console.error(`  ✗ ${skill}: frontmatter missing name`); ok = false; }
    if (!desc) { console.error(`  ✗ ${skill}: frontmatter missing description`); ok = false; }
    if (name && name !== skill) console.warn(`  ! ${skill}: frontmatter name "${name}" != folder "${skill}"`);

    if (!fs.existsSync(pkgPath)) {
      console.error(`  ✗ ${skill}: missing package.json`);
      ok = false;
      continue;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.version !== rootPkg.version) {
      console.error(`  ✗ ${skill}: version ${pkg.version} != root ${rootPkg.version} — run pnpm run sync:versions`);
      ok = false;
    }
    if (pkg.name !== `@erikaax/${skill}`) console.warn(`  ! ${skill}: package name ${pkg.name} expected @erikaax/${skill}`);
    if (!pkg.files || !pkg.files.includes("SKILL.md")) console.warn(`  ! ${skill}: package.json files does not include SKILL.md`);

    if (ok) console.log(`  ✓ ${skill}`);
  }

  // check bin and scripts
  for (const f of ["bin/cli.mjs", "scripts/install.mjs", "scripts/validate.mjs", "scripts/sync-versions.mjs"]) {
    if (!fs.existsSync(path.join(ROOT, f))) { console.error(`  ✗ missing ${f}`); ok = false; }
  }
  if (ok) console.log("\n✓ Validation passed");
  else console.log("\n✗ Validation failed");
  return ok;
}

// run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  validate().then((ok) => process.exit(ok ? 0 : 1));
}
