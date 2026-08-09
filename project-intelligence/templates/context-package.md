<!--
Target: handed to another agent or session; persist under .ai/ only if it will be reused.
A bounded briefing on one area, assembled from the knowledge base.
POINT AT ARTIFACTS — do not paraphrase them. A paraphrase of a paraphrase is how a multi-agent
operation ends up building a system nobody actually has. Give the path to the flow file, the ADR,
the change record, and let the receiving agent read the original.
Include what is UNKNOWN. An agent that knows the edges of the map stops at them; one that does
not, invents.
-->

# Context Package: <area>

**Prepared:** <YYYY-MM-DD>
**For:** <task or agent>
**Scope:** <what this package covers — and what it deliberately does not>

## In One Paragraph

<What this part of the system does and how it fits into the whole.>

## Architecture

```md
Pattern:      <as it applies here>          → architecture.md
Entry point:  <method + route>              → <path:line>
Main service: <name>                        → <path>
Layers:       <the path from entry to persistence>
```

## Data

```md
Tables:       <names>                       → database.md
Owned by:     <which component writes them>
Constraints:  <the ones that will bite>
```

## External Services

```md
<name>: <what is called, and what happens on failure>   → integrations.md
```

## Infrastructure

```md
<queues, functions, buckets, schedules relevant to this area>   → infrastructure.md
```

## Events

```md
Emitted:  <event> → <consumers>
Consumed: <event> ← <producers>
```

## Relevant Files

```text
<path>    <role>
<path>    <role>
```

## Flows

- `flows/<flow>.md` — <one line on what it covers>

## Decisions That Constrain This Area

- `ADR-###` — <the constraint it imposes>

## Recent Changes

- `changes/<file>.md` — <what changed and when>

## Conventions to Follow

- <the non-obvious rules a change here must respect>

## Known Risks

- <what makes changes here dangerous, and where regressions concentrate>

## Environments & Testing

```md
How to run it locally:   <command>
How to exercise the flow: <request or command>
What NOT to touch:       <resources shared with production>
```

## Unknown

- <what is not established, and how the receiving agent could resolve it>

## Verification

**All claims above verified:** <YYYY-MM-DD>
**Re-verify before relying on:** <anything whose files may have changed since>
