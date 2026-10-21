// Tests for check-references.mjs on a minimal kit built in a temp directory.
// Run: node --test scripts/test/check-references.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkReferences } from "../check-references.mjs";

function kit(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "refcheck-"));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const BASE = {
  "spec-kit-shared/artifact-conventions.md": "# Conventions\n\n## Write Ownership\n\n## Writing `state.json`\n",
  "spec-kit-demo/SKILL.md": "# Demo\n\n## Workflow\n\n### Phase 2 — Escalation\n\n### Phase 3 — Coverage Checks (spec → plan)\n\nSee § Escalation, § Coverage Checks,\nand `artifact-conventions.md` § Write\nOwnership. Use `references/updating.md`. Edit `spec.md` §E freely.\n\n```text\n§ Not A Heading inside a fence\n```\n",
  "spec-kit-demo/references/updating.md": "# Updating\n\nFollow `spec-kit-demo` § Workflow and `artifact-conventions.md` § Writing `state.json`.\n",
};

test("valid references, wrapped across lines and with dotted names, resolve", () => {
  assert.deepEqual(checkReferences(kit(BASE)), []);
});

test("a renamed heading, a missing file, and an unknown target are reported", () => {
  const root = kit({
    ...BASE,
    "spec-kit-shared/artifact-conventions.md": "# Conventions\n\n## Ownership Matrix\n\n## Writing `state.json`\n",
    "spec-kit-demo/SKILL.md": BASE["spec-kit-demo/SKILL.md"].replace("`references/updating.md`", "`references/missing.md`") + "\nAlso `nope-skill` § Something.\n",
  });
  const problems = checkReferences(root);
  assert.equal(problems.length, 3);
  assert.ok(problems.some((p) => p.includes("§ Write") && p.includes("artifact-conventions.md")));
  assert.ok(problems.some((p) => p.includes("references/missing.md")));
  assert.ok(problems.some((p) => p.includes("nope-skill")));
});

test("the repository's own kit has no broken reference", () => {
  assert.deepEqual(checkReferences(), []);
});
