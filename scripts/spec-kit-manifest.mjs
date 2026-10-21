import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Single source of truth for the atomic kit's skills: the `speckit.skills` field of spec-kit/package.json.
export const SPEC_KIT_MANIFEST = path.join(ROOT, "spec-kit", "package.json");
export const SPEC_KIT_SKILLS = JSON.parse(fs.readFileSync(SPEC_KIT_MANIFEST, "utf8")).speckit?.skills ?? [];
