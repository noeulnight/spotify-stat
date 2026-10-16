import assert from "node:assert/strict";
import test from "node:test";
import {
  getHomePeriods,
  formatHomeDuration,
  getHomeChange,
} from "../src/widgets/home/model/home-periods";
import {
  getHomeTimeSeries,
  getHomeHourlyShares,
} from "../src/widgets/home/model/home-series";

test("home calendar periods compare the same elapsed time in the previous period", () => {
  const now = new Date(2026, 9, 16, 15);
  for (const value of ["today", "week", "month", "year"]) {
    const period = getHomePeriods(now, value);
    assert.equal(period.start.getHours(), 0);
    assert.equal(
      period.end.getTime() - period.start.getTime(),
      period.previousEnd.getTime() - period.previousStart.getTime(),
    );
    assert.ok(period.previousEnd <= period.start);
  }
  const week = getHomePeriods(now, "week");
  assert.equal(week.start.getDay(), 1);
  assert.equal(week.start.getDate(), 12);
  assert.equal(week.previousStart.getDate(), 5);
  assert.equal(getHomePeriods(new Date(2026, 0, 1)).start.getFullYear(), 2025);
  assert.equal(getHomePeriods(now, "month").start.getDate(), 1);
  assert.equal(getHomePeriods(now, "year").start.getMonth(), 0);
  assert.equal(getHomePeriods(now, "all").start.getTime(), 0);
  assert.equal(now.getHours(), 15);
});

test("short previous months never overlap the selected month", () => {
  const period = getHomePeriods(new Date(2026, 2, 31, 12), "month");
  assert.equal(period.previousStart.getMonth(), 1);
  assert.equal(period.previousEnd.getTime(), period.start.getTime());
});

test("zero baselines do not invent infinite percentage growth", () => {
  assert.equal(getHomeChange(12, 10), "+20%");
  assert.equal(getHomeChange(0, 10), "-100%");
  assert.equal(getHomeChange(10, 0), "New");
  assert.equal(getHomeChange(0, 0), "No change");
});

test("home listening time retains durations longer than one day", () => {
  assert.equal(formatHomeDuration(90_000_000), "25h 0m");
  assert.equal(formatHomeDuration(3_660_000), "1h 1m");
  assert.equal(formatHomeDuration(0), "0h 0m");
});

test("home activity fills hourly gaps and converts milliseconds into minutes", () => {
  assert.deepEqual(
    getHomeTimeSeries(
      [
        { _id: { year: 2026, month: 10, day: 16, hour: 8 }, count: 60_000 },
        { _id: { year: 2026, month: 10, day: 16, hour: 10 }, count: 180_000 },
      ],
      "hour",
    ),
    [
      { label: "08:00", value: 1 },
      { label: "09:00", value: 0 },
      { label: "10:00", value: 3 },
    ],
  );
  assert.deepEqual(
    getHomeTimeSeries(
      [{ _id: { year: 2026, month: 10 }, count: 60_000 }],
      "month",
    ),
    [{ label: "Oct 2026", value: 1 }],
  );
  assert.deepEqual(getHomeTimeSeries([], "day"), []);
});

test("hourly shares preserve the full denominator with empty hours", () => {
  const result = getHomeHourlyShares([
    { _id: 8, count: 1 },
    { _id: 9, count: 3 },
  ]);
  assert.equal(result.length, 24);
  assert.equal(result[8]?.value, 25);
  assert.equal(result[9]?.value, 75);
  assert.equal(result[0]?.value, 0);
  assert.ok(
    getHomeHourlyShares([{ _id: 8, count: 0 }]).every((row) => row.value === 0),
  );
});
