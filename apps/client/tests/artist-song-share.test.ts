import assert from "node:assert/strict";
import test from "node:test";
import type { ArtistStatsResponse } from "../src/entities/listening";
import { getArtistSongShare } from "../src/widgets/artist-details/model/artist-song-share";

test("favorite-song shares use all-time plays, including songs outside the top list", () => {
  const stats = {
    total: { count: 100 },
    mostListened: [40, 20, 10, 5].map((count, index) => ({
      _id: String(index),
      count,
      track: { name: `Song ${index}` },
    })),
  } as ArtistStatsResponse;
  const { rows, topThreeShare } = getArtistSongShare(stats);
  assert.equal(topThreeShare, 70);
  assert.deepEqual(
    rows.map((row) => row.count),
    [40, 20, 10, 30],
  );
  assert.equal(
    rows.reduce((sum, row) => sum + row.count, 0),
    100,
  );
  assert.equal(rows[3]?.share, 30);
});

test("no artificial other songs or percentages are added for an empty catalog", () => {
  assert.deepEqual(
    getArtistSongShare({
      total: { count: 0 },
      mostListened: [],
    } as unknown as ArtistStatsResponse),
    { rows: [], topThreeShare: 0 },
  );
});
