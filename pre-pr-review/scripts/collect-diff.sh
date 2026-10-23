#!/usr/bin/env bash
# Read-only inventory of a PR diff against its base branch: merge base, commits,
# changed files by status, per-file churn, file classes (source / test / docs / noise),
# local changes that are not in any commit (tracked and untracked), base drift that
# overlaps the PR, the lenses each file activates, and the size class of SKILL.md §4.
# Never modifies the working tree, index, refs, or remotes.
#
# Usage: collect-diff.sh [--trace <run-id>] [base-ref] [head-ref]
#   base-ref  Base branch or ref (e.g. origin/main). When omitted, a candidate is
#             detected and reported as such; confirm it before relying on it.
#   head-ref  Commit to review (default: HEAD). Pass the PR head SHA when the PR is
#             not checked out. Local changes are counted only when it resolves to HEAD.
#   --trace   Append a `sizing` event for <run-id> to the review trace (scripts/trace.mjs).
#             Tracing never changes the output or the exit code.
#
# Exit codes: 0 inventory printed; 1 not a work tree, unresolvable ref, or no merge base.
# Compatible with bash 3.2 (macOS): no associative arrays.
set -euo pipefail

die() {
  echo "ERROR: $*" >&2
  exit 1
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
trace_run=""
args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --trace)
      [[ $# -ge 2 ]] || die "--trace needs a run id"
      trace_run="$2"
      shift 2
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done
set -- ${args[@]+"${args[@]}"}

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

lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }

# Noise = files whose lines are spot-checked instead of read: lockfiles, snapshots,
# vendored code, minified/source-map output, binaries, and files marked as generated.
# Migrations, SQL, and schema files are never noise, even when generated.
# $3 is where the content lives: a git rev, or "worktree" for local changes.
gen_re='@generated|DO NOT EDIT|[Aa]uto-?generated'

noise_reason() {
  local path="$1" added="$2" where="$3" low name first_lines rev attr
  low="$(lower "$path")"
  name="${low##*/}"
  case "$low" in
    *migration* | *migrate* | *.sql | *schema*) return 0 ;;
  esac
  if [[ "$added" == "-" ]]; then
    echo "binary"
    return 0
  fi
  case "$name" in
    package-lock.json | npm-shrinkwrap.json | yarn.lock | pnpm-lock.yaml | bun.lock | bun.lockb | \
      cargo.lock | gemfile.lock | poetry.lock | pipfile.lock | uv.lock | composer.lock | go.sum | \
      mix.lock | pubspec.lock | podfile.lock | packages.lock.json | gradle.lockfile | flake.lock | \
      deno.lock | package.resolved)
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
  case "/$low" in
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
  if [[ "$where" == "worktree" ]]; then
    first_lines="$(head -n 5 "$path" 2>/dev/null || true)"
  else
    rev="$where"
    git cat-file -e "$rev:$path" 2>/dev/null || rev="$merge_base"
    first_lines="$(git show "$rev:$path" 2>/dev/null | head -n 5 || true)"
  fi
  if [[ "$first_lines" =~ $gen_re ]]; then
    echo "generated (header marker)"
  fi
  return 0
}

# Dependency manifests are source (never docs, even `requirements.txt`) and activate
# `release-and-ops`.
is_manifest() {
  case "${1##*/}" in
    package.json | go.mod | requirements*.txt | constraints*.txt | pyproject.toml | setup.py | setup.cfg | \
      pipfile | gemfile | cargo.toml | pom.xml | build.gradle | build.gradle.kts | composer.json | \
      mix.exs | pubspec.yaml | packages.config | deno.json | package.swift | *.csproj | *.gemspec)
      return 0
      ;;
  esac
  return 1
}

# Class of a hand-reviewed file: test | docs | source. Tests and prose docs are read in
# full like any hand-reviewed file but do not count toward H (SKILL.md §4).
file_class() {
  local low
  low="/$(lower "$1")"
  if is_manifest "$low"; then
    echo "source"
    return
  fi
  case "$low" in
    */test/* | */tests/* | */__tests__/* | */spec/* | */specs/* | */e2e/* | */cypress/* | \
      */playwright/* | */testdata/* | */fixtures/* | *.test.* | *.spec.* | *_test.* | */test_*.py | \
      *test.java | *test.kt | *tests.cs | *_spec.rb | */conftest.py)
      echo "test"
      return
      ;;
    *.md | *.mdx | *.rst | *.adoc | *.txt)
      echo "docs"
      return
      ;;
  esac
  echo "source"
}

