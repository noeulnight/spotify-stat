import assert from "node:assert/strict";
import test from "node:test";
import {
  createShareLink,
  isShareablePage,
} from "../src/features/account-settings/model/share-link";

test("share links preserve the current page, period and anchor", () => {
  assert.equal(
    createShareLink(
      "https://example.test/top/songs?start=2026-10-01&end=2026-10-16#list",
      "public-token",
    ),
    "https://example.test/share/public-token/top/songs?start=2026-10-01&end=2026-10-16#list",
  );
  assert.equal(
    createShareLink("https://example.test/songs/track-id", "public-token"),
    "https://example.test/share/public-token/songs/track-id",
  );
  assert.equal(
    createShareLink("https://example.test/", "public-token"),
    "https://example.test/share/public-token",
  );
});

test("shared pages keep one share prefix and use the supplied public token", () => {
  assert.equal(
    createShareLink(
      "https://example.test/share/public-token/stats?period=month",
      "public-token",
    ),
    "https://example.test/share/public-token/stats?period=month",
  );
  assert.equal(
    createShareLink("https://example.test/share/old-token", "new-token"),
    "https://example.test/share/new-token",
  );
  assert.equal(
    createShareLink("https://example.test/albums/album-id", "token/value"),
    "https://example.test/share/token%2Fvalue/albums/album-id",
  );
});

test("sharing requires a token and a supported public page", () => {
  for (const path of [
    "/settings",
    "/now-playing",
    "/registrations-disabled",
    "/share/token/settings",
  ]) {
    assert.equal(isShareablePage(path), false);
    assert.equal(createShareLink(`https://example.test${path}`, "token"), null);
  }
  assert.equal(createShareLink("https://example.test/stats", ""), null);
});
