import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../src/shared/api";
import { spotifyTrackId } from "../src/features/song-recommendations/model/spotify-track-id";
import { createRecommendationQueries } from "../src/features/song-recommendations/api/queries";
import { createRecommendationsApi } from "../src/features/song-recommendations/api/recommendations";

const id = "2FL9FCK0CKyypmE7Pf1oNa";
test("Spotify track links accept only track URLs and URIs", () => {
  for (const value of [
    `spotify:track:${id}`,
    `https://open.spotify.com/track/${id}?si=example`,
    ` https://open.spotify.com/intl-ko/track/${id}/ `,
  ])
    assert.equal(spotifyTrackId(value), id);
  for (const value of [
    id,
    "love",
    `http://open.spotify.com/track/${id}`,
    `https://open.spotify.com.evil.test/track/${id}`,
    `https://user@open.spotify.com/track/${id}`,
    `https://open.spotify.com/album/${id}`,
    `spotify:track:${id}extra`,
    `https://open.spotify.com/track/${id}/extra`,
  ])
    assert.equal(spotifyTrackId(value), null);
});

test("public recommendations select a recipient but cannot read or delete an inbox", async () => {
  const client = createApiClient({
    baseURL: "https://example.test/api",
    publicToken: "share/key",
  });
  let requests = 0;
  client.http.defaults.adapter = async (config) => {
    requests++;
    assert.equal(config.url, "/recommendations/share%2Fkey");
    assert.equal(config.method, "post");
    assert.deepEqual(JSON.parse(config.data), {
      trackId: id,
      name: "",
      message: "",
    });
    return {
      config,
      data: { status: true },
      status: 201,
      statusText: "Created",
      headers: {},
    };
  };
  const api = createRecommendationsApi(client);
  await api.send({ trackId: id, name: "", message: "" });
  await assert.rejects(api.list(0), /Log in/);
  await assert.rejects(api.remove("id"), /Log in/);
  assert.equal(requests, 1);
  const privateApi = createRecommendationsApi(
    createApiClient({ baseURL: "https://example.test/api" }),
  );
  await assert.rejects(
    privateApi.send({ trackId: id, name: "", message: "" }),
    /share link/,
  );
});

test("Spotify search and the public song list preserve recipient, query and cancellation", async () => {
  const client = createApiClient({
    baseURL: "https://example.test/api",
    publicToken: "share/key",
  });
  const requests: Array<{
    url?: string;
    params?: Record<string, unknown>;
    signal?: unknown;
  }> = [];
  client.http.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: [], status: 200, statusText: "OK", headers: {} };
  };
  const api = createRecommendationsApi(client);
  const controller = new AbortController();
  await api.search("아이유 & love", controller.signal);
  await api.publicList(20, controller.signal);
  assert.equal(requests[0]?.url, "/recommendations/share%2Fkey/search");
  assert.equal(requests[0]?.params?.q, "아이유 & love");
  assert.equal(requests[0]?.signal, controller.signal);
  assert.equal(requests[1]?.url, "/recommendations/share%2Fkey");
  assert.equal(requests[1]?.params?.offset, 20);
  const queries = createRecommendationQueries(client);
  assert.notDeepEqual(
    queries.publicList(0).queryKey,
    queries.inbox(0).queryKey,
  );
  assert.notDeepEqual(
    queries.publicList(0).queryKey,
    queries.publicList(20).queryKey,
  );
  assert.notDeepEqual(
    queries.search("a").queryKey,
    queries.search("b").queryKey,
  );
  const other = createRecommendationQueries(
    createApiClient({
      baseURL: "https://example.test/api",
      publicToken: "other",
    }),
  );
  assert.notDeepEqual(
    queries.publicList(0).queryKey,
    other.publicList(0).queryKey,
  );
});
