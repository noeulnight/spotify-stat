import assert from "node:assert/strict";
import test from "node:test";
import { getPeriod } from "../src/features/filter-period";

test("period presets preserve the end and calculate the requested date range", () => {
  const end = new Date("2026-10-16T03:00:00Z");
  for (const days of [7, 30, 90, 365]) {
    const period = getPeriod(String(days), end);
    assert.equal(period.end, end);
    assert.equal(end.getTime() - period.start.getTime(), days * 86_400_000);
  }
  assert.equal(getPeriod("all", end).start.getTime(), 0);
});
