// Tests for fingerprint.mjs and lint-artifacts.mjs against spec-kit-shared/evals/base-feature.
// Run: node --test spec-kit-shared/scripts/test/
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareState, fingerprint, recordEntry } from "../fingerprint.mjs";
import { lint } from "../lint-artifacts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(HERE, "../../evals/base-feature");
const SCRIPTS = path.resolve(HERE, "..");

function feature(mutate = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speckit-test-"));
  fs.cpSync(BASE, dir, { recursive: true });
  mutate({
    dir,
    read: (f) => fs.readFileSync(path.join(dir, f), "utf8"),
    write: (f, text) => fs.writeFileSync(path.join(dir, f), text),
    edit: (f, from, to) => {
      const text = fs.readFileSync(path.join(dir, f), "utf8");
      assert.ok(text.includes(from), `fixture ${f} does not contain: ${from}`);
      fs.writeFileSync(path.join(dir, f), text.replace(from, to));
    },
  });
  return dir;
}

const codes = (result, severity) =>
  result.findings.filter((f) => !severity || f.severity === severity).map((f) => f.code).sort();

const record = (dir) => ["spec", "plan", "tasks"].forEach((a) => recordEntry(dir, a));

const AMENDMENT = `
#### Enmiendas

- [ ] T009 [US1] [ENMIENDA T002] Treat 429 as ambiguous in the outcome mapping
      Enmienda: AM-01
      Traza a: R-AC03, PL-O02
      Validación: \`npm test -- allowList.service\` keeps a 429 entry pending; re-recorrer el \`Verifica\` de T005 (cierre activo)
`;

// ── base fixture ────────────────────────────────────────────────────────────

test("base fixture lints clean", () => {
  const result = lint(BASE);
  assert.equal(result.status, 0);
  assert.deepEqual(result.findings, []);
});

// ── fingerprint.mjs ─────────────────────────────────────────────────────────

test("record then state reports no drift, and checkbox progress is not drift", () => {
  const dir = feature();
  record(dir);
  assert.equal(compareState(dir).status, 0);
  const tasks = path.join(dir, "tasks.md");
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("- [ ] T002", "- [x] T002"));
  assert.equal(compareState(dir).status, 0);
});

test("a content edit is drift and is localized to the changed ID", () => {
  const dir = feature();
  record(dir);
  const spec = path.join(dir, "spec.md");
  fs.writeFileSync(spec, fs.readFileSync(spec, "utf8").replace("within 10 seconds, including", "within 8 seconds, including"));
  const result = compareState(dir);
  assert.equal(result.status, 1);
  assert.deepEqual(result.localized.spec, { changed: ["R-QR01"], added: [], removed: [] });
  assert.ok(result.lines.some((l) => l.startsWith("plan.based_on_spec_hash: DRIFT")));
});

test("an added task is localized as added", () => {
  const dir = feature();
  record(dir);
  const tasks = path.join(dir, "tasks.md");
  fs.appendFileSync(tasks, "\n- [ ] T009 Extra task\n      Traza a: R-G01, PL-O02\n      Archivo(s): ninguno\n      Depende de: ninguna\n      Validación: it runs\n");
  assert.deepEqual(compareState(dir).localized.tasks, { changed: [], added: ["T009"], removed: [] });
});

test("a legacy raw tasks hash differing only in checkboxes is not drift", () => {
  const dir = feature();
  record(dir);
  const tasks = path.join(dir, "tasks.md");
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("- [ ] T001", "- [x] T001"));
  const statePath = path.join(dir, "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  state.artifacts.tasks.content_hash = fingerprint(tasks, { mode: "raw" });
  fs.writeFileSync(statePath, JSON.stringify(state));
  const result = compareState(dir);
  assert.equal(result.status, 0);
  assert.ok(result.lines.some((l) => l.includes("legacy raw hash")));
});

test("record migrates a version-1 state and keeps source_documents", () => {
  const dir = feature();
  const sources = { S1: { path: "docs/plan-sms-allow-list.md", fingerprint: "sha256:1111", read_at: "2026-10-01T00:00:00Z" } };
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify({ artifacts: {}, source_documents: sources }));
  const result = recordEntry(dir, "spec");
  assert.ok(result.lines.includes("SCHEMA_MIGRATED: 1→2"));
  const state = JSON.parse(fs.readFileSync(path.join(dir, "state.json"), "utf8"));
  assert.equal(state.schema_version, 2);
  assert.deepEqual(state.source_documents, sources);
  assert.ok(state.artifacts.spec.sections["R-AC03"].startsWith("sha256:"));
});

