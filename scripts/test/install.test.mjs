// Tests for install.mjs against the real repo, installing into a temp directory.
// Run: node --test scripts/test/install.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { installSkills, listSkills } from "../install.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

async function install(skills) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "install-"));
  const log = console.log;
  console.log = () => {};
  try {
    await installSkills({ skills, target: "dir", dir, global: false, dryRun: false, force: false });
  } finally {
    console.log = log;
  }
  return dir;
}

function walk(dir, rel = "") {
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const r = path.posix.join(rel, e.name);
    return e.isDirectory() ? walk(dir, r) : [r];
  });
}

test("every listed skill except the spec-kit bundle has a SKILL.md", () => {
  for (const skill of listSkills().filter((s) => s !== "spec-kit")) {
    assert.ok(fs.existsSync(path.join(ROOT, skill, "SKILL.md")), `${skill}/SKILL.md`);
  }
});

test("brand-guidelines installs as a skill", async () => {
  const dir = await install(["brand-guidelines"]);
  assert.deepEqual(walk(path.join(dir, "brand-guidelines")), ["SKILL.md"]);
});

test("repo-only files are not installed", async () => {
  const dir = await install(["pre-pr-review", "brain-orchestrator", "spec-kit"]);
  const files = walk(dir);
  const leaked = files.filter((f) =>
    /(^|\/)(package\.json|package-lock\.json)$/.test(f) ||
    /(^|\/)(evals|test)\//.test(f) ||
    /\.test\.[cm]?js$/.test(f) ||
    /^[^/]+\/README\.md$/.test(f) && !f.startsWith("spec-kit-shared/"));
  assert.deepEqual(leaked, []);
  assert.ok(files.includes("pre-pr-review/SKILL.md"));
  assert.ok(files.includes("pre-pr-review/scripts/trace.mjs"));
  assert.ok(files.includes("brain-orchestrator/templates/TASK.md"));
  assert.ok(files.includes("spec-kit-shared/README.md"));
  assert.ok(files.includes("spec-kit-shared/scripts/fingerprint.mjs"));
});
