import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// .claude-plugin/marketplace.json lists skills by hand, so it drifts from the workspace silently:
// every installable skill must be in exactly one plugin (two would load it twice), and the
// spec-kit plugin must carry the whole kit, as the CLI and npm bundle do.
export function checkMarketplace(root = REPO_ROOT) {
  const file = path.join(root, ".claude-plugin", "marketplace.json");
  if (!fs.existsSync(file)) return [".claude-plugin/marketplace.json is missing"];
  const problems = [];
  const marketplace = JSON.parse(fs.readFileSync(file, "utf8"));

  const ws = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8");
  const workspace = ws.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  const kit = JSON.parse(fs.readFileSync(path.join(root, "spec-kit", "package.json"), "utf8")).speckit?.skills ?? [];
  const expected = [...workspace.filter((s) => s !== "spec-kit"), ...kit];

  const owner = new Map();
  for (const plugin of marketplace.plugins ?? []) {
    if (plugin.source !== "./") problems.push(`plugin ${plugin.name}: source must be "./" so skills resolve from the repo root`);
    for (const entry of plugin.skills ?? []) {
      const skill = entry.replace(/^\.\//, "").replace(/\/$/, "");
      if (!fs.existsSync(path.join(root, skill, "SKILL.md"))) problems.push(`plugin ${plugin.name}: ${entry} has no SKILL.md`);
      if (owner.has(skill)) problems.push(`${skill} is in both plugin ${owner.get(skill)} and plugin ${plugin.name}`);
      else owner.set(skill, plugin.name);
    }
  }
  for (const skill of expected.filter((s) => !owner.has(s))) problems.push(`${skill} is in no plugin`);

  const kitPlugin = (marketplace.plugins ?? []).find((p) => p.name === "spec-kit");
  const kitSkills = new Set((kitPlugin?.skills ?? []).map((s) => s.replace(/^\.\//, "").replace(/\/$/, "")));
  if (!kitPlugin) problems.push("no spec-kit plugin");
  else if (kit.some((s) => !kitSkills.has(s)) || kitSkills.size !== kit.length) problems.push("plugin spec-kit must list exactly the skills in speckit.skills of spec-kit/package.json");

  return problems;
}
