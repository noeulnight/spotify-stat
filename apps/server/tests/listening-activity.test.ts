import assert from "node:assert/strict";
import test from "node:test";

import { summarizeListeningActivity } from "../src/tools/listening-activity";

test("activity fills twelve months and compares non-overlapping thirty-day periods", () => {
  const activity = summarizeListeningActivity(
    [
      { _id: "2025-10-20", count: 4 },
      { _id: "2026-08-20", count: 2 },
      { _id: "2026-08-21", count: 3 },
      { _id: "2026-09-19", count: 5 },
      { _id: "2026-09-20", count: 7 },
      { _id: "2026-10-19", count: 11 },
      { _id: "2026-10-20", count: 100 },
    ],
    "2026-10-19",
  );
  assert.deepEqual(activity.recent, {
    count: 18,
    previousCount: 8,
    through: "2026-10-19",
  });
  assert.equal(activity.months.length, 12);
  assert.deepEqual(activity.months[0], { month: "2025-11", count: 0 });
  assert.deepEqual(activity.months[11], { month: "2026-10", count: 11 });
  assert.equal(activity.listeningDays, 6);
  assert.equal(activity.longestStreak, 2);
  assert.deepEqual(activity.peakDay, { date: "2026-10-19", count: 11 });
});

test("calendar-day streaks span leap days, year boundaries and DST transitions", () => {
  for (const dates of [
    ["2024-02-28", "2024-02-29", "2024-03-01"],
    ["2025-12-31", "2026-01-01", "2026-01-02"],
    ["2026-03-07", "2026-03-08", "2026-03-09"],
    ["2026-10-31", "2026-11-01", "2026-11-02"],
  ]) {
    const result = summarizeListeningActivity(
      dates.reverse().map((_id) => ({ _id, count: 2 })),
      "2026-11-03",
    );
    assert.equal(result.longestStreak, 3);
    assert.equal(result.listeningDays, 3);
    assert.equal(result.peakDay?.date, [...dates].sort()[0]);
  }
});

test("empty activity preserves zeros without inventing a peak day or streak", () => {
  const activity = summarizeListeningActivity([], "2026-01-01");
  assert.equal(activity.listeningDays, 0);
  assert.equal(activity.longestStreak, 0);
  assert.equal(activity.peakDay, null);
  assert.equal(activity.recent.count, 0);
  assert.equal(activity.recent.previousCount, 0);
  assert.equal(
    activity.months.every((month) => month.count === 0),
    true,
  );
  assert.equal(activity.months[0]?.month, "2025-02");
});
