import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaInfo } from "../src/entities/listening/ui/MediaInfo";
import { MediaActionsProvider } from "../src/entities/listening/ui/media-actions";
import { ArtistLink } from "../src/entities/listening/ui/ArtistLink";

test("media info links cover, title and subtitle to their entities and retains share context", () => {
  const html = renderToStaticMarkup(
    createElement(MediaInfo, {
      trackId: "song/id",
      albumId: "album/id",
      artistId: "artist/id",
      title: "Song",
      subTitle: "Artist",
      publicToken: "shared/token",
    }),
  );
  assert.match(html, /href="\/share\/shared%2Ftoken\/songs\/song%2Fid"/);
  assert.match(html, /href="\/share\/shared%2Ftoken\/albums\/album%2Fid"/);
  assert.match(html, /href="\/share\/shared%2Ftoken\/artists\/artist%2Fid"/);
  assert.equal((html.match(/<a /g) ?? []).length, 3);
  assert.equal((html.match(/data-slot="media-info"/g) ?? []).length, 1);
});

test("media info supports album, artist and noninteractive labels without nested links", () => {
  const album = renderToStaticMarkup(
    createElement(MediaInfo, { albumId: "a", title: "Album" }),
  );
  assert.match(album, /href="\/albums\/a"/);
  const artist = renderToStaticMarkup(
    createElement(MediaInfo, { artistId: "b", title: "Artist" }),
  );
  assert.match(artist, /href="\/artists\/b"/);
  const label = renderToStaticMarkup(
    createElement(MediaInfo, { title: "Title", subTitle: "Subtitle" }),
  );
  assert.doesNotMatch(label, /<a /);
  const multiple = renderToStaticMarkup(
    createElement(MediaInfo, {
      trackId: "t",
      publicToken: "shared",
      artistId: "b",
      title: "Song",
      subTitle: createElement(ArtistLink, {
        artist: { id: "b", name: "Artist" },
      }),
    }),
  );
  assert.equal((multiple.match(/<a /g) ?? []).length, 2);
});

test("shared tracks and non-track media never expose playlist actions", () => {
  const renderActions = () => {
    throw new Error("Private action rendered");
  };
  for (const props of [
    { trackId: "track", title: "Shared song", publicToken: "guest" },
    { albumId: "album", title: "Album" },
    { artistId: "artist", title: "Artist" },
  ]) {
    assert.doesNotThrow(() =>
      renderToStaticMarkup(
        createElement(
          MediaActionsProvider,
          { value: renderActions },
          createElement(MediaInfo, props),
        ),
      ),
    );
  }
});

test("compact media keeps separate truncation classes on the title and subtitle", () => {
  const html = renderToStaticMarkup(
    createElement(MediaInfo, {
      title: "A long song title",
      subTitle: "Artist",
      truncate: true,
    }),
  );
  assert.equal((html.match(/class="[^"]*\btruncate\b[^"]*"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /mediumtruncate|foregroundtruncate/);
});
