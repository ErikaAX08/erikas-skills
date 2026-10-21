#!/usr/bin/env bash
# Builds a disposable repository holding one spec-kit feature, so a kit skill's eval runs against
# real artifacts and a real state.json.
#
# Case layout (every directory optional):
#   feature/       files overlaid on base-feature/ before state.json is recorded
#   after-state/   files overlaid after state.json is recorded (later progress, hand edits, reports)
#   repo/          files placed at the repository root (probe scripts, source files)
#
# Usage: build-fixture.sh <case-dir> <dest-dir>
#   dest-dir must not exist. The feature lands in .speckit/specs/001-sms-allow-list, with READY
#   checklists, a recorded state.json, and .speckit/feature.json pointing at it. Author, committer,
#   and dates are fixed so SHAs are reproducible.
set -euo pipefail

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ $# -eq 2 ]] || die "usage: build-fixture.sh <case-dir> <dest-dir>"
here="$(cd "$(dirname "$0")" && pwd)"
case_dir="$(cd "$1" && pwd)" || die "case '$1' not found"
dest="$2"
[[ ! -e "$dest" ]] || die "destination '$dest' already exists"

export GIT_AUTHOR_NAME="Eval Author" GIT_AUTHOR_EMAIL="author@example.com"
export GIT_COMMITTER_NAME="Eval Author" GIT_COMMITTER_EMAIL="author@example.com"
export GIT_AUTHOR_DATE="2026-01-01T00:00:00Z" GIT_COMMITTER_DATE="2026-01-01T00:00:00Z"

feature=".speckit/specs/001-sms-allow-list"
mkdir -p "$dest/$feature/checklists"
cd "$dest"
git init -q -b main
git config commit.gpgsign false

[[ -d "$case_dir/repo" ]] && cp -R "$case_dir/repo/." .
cp -R "$here/base-feature/." "$feature/"
[[ -d "$case_dir/feature" ]] && cp -R "$case_dir/feature/." "$feature/"

for checklist in requirements plan-quality tasks-quality; do
  printf '# Checklist\n\n**Status**: READY\n\nAll items passed.\n' > "$feature/checklists/$checklist.md"
done
printf '{\n  "feature_directory": "%s"\n}\n' "$feature" > .speckit/feature.json

for artifact in spec plan tasks; do
  node "$here/../scripts/fingerprint.mjs" --record "$feature" "$artifact" > /dev/null
done
# Pin updated_at so the built state.json is identical on every machine.
node -e '
  const fs = require("fs");
  const p = process.argv[1];
  const s = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const e of Object.values(s.artifacts)) e.updated_at = "2026-01-01T00:00:00Z";
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
' "$feature/state.json"

[[ -d "$case_dir/after-state" ]] && cp -R "$case_dir/after-state/." "$feature/"

git add -A
git commit -q -m "fixture"
echo "Built $dest ($feature)"
