# Antipattern Prevention

> Loaded by `brain-orchestrator` in Phase 4 (DESIGN — before a design is accepted) and Phase 9
> (REVIEW — before a result is integrated). Two catalogs: things that go wrong in the _code_, and
> things that go wrong in the _orchestration_. The second kind is more expensive, because it
> multiplies across every agent in the wave.

## 1. The question that gates every design

```text
Does this fix the mechanism that causes the failure, or does it make the symptom disappear?
```

If you cannot state the mechanism in one sentence — _"validity is decided in two places and the
cached path has no invalidation on expiry"_ — you have not diagnosed anything yet, and whatever you
are about to ship is a guess with a passing test.

A mitigation is legitimate when it is chosen deliberately: label it `MITIGATION` in the ADR, keep
the real cause as an `OPEN QUESTION` with an ID, and say plainly what remains broken. A mitigation
is a defect when it is presented as a fix.

| Symptom-level "fix"                   | What it leaves behind                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Lower a cache TTL                     | The stale-read path still exists; it now fails less often and less reproducibly |
| Add a null check at the crash site    | Whatever produced the null still produces it, one frame earlier                 |
| Retry the failing call                | The failure is now slower, and its cause is invisible in the metrics            |
| Catch and log the exception           | The invalid state propagates; the log becomes the only evidence                 |
| Reorder two statements until it works | The race is still there, now with a timing dependency nobody documented         |

## 2. Proving the fix

| Change type                      | Minimum proof                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bug fix                          | A regression test that **fails on the current code** and passes after — written before the fix, not after         |
| Contract change                  | Contract/integration tests on both sides, plus every consumer enumerated and adapted                              |
| Data model / migration           | Migration applied and reverted on a realistic dataset; backward compatibility checked against the running version |
| Concurrency / ordering           | A test that reproduces the interleaving, or an explicit statement of why it cannot be tested and what compensates |
| Refactor with no behavior change | The existing suite passes untouched — if you had to edit tests, the behavior changed                              |
| New feature                      | Unit tests for the logic, integration for the wiring, plus the project's own bar                                  |
| Anything at all                  | typecheck, lint, and build pass without a single rule being relaxed                                               |

Tests assert **behavior**, not incidental implementation. A test that breaks when you rename a
private method, while the observable behavior is unchanged, is a maintenance tax pretending to be
coverage.

## 3. Code and design antipatterns

Each row: what it looks like, how it is detected, what to do instead.

| Antipattern                             | Detection                                                                                          | Correct move                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Duplicated logic**                    | The same rule implemented in two layers; grep finds a second, similar validator                    | Extend the existing one, or extract it once and have both call it                                      |
| **Monkey patch / permanent workaround** | Behavior overridden at a distance; a comment saying "temporary" with no date or ticket             | Fix at the source, or make the workaround an explicit, ADR-recorded mitigation                         |
| **Business logic in the wrong layer**   | Domain rules in a controller, an HTTP status decided in a repository, SQL in a component           | Move the rule to the layer that owns it; the transport layer translates, it does not decide            |
| **Unnecessary global state**            | A new module-level mutable, a singleton holding request-scoped data                                | Pass it explicitly; global state converts a local bug into a heisenbug                                 |
| **Circular dependencies**               | Import cycles; a module importing its own consumer                                                 | Introduce the boundary the cycle is asking for, or invert the dependency                               |
| **Premature abstraction**               | An interface with one implementation, a factory producing one type, a "strategy" with one strategy | Wait for the second real case; two concrete implementations teach the shape, one guess invents it      |
| **God object**                          | A class touched by every task, a file whose imports span every module                              | Split by responsibility, along the boundary the tasks already revealed                                 |
| **Giant function**                      | A function nobody can hold in their head; deep nesting; a dozen parameters                         | Extract by responsibility, not by line count                                                           |
| **Duplicated validation**               | The same rule enforced at the edge and in the domain, drifting apart                               | One authoritative place; the others delegate to it                                                     |
| **Hardcoding**                          | An environment value, a URL, a limit, or a magic status inlined                                    | Configuration with an explicit default and a named constant                                            |
| **Silent exception**                    | `catch {}`, a swallowed error, a rejected promise nobody observes                                  | Handle it or propagate it; a caught error that changes nothing is a deleted incident report            |
| **Unjustified catch-all**               | One handler wrapping an entire flow, converting every cause into one message                       | Catch what you can actually handle, where you can handle it                                            |
| **Type bypass**                         | `any`, `as unknown as`, `@ts-ignore`, `# type: ignore`, an unchecked cast                          | Model the real type; a bypass moves the failure from build time to run time                            |
| **Contract bypass**                     | Calling past the interface into an internal, reading another module's private state                | Go through the contract, or change the contract deliberately                                           |
| **Invasive refactor**                   | A diff far larger than the task; renames across untouched modules                                  | Revert the unrelated part; propose it as its own task                                                  |
| **Deleting tests to get green**         | Tests removed, `.skip`, `.only`, an assertion weakened to match new output                         | Never. A failing test is information; deleting it deletes the information, not the bug                 |
| **Disabling checks**                    | `eslint-disable`, a suppressed rule, a loosened tsconfig, a relaxed CI gate                        | Fix the code. If the rule is genuinely wrong, change it deliberately, in its own change, with a reason |
| **Hiding errors in the build**          | A step made non-fatal, an error filtered from output, a warning silenced                           | The build tells the truth or it is worthless                                                           |

