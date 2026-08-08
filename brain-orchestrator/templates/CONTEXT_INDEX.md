<!--
Target: .agent/memory/CONTEXT_INDEX.md
The navigation map. Keep it under ~60 lines: references and status only, never content.
If a detail is tempting to write here, it belongs in the artifact this file points to.
Update on every task status change and at every phase checkpoint.
-->

# Context Index

**Current objective:** <one sentence — what this operation is solving>

**Mode:** LIGHT | STANDARD | FULL
**Phase:** RESUME | DISCOVER | MODEL | DIAGNOSE | DESIGN | DECOMPOSE | PERSIST | DELEGATE | EXECUTE | REVIEW | INTEGRATE | VERIFY | REASSESS
**Last updated:** <YYYY-MM-DD>

## Memory

| Artifact       | Path                       |
| -------------- | -------------------------- |
| Project state  | `memory/PROJECT_STATE.md`  |
| Architecture   | `memory/ARCHITECTURE.md`   |
| Problem model  | `memory/PROBLEM_MODEL.md`  |
| Invariants     | `memory/INVARIANTS.md`     |
| Open questions | `memory/OPEN_QUESTIONS.md` |

## Active ADRs

- ADR-00X — <short title>
- ADR-00Y — <short title>

<!-- List only ACCEPTED ADRs. Superseded ones stay in adr/ but are not listed here. -->

## Active Tasksß

| Task               | Status      | Note                |
| ------------------ | ----------- | ------------------- |
| TASK-00X — <title> | IN_PROGRESS | <owner / since>     |
| TASK-00Y — <title> | READY       | depends on TASK-00X |
| TASK-00Z — <title> | BLOCKED     | <one-line reason>   |

<!-- DONE and CANCELLED tasks are not listed here; they live in PROJECT_STATE.md as counts + IDs. -->

## Recent Important Findings

- F-0XX — <one line>
- F-0XY — <one line>

## Open Questions

- Q-00X — <one line> <!-- only the ones that currently block or bias a decision -->
