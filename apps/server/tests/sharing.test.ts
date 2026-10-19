import assert from "node:assert/strict";
import test from "node:test";

import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { PrivateDataModel, UserModel } from "../src/database/Models";
import { router } from "../src/routes";
import {
  ErrorTypeToHTTPCode,
  YourSpotifyError,
} from "../src/tools/errors/error";

test("sharing keys validate, reject duplicates and handle a race at the unique index", async (t) => {
  const id = new Types.ObjectId();
  const other = new Types.ObjectId();
  let stored = "old-key";
  let writes = 0;
  t.mock.method(PrivateDataModel, "findOne", async () => ({
    jwtPrivateKey: "sharing-test",
  }));
  t.mock.method(
    UserModel,
    "findOne",
    async (filter: Record<string, unknown>) => {
      if (filter._id) return { _id: id };
      if (filter.publicToken === "taken-key") return { _id: other };
      if (filter.publicToken === stored) return { _id: id };
      return null;
    },
  );
  t.mock.method(
    UserModel.collection,
    "createIndex",
    async (
      keys: Record<string, number>,
      options: { unique: boolean; partialFilterExpression: unknown },
    ) => {
      assert.deepEqual(keys, { publicToken: 1 });
      assert.equal(options.unique, true);
      assert.deepEqual(options.partialFilterExpression, {
        publicToken: { $type: "string" },
      });
      return "publicToken_unique";
    },
  );
  t.mock.method(
    UserModel,
    "findByIdAndUpdate",
    async (_id: string, update: { publicToken: string }) => {
      if (update.publicToken === "race-key")
        throw Object.assign(new Error("Duplicate"), { code: 11000 });
      stored = update.publicToken;
      writes++;
      return {};
    },
  );
  const app = express();
  app.use(express.json(), cookieParser(), router);
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
  const port = (server.address() as import("node:net").AddressInfo).port;
  const cookie = `token=${jwt.sign({ userId: id.toString() }, "sharing-test")}`;
  const request = (path: string, key?: string, auth = true) =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      method: key === undefined ? "GET" : "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Cookie: cookie } : {}),
      },
      body: key === undefined ? undefined : JSON.stringify({ key }),
    });
  try {
    assert.equal(
      (await request("/public-token", "new-key", false)).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/public-token/availability?key=new-key",
          undefined,
          false,
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/public-token/availability?key=new-key&token=guest",
          undefined,
          false,
        )
      ).status,
      401,
    );
    assert.deepEqual(
      await (await request("/public-token/availability?key=taken-key")).json(),
      { key: "taken-key", available: false },
    );
    assert.deepEqual(
      await (await request("/public-token/availability?key=old-key")).json(),
      { key: "old-key", available: true },
    );
    assert.deepEqual(
      await (await request("/public-token/availability?key=new-key")).json(),
      { key: "new-key", available: true },
    );
    for (const invalid of ["", "ab", "a/b", "space key", "a".repeat(65)])
      assert.equal((await request("/public-token", invalid)).status, 400);
    assert.equal((await request("/public-token", "taken-key")).status, 409);
    assert.equal((await request("/public-token", "race-key")).status, 409);
    assert.equal(stored, "old-key");
    assert.equal(writes, 0);
    const saved = await request("/public-token", "new-key");
    assert.equal(saved.status, 200);
    assert.equal(await saved.text(), "new-key");
    assert.equal(stored, "new-key");
    assert.deepEqual(
      await (await request("/public-token/availability?key=old-key")).json(),
      { key: "old-key", available: true },
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
