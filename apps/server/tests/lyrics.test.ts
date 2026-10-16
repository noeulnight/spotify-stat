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
  const missing = createLyricsLookup(async () => {
    calls++;
    return new Response(null, { status: 404 });
  });
  assert.equal(await missing(signature), null);
  assert.equal(await missing(signature), null);
  assert.equal(calls, 1);
  const invalid = createLyricsLookup(async () => {
    calls++;
    return Response.json({ invalid: true });
  });
  await assert.rejects(invalid(signature));
  await assert.rejects(invalid(signature));
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
