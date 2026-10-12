#!/usr/bin/env bash
# Read-only inventory of a PR diff against its base branch: merge base, commits,
# changed files by status, per-file churn, hand-reviewed vs noise classification,
# base drift that overlaps the PR, and local changes that are not in any commit.
# Never modifies the working tree, index, refs, or remotes.
#
# Usage: collect-diff.sh [base-ref] [head-ref]
#   base-ref  Base branch or ref (e.g. origin/main). When omitted, a candidate is
#             detected and reported as such; confirm it before relying on it.
#   head-ref  Commit to review (default: HEAD). Pass the PR head SHA when the PR is
#             not checked out. Local changes are reported only when it resolves to HEAD.
#
# Exit codes: 0 inventory printed; 1 not a work tree, unresolvable ref, or no merge base.
set -euo pipefail

die() {
  echo "ERROR: $*" >&2
  exit 1
}

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git work tree"

base="${1:-}"
base_source="argument"
head="${2:-HEAD}"

if [[ -z "$base" ]]; then
  base_source="detected candidate (unconfirmed)"
  if remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
    base="$remote_head"
  else
    for candidate in origin/develop origin/main origin/master develop main master; do
      if git rev-parse --verify --quiet "$candidate^{commit}" >/dev/null; then
        base="$candidate"
        break
      fi
    done
  fi
fi

if [[ -z "$base" ]] || ! git rev-parse --verify --quiet "$base^{commit}" >/dev/null; then
  die "base ref '${base:-<none>}' not found; pass it explicitly"
fi
git rev-parse --verify --quiet "$head^{commit}" >/dev/null || die "head ref '$head' not found"

base_sha="$(git rev-parse "$base^{commit}")"
head_sha="$(git rev-parse "$head^{commit}")"
merge_base="$(git merge-base "$base_sha" "$head_sha" 2>/dev/null)" ||
  die "no merge base between '$base' and '$head' (unrelated histories)"

head_is_checkout="no"
[[ "$head_sha" == "$(git rev-parse HEAD)" ]] && head_is_checkout="yes"

status="ok"
[[ "$merge_base" == "$head_sha" ]] && status="empty-diff (head has no commits beyond the merge base)"

echo "## Base"
echo "base: $base @ $(git rev-parse --short "$base_sha") ($base_source)"
echo "head: $head @ $(git rev-parse --short "$head_sha") (checked out: $head_is_checkout)"
echo "merge-base: $(git rev-parse --short "$merge_base")"
echo "status: $status"

echo
echo "## Commits in PR ($(git rev-list --count "$merge_base..$head_sha"))"
git log --format='%h %s' "$merge_base..$head_sha"

echo
echo "## Changed files (merge-base..head)"
git diff --find-renames --name-status "$merge_base" "$head_sha"

echo
echo "## Diff size"
git diff --find-renames --shortstat "$merge_base" "$head_sha"

echo
echo "## Per-file churn (added deleted path)"
git diff --find-renames --numstat "$merge_base" "$head_sha"

# Noise = files whose lines are spot-checked instead of read: lockfiles, snapshots,
# vendored code, minified/source-map output, binaries, and files marked as generated.
# Migrations, SQL, and schema files are never noise, even when generated.
gen_re='@generated|DO NOT EDIT|[Aa]uto-?generated'

noise_reason() {
  local path="$1" added="$2" lower name first_lines rev attr
  lower="$(printf '%s' "$path" | tr '[:upper:]' '[:lower:]')"
  name="${lower##*/}"
  case "$lower" in
    *migration* | *migrate* | *.sql | *schema*) return 0 ;;
  esac
  if [[ "$added" == "-" ]]; then
    echo "binary"
    return 0
  fi
  case "$name" in
    package-lock.json | npm-shrinkwrap.json | yarn.lock | pnpm-lock.yaml | bun.lock | bun.lockb | \
      cargo.lock | gemfile.lock | poetry.lock | pipfile.lock | uv.lock | composer.lock | go.sum | \
      mix.lock | pubspec.lock | podfile.lock | packages.lock.json | gradle.lockfile | flake.lock)
      echo "lockfile"
      return 0
      ;;
    *.snap)
      echo "snapshot"
      return 0
      ;;
    *.min.js | *.min.css | *.map)
      echo "minified/source-map"
      return 0
      ;;
  esac
  case "/$lower" in
    */__snapshots__/*)
      echo "snapshot"
      return 0
      ;;
    */vendor/* | */third_party/* | */node_modules/*)
      echo "vendored"
      return 0
      ;;
  esac
  attr="$(git check-attr linguist-generated -- "$path" 2>/dev/null || true)"
  if [[ "$attr" == *": linguist-generated: true" || "$attr" == *": linguist-generated: set" ]]; then
    echo "generated (.gitattributes)"
    return 0
  fi
  rev="$head_sha"
  git cat-file -e "$head_sha:$path" 2>/dev/null || rev="$merge_base"
  first_lines="$(git show "$rev:$path" 2>/dev/null | head -n 5 || true)"
  if [[ "$first_lines" =~ $gen_re ]]; then
    echo "generated (header marker)"
  fi
  return 0
}

hand_files=0
hand_lines=0
noise_files=0
noise_lines=0
noise_list=""

# -z output: "added<TAB>deleted<TAB>path<NUL>", or for renames
# "added<TAB>deleted<TAB><NUL>old<NUL>new<NUL>".
while IFS= read -r -d '' record; do
  added="${record%%$'\t'*}"
  rest="${record#*$'\t'}"
  deleted="${rest%%$'\t'*}"
  path="${rest#*$'\t'}"
  if [[ -z "$path" ]]; then
    IFS= read -r -d '' _old_path
    IFS= read -r -d '' path
  fi
  lines=0
  [[ "$added" != "-" ]] && lines=$((added + deleted))
  reason="$(noise_reason "$path" "$added")"
  if [[ -n "$reason" ]]; then
    noise_files=$((noise_files + 1))
    noise_lines=$((noise_lines + lines))
    noise_list="${noise_list}  ${reason}: ${path}"$'\n'
  else
    hand_files=$((hand_files + 1))
    hand_lines=$((hand_lines + lines))
  fi
done < <(git diff --find-renames --numstat -z "$merge_base" "$head_sha")

echo
echo "## Review load (lines = added + deleted)"
echo "hand-reviewed: $hand_files files, $hand_lines lines"
echo "noise (spot-check only): $noise_files files, $noise_lines lines"
if [[ -n "$noise_list" ]]; then
  printf '%s' "$noise_list"
fi

echo
echo "## Base drift since merge-base"
echo "base ahead of merge-base: $(git rev-list --count "$merge_base..$base_sha") commits"
echo "files changed on base since merge-base that the PR also changes:"
overlap="$(comm -12 \
  <(git diff --name-only "$merge_base" "$base_sha" | sort) \
  <(git diff --name-only "$merge_base" "$head_sha" | sort))"
if [[ -n "$overlap" ]]; then
  echo "$overlap"
else
  echo "(none)"
fi

echo
echo "## Local changes not in any commit (entry A: in scope, label local-only; entry B: excluded)"
if [[ "$head_is_checkout" != "yes" ]]; then
  echo "(not applicable: head is not the checked-out commit)"
else
  local_changes="$(git status --porcelain=v1 --untracked-files=all)"
  if [[ -n "$local_changes" ]]; then
    echo "$local_changes"
    echo "tracked local churn: $(git diff --shortstat HEAD)"
  else
    echo "(none)"
  fi
fi
