"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { withRetry } = require("../src/lib/retry");

test("returns the first successful result", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw Object.assign(new Error("reset"), { code: "ECONNRESET" });
    return "ok";
  }, { attempts: 3, baseDelayMs: 1 });
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("throws the last error after the final attempt", async () => {
  await assert.rejects(withRetry(async () => { throw new Error("down"); }, { attempts: 2, baseDelayMs: 1 }), /down/);
});

test("reports each retry", async () => {
  const seen = [];
  await withRetry(async (attempt) => { if (attempt === 1) throw new Error("x"); return 1; }, { attempts: 2, baseDelayMs: 1, onRetry: (_e, a) => seen.push(a) });
  assert.deepEqual(seen, [1]);
});
