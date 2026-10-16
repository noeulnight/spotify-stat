import assert from "node:assert/strict";
import test from "node:test";
import {
  formatListeningTime,
  getActivitySeries,
} from "../src/widgets/stats/model/stats-series";

test("daily stats sort backend calendar dates and fill gaps through a leap day", () => {
  assert.deepEqual(
    getActivitySeries(
      [
        { _id: { year: 2024, month: 3, day: 1 }, count: 7 },
        { _id: { year: 2024, month: 2, day: 28 }, count: 4 },
        { _id: null, count: 100 },
      ],
      false,
    ),
    [
      { label: "Feb 28, 2024", value: 4 },
      { label: "Feb 29, 2024", value: 0 },
      { label: "Mar 1, 2024", value: 7 },
    ],
  );
});

test("monthly stats preserve year boundaries and do not invent an empty range", () => {
  assert.deepEqual(
    getActivitySeries(
      [
        { _id: { year: 2026, month: 2 }, count: 8 },
        { _id: { year: 2025, month: 12 }, count: 2 },
      ],
      true,
    ),
    [
      { label: "Dec 2025", value: 2 },
      { label: "Jan 2026", value: 0 },
      { label: "Feb 2026", value: 8 },
    ],
  );
  assert.deepEqual(getActivitySeries([], true), []);
  assert.deepEqual(getActivitySeries([{ _id: null, count: 4 }], false), []);
});

test("listening time formats backend milliseconds without wrapping at 24 hours", () => {
  assert.equal(formatListeningTime(0), "0h 0m");
  assert.equal(formatListeningTime(-1), "0h 0m");
  assert.equal(formatListeningTime(3_660_000), "1h 1m");
  assert.equal(formatListeningTime(90_000_000), "25h 0m");
});
