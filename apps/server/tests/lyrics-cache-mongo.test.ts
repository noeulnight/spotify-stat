import assert from "node:assert/strict";
import test from "node:test";

import { createLyricsCache } from "../src/tools/apis/lyricsCache";

const uri = process.env.MONGO_TEST_URI;
test(
  "MongoDB persists lyrics, expires negative results and clears both cache layers",
  { skip: !uri },
  async () => {
    assert.match(
      uri!,
      /^mongodb:\/\/127\.0\.0\.1:\d+\/spotistat_lyrics_cache_test$/,
    );
    const mongoose = await import("mongoose");
    const { lyricsCacheStore } = await import("../src/database/queries/lyrics");
    const { LyricsCacheModel, UserModel, PrivateDataModel } =
      await import("../src/database/Models");
    await mongoose.connect(uri!);
    try {
      await Promise.all([
        LyricsCacheModel.deleteMany({}),
        UserModel.deleteMany({}),
        PrivateDataModel.deleteMany({}),
      ]);
      await LyricsCacheModel.init();
      const data = {
        id: 42,
        instrumental: false,
        plainLyrics: "Hello",
        syncedLyrics: null,
      };
      const lookup = Object.assign(async () => data, { clear() {} });
      const signature = {
        trackName: "Test",
        artistName: "Artist",
        albumName: "Album",
        durationMs: 1000,
      };
      const cache = createLyricsCache(lyricsCacheStore, lookup);
      await cache.get("test-track", async () => signature);
      assert.deepEqual(await lyricsCacheStore.get("test-track"), data);
      const reloaded = createLyricsCache(
        lyricsCacheStore,
        Object.assign(
          async () => {
            throw new Error("Upstream unavailable");
          },
          { clear() {} },
        ),
      );
      assert.deepEqual(
        await reloaded.get("test-track", async () => {
          throw new Error("Playback unavailable");
        }),
        data,
      );
      await lyricsCacheStore.set("missing-track", null);
      assert.equal(await lyricsCacheStore.get("missing-track"), null);
      const missing = await LyricsCacheModel.findOne({
        trackId: "missing-track",
      }).lean();
      assert.ok(missing?.expiresAt && missing.expiresAt.getTime() > Date.now());
      await LyricsCacheModel.updateOne(
        { trackId: "missing-track" },
        { $set: { expiresAt: new Date(0) } },
      );
      assert.equal(await lyricsCacheStore.get("missing-track"), undefined);
      await reloaded.clear();
      assert.equal(await LyricsCacheModel.countDocuments(), 0);
      assert.equal(await lyricsCacheStore.get("test-track"), undefined);
      const { default: express } = await import("express");
      const { default: cookieParser } = await import("cookie-parser");
      const { default: jwt } = await import("jsonwebtoken");
      const { router } = await import("../src/routes/lyrics");
      const { YourSpotifyError, ErrorTypeToHTTPCode } =
        await import("../src/tools/errors/error");
      const key = "lyrics-cache-test-key";
      await PrivateDataModel.create({ jwtPrivateKey: key });
      const [admin, regular] = await UserModel.create([
        {
          username: "Admin",
          spotifyId: "test-admin",
          admin: true,
          publicToken: "shared-admin",
          settings: { dateFormat: "default" },
        },
        {
          username: "User",
          spotifyId: "test-user",
          admin: false,
          settings: { dateFormat: "default" },
        },
      ]);
      assert.ok(admin && regular);
      const app = express();
      app.use(cookieParser());
      app.use("/lyrics", router);
      app.use(
        (
          error: unknown,
          _req: unknown,
          res: import("express").Response,
          _next: unknown,
        ) => {
          res
            .status(
              error instanceof YourSpotifyError
                ? ErrorTypeToHTTPCode[error.type]
                : 500,
            )
            .end();
        },
      );
      const server = await new Promise<import("node:http").Server>(
        (resolve) => {
          const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
        },
      );
      try {
        const address = server.address() as import("node:net").AddressInfo;
        const url = `http://127.0.0.1:${address.port}/lyrics/cache`;
        await lyricsCacheStore.set("protected-track", data);
        assert.equal((await fetch(url, { method: "DELETE" })).status, 401);
        assert.equal(
          (await fetch(url + "?token=shared-admin", { method: "DELETE" }))
            .status,
          401,
        );
        const regularToken = jwt.sign({ userId: regular._id.toString() }, key);
        assert.equal(
          (
            await fetch(url, {
              method: "DELETE",
              headers: { Cookie: `token=${regularToken}` },
            })
          ).status,
          403,
        );
        assert.equal(await LyricsCacheModel.countDocuments(), 1);
        const adminToken = jwt.sign({ userId: admin._id.toString() }, key);
        assert.equal(
          (
            await fetch(url, {
              method: "DELETE",
              headers: { Cookie: `token=${adminToken}` },
            })
          ).status,
          204,
        );
        assert.equal(await LyricsCacheModel.countDocuments(), 0);
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    } finally {
      await mongoose.disconnect();
    }
  },
);
