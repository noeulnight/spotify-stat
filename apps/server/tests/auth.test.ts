import assert from "node:assert/strict";
import test from "node:test";

import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { PrivateDataModel, UserModel } from "../src/database/Models";
import {
  ErrorTypeToHTTPCode,
  YourSpotifyError,
} from "../src/tools/errors/error";
import {
  logged,
  optionalLogged,
  isLoggedOrGuest,
  optionalLoggedOrGuest,
} from "../src/tools/middleware";

const key = "auth-test-key";
const id = new Types.ObjectId().toString();

test("invalid auth cookies are cleared across required and optional authentication", async (t) => {
  let databaseFailure = false;
  t.mock.method(PrivateDataModel, "findOne", async () => {
    if (databaseFailure) throw new Error("Database unavailable");
    return { jwtPrivateKey: key };
  });
  t.mock.method(
    UserModel,
    "findOne",
    async (filter: Record<string, unknown>) => {
      if (filter.publicToken === "valid-share") return { _id: id };
      return filter._id?.toString() === id ? { _id: id } : null;
    },
  );
  const app = express();
  app.use(cookieParser());
  for (const [path, middleware] of [
    ["/required", logged],
    ["/optional", optionalLogged],
    ["/shared", isLoggedOrGuest],
    ["/optional-shared", optionalLoggedOrGuest],
  ] as const) {
    app.get(path, middleware, (_req, res) => res.sendStatus(200));
  }
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
  await new Promise<void>((resolve) => server.on("listening", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  const request = (path: string, token?: string) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, {
      headers: token === undefined ? {} : { Cookie: `token=${token}` },
    });
  try {
    const invalidTokens = [
      "",
      "invalid-token",
      jwt.sign({ userId: id }, "wrong-key"),
      jwt.sign({ userId: id }, key, { expiresIn: -1 }),
      jwt.sign({ userId: id }, key, { notBefore: 3600 }),
      jwt.sign({}, key),
      jwt.sign({ userId: "invalid-id" }, key),
      jwt.sign({ userId: new Types.ObjectId().toString() }, key),
    ];
    for (const path of [
      "/required",
      "/optional",
      "/shared",
      "/optional-shared",
    ]) {
      const expectedStatus = path.includes("optional") ? 200 : 401;
      for (const token of invalidTokens) {
        const response = await request(path, token);
        assert.equal(response.status, expectedStatus);
        assert.match(
          response.headers.get("set-cookie") ?? "",
          /^token=;.*Path=\/;.*Expires=Thu, 01 Jan 1970/,
        );
      }
      const valid = await request(path, jwt.sign({ userId: id }, key));
      assert.equal(valid.status, 200);
      assert.equal(valid.headers.get("set-cookie"), null);
      const anonymous = await request(path);
      assert.equal(anonymous.status, expectedStatus);
      assert.equal(anonymous.headers.get("set-cookie"), null);
    }
    assert.equal((await request("/shared?token=valid-share")).status, 200);
    databaseFailure = true;
    const unavailable = await request(
      "/required",
      jwt.sign({ userId: id }, key),
    );
    assert.equal(unavailable.status, 401);
    assert.equal(unavailable.headers.get("set-cookie"), null);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("Spotify login sets the session cookie and redirects to the site root", async (t) => {
  const { GlobalPreferencesModel } = await import("../src/database/Models");
  const { spotifyProvider } = await import("../src/tools/oauth/Provider");
  const { router } = await import("../src/routes/oauth");
  const { get } = await import("../src/tools/env");
  t.mock.method(GlobalPreferencesModel, "findOne", async () => ({
    allowRegistrations: true,
  }));
  t.mock.method(PrivateDataModel, "findOne", async () => ({
    jwtPrivateKey: key,
  }));
  t.mock.method(UserModel, "findOne", async () => ({
    _id: new Types.ObjectId(id),
  }));
  t.mock.method(UserModel, "findOneAndUpdate", async () => ({}));
  t.mock.method(spotifyProvider, "exchangeCode", async () => ({
    accessToken: "test",
    expiresIn: Date.now() + 3600000,
  }));
  const httpClient = spotifyProvider.getHttpClient("test");
  t.mock.method(httpClient, "get", async () => ({
    data: { id: "spotify-user" },
  }));
  t.mock.method(spotifyProvider, "getHttpClient", () => httpClient);
  const app = express();
  app.use(cookieParser());
  app.use("/oauth", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  try {
    const address = server.address() as import("node:net").AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${address.port}/oauth/spotify/callback?code=test&state=test-state`,
      {
        redirect: "manual",
        headers: {
          Cookie: `oauth=${encodeURIComponent('j:{"state":"test-state"}')}`,
        },
      },
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      new URL("/", get("CLIENT_ENDPOINT")).href,
    );
    const destination = new URL(response.headers.get("location")!);
    assert.equal(destination.pathname, "/");
    assert.equal(destination.search, "");
    assert.equal(destination.hash, "");
    const cookies = response.headers.getSetCookie();
    const session = cookies.find((cookie) => cookie.startsWith("token="));
    assert.ok(session);
    assert.match(session, /Path=\//);
    assert.match(session, /HttpOnly/);
    const token = session.split(";")[0]!.slice("token=".length);
    assert.equal((jwt.verify(token, key) as jwt.JwtPayload).userId, id);
    assert.ok(cookies.some((cookie) => cookie.startsWith("oauth=;")));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
