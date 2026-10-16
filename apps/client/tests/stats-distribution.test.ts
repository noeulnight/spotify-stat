import assert from "node:assert/strict";
import test from "node:test";
import {
  getArtistDistribution,
  getHourlyDistribution,
  getHourlyShares,
} from "../src/widgets/stats/model/distribution-series";
import { getActivitySeries } from "../src/widgets/stats/model/stats-series";

test("artist shares use full bucket totals and preserve paired artist counts", () => {
  const date = { year: 2026, month: 10, day: 1 };
  const result = getArtistDistribution(
    [
      {
        _id: date,
        artists: [
          { id: "b", name: "B" },
          { id: "a", name: "A" },
        ],
        counts: [1, 3],
      },
    ],
    [{ _id: date, count: 10 }],
    false,
  );
  assert.equal(result.series[0]?.label, "A");
  assert.equal(result.data[0]?.item0, 30);
  assert.equal(result.data[0]?.item1, 10);
  assert.equal(result.data[0]?.other, 60);
  assert.equal(
    Object.values(result.data[0]!)
      .filter((value): value is number => typeof value === "number")
      .reduce((sum, value) => sum + value, 0),
    100,
  );
});

test("hourly ranking retains truncated items as Other, with zeroes for empty hours", () => {
  const result = getHourlyDistribution([
    {
      hour: 8,
      total: 10,
      items: [{ itemId: "a", total: 4 }],
      full_items: { a: { id: "a", name: "Artist" } },
    },
  ]);
  assert.equal(result.data.length, 24);
  assert.deepEqual(result.data[0], { label: "00:00", item0: 0, other: 0 });
  assert.deepEqual(result.data[8], { label: "08:00", item0: 40, other: 60 });
  assert.equal(getHourlyDistribution([]).data.length, 0);
});

test("artist stack limits series and includes all omitted shares in Other", () => {
  const date = { year: 2026, month: 10 };
  const artists = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    name: String(i),
  }));
  const result = getArtistDistribution(
    [{ _id: date, artists, counts: artists.map(() => 1) }],
    [{ _id: date, count: 20 }],
    true,
  );
  assert.equal(result.series.length, 11);
  assert.equal(result.data[0]?.other, 50);
  assert.deepEqual(getArtistDistribution([], [], true).data, []);
});

test("hourly shares are percentages independent of metric units", () => {
  const plays = getHourlyShares([
    { _id: 7, count: 1 },
    { _id: 8, count: 3 },
  ]);
  const durations = getHourlyShares([
    { _id: 7, count: 60_000 },
    { _id: 8, count: 180_000 },
  ]);
  assert.deepEqual(plays, durations);
  assert.equal(plays[7]?.value, 25);
  assert.equal(plays[8]?.value, 75);
  assert.ok(
    getHourlyShares([{ _id: 8, count: 0 }]).every((row) => row.value === 0),
  );
  assert.deepEqual(getHourlyShares([]), []);
});

test("missing average values are gaps, not a false zero release year or artist count", () => {
  assert.deepEqual(
    getActivitySeries(
      [
        { _id: { year: 2026, month: 1 }, count: 2020.5 },
        { _id: { year: 2026, month: 3 }, count: 2024 },
      ],
      true,
      null,
    ),
    [
      { label: "Jan 2026", value: 2020.5 },
      { label: "Feb 2026", value: null },
      { label: "Mar 2026", value: 2024 },
    ],
  );
});
