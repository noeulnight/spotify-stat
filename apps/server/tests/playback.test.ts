import assert from "node:assert/strict";
import test from "node:test";

import { controlPlayback, playbackActions } from "../src/tools/apis/playback";
import { HttpError, QueuedHttpClient } from "../src/tools/apis/queueHttpClient";

test("playback commands use Spotify methods, no track payload and no repeated skips", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method?: string; body?: BodyInit | null }[] =
    [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), method: init?.method, body: init?.body });
    return new Response(null, { status: 204 });
  };
  try {
    const client = new QueuedHttpClient("https://api.spotify.com/v1", {});
    for (const action of playbackActions) await controlPlayback(client, action);
    assert.deepEqual(requests, [
      {
        url: "https://api.spotify.com/v1/me/player/play",
        method: "put",
        body: undefined,
      },
      {
        url: "https://api.spotify.com/v1/me/player/pause",
        method: "put",
        body: undefined,
      },
      {
        url: "https://api.spotify.com/v1/me/player/next",
        method: "post",
        body: undefined,
      },
      {
        url: "https://api.spotify.com/v1/me/player/previous",
        method: "post",
        body: undefined,
      },
    ]);
    for (const body of ["", "playback-command-accepted"]) {
      globalThis.fetch = async () => new Response(body, { status: 200 });
      for (const action of playbackActions) {
        const response = await controlPlayback(client, action);
        assert.equal(response.status, 200);
        assert.equal(response.data, undefined);
      }
    }
    globalThis.fetch = async () => Response.json({ is_playing: true });
    const current = await client.get("/me/player/currently-playing");
    assert.deepEqual(current.data, { is_playing: true });
    let failures = 0;
    globalThis.fetch = async () => {
      failures++;
      return Response.json(
        { error: { reason: "RATE_LIMITED" } },
        { status: 429 },
      );
    };
    await assert.rejects(
      controlPlayback(client, "next"),
      (error) => error instanceof HttpError && error.status === 429,
    );
    assert.equal(failures, 1);
    globalThis.fetch = async () =>
      Response.json({ error: { reason: "NO_ACTIVE_DEVICE" } }, { status: 404 });
    await assert.rejects(
      controlPlayback(client, "pause"),
      (error) => error instanceof HttpError && error.status === 404,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
