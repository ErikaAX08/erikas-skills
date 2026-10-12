#!/usr/bin/env bash
# Builds a disposable git repository from an eval fixture so pre-pr-review runs against a real diff.
#
# Fixture layout:
#   base/                tree committed on `main`
#   head/                optional full tree committed on `feature`; absent = `feature` equals `main`
#   local/               optional files copied over the work tree after the commits, left uncommitted
#   commit-message.txt   optional message for the `feature` commit (default: "feature")
#
# Usage: build-fixture.sh <fixture-dir> <dest-dir>
#   dest-dir must not exist. Author, committer, and dates are fixed so SHAs are reproducible.
#   The repository is left with `feature` checked out.
set -euo pipefail

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ $# -eq 2 ]] || die "usage: build-fixture.sh <fixture-dir> <dest-dir>"
fixture="$(cd "$1" && pwd)" || die "fixture '$1' not found"
dest="$2"
[[ -d "$fixture/base" ]] || die "fixture has no base/ directory"
[[ ! -e "$dest" ]] || die "destination '$dest' already exists"

export GIT_AUTHOR_NAME="Eval Author" GIT_AUTHOR_EMAIL="author@example.com"
export GIT_COMMITTER_NAME="Eval Author" GIT_COMMITTER_EMAIL="author@example.com"
export GIT_AUTHOR_DATE="2026-01-01T00:00:00Z" GIT_COMMITTER_DATE="2026-01-01T00:00:00Z"

mkdir -p "$dest"
cd "$dest"
git init -q -b main
git config commit.gpgsign false
cp -R "$fixture/base/." .
git add -A
git commit -q -m "base"

git checkout -q -b feature
if [[ -d "$fixture/head" ]]; then
  git rm -rq --ignore-unmatch .
  cp -R "$fixture/head/." .
  git add -A
  message="feature"
  [[ -f "$fixture/commit-message.txt" ]] && message="$(cat "$fixture/commit-message.txt")"
  export GIT_AUTHOR_DATE="2026-01-02T00:00:00Z" GIT_COMMITTER_DATE="2026-01-02T00:00:00Z"
  git commit -q -m "$message"
fi

if [[ -d "$fixture/local" ]]; then
  cp -R "$fixture/local/." .
fi

echo "built $(basename "$fixture") at $dest (main $(git rev-parse --short main), feature $(git rev-parse --short feature))"