## 4. Orchestration antipatterns — the Brain's own failure modes

| Antipattern                                 | What it looks like                                                   | Why it is expensive                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Inventing architecture**                  | Describing how the system "probably" works and planning on top of it | Every downstream task inherits the fiction; the failure surfaces at integration           |
| **Assuming without evidence**               | A claim with no `path:line`, no command, no evidence level           | Unfalsifiable plans cannot be corrected, only abandoned                                   |
| **Implementing too early**                  | Code before the flow is traced                                       | The first fix lands in the wrong layer and becomes the thing everyone else builds around  |
| **Tasks per file**                          | `TASK-1: edit fileA`                                                 | Unverifiable, uncohesive, and collides on contact                                         |
| **Artificial parallelism**                  | Splitting sequential work because agents are idle                    | Merge conflicts, divergent contracts, and slower delivery than sequencing would have been |
| **Letting executors redefine architecture** | Each agent solving the global problem locally                        | N different systems in one repository                                                     |
| **Silent contract changes**                 | A shape adjusted mid-flight without a REV or an ADR                  | Consumers built against a contract that no longer exists                                  |
| **Silent scope changes**                    | Widening `Allowed Scope` without recording it                        | Review can no longer distinguish the change from the drift                                |
| **Accepting "it compiles"**                 | Marking done because the build is green                              | Compilation proves syntax, not behavior; the acceptance criteria proved nothing           |
| **Ignoring consumers**                      | Changing a signature without enumerating callers                     | Runtime breakage in the paths nobody thought to check                                     |
| **New abstraction without searching**       | Building an adapter that already exists three folders away           | Two parallel mechanisms for one job, forever                                              |
| **Continuing an invalidated plan**          | New evidence, same plan                                              | Every subsequent task is built on a premise already known to be false                     |
| **Trusting stale memory**                   | Acting on a document older than the code                             | Confidently wrong, at speed                                                               |
| **Summary chains**                          | Knowledge passed agent → summary → summary → agent                   | The telephone game; the contract mutates at every hop                                     |
| **Memory as a transcript**                  | Logging every command and every file opened                          | Nobody reads it; the signal that mattered is buried in it                                 |
| **Duplicating truth**                       | The same fact restated in four documents                             | They diverge, and no one can tell which is current                                        |
| **More agents = more productivity**         | Fan-out as a reflex                                                  | Coordination cost grows faster than throughput; correctness does not scale with headcount |
| **More tasks = better planning**            | Twenty tasks with no dependency model                                | A task list is not a plan; a plan has an order and a critical path                        |

## 5. Review checklist

Run before integrating any result, and before accepting any design:

- [ ] The change fixes a named mechanism, not a symptom — or is explicitly labeled a mitigation.
- [ ] Nothing in §3 was introduced (check the diff against the table, not from memory).
- [ ] Nothing that already existed was reimplemented — the search for existing components was done
      and recorded.
- [ ] No test, lint rule, type check, or build step was weakened, skipped, or deleted.
- [ ] No new `any`, `@ts-ignore`, suppression, or silent catch appears in the diff.
- [ ] No dependency, config, or CI change that the task did not ask for.
- [ ] Every changed contract has every consumer enumerated and adapted.
- [ ] Every invariant referenced by the task still holds, demonstrated by a test where possible.
- [ ] The diff size is proportional to the task; unexplained excess is `SUSPICIOUS` until explained.
- [ ] Behavior is proven by something that actually ran, and whose output was actually read.
