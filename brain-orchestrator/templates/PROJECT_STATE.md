<!--
Target: .agent/memory/PROJECT_STATE.md
Where the operation stands right now. Keep it under ~80 lines and strictly current —
completed work compresses to counts plus IDs. Update at phase checkpoints and on any
status change, blocker, or decision; not after every trivial command.
-->

# Project State

**Last updated:** <YYYY-MM-DD>
**Current objective:** <one sentence>
**Mode:** LIGHT | STANDARD | FULL
**Current phase:** <phase name>

## Active Tasks

| Task     | Status      | Owner        | Temporary ownership (paths) |
| -------- | ----------- | ------------ | --------------------------- |
| TASK-00X | IN_PROGRESS | <agent/role> | `src/...`, `src/...`        |
| TASK-00Y | READY       | —            | —                           |

## Blocked Tasks

| Task     | Blocked by                             | Since  | Resolution needed  |
| -------- | -------------------------------------- | ------ | ------------------ |
| TASK-00Z | BLOCKER in TASK-00X / Q-003 unanswered | <date> | <what unblocks it> |

## Completed

<count> tasks: TASK-001, TASK-002, TASK-003 …

<!-- IDs only. Details live in each task file and its handoff. -->

## Cancelled

| Task     | Reason     | Superseded by |
| -------- | ---------- | ------------- |
| TASK-00W | <one line> | TASK-0YY      |

## Current Blockers

- <blocker, its owner, and what resolves it — or "none">

## Active Risks

- <risk> — likelihood/impact, and what would detect it early

## Pending Decisions

- <decision awaiting evidence, an ADR, or the user> — who decides, and what it is waiting on

## Next Recommended Action

<exactly one thing — the next action, not a list of options>
