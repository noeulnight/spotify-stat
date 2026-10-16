import assert from "node:assert/strict";
import test from "node:test";
import type { ArtistStatsResponse } from "../src/entities/listening";
import { getArtistActivity } from "../src/widgets/artist-details/model/artist-activity";

test("artist activity uses backend totals for month shares and fills all 24 hours", () => {
  const stats = {
    bestPeriod: [
      { _id: { year: 2026, month: 10 }, count: 68, total: 138 },
      { _id: { year: 2026, month: 8 }, count: 45, total: 138 },
      { _id: { year: 2026, month: 7 }, count: 25, total: 138 },
    ],
    dayRepartition: [
      { _id: 23, count: 4 },
      { _id: 8, count: 21 },
    ],
  } as ArtistStatsResponse;
  const { months, hours } = getArtistActivity(stats);
  assert.deepEqual(months, [
    { label: "October 2026", count: 68, share: 49 },
    { label: "August 2026", count: 45, share: 33 },
  ]);
  assert.equal(hours.length, 24);
  assert.deepEqual(hours[0], { hour: 0, plays: 0 });
  assert.deepEqual(hours[8], { hour: 8, plays: 21 });
  assert.deepEqual(hours[23], { hour: 23, plays: 4 });
});

test("artist activity handles empty data and a zero total", () => {
  assert.deepEqual(getArtistActivity({} as ArtistStatsResponse).months, []);
  assert.ok(
    getArtistActivity({} as ArtistStatsResponse).hours.every(
      (row) => row.plays === 0,
    ),
  );
  const { months } = getArtistActivity({
    bestPeriod: [{ _id: { year: 2026, month: 1 }, count: 0, total: 0 }],
  } as ArtistStatsResponse);
  assert.equal(months[0].share, 0);
});
