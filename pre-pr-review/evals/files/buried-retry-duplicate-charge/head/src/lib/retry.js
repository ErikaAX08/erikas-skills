"use strict";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs `fn` up to `attempts` times with exponential backoff between attempts. `onRetry` is called
// with the error and the number of the attempt that failed.
async function withRetry(fn, { attempts = 3, baseDelayMs = 100, onRetry = () => {} } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      onRetry(err, attempt);
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

module.exports = { withRetry };
