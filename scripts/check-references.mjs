import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
let ROOT = REPO_ROOT;

// Spec Kit documents cross-reference each other by file path and by `§ Section` name. A renamed
// heading or a moved file breaks those references silently, so validation checks both.
// Feature artifacts (spec.md, plan.md, …) are not kit files: references into them are skipped.
const ARTIFACTS = new Set(["spec.md", "plan.md", "tasks.md", "research.md", "data-model.md", "quickstart.md", "amendments.md", "state.json", "constitution.md"]);
const PATH_RE = /`((?:spec-kit-[a-z-]+|pre-pr-review|verify-before-implement|references|assets|scripts|templates)\/[A-Za-z0-9._/-]+\.(?:md|mjs|sh|json))`/g;
// A reference runs from `§` to the first clause punctuation; a period ends it only before whitespace,
// so `6.9` and `state.json` stay whole.
// It also ends before the next "`target` §", so two references in one sentence stay separate.
const REF_RE = /(?:`([^`\n]+)`(?:['’]s)?\s+)?§\s?([^\s§](?:(?!`[^`\n]+`(?:['’]s)?\s+§)(?:[^,;:()|"\]\n§.]|\.(?=\S)))*)/g;

function kitDocuments() {
  const docs = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("spec-kit-")) continue;
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== "evals" && e.name !== "test") walk(p);
        else if (e.isFile() && e.name.endsWith(".md")) docs.push(p);
      }
    };
    walk(path.join(ROOT, entry.name));
  }
  return docs;
}

// Prose outside fenced code, with line breaks folded so references wrapped across lines are whole.
function prose(file) {
  let fenced = false;
  return fs.readFileSync(file, "utf8").split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return ""; }
    return fenced ? "" : line;
  }).join(" ");
}

const headingCache = new Map();
function headings(file) {
  if (!headingCache.has(file)) {
    let fenced = false;
    const list = [];
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
      const m = !fenced && line.match(/^#{1,6}\s+(.*)$/);
      if (m) list.push(normalize(m[1]));
    }
    headingCache.set(file, list);
  }
  return headingCache.get(file);
}

function normalize(text) {
  return text.toLowerCase().replace(/[`*]/g, "").replace(/[’]/g, "'").replace(/'s\b/g, "").replace(/\s+/g, " ").trim();
}

function skillDir(file) {
  const rel = path.relative(ROOT, file).split(path.sep);
  return path.join(ROOT, rel[0]);
}

function resolveTarget(token, file) {
  if (!token) return file;
  const name = token.trim();
  if (ARTIFACTS.has(path.basename(name)) && !name.includes("/")) return null;
  if (fs.existsSync(path.join(ROOT, name, "SKILL.md"))) return path.join(ROOT, name, "SKILL.md");
  for (const candidate of [path.join(ROOT, name), path.join(ROOT, "spec-kit-shared", name), path.join(skillDir(file), name)]) {
    if (name.endsWith(".md") && fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

// A reference matches when its leading words are a whole heading title, or the start of one (two
// words at least). Titles are the full heading and, for "Phase 2 — Escalation", the part after "—".
function refMatches(ref, target) {
  const words = normalize(ref).replace(/[^a-z0-9.\- ']/g, " ").split(/\s+/).filter(Boolean).slice(0, 8);
  if (words.length === 0) return true;
  const list = headings(target);
  if (/^[0-9]/.test(words[0]) || /^[a-z]$/.test(words[0])) {
    return list.some((h) => h === words[0] || h.startsWith(words[0] + " ") || h.startsWith(words[0] + "."));
  }
  const titles = list.flatMap((h) => [h, ...h.split(" — ").slice(1)]).map((t) => t.replace(/[^a-z0-9.\- ']/g, " ").replace(/\s+/g, " ").trim());
  for (let k = words.length; k >= 1; k--) {
    const phrase = words.slice(0, k).join(" ");
    if (titles.some((t) => t === phrase || (k >= 2 && t.startsWith(phrase)))) return true;
  }
  return false;
}

export function checkReferences(root = REPO_ROOT) {
  ROOT = root;
  headingCache.clear();
  const problems = [];
  for (const file of kitDocuments()) {
    const rel = path.relative(ROOT, file);
    const text = prose(file);
    for (const m of text.matchAll(PATH_RE)) {
      const ref = m[1];
      if (/[<[\]*#]/.test(ref)) continue;
      const fromRoot = path.join(ROOT, ref);
      const fromSkill = path.join(skillDir(file), ref);
      if (!fs.existsSync(fromRoot) && !fs.existsSync(fromSkill)) problems.push(`${rel}: path \`${ref}\` does not exist`);
    }
    for (const m of text.matchAll(REF_RE)) {
      const [, token, ref] = m;
      const target = resolveTarget(token, file);
      if (target === null) continue;
      if (target === undefined) { problems.push(`${rel}: § reference target \`${token}\` is not a kit document`); continue; }
      if (!refMatches(ref, target)) problems.push(`${rel}: "§ ${ref.trim().slice(0, 60)}" has no matching heading in ${path.relative(ROOT, target)}`);
    }
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const problems = checkReferences();
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.log(problems.length ? `✗ ${problems.length} broken reference(s)` : "✓ references resolve");
  process.exit(problems.length ? 1 : 0);
}
