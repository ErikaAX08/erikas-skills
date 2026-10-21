// Parser for spec-kit feature artifacts, following the Artifact Grammar in
// spec-kit-shared/artifact-conventions.md. Shared by fingerprint.mjs (per-ID hashes) and
// lint-artifacts.mjs (mechanical checks).
import fs from "node:fs";
import path from "node:path";

// Contract version of spec-kit-shared/artifact-conventions.md; state.json without schema_version is version 1.
export const CONTRACT_VERSION = 2;

// Stable ID families (§ Stable ID Namespaces). Template placeholders such as `R-FR0#` never match.
const ID_SOURCE =
  "R-(?:FR|QR|AC|AS|US|DEP|RISK|G|D)\\d+|E-(?:I|DL)\\d+|E-\\d+|A-(?:D|E|C)\\d+|A-\\d+" +
  "|S-(?:CS|SG|C)\\d+|O-\\d+|N-\\d+|PL-(?:D|O)\\d+|RS-\\d+|AM-\\d+|T\\d{3,}";
const ID_RE = () => new RegExp(`(?<![A-Za-z0-9-])(${ID_SOURCE})(?![A-Za-z0-9])`, "g");
const EVIDENCE_REF_RE = () => /\[((?:[SP]\d+)(?:\s*,\s*[SP]\d+)*)\]/g;
const ID_ONLY = new RegExp(`^(?:${ID_SOURCE}|[SP]\\d+)$`);

