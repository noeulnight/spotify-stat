import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getPlaybackProgress,
  PlaybackProgress,
  type CurrentlyPlayingResponse,
} from "../src/entities/listening";

const playback: CurrentlyPlayingResponse = {
  isPlaying: true,
  progressMs: 60_000,
  fetchedAt: 1_000_000,
  track: {
    id: "track",
    name: "Track",
    uri: "spotify:track:track",
    durationMs: 180_000,
  },
  album: { id: "album", name: "Album", imageUrl: null },
  artists: [],
};

test("playback advances from the API timestamp only while playing", () => {
  assert.equal(getPlaybackProgress(playback, 1_005_000).positionMs, 65_000);
  assert.equal(
    getPlaybackProgress({ ...playback, isPlaying: false }, 1_005_000)
      .positionMs,
    60_000,
  );
  assert.equal(
    getPlaybackProgress(
      { ...playback, progressMs: 20_000, fetchedAt: 1_005_000 },
      1_006_000,
    ).positionMs,
    21_000,
  );
});

test("playback stays within the track duration and handles a clock ahead of the client", () => {
  assert.equal(getPlaybackProgress(playback, 2_000_000).positionMs, 180_000);
  assert.equal(getPlaybackProgress(playback, 900_000).positionMs, 60_000);
  assert.deepEqual(
    getPlaybackProgress(
      { ...playback, track: { ...playback.track, durationMs: 0 } },
      1_005_000,
    ),
    { positionMs: 0, durationMs: 0 },
  );
});

test("progress renders real elapsed and total time with an accessible label", () => {
  const html = renderToStaticMarkup(
    createElement(PlaybackProgress, {
      playback: { ...playback, isPlaying: false },
    }),
  );
  assert.match(html, /aria-label="Playback progress"/);
  assert.match(html, /aria-valuetext="1:00 \/ 3:00"/);
  assert.match(html, /aria-valuenow="33/);
});
