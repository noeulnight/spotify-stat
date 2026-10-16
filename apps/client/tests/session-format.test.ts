import assert from "node:assert/strict";
import test from "node:test";
import { formatSessionDuration } from "../src/widgets/longest-sessions/model/session-format";

test("session duration retains total hours and handles minute/second boundaries", () => {
  assert.equal(formatSessionDuration(0), "0s");
  assert.equal(formatSessionDuration(-1), "0s");
  assert.equal(formatSessionDuration(59_999), "59s");
  assert.equal(formatSessionDuration(60_000), "1m");
  assert.equal(formatSessionDuration(3_599_999), "59m");
  assert.equal(formatSessionDuration(3_660_000), "1h 1m");
  assert.equal(formatSessionDuration(25 * 3_600_000), "25h 0m");
});
