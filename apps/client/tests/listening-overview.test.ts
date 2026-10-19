import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ListeningOverview } from "../src/entities/listening/ui/ListeningOverview";

type Stats = NonNullable<Parameters<typeof ListeningOverview>[0]["stats"]>;
const render = (total: Stats["total"]) =>
  renderToStaticMarkup(createElement(ListeningOverview, { stats: { total } }));

test("listening overview displays full-history time and artist catalog counts", () => {
  const html = render({
    count: 1234,
    durationMs: 462_720_000,
    differents: 83,
    albums: 21,
  });
  assert.match(html, /1,234/);
  assert.match(html, /Listening time<\/dt><dd[^>]*>128h 32m/);
  assert.match(html, /Songs listened<\/dt><dd[^>]*>83/);
  assert.match(html, /Albums listened<\/dt><dd[^>]*>21/);
});

test("song totals show time without artist counts and old responses do not invent metrics", () => {
  const song = render({ count: 4, durationMs: 3_660_000 });
  assert.match(song, /1h 1m/);
  assert.doesNotMatch(song, /Songs listened|Albums listened/);
  const old = render({ count: 4 });
  assert.doesNotMatch(old, /Listening time|Songs listened|Albums listened/);
});

test("zero totals are valid and invalid listening durations stay hidden", () => {
  const empty = render({ count: 0, durationMs: 0, differents: 0, albums: 0 });
  assert.match(empty, /0h 0m/);
  assert.match(empty, /Songs listened<\/dt><dd[^>]*>0/);
  for (const durationMs of [-1, NaN, Infinity])
    assert.doesNotMatch(render({ count: 4, durationMs }), /Listening time/);
});
