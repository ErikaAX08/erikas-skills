#!/usr/bin/env node
// Content Fingerprint Convention (spec-kit-shared/artifact-conventions.md), computed mechanically.
//
//   node fingerprint.mjs <file>...                        print "sha256:<hex>  <file>" per file
//   node fingerprint.mjs --sections <file>                print per-ID section hashes as JSON
//   node fingerprint.mjs --state <feature-dir>            compare spec/plan/tasks against state.json
//     exit 0 = no drift, 1 = drift, 2 = no state.json, 3 = state.json newer than this contract
//   node fingerprint.mjs --record <feature-dir> <spec|plan|tasks>
//                                                         write that artifact's state.json entry
//     run only by the artifact's owning skill (§ Write Ownership); exit 3 = state.json too new
//   --state and --record also accept --log <run-id> --skill <name> to record their result in the
//   feature's run log (§ Run Log)
//
// tasks.md is hashed progress-insensitively (checkboxes normalized to "[ ]"); --tasks forces that
// normalization on any file and --raw disables it.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTRACT_VERSION, sectionBlocks } from "./lib/artifacts.mjs";
import { appendEvent, logOption } from "./lib/runlog.mjs";

const CHECKBOX = /^(\s*[-*]\s+)\[[xX]\]/gm;
const UPSTREAM = { plan: ["based_on_spec_hash", "spec"], tasks: ["based_on_plan_hash", "plan"] };

function sha256(text) {
  return "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
}

export function fingerprint(file, { mode = "auto" } = {}) {
  const text = fs.readFileSync(file, "utf8");
  const normalize = mode === "tasks" || (mode === "auto" && path.basename(file) === "tasks.md");
  return sha256(normalize ? text.replace(CHECKBOX, "$1[ ]") : text);
}

export function sections(file) {
  const out = {};
  for (const [id, block] of Object.entries(sectionBlocks(file))) out[id] = sha256(block);
  return out;
}

function readState(dir) {
  const statePath = path.join(dir, "state.json");
  return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : null;
}

function diffSections(recorded, current) {
  const changed = [], added = [], removed = [];
  for (const [id, h] of Object.entries(current)) {
    if (!(id in recorded)) added.push(id);
    else if (recorded[id] !== h) changed.push(id);
  }
  for (const id of Object.keys(recorded)) if (!(id in current)) removed.push(id);
  return { changed, added, removed };
}

export function compareState(dir) {
  const lines = [];
  const state = readState(dir);
  if (!state) {
    lines.push(`STATE_FOUND: false (${path.join(dir, "state.json")}) — nothing to compare; this is not "no drift".`);
    return { status: 2, lines };
  }
  const version = state.schema_version ?? 1;
  if (version > CONTRACT_VERSION) {
    lines.push(`SCHEMA_VERSION: ${version} — newer than this kit's contract (${CONTRACT_VERSION}); update the kit before comparing.`);
    return { status: 3, lines };
  }
  lines.push(`SCHEMA_VERSION: ${version}${version < CONTRACT_VERSION ? " (legacy — migrates on next write)" : ""}`);
  const { artifacts = {} } = state;
  const current = {};
  const localized = {};
  let drift = false;
  for (const name of ["spec", "plan", "tasks"]) {
    const entry = artifacts[name];
    const file = path.join(dir, entry?.path ?? `${name}.md`);
    if (!fs.existsSync(file)) {
      lines.push(`${name}.md: absent${entry ? " (recorded in state.json — vanished)" : ""}`);
      if (entry) drift = true;
      continue;
    }
    current[name] = fingerprint(file);
    if (!entry) {
      lines.push(`${name}.md: not recorded  current=${current[name]}`);
      continue;
    }
    let status = current[name] === entry.content_hash ? "MATCH" : "DRIFT";
    if (status === "DRIFT" && name === "tasks" && fingerprint(file, { mode: "raw" }) === entry.content_hash) {
      status = "MATCH (legacy raw hash — rewrite normalized)";
    }
    if (status === "DRIFT") drift = true;
    lines.push(`${name}.md content: ${status}  recorded=${entry.content_hash}  current=${current[name]}`);
    if (status === "DRIFT") {
      if (entry.sections) {
        const d = diffSections(entry.sections, sections(file));
        localized[name] = d;
        const touched = d.changed.length + d.added.length + d.removed.length;
        lines.push(touched
          ? `  localized: changed=[${d.changed.join(", ")}] added=[${d.added.join(", ")}] removed=[${d.removed.join(", ")}]`
          : "  localized: no ID block changed — the edit is outside every ID definition");
      } else {
        lines.push("  localized: no recorded sections — localization falls back to a manual diff");
      }
    }
  }
  for (const [name, [field, upstream]] of Object.entries(UPSTREAM)) {
    const based = artifacts[name]?.[field];
    if (!based || !current[upstream]) continue;
    const status = based === current[upstream] ? "MATCH" : "DRIFT";
    if (status === "DRIFT") drift = true;
    lines.push(`${name}.${field}: ${status}  recorded=${based}  current ${upstream}=${current[upstream]}`);
  }
  lines.push(`ARTIFACT_DRIFT: ${drift ? "YES" : "NO"} (source_documents are checked separately per the convention)`);
  return { status: drift ? 1 : 0, lines, localized };
}