test("a state newer than the contract stops compare, record, and lint", () => {
  const dir = feature();
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify({ schema_version: 3, artifacts: {} }));
  assert.equal(compareState(dir).status, 3);
  assert.equal(recordEntry(dir, "spec").status, 3);
  assert.equal(lint(dir).status, 3);
});

// ── lint-artifacts.mjs ──────────────────────────────────────────────────────

test("L01 duplicate definition and L02 broken citation", () => {
  const dir = feature(({ edit }) => {
    edit("spec.md", "- **R-AC04**:", "- **R-AC01**: duplicated\n- **R-AC04**:");
    edit("tasks.md", "Traza a: S-SG02, PL-O03", "Traza a: S-SG02, PL-O09");
  });
  const result = lint(dir);
  assert.deepEqual(codes(result, "BLOCKING"), ["L01", "L02"]);
  assert.equal(result.status, 1);
});

test("L03 legacy plan IDs collide with spec IDs and skip plan-level checks", () => {
  const dir = feature(({ read, write }) => {
    write("plan.md", read("plan.md").replaceAll("PL-D0", "A-D0").replaceAll("PL-O0", "O-0"));
    write("tasks.md", read("tasks.md").replaceAll("PL-O0", "O-0"));
  });
  const result = lint(dir);
  assert.deepEqual(codes(result, "BLOCKING"), []);
  assert.ok(codes(result, "ADVISORY").includes("L03"));
  assert.ok(result.notChecked.some((n) => n.startsWith("legacy plan")));
});

test("L06 missing field, L07 unknown dependency, and an appended lower phase ID is not an error", () => {
  const dir = feature(({ edit }) => {
    edit("tasks.md", "Validación: `npm test -- allowList.route` returns 201 with the flag on and 404 with it off\n", "");
    edit("tasks.md", "Depende de: T001\n      Validación: `npm test -- allowList.sweep`", "Depende de: T099\n      Validación: `npm test -- allowList.sweep`");
  });
  const result = lint(dir);
  assert.deepEqual(codes(result), ["L06", "L07"]);
});

test("L08 two active closures and L09 regular task after the closure", () => {
  const dir = feature(({ edit }) => {
    edit("tasks.md", "**Checkpoint**: US1 works", "- [ ] T009 [US1] [CIERRE] Second closure\n      Verifica:\n        - R-AC01 satisfecho\n      Validación: recorrido\n\n**Checkpoint**: US1 works");
  });
  assert.ok(codes(lint(dir), "BLOCKING").includes("L08"));

  const dir2 = feature(({ edit }) => {
    edit("tasks.md", "**Checkpoint**: US1 works", "- [ ] T009 [US1] Late task\n      Traza a: R-AC01, PL-O02\n      Archivo(s): src/sms/allowList/service.js\n      Depende de: T002\n      Validación: it passes\n\n**Checkpoint**: US1 works");
  });
  assert.deepEqual(codes(lint(dir2), "BLOCKING"), ["L09"]);
});

test("L10 closure that lists R-AC IDs must cover the story's claimed criteria", () => {
  const dir = feature(({ edit }) => edit("tasks.md", "- R-AC01, R-AC02, R-AC03 satisfechos", "- R-AC01 satisfecho"));
  assert.deepEqual(codes(lint(dir), "BLOCKING"), ["L10"]);
  const dir2 = feature(({ edit }) => edit("tasks.md", "- R-AC01, R-AC02, R-AC03 satisfechos", "- Todo R-AC de esta historia satisfecho"));
  assert.deepEqual(codes(lint(dir2)), ["L10"]);
  assert.equal(lint(dir2).findings[0].severity, "ADVISORY");
});

test("a valid amendment after the closure lints clean; broken links do not", () => {
  const withAmendment = (status, { amendmentsFile = true, tag = "[ENMIENDA T002] " } = {}) =>
    feature(({ dir, edit }) => {
      for (const id of ["T002", "T003", "T004", "T005"]) edit("tasks.md", `- [ ] ${id}`, `- [x] ${id}`);
      edit("tasks.md", "\n**Checkpoint**: US1 works", AMENDMENT.replace("[ENMIENDA T002] ", tag) + "\n**Checkpoint**: US1 works");
      if (amendmentsFile) fs.writeFileSync(path.join(dir, "amendments.md"), `# Amendments\n\n## AM-01 — 429 is ambiguous\n\n- **Layer**: plan\n- **Status**: ${status}\n`);
    });
  assert.deepEqual(lint(withAmendment("applied")).findings, []);
  assert.deepEqual(codes(lint(withAmendment("applied", { amendmentsFile: false })), "BLOCKING"), ["L12"]);
  assert.deepEqual(codes(lint(withAmendment("applied", { tag: "" })), "BLOCKING"), ["L09"]);
  assert.deepEqual(codes(lint(withAmendment("stopped")), "BLOCKING"), ["L19"]);
  assert.deepEqual(codes(lint(withAmendment("done"))), ["L20"]);
});

