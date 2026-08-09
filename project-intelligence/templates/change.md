<!--
Target: .ai/changes/YYYY-MM-DD-<slug>.md
One significant change per file. Never edited afterwards — a later change gets a later file.
"Before" and "Why" are the reason this directory exists: the code already shows what the system
does now, and nothing in the repository preserves what it did before or why someone chose this.
Losing that is how a future engineer confidently "fixes" a deliberate decision.
Write it from the actual diff, never from memory of the intent.
-->

# Change: <short title>

**Date:** <YYYY-MM-DD>
**Author / agent:** <who>
**Commits / PR:** <sha or #number, if it exists>
**Type:** <bugfix | feature | refactor | infrastructure | data migration | dependency>

## Problem

<What was wrong or missing, concretely. The observable symptom, and who it affected.>

## Before

<How the system actually worked before this change. Enough that someone can picture the old
behavior without checking out the old commit — this is the part that cannot be recovered later.>

```text
<the old path, if a flow changed>
```

## Change

<What was actually done. Mechanism, not intent.>

```text
<the new path, if a flow changed>
```

## Files Modified

```text
<path>    <what changed in it>
<path>    <what changed in it>
```

<!-- From `git diff --name-only`, not from memory. -->

## Why

<Why this approach and not another. What was rejected, and on what grounds. If it is a
mitigation rather than a fix, say so explicitly and name the real cause left open.>

## After

<How the system works now. State the new behavior in the same terms as "Before" so the two can
be read side by side.>

## Impact

```md
Affected flows:        flows/<flow>.md
Affected components:   <paths>
Affected data:         <tables, migrations, backfills>
Affected services:     <external services or cloud resources>
Affected environments: <which need a config change, a migration, or a redeploy>
Configuration:         <new or changed variables, by NAME>
Breaking?              <yes/no — for whom, and what they must do>
Rollback:              <how, and what it cannot undo>
```

## Validation

```md
Tests:   <which ran>
Result:  <the actual output, not "passed" by assumption>
Manual:  <what was checked by hand, in which environment>
Not verified: <what remains unproven>
```

## Memory Updated

<Which knowledge-base documents this change required updating, and which it did not affect.>
