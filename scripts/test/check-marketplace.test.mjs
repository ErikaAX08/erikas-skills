// Tests for check-marketplace.mjs on a minimal repo built in a temp directory.
// Run: node --test scripts/test/check-marketplace.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkMarketplace } from "../check-marketplace.mjs";

function repo(plugins) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketplace-"));
  const files = {
    "pnpm-workspace.yaml": "packages:\n  - alpha\n  - beta\n  - spec-kit\n",
    "spec-kit/package.json": JSON.stringify({ speckit: { skills: ["spec-kit-one", "spec-kit-two"] } }),
    "alpha/SKILL.md": "", "beta/SKILL.md": "", "spec-kit-one/SKILL.md": "", "spec-kit-two/SKILL.md": "",
    ".claude-plugin/marketplace.json": JSON.stringify({ name: "demo", owner: { name: "x" }, plugins }),
  };
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const VALID = [
  { name: "tools", source: "./", skills: ["./alpha", "./beta"] },
  { name: "spec-kit", source: "./", skills: ["./spec-kit-one", "./spec-kit-two"] },
];

test("every skill in exactly one plugin passes", () => {
  assert.deepEqual(checkMarketplace(repo(VALID)), []);
});

test("a missing, duplicated, or nonexistent skill is reported", () => {
  const problems = checkMarketplace(repo([
    { name: "tools", source: "./", skills: ["./alpha", "./gamma"] },
    { name: "more", source: "./", skills: ["./alpha"] },
    VALID[1],
  ]));
  assert.equal(problems.length, 3);
  assert.ok(problems.some((p) => p.includes("./gamma has no SKILL.md")));
  assert.ok(problems.some((p) => p.includes("alpha is in both plugin tools and plugin more")));
  assert.ok(problems.some((p) => p.includes("beta is in no plugin")));
});

test("a partial spec-kit plugin is reported", () => {
  const problems = checkMarketplace(repo([
    { ...VALID[0], skills: ["./alpha", "./beta", "./spec-kit-two"] },
    { name: "spec-kit", source: "./", skills: ["./spec-kit-one"] },
  ]));
  assert.deepEqual(problems, ["plugin spec-kit must list exactly the skills in speckit.skills of spec-kit/package.json"]);
});

test("the repository's own marketplace lists every skill once", () => {
  assert.deepEqual(checkMarketplace(), []);
});
