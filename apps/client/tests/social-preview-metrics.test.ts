import { formatListeningTime } from "../src/entities/listening";
import assert from "node:assert/strict";
import test from "node:test";
import type {
  AlbumStatsResponse,
  ArtistStatsResponse,
  TrackStatsResponse,
} from "../src/entities/listening";
import {
  getAlbumMetrics,
  getArtistMetrics,
  getSongMetrics,
} from "../src/features/social-preview/model/metrics";

test("listening time keeps total hours and rejects unavailable durations", () => {
  assert.equal(formatListeningTime(462_720_000), "128h 32m");
  assert.equal(formatListeningTime(59_999), "0h 0m");
  assert.equal(formatListeningTime(0), "0h 0m");
  for (const value of [undefined, NaN, Infinity, -1])
    assert.equal(formatListeningTime(value), undefined);
});

test("OG metrics use full-history totals instead of truncated top lists or track lengths", () => {
  const firstLast = {
    first: { played_at: "2023-01-02T10:00:00Z" },
    last: { played_at: "2026-10-16T12:00:00Z" },
  };
  const total = {
    count: 1234,
    durationMs: 462_720_000,
    differents: 83,
    albums: 21,
  };
  assert.deepEqual(
    getSongMetrics({ total, firstLast } as unknown as TrackStatsResponse),
    [
      { label: "Plays", value: "1,234" },
      { label: "Listening time", value: "128h 32m" },
      { label: "First played", value: "2023-01-02" },
      { label: "Last played", value: "2026-10-16" },
    ],
  );
  assert.deepEqual(
    getAlbumMetrics({
      total,
      firstLast,
      tracks: [{ count: 4 }, { count: 7 }],
    } as unknown as AlbumStatsResponse),
    [
      { label: "Plays", value: "1,234" },
      { label: "Listening time", value: "128h 32m" },
      { label: "Songs", value: "83" },
      { label: "First played", value: "2023-01-02" },
    ],
  );
  assert.deepEqual(
    getArtistMetrics({
      total,
      mostListened: Array(10),
      albumMostListened: Array(10),
    } as ArtistStatsResponse),
    [
      { label: "Plays", value: "1,234" },
      { label: "Listening time", value: "128h 32m" },
      { label: "Songs", value: "83" },
      { label: "Albums", value: "21" },
    ],
  );
});

test("old API responses and missing dates do not invent time or distinct counts", () => {
  assert.deepEqual(
    getSongMetrics({
      total: { count: 4 },
      firstLast: { first: { played_at: "bad date" } },
    } as unknown as TrackStatsResponse),
    [{ label: "Plays", value: "4" }],
  );
  assert.deepEqual(
    getArtistMetrics({ total: { count: 4 } } as ArtistStatsResponse),
    [{ label: "Plays", value: "4" }],
  );
  assert.deepEqual(
    getAlbumMetrics({
      tracks: [{ count: 4 }, { count: 7 }],
    } as unknown as AlbumStatsResponse),
    [
      { label: "Plays", value: "11" },
      { label: "Songs", value: "2" },
    ],
  );
});
