import assert from "node:assert/strict";
import test from "node:test";

import {
  createLyricsLookup,
  LyricsUnavailable,
} from "../src/tools/apis/lyrics";

const signature = {
  trackName: "Song",
  artistName: "Artist",
  albumName: "Album",
  durationMs: 233_500,
};
const lyrics = {
  id: 1,
  instrumental: false,
  plainLyrics: "Hello",
  syncedLyrics: "[00:01.00]Hello",
};

test("lyrics sends precise metadata, identifies the client and deduplicates cached requests", async () => {
  let calls = 0;
  const lookup = createLyricsLookup(async (input, init) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.origin, "https://lrclib.net");
    assert.equal(url.searchParams.get("duration"), "233.5");
    assert.equal(url.searchParams.get("track_name"), "Song");
    assert.equal(url.searchParams.get("artist_name"), "Artist");
    assert.equal(url.searchParams.get("album_name"), "Album");
    assert.match(
      String(
        (init?.headers as Record<string, string> | undefined)?.["User-Agent"],
      ),
      /Spotistat/,
    );
    assert.ok(init?.signal);
    return Response.json(lyrics);
  });
  const [first, second] = await Promise.all([
    lookup(signature),
    lookup(signature),
  ]);
  assert.deepEqual(first, lyrics);
  assert.deepEqual(second, lyrics);
  await lookup(signature);
  assert.equal(calls, 1);
});

test("missing lyrics are cached, malformed or failed upstream responses are not", async () => {
  let calls = 0;
  const missing = createLyricsLookup(async (input) => {
    calls++;
    if (new URL(String(input)).pathname === "/api/search")
      return Response.json([]);
    return new Response(null, { status: 404 });
  });
  assert.equal(await missing(signature), null);
  assert.equal(await missing(signature), null);
  assert.equal(calls, 2);
  const invalid = createLyricsLookup(async () => {
    calls++;
    return Response.json({ invalid: true });
  });
  await assert.rejects(invalid(signature));
  await assert.rejects(invalid(signature));
  assert.equal(calls, 4);
});

test("404 searches by title and artist, validates versions and prefers the same album", async () => {
  let calls = 0;
  const candidate = {
    ...lyrics,
    trackName: " song ",
    artistName: "ARTIST",
    albumName: "Other album",
    duration: 233.5,
  };
  const lookup = createLyricsLookup(async (input, init) => {
    calls++;
    const url = new URL(String(input));
    if (url.pathname === "/api/get") return new Response(null, { status: 404 });
    assert.equal(url.pathname, "/api/search");
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      track_name: "Song",
      artist_name: "Artist",
    });
    assert.ok(init?.signal);
    return Response.json([
      { ...candidate, id: 2, trackName: "Song (Live)" },
      { ...candidate, id: 3, artistName: "Another artist" },
      { ...candidate, id: 4, duration: 235.6 },
      { ...candidate, id: 5, plainLyrics: null, syncedLyrics: null },
      { ...candidate, id: 6 },
      { ...candidate, id: 7, albumName: " album ", duration: 235.5 },
    ]);
  });
  assert.deepEqual(await lookup(signature), { ...lyrics, id: 7 });
  await lookup(signature);
  assert.equal(calls, 2);
});

test("search rejects unrelated candidates and selects the closest duration without the album", async () => {
  const candidate = {
    ...lyrics,
    trackName: "Song",
    artistName: "Artist",
    albumName: "Compilation",
    duration: 234,
  };
  const lookup = createLyricsLookup(async (input) =>
    new URL(String(input)).pathname === "/api/get"
      ? new Response(null, { status: 404 })
      : Response.json([
          { ...candidate, id: 2, duration: 235 },
          { ...candidate, id: 3 },
        ]),
  );
  assert.deepEqual(await lookup(signature), { ...lyrics, id: 3 });
  assert.equal(await lookup({ ...signature, trackName: "Song (Live)" }), null);
  assert.equal(await lookup({ ...signature, artistName: "Other" }), null);
  assert.equal(await lookup({ ...signature, durationMs: 250_000 }), null);
});

test("503 is not treated as a search miss and search failures retain retry-after", async () => {
  let calls = 0;
  const failed = createLyricsLookup(async () => {
    calls++;
    return new Response(null, { status: 503 });
  });
  await assert.rejects(failed(signature), LyricsUnavailable);
  assert.equal(calls, 1);
  const searchFailed = createLyricsLookup(async (input) => {
    calls++;
    return new URL(String(input)).pathname === "/api/get"
      ? new Response(null, { status: 404 })
      : new Response(null, { status: 503, headers: { "Retry-After": "60" } });
  });
  await assert.rejects(
    searchFailed(signature),
    (error) => error instanceof LyricsUnavailable && error.retryAfter === 60,
  );
  await assert.rejects(searchFailed(signature), LyricsUnavailable);
  assert.equal(calls, 3);
});

test("upstream retry-after prevents requests for other tracks during cooldown", async () => {
  let calls = 0;
  const lookup = createLyricsLookup(async () => {
    calls++;
    return new Response("Slow down", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  });
  await assert.rejects(
    lookup(signature),
    (error) => error instanceof LyricsUnavailable && error.retryAfter === 60,
  );
  await assert.rejects(
    lookup({ ...signature, trackName: "Other" }),
    LyricsUnavailable,
  );
  assert.equal(calls, 1);
});

test("instrumental responses retain their explicit state", async () => {
  const lookup = createLyricsLookup(async () =>
    Response.json({
      id: 2,
      instrumental: true,
      plainLyrics: null,
      syncedLyrics: null,
    }),
  );
  assert.equal((await lookup(signature))?.instrumental, true);
});

test("catalog lyrics metadata skips Spotify and missing tracks use matching current playback", async () => {
  const { resolveLyricsSignature } = await import("../src/tools/apis/lyrics");
  let calls = 0;
  const playback = async () => {
    calls++;
    return {
      currently_playing_type: "track",
      item: {
        id: "current-id",
        name: "Current song",
        duration_ms: 180000,
        artists: [{ name: "Current artist" }],
        album: { name: "Current album" },
      },
    };
  };
  assert.deepEqual(
    await resolveLyricsSignature("stored-id", signature, playback),
    signature,
  );
  assert.equal(calls, 0);
  assert.deepEqual(await resolveLyricsSignature("current-id", null, playback), {
    trackName: "Current song",
    artistName: "Current artist",
    albumName: "Current album",
    durationMs: 180000,
  });
  assert.equal(calls, 1);
  assert.equal(
    await resolveLyricsSignature("different-id", null, playback),
    null,
  );
  assert.equal(
    await resolveLyricsSignature("current-id", null, async () => null),
    null,
  );
  assert.equal(
    await resolveLyricsSignature("current-id", null, async () => ({
      ...(await playback()),
      currently_playing_type: "episode",
    })),
    null,
  );
});