// Canonical task-field tokens (§ Grammar Tokens).
export const TASK_FIELDS = ["Traza a", "Archivo(s)", "Depende de", "Validación", "Verifica", "Enmienda", "Superada por"];
const FIELD_RE = /^(Traza a|Archivo\(s\)|Depende de|Validación|Verifica|Enmienda|Superada por):\s*(.*)$/;
const TASK_RE = /^(\s*)[-*]\s+\[( |x|X)\]\s+(T\d{3,})\b\s*(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const SEPARATOR_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const FOLDED_FIELDS = new Map(TASK_FIELDS.map((f) => [fold(f), f]));

export function idsIn(text) {
  const out = [];
  for (const m of text.matchAll(ID_RE())) out.push(m[1]);
  for (const m of text.matchAll(EVIDENCE_REF_RE())) out.push(...m[1].split(/\s*,\s*/));
  return out;
}

export function familyOf(id) {
  const m = id.match(/^([A-Z]+(?:-[A-Z]+)?-?)/);
  return m ? m[1].replace(/-$/, "") : id;
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

// Lines of a file with fenced code blocks marked, so IDs inside examples are not indexed.
function readLines(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let fenced = false;
  return lines.map((text, i) => {
    const isFence = /^\s*(```|~~~)/.test(text);
    const inFence = fenced || isFence;
    if (isFence) fenced = !fenced;
    return { n: i + 1, text, inFence };
  });
}

// Definitions: bold list items (`- **R-FR01**:`), ID headings (`### O-01 — …`), and rows of tables whose
// first column is headed `ID`. Rows of other tables (Safe Deferral, Convention Enforcement) only cite.
// Each definition carries the block of text that belongs to it, for per-ID hashing.
function parseDefinitions(lines) {
  const defs = [];
  const tables = [];
  let header = null;
  for (let i = 0; i < lines.length; i++) {
    const { text, inFence, n } = lines[i];
    if (inFence) { header = null; continue; }

    if (/^\s*\|/.test(text)) {
      const cells = splitRow(text);
      const next = lines[i + 1]?.text ?? "";
      if (!header && SEPARATOR_RE.test(next)) {
        header = { cols: cells, rows: [], line: n };
        tables.push(header);
        continue;
      }
      if (SEPARATOR_RE.test(text)) continue;
      if (header) {
        const table = header;
        const row = { cells, line: n, get: (name) => cellByName(table.cols, cells, name) };
        table.rows.push(row);
        if (/^ID$/i.test(table.cols[0]) && ID_ONLY.test(cells[0])) {
          defs.push({ id: cells[0], line: n, kind: "row", block: text, row, table });
        }
      }
      continue;
    }
    header = null;

    const h = text.match(HEADING_RE);
    if (h) {
      const first = h[2].match(new RegExp(`^(${ID_SOURCE})(?![A-Za-z0-9])`));
      if (first) {
        const level = h[1].length;
        let j = i + 1;
        while (j < lines.length) {
          const hh = lines[j].text.match(HEADING_RE);
          if (hh && !lines[j].inFence && hh[1].length <= level) break;
          j++;
        }
        defs.push({ id: first[1], line: n, kind: "heading", block: lines.slice(i, j).map((l) => l.text).join("\n") });
      }
      continue;
    }

    const li = text.match(new RegExp(`^(\\s*)(?:[-*]|\\d+\\.)\\s+\\*\\*(${ID_SOURCE})(?![A-Za-z0-9])`));
    if (li) {
      const indent = li[1].length;
      let j = i + 1;
      while (j < lines.length) {
        const t = lines[j].text;
        if (!t.trim() || HEADING_RE.test(t)) break;
        const lead = t.match(/^(\s*)/)[1].length;
        if (lead <= indent) break;
        j++;
      }
      defs.push({ id: li[2], line: n, kind: "item", block: lines.slice(i, j).map((l) => l.text).join("\n") });
    }
  }
  return { defs, tables };
}

function cellByName(cols, cells, name) {
  const re = name instanceof RegExp ? name : new RegExp(`^${name}$`, "i");
  const idx = cols.findIndex((c) => re.test(c));
  return idx === -1 ? undefined : cells[idx];
}

// Citations: every ID occurrence outside fenced code that is not the definition token itself.
function parseCitations(lines, defs) {
  const defLines = new Map(defs.map((d) => [d.line, d.id]));
  const cites = [];
  for (const { n, text, inFence } of lines) {
    if (inFence) continue;
    let skipFirst = defLines.get(n);
    for (const id of idsIn(text)) {
      if (skipFirst === id) { skipFirst = undefined; continue; }
      cites.push({ id, line: n });
    }
  }
  return cites;
}

// tasks.md: phases, tasks with tags and fields (sub-lines and inline ` — Field: value` segments).
function parseTasks(lines) {
  const tasks = [];
  const tokenWarnings = [];
  let phase = { title: "(before first phase)", story: null, line: 0 };
  let inEnmiendas = false;
  let cur = null;
  let lastField = null;

  const addSegments = (segmentText, n) => {
    for (const seg of segmentText.split(/\s+—\s+/)) {
      const m = seg.trim().match(FIELD_RE);
      if (m) {
        cur.fields[m[1]] = (cur.fields[m[1]] ? cur.fields[m[1]] + "\n" : "") + m[2];
        cur.fieldLines[m[1]] = n;
        lastField = m[1];
        continue;
      }
      const near = seg.trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñ() ]{4,20}):/);
      if (near && FOLDED_FIELDS.has(fold(near[1])) && FOLDED_FIELDS.get(fold(near[1])) !== near[1]) {
        tokenWarnings.push({ line: n, found: near[1], expected: FOLDED_FIELDS.get(fold(near[1])) });
      }
      if (lastField) cur.fields[lastField] += "\n" + seg;
    }
  };

  for (const { n, text, inFence } of lines) {
    if (inFence) continue;
    const h = text.match(HEADING_RE);
    if (h) {
      cur = null;
      if (h[1].length <= 3) {
        const story = h[2].match(/\bUS(\d+)\b/);
        phase = { title: h[2].trim(), story: story ? `US${story[1]}` : null, line: n };
        inEnmiendas = false;
      } else if (/^Enmiendas\b/.test(h[2].trim())) {
        inEnmiendas = true;
      }
      continue;
    }
    const t = text.match(TASK_RE);
    if (t) {
      const [, , box, id, rest] = t;
      const tags = [];
      let remainder = rest;
      for (;;) {
        const m = remainder.match(/^\[([^\]]+)\]\s*/);
        if (!m) break;
        tags.push(m[1].trim());
        remainder = remainder.slice(m[0].length);
      }
      const storyTag = tags.find((g) => /^US\d+$/.test(g)) ?? null;
      const enmienda = tags.find((g) => /^ENMIENDA\b/.test(g));
      cur = {
        id, line: n, done: box !== " ", tags, phase, story: storyTag ?? phase.story, inEnmiendas,
        cierre: tags.includes("CIERRE"), sonda: tags.includes("SONDA"),
        enmiendaOf: enmienda ? (enmienda.match(/T\d{3,}/) ?? [null])[0] : null,
        isEnmienda: Boolean(enmienda), fields: {}, fieldLines: {}, blockLines: [text],
      };
      lastField = null;
      tasks.push(cur);
      addSegments(remainder, n);
      continue;
    }
    if (cur) {
      if (!text.trim()) { lastField = null; continue; }
      if (!/^\s/.test(text)) { cur = null; continue; }
      cur.blockLines.push(text);
      addSegments(text.trim(), n);
    }
  }
  for (const task of tasks) {
    task.supersededBy = task.fields["Superada por"] ? (task.fields["Superada por"].match(/T\d{3,}/) ?? [null])[0] : null;
    task.block = task.blockLines.join("\n");
  }
  return { tasks, tokenWarnings };
}

export function parseArtifact(file) {
  const lines = readLines(file);
  const { defs, tables } = parseDefinitions(lines);
  const parsed = { file, lines, defs, tables };
  if (path.basename(file) === "tasks.md") {
    Object.assign(parsed, parseTasks(lines));
    for (const t of parsed.tasks) defs.push({ id: t.id, line: t.line, kind: "task", block: t.block });
  }
  parsed.cites = parseCitations(lines, defs);
  return parsed;
}

const FEATURE_FILES = ["spec.md", "plan.md", "research.md", "data-model.md", "tasks.md", "amendments.md"];

export function loadFeature(dir) {
  const feature = { dir, files: {} };
  for (const name of FEATURE_FILES) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) feature.files[name] = parseArtifact(file);
  }
  const statePath = path.join(dir, "state.json");
  feature.state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : null;
  return feature;
}

// Text of each ID definition, used for per-ID section hashes. Task blocks are checkbox-normalized.
export function sectionBlocks(file) {
  const parsed = parseArtifact(file);
  const blocks = {};
  if (parsed.tasks) {
    for (const t of parsed.tasks) blocks[t.id] = t.block.replace(/^(\s*[-*]\s+)\[[xX]\]/, "$1[ ]");
    return blocks;
  }
  for (const d of parsed.defs) blocks[d.id] = blocks[d.id] === undefined ? d.block : `${blocks[d.id]}\n${d.block}`;
  return blocks;
}
