import assert from "node:assert/strict";
import test from "node:test";
import {
  parseLyrics,
  activeLyricIndex,
  activeSongLyricIndex,
  getLyricsText,
} from "../src/features/view-lyrics/model/lyrics";
import { getPlaybackProgress } from "../src/entities/listening/model/playback-progress";

test("song lyrics prefer plain text and fall back to synced text without timestamps", () => {
  const lyrics = {
    id: 1,
    instrumental: false,
    plainLyrics: "  First verse\n\nSecond verse  ",
    syncedLyrics: "[00:01.00]Timed verse",
  };
  assert.equal(getLyricsText(lyrics), "First verse\n\nSecond verse");
  assert.equal(
    getLyricsText({
      ...lyrics,
      plainLyrics: " \n ",
      syncedLyrics:
        "[ar:Artist]\n[00:01.00]First verse\n[00:02.00]\n[00:03.00]Second verse",
    }),
    "First verse\n\nSecond verse",
  );
  assert.equal(getLyricsText(null), "");
  assert.equal(getLyricsText(undefined), "");
  assert.equal(
    getLyricsText({ ...lyrics, plainLyrics: null, syncedLyrics: null }),
    "",
  );
});

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

test("song lyric sync only follows playback for the displayed song", () => {
  const lines = parseLyrics("[00:00.00]Start\n[00:05.00]Next\n[00:10.00]Last");
  const playback = {
    isPlaying: true,
    progressMs: 4000,
    fetchedAt: 1000,
    track: { durationMs: 15000, id: "song", name: "Track", uri: "" },
    album: { id: "album", name: "Album", imageUrl: null },
    artists: [],
  };
  assert.equal(activeSongLyricIndex(lines, "song", playback, 2500), 1);
  assert.equal(activeSongLyricIndex(lines, "another-song", playback, 2500), -1);
  assert.equal(activeSongLyricIndex(lines, "song", null, 2500), -1);
  assert.equal(activeSongLyricIndex(lines, "song", undefined, 2500), -1);
  assert.equal(activeSongLyricIndex([], "song", playback, 2500), -1);
  assert.equal(
    activeSongLyricIndex(
      lines,
      "song",
      { ...playback, isPlaying: false },
      2500,
    ),
    0,
  );
  assert.equal(
    activeSongLyricIndex(
      lines,
      "song",
      { ...playback, progressMs: 11000, fetchedAt: 2500 },
      2500,
    ),
    2,
  );
});