test("L11 superseded task must be closed and point to an existing task", () => {
  const dir = feature(({ edit }) => edit("tasks.md", "Validación: `npm test -- allowList.service` passes", "Superada por: T050 (AM-01)\n      Validación: `npm test -- allowList.service` passes"));
  const blocking = codes(lint(dir), "BLOCKING");
  assert.ok(blocking.filter((c) => c === "L11").length === 2);
});

test("L13 assumption without probe, L14 dependent task not after its probe", () => {
  const assume = ({ edit }) => edit("plan.md", "| RS-02 | executed |", "| RS-02 | assumption |");
  assert.deepEqual(codes(lint(feature(assume)), "BLOCKING"), ["L13"]);

  const probe = "- [ ] T009 [SONDA] Confirm when the logger captures the URL (PL-D02, RS-02)\n      Traza a: PL-D02, RS-02\n      Archivo(s): ninguno (script en scratch)\n      Depende de: ninguna\n      Validación: the probe prints the URL before the handler runs\n\n**Checkpoint**: foundation ready";
  const withProbe = (s) => { assume(s); s.edit("tasks.md", "**Checkpoint**: foundation ready", probe); };
  const unordered = lint(feature(withProbe));
  assert.deepEqual(codes(unordered, "BLOCKING"), ["L14"]);
  assert.match(unordered.findings.find((f) => f.code === "L14").message, /^T004 /);

  const ordered = lint(feature((s) => { withProbe(s); s.edit("tasks.md", "Archivo(s): src/sms/allowList/route.js\n      Depende de: T003", "Archivo(s): src/sms/allowList/route.js\n      Depende de: T003, T009"); }));
  assert.deepEqual(codes(ordered, "BLOCKING"), []);
});

test("L15 runtime premise verified only by reading", () => {
  const dir = feature(({ edit }) => edit("research.md", "| yes | executed | `node probe-logger.js`", "| yes | read | `node probe-logger.js`"));
  const blocking = lint(dir).findings.filter((f) => f.code === "L15");
  assert.deepEqual(blocking.map((f) => f.file).sort(), ["plan.md", "research.md"]);
});

test("L16 missing evidence level and L17 unlinked operations", () => {
  const dir = feature(({ edit }) => {
    edit("plan.md", "| RS-01 | executed |", "| RS-01 |  |");
    edit("plan.md", "| PL-O04 | Add the expiry sweep | O-02, R-FR02, R-AC04 |", "| PL-O04 | Add the expiry sweep | R-FR02, R-AC04 |");
  });
  const advisory = lint(dir).findings.filter((f) => f.severity === "ADVISORY").map((f) => `${f.code}:${f.message.split(" ")[0]}`).sort();
  assert.deepEqual(advisory, ["L16:PL-D01", "L17:O-02", "L17:PL-O04"]);
});

test("L18 sensitive-data channel without a safeguard", () => {
  const dir = feature(({ edit }) => edit("spec.md", "| Query string | none | absent | N/A — POST only |", "| Query string | phone | full |  |"));
  assert.deepEqual(codes(lint(dir), "BLOCKING"), ["L18"]);
});

test("L21 non-canonical grammar token", () => {
  const dir = feature(({ edit }) => edit("tasks.md", "      Validación: `npm run migrate:up", "      Validacion: `npm run migrate:up"));
  const result = lint(dir);
  assert.ok(codes(result, "ADVISORY").includes("L21"));
  assert.ok(codes(result, "BLOCKING").includes("L06"));
});

// ── CLI contracts ───────────────────────────────────────────────────────────

test("CLI exit codes", () => {
  const run = (script, ...args) => spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8" });
  assert.equal(run("lint-artifacts.mjs", BASE).status, 0);
  assert.equal(run("lint-artifacts.mjs", os.tmpdir()).status, 2);
  const broken = feature(({ edit }) => edit("tasks.md", "Traza a: S-SG02, PL-O03", "Traza a: S-SG02, PL-O09"));
  const lintRun = run("lint-artifacts.mjs", broken, "--json");
  assert.equal(lintRun.status, 1);
  assert.equal(JSON.parse(lintRun.stdout).findings[0].code, "L02");
  const dir = feature();
  assert.equal(run("fingerprint.mjs", "--state", dir).status, 2);
  assert.equal(run("fingerprint.mjs", "--record", dir, "tasks").status, 0);
  assert.equal(run("fingerprint.mjs", "--record", dir, "nope").status, 64);
});
