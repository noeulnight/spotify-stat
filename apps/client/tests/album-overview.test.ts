import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getAlbumOverview,
  ListeningOverview,
  type AlbumStatsResponse,
} from "../src/entities/listening";

test("album overview totals supplied song counts and resolves first/last covers", () => {
  const stats = {
    album: {
      id: "album",
      name: "Album",
      images: [{ url: "https://example.com/cover.png" }],
    },
    artists: [],
    tracks: [
      { _id: "s1", count: 13 },
      { _id: "s2", count: 8 },
    ],
    firstLast: {
      first: {
        played_at: "2025-01-01T00:00:00Z",
        track: { id: "s1", name: "First song", album: "album" },
      },
      last: {
        played_at: "2026-01-01T00:00:00Z",
        track: { id: "s2", name: "Last song", album: "album" },
      },
    },
  } as unknown as AlbumStatsResponse;
  const overview = getAlbumOverview(stats);
  assert.equal(overview.total.count, 21);
  assert.equal(overview.firstLast?.first.track.album, stats.album);
  assert.equal(stats.firstLast?.first.track.album, "album");
  const html = renderToStaticMarkup(
    createElement(ListeningOverview, { stats: overview, publicToken: "test" }),
  );
  assert.match(html, /href="\/share\/test\/songs\/s1"/);
  assert.match(html, /Last song/);
  assert.doesNotMatch(html, /Top months/);
});

test("empty album history is valid and unavailable months stay hidden", () => {
  const overview = getAlbumOverview({
    album: {},
    artists: [],
    tracks: [],
  } as unknown as AlbumStatsResponse);
  assert.equal(overview.total.count, 0);
  assert.equal(overview.firstLast, undefined);
  const html = renderToStaticMarkup(
    createElement(ListeningOverview, { stats: overview }),
  );
  assert.match(html, /Total plays/);
  assert.doesNotMatch(html, /Top months/);
  const withMonths = renderToStaticMarkup(
    createElement(ListeningOverview, {
      stats: {
        total: { count: 1 },
        bestPeriod: [{ _id: { year: 2026, month: 10 }, count: 1, total: 1 }],
      },
    }),
  );
  assert.match(withMonths, /October 2026/);
  assert.match(withMonths, /100%/);
});
