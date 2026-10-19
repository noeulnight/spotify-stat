import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LyricsText } from "../src/features/view-lyrics/ui/LyricsText";

const lyrics = {
  id: 1,
  instrumental: false,
  plainLyrics: "First\nCurrent\nLast",
  syncedLyrics: "[00:00.00]First\n[00:05.00]Current\n[00:10.00]Last",
};
const playback = {
  isPlaying: false,
  progressMs: 6000,
  fetchedAt: 1000,
  track: { id: "song", name: "Song", uri: "", durationMs: 15000 },
  album: { id: "album", name: "Album", imageUrl: null },
  artists: [],
};

test("panel, preview, full and floating lyrics keep the same rows and active line", () => {
  const render = (mode: "panel" | "preview" | "full" | "floating") =>
    renderToStaticMarkup(
      createElement(LyricsText, { lyrics, trackId: "song", playback, mode }),
    );
  const full = render("full");
  const preview = render("preview");
  const panel = render("panel");
  const floating = render("floating");
  assert.equal(
    floating.slice(floating.indexOf('<span role="list"')),
    full.slice(full.indexOf('<span role="list"')),
  );
  assert.equal(
    panel.slice(panel.indexOf('<span role="list"')),
    full.slice(full.indexOf('<span role="list"')),
  );
  assert.equal(
    full.slice(full.indexOf('<span role="list"')),
    preview.slice(preview.indexOf('<span role="list"')),
  );
  const rows = [
    ...full.matchAll(/<span role="listitem"[\s\S]*?<\/span><\/span>/g),
  ].map(([row]) => row);
  assert.equal(rows.length, 3);
  assert.match(
    rows[1]!,
    /data-state="active" class="lyrics-text__line font-bold"/,
  );
  assert.match(rows[1]!, /--lyrics-progress:20%/);
  assert.match(
    rows[0]!,
    /data-state="sung" class="lyrics-text__line font-normal"/,
  );
  assert.match(
    rows[2]!,
    /data-state="upcoming" class="lyrics-text__line font-normal"/,
  );
  assert.doesNotMatch(full, /--lyrics-blur/);
  assert.match(full, /tabindex="0"/);
  assert.match(preview, /tabindex="0"/);
});

test("lyrics do not highlight a different song and support untimed text", () => {
  const other = renderToStaticMarkup(
    createElement(LyricsText, { lyrics, trackId: "other", playback }),
  );
  assert.doesNotMatch(other, /aria-current=/);
  assert.doesNotMatch(other, /data-synced="true"|--lyrics-progress/);
  assert.doesNotMatch(other, /--lyrics-blur/);
  const plain = renderToStaticMarkup(
    createElement(LyricsText, {
      lyrics: { ...lyrics, syncedLyrics: null },
      trackId: "song",
      playback,
    }),
  );
  assert.match(plain, /First\nCurrent\nLast/);
  assert.doesNotMatch(plain, /aria-current=/);
});

test("lyrics before the first timestamp remain upcoming without a highlight", () => {
  const waiting = renderToStaticMarkup(
    createElement(LyricsText, {
      lyrics: { ...lyrics, syncedLyrics: "[00:05.00]First\n[00:10.00]Next" },
      trackId: "song",
      playback: { ...playback, progressMs: 0 },
    }),
  );
  assert.equal([...waiting.matchAll(/data-state="upcoming"/g)].length, 2);
  assert.doesNotMatch(waiting, /aria-current=|--lyrics-progress|font-bold/);
});
