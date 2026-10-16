import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlbumLink } from "../src/entities/listening";

test("album detail links encode IDs and retain the shared account", () => {
  const album = { id: "album/id", name: "Album name" };
  const normal = renderToStaticMarkup(createElement(AlbumLink, { album }));
  assert.match(normal, /href="\/albums\/album%2Fid"/);
  assert.match(normal, />Album name<\/a>/);
  const shared = renderToStaticMarkup(
    createElement(AlbumLink, { album, publicToken: "shared/token" }, "Cover"),
  );
  assert.match(shared, /href="\/share\/shared%2Ftoken\/albums\/album%2Fid"/);
  assert.match(shared, />Cover<\/a>/);
});
