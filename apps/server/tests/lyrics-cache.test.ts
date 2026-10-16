import assert from "node:assert/strict";
import test from "node:test";

import {
  LyricsUnavailable,
  type Lyrics,
  type LyricsSignature,
} from "../src/tools/apis/lyrics";
import {
  createLyricsCache,
  type LyricsCacheStore,
} from "../src/tools/apis/lyricsCache";

const signature: LyricsSignature = {
  trackName: "Song",
  artistName: "Artist",
  albumName: "Album",
  durationMs: 180000,
};
const lyrics: Lyrics = {
  id: 1,
  instrumental: false,
  plainLyrics: "Hello",
  syncedLyrics: "[00:00.00]Hello",
};
function store() {
  const values = new Map<string, Lyrics | null>();
  const api: LyricsCacheStore = {
    get: async (id) => values.get(id),
    set: async (id, value) => {
      values.set(id, value);
    },
    clear: async () => values.clear(),
  };
  return { values, api };
}
function lookup(fn: (signature: LyricsSignature) => Promise<Lyrics | null>) {
  return Object.assign(fn, { clear() {} });
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("persistent lyrics survive lookup instances and bypass playback and upstream outages", async () => {
  const db = store();
  const first = createLyricsCache(
    db.api,
    lookup(async () => lyrics),
  );
  assert.deepEqual(await first.get("track", async () => signature), lyrics);
  const second = createLyricsCache(
    db.api,
    lookup(async () => {
      throw new LyricsUnavailable();
    }),
  );
  assert.deepEqual(
    await second.get("track", async () => {
      throw new Error("Playback unavailable");
    }),
    lyrics,
  );
});

test("cache misses deduplicate, errors and missing playback metadata are never persisted", async () => {
  const db = store();
  let calls = 0;
  const cache = createLyricsCache(
    db.api,
    lookup(async () => {
      calls++;
      if (calls === 1) throw new LyricsUnavailable();
      return null;
    }),
  );
  assert.equal(await cache.get("track", async () => null), null);
  assert.equal(db.values.has("track"), false);
  await assert.rejects(
    cache.get("track", async () => signature),
    LyricsUnavailable,
  );
  assert.equal(db.values.has("track"), false);
  await Promise.all([
    cache.get("track", async () => signature),
    cache.get("track", async () => signature),
  ]);
  assert.equal(calls, 2);
  assert.equal(db.values.get("track"), null);
  await cache.get("track", async () => {
    throw new Error("Should use cached miss");
  });
});

test("clearing also clears memory and prevents an earlier lookup from repopulating MongoDB", async () => {
  const db = store();
  const started = deferred(),
    release = deferred();
  let clears = 0;
  const fetch = Object.assign(
    async () => {
      started.resolve();
      await release.promise;
      return lyrics;
    },
    {
      clear() {
        clears++;
      },
    },
  );
  const cache = createLyricsCache(db.api, fetch);
  const pending = cache.get("track", async () => signature);
  await started.promise;
  await cache.clear();
  release.resolve();
  await pending;
  assert.equal(clears, 1);
  assert.equal(db.values.size, 0);
  await cache.get("track", async () => signature);
  assert.deepEqual(db.values.get("track"), lyrics);
});

test("clear waits for an existing MongoDB write before deleting cached entries", async () => {
  const db = store();
  const writing = deferred(),
    release = deferred();
  const cache = createLyricsCache(
    {
      ...db.api,
      set: async (id, value) => {
        writing.resolve();
        await release.promise;
        await db.api.set(id, value);
      },
    },
    lookup(async () => lyrics),
  );
  const pending = cache.get("track", async () => signature);
  await writing.promise;
  const cleared = cache.clear();
  release.resolve();
  await Promise.all([pending, cleared]);
  assert.equal(db.values.size, 0);
});
