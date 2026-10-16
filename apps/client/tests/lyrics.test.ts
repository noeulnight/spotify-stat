import assert from "node:assert/strict";
import test from "node:test";
import {
  parseLyrics,
  activeLyricIndex,
} from "../src/features/view-lyrics/model/lyrics";
import { getPlaybackProgress } from "../src/entities/listening/model/playback-progress";

test("LRC supports fractional and repeated timestamps, offsets, simultaneous lines and gaps", () => {
  const lines = parseLyrics(
    "[ar:Artist]\n[offset:-100]\n[00:01.5][00:04.005]Hello\n[00:01.50]Translation\n[00:02.50]\n[00:70.00]invalid",
  );
  assert.deepEqual(lines, [
    { timeMs: 1400, text: "Hello\nTranslation" },
    { timeMs: 2400, text: "" },
    { timeMs: 3905, text: "Hello" },
  ]);
  assert.equal(activeLyricIndex(lines, 1399), -1);
  assert.equal(activeLyricIndex(lines, 1400), 0);
  assert.equal(activeLyricIndex(lines, 2500), 1);
  assert.equal(activeLyricIndex(lines, 4000), 2);
  assert.deepEqual(parseLyrics(null), []);
  assert.deepEqual(parseLyrics("plain lyrics"), []);
});

test("lyrics follow interpolated playback, pause and seek positions", () => {
  const lines = parseLyrics("[00:00.00]Start\n[00:05.00]Next\n[00:10.00]Last");
  const playback = {
    isPlaying: true,
    progressMs: 4000,
    fetchedAt: 1000,
    track: { durationMs: 15000, id: "t", name: "Track", uri: "" },
    album: { id: "a", name: "Album", imageUrl: null },
    artists: [],
  };
  assert.equal(
    activeLyricIndex(lines, getPlaybackProgress(playback, 2500).positionMs),
    1,
  );
  assert.equal(
    activeLyricIndex(
      lines,
      getPlaybackProgress({ ...playback, isPlaying: false }, 2500).positionMs,
    ),
    0,
  );
  assert.equal(
    activeLyricIndex(
      lines,
      getPlaybackProgress(
        { ...playback, progressMs: 11000, fetchedAt: 2500 },
        2500,
      ).positionMs,
    ),
    2,
  );
});
