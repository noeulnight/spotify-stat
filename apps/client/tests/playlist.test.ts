import assert from "node:assert/strict";
import test from "node:test";
import type { InternalAxiosRequestConfig } from "axios";
import { createApiClient } from "../src/shared/api";
import { createPlaylistApi, playlistQuery } from "../src/entities/playlist";

function setup() {
  const client = createApiClient({ baseURL: "https://example.test/api" });
  const requests: InternalAxiosRequestConfig[] = [];
  client.http.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: [], status: 204, statusText: "OK", headers: {}, config };
  };
  return { client, requests, api: createPlaylistApi(client) };
}

const track = "4uLU6hMCjMI75M1A2tKUQC";
const otherTrack = "0VjIjW4GlUZAMYd2vXMi3b";

test("selected tracks use the specific API, preserve order and remove duplicates", async () => {
  const { api, requests } = setup();
  await api.addSongs([track, otherTrack, track], { playlistId: "existing" });
  assert.equal(requests[0].url, "/spotify/playlist/create");
  assert.equal(requests[0].method, "post");
  assert.deepEqual(JSON.parse(requests[0].data), {
    type: "specific",
    songIds: [track, otherTrack],
    playlistId: "existing",
  });
});

test("new playlist names are trimmed and empty selections/names never send a request", async () => {
  const { api, requests } = setup();
  await api.addSongs([track], { name: "  Favorites  " });
  assert.equal(JSON.parse(requests[0].data).name, "Favorites");
  await assert.rejects(api.addSongs([], { name: "Favorites" }));
  await assert.rejects(api.addSongs([track], { name: "   " }));
  await assert.rejects(api.addSongs(["invalid"], { name: "Favorites" }));
  assert.equal(requests.length, 1);
});

test("playlist listing supports cancellation and account-specific cache keys", async () => {
  const { api, requests, client } = setup();
  const controller = new AbortController();
  await api.list(controller.signal);
  assert.equal(requests[0].url, "/spotify/playlists");
  assert.equal(requests[0].signal, controller.signal);
  const other = setup();
  assert.notDeepEqual(
    playlistQuery(client).queryKey,
    playlistQuery(other.client).queryKey,
  );
});

test("Spotify write errors are propagated without an automatic retry", async () => {
  const { api, client } = setup();
  let attempts = 0;
  client.http.defaults.adapter = async () => {
    attempts++;
    throw new Error("Spotify unavailable");
  };
  await assert.rejects(
    api.addSongs([track], { playlistId: "existing" }),
    /Spotify unavailable/,
  );
  assert.equal(attempts, 1);
});
