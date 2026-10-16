import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ArtistLink } from "../src/entities/listening";

test("artist links encode IDs and preserve public sharing context", () => {
  const artist = { id: "artist/id", name: "Artist name" };
  const normal = renderToStaticMarkup(createElement(ArtistLink, { artist }));
  assert.match(normal, /href="\/artists\/artist%2Fid"/);
  assert.match(normal, />Artist name<\/a>/);
  const shared = renderToStaticMarkup(
    createElement(
      ArtistLink,
      { artist, publicToken: "shared/token" },
      "Profile",
    ),
  );
  assert.match(shared, /href="\/share\/shared%2Ftoken\/artists\/artist%2Fid"/);
  assert.match(shared, />Profile<\/a>/);
});
