import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SongLink } from "../src/entities/listening";

test("song detail links encode IDs and retain the shared account", () => {
  const song = { id: "song/id", name: "Song name" };
  const normal = renderToStaticMarkup(createElement(SongLink, { song }));
  assert.match(normal, /href="\/songs\/song%2Fid"/);
  assert.match(normal, />Song name<\/a>/);
  const shared = renderToStaticMarkup(
    createElement(SongLink, { song, publicToken: "shared/token" }, "Cover"),
  );
  assert.match(shared, /href="\/share\/shared%2Ftoken\/songs\/song%2Fid"/);
  assert.match(shared, />Cover<\/a>/);
});
