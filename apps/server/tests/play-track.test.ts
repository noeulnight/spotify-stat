import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import {
  PrivateDataModel,
  TrackModel,
  UserModel,
} from "../src/database/Models";
import { router } from "../src/routes/spotify";
import { HttpError } from "../src/tools/apis/queueHttpClient";
import { SpotifyAPI } from "../src/tools/apis/spotifyApi";
import {
  ErrorTypeToHTTPCode,
  YourSpotifyError,
} from "../src/tools/errors/error";
import { spotifyProvider } from "../src/tools/oauth/Provider";

test("track playback accepts uncatalogued IDs for the signed-in listener only", async (t) => {
  const listener = new Types.ObjectId();
  const owner = new Types.ObjectId();
  const key = "play-track-test-key";
  const id = "2FL9FCK0CKyypmE7Pf1oNa";
  let upstreamStatus: number | undefined;
  t.mock.method(PrivateDataModel, "findOne", async () => ({
    jwtPrivateKey: key,
  }));
  t.mock.method(UserModel, "findOne", async (filter: Record<string, unknown>) =>
    filter._id?.toString() === listener.toString()
      ? { _id: listener }
      : { _id: owner },
  );
  t.mock.method(TrackModel, "findOne", () => {
    throw new Error("Playback must not look up the catalog");
  });
  const play = t.mock.method(
    SpotifyAPI.prototype,
    "playTrack",
    async function (this: SpotifyAPI, uri: string) {
      assert.equal(Reflect.get(this, "userId"), listener.toString());
      assert.equal(uri, `spotify:track:${id}`);
      if (upstreamStatus)
        throw new HttpError({
          status: upstreamStatus,
          statusText: "Rejected",
          body: "private upstream error",
        });
    },
  );
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/spotify", router);
  app.use(
    (error: unknown, _req: unknown, res: express.Response, _next: unknown) => {
      res.sendStatus(
        error instanceof YourSpotifyError
          ? ErrorTypeToHTTPCode[error.type]
          : 500,
      );
    },
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/spotify/play?token=owner-share`;
  const request = (trackId: unknown, authenticated = true) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authenticated
          ? {
              Cookie: `token=${jwt.sign({ userId: listener.toString() }, key)}`,
            }
          : {}),
      },
      body: JSON.stringify({ id: trackId }),
    });
  try {
    assert.equal((await request(id, false)).status, 401);
    for (const invalid of [
      "",
      "short",
      `spotify:track:${id}`,
      `https://open.spotify.com/track/${id}`,
      "/".repeat(22),
      null,
    ])
      assert.equal((await request(invalid)).status, 400);
    assert.equal(play.mock.callCount(), 0);
    assert.equal((await request(id)).status, 200);
    for (const status of [404, 403, 429]) {
      upstreamStatus = status;
      const response = await request(id);
      assert.equal(response.status, status);
      assert.deepEqual(
        await response.json(),
        status === 404
          ? { code: "SPOTIFY_ERROR", reason: "NO_ACTIVE_DEVICE" }
          : { code: "SPOTIFY_ERROR" },
      );
    }
    assert.equal(play.mock.callCount(), 4);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("track playback sends one Spotify URI with interactive request options", async (t) => {
  t.mock.method(UserModel, "findOne", async () => ({
    spotifyId: "test-listener",
    accessToken: "test-token",
    expiresIn: Date.now() + 3_600_000,
  }));
  const http = spotifyProvider.getHttpClient("test-token");
  const put = t.mock.method(http, "put", async () => ({ status: 204 }));
  t.mock.method(spotifyProvider, "getHttpClient", () => http);
  await new SpotifyAPI("012345678901234567890123").playTrack(
    "spotify:track:2FL9FCK0CKyypmE7Pf1oNa",
  );
  assert.deepEqual(put.mock.calls[0]?.arguments, [
    "/me/player/play",
    {
      data: { uris: ["spotify:track:2FL9FCK0CKyypmE7Pf1oNa"] },
      priority: "high",
      retry429MaxAttempts: 0,
      responseType: "none",
    },
  ]);
  assert.equal(put.mock.callCount(), 1);
});