# Lenses a source file activates, by path (multi-agent-review.md §3). A source file that
# matches no lens activates `flow-and-state`, so every source file is owned by some lens.
lenses_for() {
  local low out=""
  low="/$(lower "$1")"
  case "$low" in
    */routes/* | */route/* | */router/* | */routers/* | */controllers/* | */controller/* | */handlers/* | \
      */handler/* | */api/* | */apis/* | */endpoints/* | */dto/* | */dtos/* | */middleware/* | \
      */middlewares/* | */guards/* | */auth/* | */policies/* | */permissions/* | */sdk/* | */graphql/* | \
      */resolvers/* | *openapi* | *swagger* | *asyncapi* | *.proto | *.graphql | *.gql | *controller.* | \
      *handler.* | *router.* | *routes.* | *middleware.* | *guard.* | *auth.* | *authz* | *authoriz* | \
      *authentic* | *permission* | *login* | *logout* | *signin* | *signup* | *oauth* | *jwt* | *sso* | *saml* | */api.* | *dto.* | *resolver.*)
      out="$out contracts-and-access"
      ;;
  esac
  case "$low" in
    *migration* | *migrate* | *.sql | *schema* | */models/* | */model/* | */entities/* | */entity/* | \
      */repositories/* | */repository/* | */db/* | */database/* | */dao/* | */seeds/* | */seed/* | \
      *backfill* | *prisma* | */alembic/* | *model.* | *models.* | *entity.* | *repository.* | */db.* | \
      *_db.* | *database.* | *dao.*)
      out="$out data-and-migrations"
      ;;
  esac
  case "$low" in
    */jobs/* | */job/* | */workers/* | */worker/* | */queues/* | */queue/* | */consumers/* | */producers/* | \
      */events/* | */listeners/* | */subscribers/* | */webhooks/* | */schedulers/* | */cron/* | \
      */integrations/* | */providers/* | */gateways/* | */payments/* | */billing/* | *job.* | *jobs.* | \
      *worker.* | *queue.* | *consumer.* | *producer.* | *event.* | *events.* | *listener.* | \
      *subscriber.* | *webhook* | *scheduler* | *cron* | *client.* | *gateway.* | *payment* | *billing* | \
      *stripe* | *kafka* | *sqs* | *sns.* | *rabbit* | *celery* | *sidekiq*)
      out="$out async-and-integrations"
      ;;
  esac
  case "$low" in
    */services/* | */service/* | */domain/* | */usecases/* | */use-cases/* | */use_cases/* | */core/* | \
      */state/* | */store/* | */stores/* | */cache/* | *service.* | *usecase* | *state.* | *machine.* | \
      *transaction* | *cache.* | *saga*)
      out="$out flow-and-state"
      ;;
  esac
  case "$low" in
    *.tsx | *.jsx | *.vue | *.svelte | *.astro | *.css | *.scss | *.sass | *.less | *.html | \
      */components/* | */pages/* | */views/* | */screens/* | */hooks/* | */frontend/* | */web/* | */ui/*)
      out="$out frontend"
      ;;
  esac
  if is_manifest "$low"; then
    out="$out release-and-ops"
  else
    case "$low" in
      *flag* | *toggle* | *config* | */conf/* | *settings* | *.env | *.env.* | */.env* | *.ini | *.toml | \
        */.github/* | *.gitlab-ci* | *jenkinsfile* | */.circleci/* | *azure-pipelines* | \
        *bitbucket-pipelines* | *.tf | *.tfvars | *.hcl | */terraform/* | */infra/* | */infrastructure/* | \
        */k8s/* | */kubernetes/* | */helm/* | */charts/* | *dockerfile* | *docker-compose* | \
        *compose.yml | *compose.yaml | *makefile | *procfile | *deploy* | *serverless.yml | \
        *serverless.yaml | *cloudformation* | */logging/* | *logger* | */metrics/* | *telemetry* | \
        *observability* | *secret* | *vault* | *kms*)
        out="$out release-and-ops"
        ;;
    esac
  fi
  [[ -z "$out" ]] && out=" flow-and-state(default)"
  echo "${out# }"
}

# High-risk area of a source file (SKILL.md §1), or nothing.
high_risk_for() {
  local low
  low="/$(lower "$1")"
  case "$low" in
    *migration* | *migrate* | *.sql | *schema* | *prisma* | */alembic/*) echo "migrations-and-schemas" ;;
    */auth/* | *auth.* | *authz* | *authoriz* | *authentic* | *permission* | */guards/* | *guard.* | \
      *login* | *logout* | *signin* | *signup* | *oauth* | *jwt* | *sso* | *saml* | \
      */policies/* | *policy.* | *rbac* | */roles/* | *role.* | *roles.*) echo "auth-and-permissions" ;;
    *payment* | *billing* | *invoice* | *charge* | *checkout* | *stripe* | *refund* | *subscription*)
      echo "payments-and-billing" ;;
    */jobs/* | *job.* | */workers/* | *worker.* | */queues/* | *queue* | *consumer* | *producer* | \
      */events/* | *webhook* | *scheduler* | *cron* | *kafka* | *sqs* | *celery*) echo "jobs-queues-events" ;;
    *secret* | *vault* | *kms* | *crypt* | *credential* | */security/*) echo "secrets-and-security" ;;
    */.github/workflows/* | *.gitlab-ci* | *jenkinsfile* | */.circleci/* | *.tf | *.tfvars | */terraform/* | \
      */helm/* | */k8s/* | */kubernetes/* | *dockerfile* | *deploy* | *procfile | *serverless.yml | \
      *serverless.yaml | *cloudformation*) echo "deploy-coordination" ;;
  esac
}

# Contract or schema shape files exclude the narrow-change exception (SKILL.md §4).
is_contract_or_schema() {
  case "/$(lower "$1")" in
    *migration* | *migrate* | *.sql | *schema* | *prisma* | *openapi* | *swagger* | *asyncapi* | *.proto | \
      *.graphql | *.gql | */dto/* | */dtos/* | *dto.*) return 0 ;;
  esac
  return 1
}

# Changed lines (added and removed) of one file, for content signals. $2 = origin.
changed_lines() {
  local path="$1" origin="$2"
  if [[ "$origin" == "commit" ]]; then
    git diff -U0 "$merge_base" "$head_sha" -- "$path" 2>/dev/null | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' || true
  elif git ls-files --error-unmatch -- "$path" >/dev/null 2>&1; then
    git diff -U0 HEAD -- "$path" 2>/dev/null | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' || true
  else
    sed 's/^/+/' "$path" 2>/dev/null || true
  fi
}

# Content signals: paths cannot show that a utility file builds SQL or that a route file
# changes a permission guard, so the changed lines can add lenses and raise R.
content_lenses() {
  local text="$1" out=""
  if printf '%s' "$text" | grep -qE 'request\.(args|json|get_json|form|params|body|query|values)|req\.(body|params|query|headers)|@(app|bp|blueprint|router|api)\.(get|post|put|patch|delete|route)\b|\b(router|app)\.(get|post|put|patch|delete|use)\(|@(Get|Post|Put|Patch|Delete|Request)Mapping|requireAuth|requireAdmin|login_required|@PreAuthorize|authorize\('; then
    out="$out contracts-and-access"
  fi
  if printf '%s' "$text" | grep -qiE '\b(select .+ from|insert into|update [a-z_."]+ set|delete from|alter table|create table|drop (table|column)|order by)\b|\.(execute|executemany|raw|query)\('; then
    out="$out data-and-migrations"
  fi
  if printf '%s' "$text" | grep -qE '\b(enqueue|publish|subscribe|consumer|producer|webhook|retry|retries|backoff|idempoten)'; then
    out="$out async-and-integrations"
  fi
  echo "${out# }"
}

content_risk() {
  local text="$1"
  if printf '%s' "$text" | grep -qE 'requireAdmin|requireAuth|isAdmin|hasRole|hasPermission|login_required|@PreAuthorize|authorize\(|password|passwd|bcrypt|jwt|session\[|set-cookie'; then
    echo "auth-and-permissions"
  elif printf '%s' "$text" | grep -qiE '\b(charge|refund|payment_intent|stripe|invoice)\b'; then
    echo "payments-and-billing"
  elif printf '%s' "$text" | grep -qiE '\b(api[_-]?key|secret|private[_-]?key|access[_-]?token)\b'; then
    echo "secrets-and-security"
  fi
}

h_src=0
h_test=0
h_docs=0
files_src=0
files_test=0
files_docs=0
noise_files=0
noise_lines=0
lockfile_changed="no"
noise_list=""
class_list=""
lens_records=""
risk_records=""
contract_files=0

# Classifies one changed file and adds it to the totals. $4 = origin label (commit | local).
account() {
  local path="$1" added="$2" deleted="$3" origin="$4" where="$5" lines=0 reason cls lenses risk
  [[ "$added" != "-" ]] && lines=$((added + deleted))
  reason="$(noise_reason "$path" "$added" "$where")"
  if [[ -n "$reason" ]]; then
    noise_files=$((noise_files + 1))
    noise_lines=$((noise_lines + lines))
    noise_list="${noise_list}  ${reason}: ${path} (${origin})"$'\n'
    if [[ "$reason" == "lockfile" ]]; then
      lockfile_changed="yes"
      lens_records="${lens_records}release-and-ops"$'\t'"${path}"$'\n'
    fi
    return
  fi
  cls="$(file_class "$path")"
  lenses="-"
  case "$cls" in
    test)
      files_test=$((files_test + 1))
      h_test=$((h_test + lines))
      ;;
    docs)
      files_docs=$((files_docs + 1))
      h_docs=$((h_docs + lines))
      ;;
    source)
      files_src=$((files_src + 1))
      h_src=$((h_src + lines))
      lenses="$(lenses_for "$path")"
      local path_lenses="$lenses" text extra c
      text="$(changed_lines "$path" "$origin")"
      extra="$(content_lenses "$text")"
      for c in $extra; do
        case " $lenses " in
          *" $c "*) ;;
          *" flow-and-state(default) "*) lenses="${lenses/flow-and-state(default)/$c}" ;;
          *) lenses="$lenses $c" ;;
        esac
      done
      local l
      for l in $lenses; do
        if [[ " $extra " == *" $l "* && " $path_lenses " != *" $l "* ]]; then
          lens_records="${lens_records}${l}"$'\t'"${path} (content)"$'\n'
        elif [[ "$l" == "flow-and-state(default)" ]]; then
          lens_records="${lens_records}flow-and-state"$'\t'"${path} (default)"$'\n'
        else
          lens_records="${lens_records}${l}"$'\t'"${path}"$'\n'
        fi
      done
      risk="$(high_risk_for "$path")"
      [[ -z "$risk" ]] && risk="$(content_risk "$text")"
      [[ -n "$risk" ]] && risk_records="${risk_records}${risk}"$'\t'"${path}"$'\n'
      is_contract_or_schema "$path" && contract_files=$((contract_files + 1))
      ;;
  esac
  class_list="${class_list}  ${cls}"$'\t'"${lines}"$'\t'"${path} (${origin})"$'\t'"[${lenses// /, }]"$'\n'
}

# -z output: "added<TAB>deleted<TAB>path<NUL>", or for renames
# "added<TAB>deleted<TAB><NUL>old<NUL>new<NUL>".
read_numstat() {
  local origin="$1" where="$2" record added rest deleted path _old_path
  while IFS= read -r -d '' record; do
    added="${record%%$'\t'*}"
    rest="${record#*$'\t'}"
    deleted="${rest%%$'\t'*}"
    path="${rest#*$'\t'}"
    if [[ -z "$path" ]]; then
      IFS= read -r -d '' _old_path
      IFS= read -r -d '' path
    fi
    account "$path" "$added" "$deleted" "$origin" "$where"
  done
}

read_numstat commit "$head_sha" < <(git diff --find-renames --numstat -z "$merge_base" "$head_sha")

local_status=""
local_src=0
local_untracked=0
if [[ "$head_is_checkout" == "yes" ]]; then
  local_status="$(git status --porcelain=v1 --untracked-files=all)"
  if [[ -n "$local_status" ]]; then
    before_src=$h_src
    read_numstat local worktree < <(git diff --find-renames --numstat -z HEAD)
    # Untracked files are entirely new: every line counts. `--no-index` reports binaries as "-".
    while IFS= read -r -d '' path; do
      stat="$(git diff --no-index --numstat -- /dev/null "$path" 2>/dev/null || true)"
      added="${stat%%$'\t'*}"
      [[ -z "$stat" ]] && added=0
      account "$path" "$added" 0 local worktree
      local_untracked=$((local_untracked + 1))
    done < <(git ls-files --others --exclude-standard -z)
    local_src=$((h_src - before_src))
  fi
fi

echo
echo "## Review load (lines = added + deleted; local changes included in entry A)"
echo "hand-reviewed: $((files_src + files_test + files_docs)) files, $((h_src + h_test + h_docs)) lines"
echo "  source: $files_src files, $h_src lines (counts toward H)"
echo "  test: $files_test files, $h_test lines (read in full; not counted in H)"
echo "  docs: $files_docs files, $h_docs lines (read in full; not counted in H)"
echo "noise (spot-check only): $noise_files files, $noise_lines lines"
if [[ -n "$noise_list" ]]; then
  printf '%s' "$noise_list"
fi

echo
echo "## File classes (class, lines, path (origin), [lenses])"
if [[ -n "$class_list" ]]; then
  printf '%s' "$class_list"
else
  echo "(none)"
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
elif [[ -n "$local_status" ]]; then
  echo "$local_status"
  echo "tracked local churn: $(git diff --shortstat HEAD)"
  echo "untracked files: $local_untracked (every line counted as added)"
else
  echo "(none)"
fi

# Lenses in the fixed order of multi-agent-review.md §3; `tests` is activated by any
# source or test file.
lens_order="contracts-and-access data-and-migrations async-and-integrations flow-and-state frontend release-and-ops"
active_lenses=""
lens_lines=""
n_lenses=0
for lens in $lens_order; do
  files="$(printf '%s' "$lens_records" | awk -F'\t' -v l="$lens" '$1 == l { print $2 }' | sort -u | tr '\n' ' ')"
  if [[ -n "$files" ]]; then
    active_lenses="$active_lenses $lens"
    n_lenses=$((n_lenses + 1))
    lens_lines="${lens_lines}${lens}: ${files% }"$'\n'
  fi
done
if [[ $((files_src + files_test)) -gt 0 ]]; then
  active_lenses="$active_lenses tests"
  lens_lines="${lens_lines}tests: activated (source or test files changed)"$'\n'
fi
active_lenses="${active_lenses# }"

risk_areas="$(printf '%s' "$risk_records" | awk -F'\t' 'NF { print $1 }' | sort -u | tr '\n' ' ')"
risk_areas="${risk_areas% }"
risk="no"
[[ -n "$risk_areas" ]] && risk="yes"

# Size per SKILL.md §4 (fast paths first). Local tracked and untracked source lines are
# already part of h_src in entry A.
H=$h_src
fast_path="none"
if [[ $((files_src + files_test + files_docs)) -eq 0 && "$lockfile_changed" == "no" && $noise_files -gt 0 ]]; then
  fast_path="noise-only"
elif [[ $files_docs -gt 0 && $((files_src + files_test)) -eq 0 ]]; then
  fast_path="docs-only candidate (confirm no machine-read contract or tooling-read comment)"
fi
# Size by volume and spread; risk raises verification depth, not fan-out (SKILL.md §4).
size_for() {
  local r="$1"
  if [[ $H -gt 400 || ($n_lenses -ge 3 && $H -gt 50) ]]; then
    echo "L"
  elif [[ $H -gt 50 || $n_lenses -ge 2 || "$r" == "yes" ]]; then
    echo "M"
  else
    echo "S"
  fi
}
narrow="not applicable (no high-risk file)"
verification="standard"
if [[ "$risk" == "yes" ]]; then
  verification="independent (R): a verifier sub-agent per 🔴/🟡 candidate, two per 🔴"
  if [[ $H -le 20 && $contract_files -eq 0 ]]; then
    narrow="possible (H <= 20, no migration/schema/contract file): with a cited test that exercises the changed lines and no message shape or API contract change, size $(size_for no) and standard verification"
  else
    narrow="excluded ($([[ $H -gt 20 ]] && echo "H > 20" || echo "migration/schema/contract file changed"))"
  fi
fi
if [[ $((files_src + files_test + files_docs + noise_files)) -eq 0 ]]; then
  size="none (empty diff)"
else
  size="$(size_for "$risk")"
fi

echo
echo "## Activated lenses (path patterns; the agent may add a lens with a reason, never drop one; (content) = activated by the changed lines; (default) = nothing matched: behavior-equivalence pass only)"
if [[ -n "$lens_lines" ]]; then
  printf '%s' "$lens_lines"
else
  echo "(none)"
fi

echo
echo "## Sizing (SKILL.md §4)"
echo "H: $H (source lines, of which local-only: $local_src)"
echo "H_test: $h_test"
echo "H_docs: $h_docs"
echo "N: $n_lenses (activated lenses excluding tests)"
echo "R: $risk${risk_areas:+ ($risk_areas)}"
echo "lockfile changed: $lockfile_changed"
echo "fast path: $fast_path"
echo "narrow-change exception: $narrow"
echo "verification: $verification"
echo "size: $size"

if [[ -n "$trace_run" ]]; then
  if command -v node >/dev/null 2>&1; then
    node "$script_dir/trace.mjs" sizing --run "$trace_run" source=collect-diff \
      "H=$H" "H_test=$h_test" "H_docs=$h_docs" "noise_lines=$noise_lines" "N=$n_lenses" \
      "R=$risk" "size=${size%% *}" "fast_path=${fast_path%% *}" "lenses=${active_lenses// /,}" \
      "high_risk=${risk_areas// /,}" "verification=${verification%% *}" "files=$((files_src + files_test + files_docs + noise_files))" \
      "local_untracked=$local_untracked" >&2 || echo "WARN: trace event not written" >&2
  else
    echo "WARN: node not found; sizing not traced" >&2
  fi
fi
