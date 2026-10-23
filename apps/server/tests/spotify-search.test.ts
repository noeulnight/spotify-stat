import assert from "node:assert/strict";
import test from "node:test";

import { UserModel } from "../src/database/Models";
import { SpotifyAPI } from "../src/tools/apis/spotifyApi";
import { spotifyProvider } from "../src/tools/oauth/Provider";

test("Spotify recommendation searches use track search with a bounded result limit", async (t) => {
  t.mock.method(UserModel, "findOne", async () => ({
    spotifyId: "listener",
    accessToken: "test-token",
    expiresIn: Date.now() + 3_600_000,
  }));
  const http = spotifyProvider.getHttpClient("test-token");
  const get = t.mock.method(http, "get", async () => ({
    data: { tracks: { items: [{ id: "new-track" }, null] } },
  }));
  t.mock.method(spotifyProvider, "getHttpClient", () => http);
  const result = await new SpotifyAPI("012345678901234567890123").searchTracks(
    "아이유 & love",
  );
  assert.deepEqual(result, [{ id: "new-track" }]);
  assert.deepEqual(get.mock.calls[0]?.arguments, [
    "/search",
    {
      params: { q: "아이유 & love", type: "track", limit: "10" },
      priority: "high",
      retry429MaxAttempts: 0,
    },
  ]);
});
