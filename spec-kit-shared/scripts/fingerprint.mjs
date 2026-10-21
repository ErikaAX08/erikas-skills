#!/usr/bin/env node
// Content Fingerprint Convention (spec-kit-shared/artifact-conventions.md), computed mechanically.
//
//   node fingerprint.mjs <file>...            print "sha256:<hex>  <file>" per file
//   node fingerprint.mjs --state <feature-dir> compare spec/plan/tasks against state.json
//
// tasks.md is hashed progress-insensitively (checkboxes normalized to "[ ]"); --tasks forces that
// normalization on any file and --raw disables it.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHECKBOX = /^(\s*[-*]\s+)\[[xX]\]/gm;

function sha256(text) {
  return "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
}

export function fingerprint(file, { mode = "auto" } = {}) {
  const text = fs.readFileSync(file, "utf8");
  const normalize = mode === "tasks" || (mode === "auto" && path.basename(file) === "tasks.md");
  return sha256(normalize ? text.replace(CHECKBOX, "$1[ ]") : text);
}

function compareState(dir) {
  const statePath = path.join(dir, "state.json");
  if (!fs.existsSync(statePath)) {
    console.log(`STATE_FOUND: false (${statePath}) — nothing to compare; this is not "no drift".`);
    return 2;
  }
  const { artifacts = {} } = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const current = {};
  let drift = false;
  for (const name of ["spec", "plan", "tasks"]) {
    const entry = artifacts[name];
    const file = path.join(dir, entry?.path ?? `${name}.md`);
    if (!fs.existsSync(file)) {
      console.log(`${name}.md: absent${entry ? " (recorded in state.json — vanished)" : ""}`);
      if (entry) drift = true;
      continue;
    }
    current[name] = fingerprint(file);
    if (!entry) {
      console.log(`${name}.md: not recorded  current=${current[name]}`);
      continue;
    }
    let status = current[name] === entry.content_hash ? "MATCH" : "DRIFT";
    if (status === "DRIFT" && name === "tasks" && fingerprint(file, { mode: "raw" }) === entry.content_hash) {
      status = "MATCH (legacy raw hash — rewrite normalized)";
    }
    if (status === "DRIFT") drift = true;
    console.log(`${name}.md content: ${status}  recorded=${entry.content_hash}  current=${current[name]}`);
  }
  const links = [
    ["plan", "based_on_spec_hash", "spec"],
    ["tasks", "based_on_plan_hash", "plan"],
  ];
  for (const [name, field, upstream] of links) {
    const based = artifacts[name]?.[field];
    if (!based || !current[upstream]) continue;
    const status = based === current[upstream] ? "MATCH" : "DRIFT";
    if (status === "DRIFT") drift = true;
    console.log(`${name}.${field}: ${status}  recorded=${based}  current ${upstream}=${current[upstream]}`);
  }
  console.log(`ARTIFACT_DRIFT: ${drift ? "YES" : "NO"} (source_documents are checked separately per the convention)`);
  return drift ? 1 : 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args[0] === "--state") {
    if (!args[1]) {
      console.error("usage: fingerprint.mjs --state <feature-dir>");
      process.exit(64);
    }
    process.exit(compareState(args[1]));
  }
  const mode = args.includes("--raw") ? "raw" : args.includes("--tasks") ? "tasks" : "auto";
  const files = args.filter((a) => !a.startsWith("--"));
  if (files.length === 0) {
    console.error("usage: fingerprint.mjs [--tasks|--raw] <file>... | --state <feature-dir>");
    process.exit(64);
  }
  for (const f of files) console.log(`${fingerprint(f, { mode })}  ${f}`);
}