// Writes artifacts.<name> (content_hash, based_on_* from the current upstream file, sections,
// updated_at), sets schema_version, and leaves every other entry and source_documents untouched.
export function recordEntry(dir, name, { now = new Date() } = {}) {
  if (!["spec", "plan", "tasks"].includes(name)) throw new Error(`unknown artifact "${name}" (spec, plan, tasks)`);
  const lines = [];
  const existing = readState(dir);
  const version = existing ? existing.schema_version ?? 1 : CONTRACT_VERSION;
  if (version > CONTRACT_VERSION) {
    lines.push(`SCHEMA_VERSION: ${version} — newer than this kit's contract (${CONTRACT_VERSION}); refusing to write.`);
    return { status: 3, lines };
  }
  const file = path.join(dir, `${name}.md`);
  if (!fs.existsSync(file)) throw new Error(`${file} does not exist`);
  const entry = { path: `${name}.md`, content_hash: fingerprint(file) };
  if (UPSTREAM[name]) {
    const [field, upstream] = UPSTREAM[name];
    const upstreamFile = path.join(dir, `${upstream}.md`);
    if (!fs.existsSync(upstreamFile)) throw new Error(`${upstreamFile} does not exist; ${name} cannot record ${field}`);
    entry[field] = fingerprint(upstreamFile);
  }
  entry.sections = sections(file);
  entry.updated_at = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const state = existing ?? {};
  const out = { ...state, schema_version: CONTRACT_VERSION, artifacts: { ...(state.artifacts ?? {}), [name]: entry } };
  if (existing && version < CONTRACT_VERSION) lines.push(`SCHEMA_MIGRATED: ${version}→${CONTRACT_VERSION}`);
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(out, null, 2) + "\n");
  lines.push(`RECORDED: artifacts.${name} content_hash=${entry.content_hash} sections=${Object.keys(entry.sections).length}`);
  return { status: 0, lines };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const usage = "usage: fingerprint.mjs [--tasks|--raw] <file>... | --sections <file> | --state <feature-dir> | --record <feature-dir> <spec|plan|tasks>";
  const run = (result) => {
    for (const l of result.lines) console.log(l);
    process.exit(result.status);
  };
  const log = logOption(args);
  if (args[0] === "--state") {
    if (!args[1]) { console.error(usage); process.exit(64); }
    const result = compareState(args[1]);
    if (log && result.status !== 2) {
      const localized = Object.entries(result.localized ?? {}).map(([name, d]) => `${name}: changed=${d.changed.join("|") || "-"} added=${d.added.join("|") || "-"} removed=${d.removed.join("|") || "-"}`);
      appendEvent(args[1], { ...log, event: "check", data: { tool: "fingerprint", mode: "state", exit: result.status, drift: result.status === 1, localized } });
    }
    run(result);
  } else if (args[0] === "--record") {
    if (!args[1] || !args[2]) { console.error(usage); process.exit(64); }
    let result;
    try { result = recordEntry(args[1], args[2]); } catch (err) { console.error(`ERROR: ${err.message}`); process.exit(64); }
    if (log && result.status === 0) {
      const hash = (result.lines.find((l) => l.startsWith("RECORDED:")) ?? "").match(/content_hash=(\S+)/)?.[1];
      appendEvent(args[1], { ...log, event: "artifact", data: { path: `${args[2]}.md`, action: "record", hash_after: hash, migrated: result.lines.some((l) => l.startsWith("SCHEMA_MIGRATED")) } });
    }
    run(result);
  } else if (args[0] === "--sections") {
    if (!args[1]) { console.error(usage); process.exit(64); }
    console.log(JSON.stringify(sections(args[1]), null, 2));
  } else {
    const mode = args.includes("--raw") ? "raw" : args.includes("--tasks") ? "tasks" : "auto";
    const files = args.filter((a) => !a.startsWith("--"));
    if (files.length === 0) { console.error(usage); process.exit(64); }
    for (const f of files) console.log(`${fingerprint(f, { mode })}  ${f}`);
  }
}
