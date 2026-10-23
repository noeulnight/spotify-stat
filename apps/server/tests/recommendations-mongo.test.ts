import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {
  PrivateDataModel,
  RecommendationModel,
  RecommendationRateModel,
  TrackModel,
  UserModel,
} from "../src/database/Models";
import type { SpotifyTrack } from "../src/database/schemas/track";
import { router as accountRouter } from "../src/routes/index";
import { router } from "../src/routes/recommendations";
import { HttpError } from "../src/tools/apis/queueHttpClient";
import { SpotifyAPI } from "../src/tools/apis/spotifyApi";
import {
  ErrorTypeToHTTPCode,
  YourSpotifyError,
} from "../src/tools/errors/error";

const uri = process.env.MONGO_TEST_URI;
test(
  "anonymous recommendations enforce recipient, owner, duplicate and rate boundaries",
  { skip: !uri },
  async (t) => {
    assert.match(
      uri!,
      /^mongodb:\/\/127\.0\.0\.1:\d+\/spotistat_recommendations_test$/,
    );
    await mongoose.connect(uri!, { autoIndex: false });
    const app = express();
    app.use(express.json(), cookieParser());
    app.use("/recommendations", router);
    app.use("/account", accountRouter);
    app.use(
      (
        error: unknown,
        _req: unknown,
        res: express.Response,
        _next: unknown,
      ) => {
        res.sendStatus(
          error instanceof YourSpotifyError
            ? ErrorTypeToHTTPCode[error.type]
            : 500,
        );
      },
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/recommendations`;
    const key = "recommendations-test-key";
    const trackId = "2FL9FCK0CKyypmE7Pf1oNa";
    const request = (
      path: string,
      method = "GET",
      body?: unknown,
      cookie?: string,
    ) =>
      fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    try {
      await RecommendationModel.createCollection();
      await RecommendationModel.collection.dropIndexes();
      await Promise.all([
        RecommendationModel.deleteMany({}),
        RecommendationRateModel.deleteMany({}),
        UserModel.deleteMany({}),
        PrivateDataModel.deleteMany({}),
        TrackModel.deleteMany({}),
      ]);
      const [owner, other] = await UserModel.create([
        {
          username: "Owner",
          spotifyId: "owner-test",
          publicToken: "owner-share",
          settings: { dateFormat: "yyyy-MM-dd" },
        },
        {
          username: "Other",
          spotifyId: "other-test",
          publicToken: "other-share",
          settings: { dateFormat: "yyyy-MM-dd" },
        },
      ]);
      assert.ok(owner && other);
      const fixtureTrack = (id: string) =>
        ({
          id,
          name: "Test song",
          artists: [{ name: "Test artist" }],
          album: { images: [{ url: "https://example.test/cover.jpg" }] },
        }) as SpotifyTrack;
      const searchMock = t.mock.method(
        SpotifyAPI.prototype,
        "searchTracks",
        async function (this: SpotifyAPI, q: string) {
          assert.equal(Reflect.get(this, "userId"), owner._id.toString());
          if (q === "upstream-limit")
            throw new HttpError({
              status: 429,
              statusText: "Limited",
              body: "private upstream error",
            });
          return [fixtureTrack(trackId), fixtureTrack("d".repeat(22))];
        },
      );
      t.mock.method(SpotifyAPI.prototype, "raw", async (path: string) => {
        const id = path.split("/").at(-1)!;
        if (id === "x".repeat(22))
          throw new HttpError({
            status: 404,
            statusText: "Not found",
            body: "",
          });
        if (id === "z".repeat(22)) throw new Error("private upstream error");
        return { data: fixtureTrack(id), status: 200, statusText: "OK" };
      });
      await PrivateDataModel.create({ jwtPrivateKey: key });
      await TrackModel.collection.insertOne({ id: trackId, name: "Test song" });
      const cookie = (id: string) => `token=${jwt.sign({ userId: id }, key)}`;
      const ownerCookie = cookie(owner._id.toString());
      const otherCookie = cookie(other._id.toString());
      const saveSettings = (body: unknown, authCookie?: string) =>
        fetch(base.replace(/\/recommendations$/, "/account/settings"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authCookie ? { Cookie: authCookie } : {}),
          },
          body: JSON.stringify(body),
        });
      assert.equal(
        (await request("/missing", "POST", { trackId }, ownerCookie)).status,
        404,
      );
      assert.equal(
        (await request(`/${"a".repeat(129)}`, "POST", { trackId })).status,
        400,
      );
      for (const body of [
        { trackId: "invalid" },
        { trackId, name: "a".repeat(41) },
        { trackId, message: "a".repeat(301) },
      ])
        assert.equal((await request("/owner-share", "POST", body)).status, 400);
      const parallel = await Promise.all([
        request("/owner-share", "POST", {
          trackId,
          name: "Private sender",
          message: "Private message",
          title: "Forged title",
        }),
        request("/owner-share", "POST", {
          trackId,
          name: "Private sender",
          message: "Private message",
          title: "Forged title",
        }),
      ]);
      assert.deepEqual(parallel.map((res) => res.status).sort(), [201, 409]);
      assert.ok(
        (await RecommendationModel.collection.indexes()).some(
          (index) => index.unique && index.key.owner && index.key.trackId,
        ),
      );
      const publicRows = (await (
        await request("/owner-share")
      ).json()) as Array<Record<string, unknown>>;
      assert.equal(publicRows.length, 1);
      assert.deepEqual(Object.keys(publicRows[0]!).sort(), [
        "artists",
        "createdAt",
        "imageUrl",
        "title",
        "trackId",
      ]);
      assert.equal(publicRows[0]?.title, "Test song");
      assert.deepEqual(publicRows[0]?.artists, ["Test artist"]);
      assert.deepEqual(await (await request("/other-share")).json(), []);
      assert.deepEqual(
        await (await request("/owner-share?offset=20")).json(),
        [],
      );
      const searched = await request(
        "/owner-share/search?q=love%20%26%20peace",
        "GET",
        undefined,
        otherCookie,
      );
      assert.equal(searched.status, 200);
      const results = (await searched.json()) as Array<Record<string, unknown>>;
      assert.equal(results[0]?.recommended, true);
      assert.equal(results[1]?.recommended, false);
      assert.equal(searchMock.mock.calls[0]?.arguments[0], "love & peace");
      assert.equal(
        (await request("/missing/search?q=love", "GET", undefined, ownerCookie))
          .status,
        404,
      );
      for (const query of ["", "q=", `q=${"a".repeat(101)}`, "q=a&q=b"])
        assert.equal(
          (await request(`/owner-share/search?${query}`)).status,
          400,
        );
      const upstreamLimit = await request(
        "/owner-share/search?q=upstream-limit",
      );
      assert.equal(upstreamLimit.status, 429);
      assert.deepEqual(await upstreamLimit.json(), { code: "SPOTIFY_LIMIT" });
      assert.equal(
        (await request("/owner-share", "POST", { trackId: "x".repeat(22) }))
          .status,
        400,
      );
      const upstreamFailure = await request("/owner-share", "POST", {
        trackId: "z".repeat(22),
      });
      assert.equal(upstreamFailure.status, 503);
      assert.deepEqual(await upstreamFailure.json(), {
        code: "SPOTIFY_UNAVAILABLE",
      });
      assert.equal(await RecommendationModel.countDocuments(), 1);
      assert.equal((await request("?token=owner-share")).status, 401);
      const row = await RecommendationModel.findOne({ owner: owner._id });
      assert.ok(row);
      assert.equal(
        (await request(`/${row._id}?token=owner-share`, "DELETE")).status,
        401,
      );
      assert.equal(
        (await request(`/${row._id}`, "DELETE", undefined, otherCookie)).status,
        404,
      );
      assert.ok(await RecommendationModel.findById(row._id));
      const inbox = await request("", "GET", undefined, ownerCookie);
      assert.equal(inbox.headers.get("cache-control"), "private, no-store");
      const rows = (await inbox.json()) as Array<Record<string, unknown>>;
      assert.equal(rows.length, 1);
      assert.equal(rows[0]?.title, "Test song");
      assert.equal(rows[0]?.owner, undefined);
      assert.equal(rows[0]?.name, "Private sender");
      assert.equal(rows[0]?.message, "Private message");
      assert.deepEqual(
        await (await request("", "GET", undefined, otherCookie)).json(),
        [],
      );
      assert.equal(
        (await saveSettings({ recommendationsEnabled: false })).status,
        401,
      );
      assert.equal(
        (await saveSettings({ recommendationsEnabled: "false" }, ownerCookie))
          .status,
        400,
      );
      assert.equal(
        (await saveSettings({ recommendationsEnabled: false }, ownerCookie))
          .status,
        200,
      );
      assert.equal(
        (await saveSettings({ nbElements: 12 }, ownerCookie)).status,
        200,
      );
      assert.equal(
        (await UserModel.findById(owner._id))?.settings.recommendationsEnabled,
        false,
      );
      const searchesBeforeDisabled = searchMock.mock.callCount();
      for (const response of [
        await request("/owner-share"),
        await request("/owner-share/search?q=disabled"),
        await request("/owner-share", "POST", { trackId: "d".repeat(22) }),
      ]) {
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          code: "RECOMMENDATIONS_DISABLED",
        });
      }
      assert.equal(searchMock.mock.callCount(), searchesBeforeDisabled);
      assert.equal(
        await RecommendationModel.countDocuments({ owner: owner._id }),
        1,
      );
      assert.equal(
        (await request("", "GET", undefined, ownerCookie)).status,
        200,
      );
      assert.equal(
        (await saveSettings({ recommendationsEnabled: true }, ownerCookie))
          .status,
        200,
      );
      assert.equal((await request("/owner-share")).status, 200);
      await UserModel.updateOne(
        { _id: owner._id },
        { $unset: { "settings.recommendationsEnabled": "" } },
      );
      assert.equal((await request("/owner-share")).status, 200);
      assert.equal(
        (await request(`/${row._id}`, "DELETE", undefined, ownerCookie)).status,
        204,
      );
      assert.equal(
        (await request("/owner-share", "POST", { trackId })).status,
        201,
      );
      await UserModel.updateOne(
        { _id: other._id },
        { $set: { publicToken: null } },
      );
      assert.equal(
        (await request("/other-share", "POST", { trackId })).status,
        404,
      );
      assert.equal((await request("/other-share")).status, 404);
      assert.equal((await request("/other-share/search?q=love")).status, 404);
      const minute = Math.floor(Date.now() / 60_000);
      await RecommendationRateModel.updateOne(
        { _id: `search:${owner._id}:${minute}` },
        { $set: { count: 59 } },
      );
      const searchLimited = await Promise.all([
        request("/owner-share/search?q=a"),
        request("/owner-share/search?q=b"),
      ]);
      assert.deepEqual(
        searchLimited.map((res) => res.status).sort(),
        [200, 429],
      );
      assert.ok(
        Number(
          searchLimited
            .find((res) => res.status === 429)
            ?.headers.get("retry-after"),
        ) > 0,
      );
      const hour = Math.floor(Date.now() / 3_600_000);
      await RecommendationRateModel.updateOne(
        { _id: `${owner._id}:${hour}` },
        { $set: { count: 29 } },
      );
      const limited = await Promise.all([
        request("/owner-share", "POST", { trackId: "a".repeat(22) }),
        request("/owner-share", "POST", { trackId: "b".repeat(22) }),
      ]);
      assert.deepEqual(limited.map((res) => res.status).sort(), [201, 429]);
      assert.ok(
        Number(
          limited.find((res) => res.status === 429)?.headers.get("retry-after"),
        ) > 0,
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await mongoose.disconnect();
    }
  },
);
