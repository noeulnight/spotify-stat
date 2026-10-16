import assert from "node:assert/strict";
import test from "node:test";
import {
  AxiosError,
  CanceledError,
  type InternalAxiosRequestConfig,
} from "axios";
import { QueryClient, InfiniteQueryObserver } from "@tanstack/react-query";
import { createApiClient } from "../src/shared/api";
import {
  createListeningApi,
  createListeningQueries,
  Timesplit,
  CollaborativeMode,
} from "../src/entities/listening";
import {
  createAccountApi,
  createAccountQueries,
} from "../src/entities/account";
import { createImportHistoryQueries } from "../src/features/import-history";

function setup(publicToken?: string) {
  const client = createApiClient({
    baseURL: "https://example.test/api",
    publicToken,
  });
  const requests: InternalAxiosRequestConfig[] = [];
  let data: unknown = [];
  client.http.defaults.adapter = async (config) => {
    requests.push(config);
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  return {
    client,
    requests,
    respond: (value: unknown) => {
      data = value;
    },
  };
}
const start = new Date("2026-10-01T00:00:00Z");
const end = new Date("2026-10-16T00:00:00Z");

test("API client validates the destination and keeps cookie/public-token configuration", async () => {
  assert.throws(() => createApiClient({ baseURL: "file:///tmp/server" }));
  assert.throws(() =>
    createApiClient({ baseURL: "https://user:secret@example.test" }),
  );
  const { client, requests, respond } = setup("public-secret");
  respond({ status: false });
  assert.deepEqual(await createAccountApi(client).me(), { status: false });
  assert.equal(requests[0]?.withCredentials, true);
  assert.equal(requests[0]?.params.token, "public-secret");
});

test("statistics and collaborative requests preserve the backend parameter contract", async () => {
  const { client, requests } = setup("public-secret");
  const api = createListeningApi(client);
  await api.songsPer(start, end, Timesplit.day);
  assert.equal(requests[0]?.url, "/spotify/songs_per");
  assert.deepEqual(requests[0]?.params, {
    token: "public-secret",
    start,
    end,
    timeSplit: "day",
  });
  await api.collaborativeBestSongs(
    ["user-a", "user-b"],
    start,
    end,
    CollaborativeMode.MINIMA,
  );
  assert.deepEqual(requests[1]?.params.otherIds, ["user-a", "user-b"]);
  assert.equal(requests[1]?.params.mode, "minima");
  await api.search("AC/DC ?");
  assert.equal(requests[2]?.url, "/search/AC%2FDC%20%3F");
});

test("query keys separate access contexts, dates, units and finite/infinite results without exposing tokens", () => {
  const a = createListeningQueries(setup("secret-a").client);
  const b = createListeningQueries(setup("secret-b").client);
  assert.notDeepEqual(
    a.getTracks(start, end, 20, 0).queryKey,
    b.getTracks(start, end, 20, 0).queryKey,
  );
  assert.notDeepEqual(
    a.songsPer(start, end, Timesplit.day).queryKey,
    a.songsPer(start, end, Timesplit.month).queryKey,
  );
  assert.notDeepEqual(
    a.getTracks(start, end, 20, 0).queryKey,
    a.getTracksInfinite(start, end).queryKey,
  );
  assert.notDeepEqual(
    a.timePer(start, end, Timesplit.day).queryKey,
    a.timePer(end, end, Timesplit.day).queryKey,
  );
  assert.ok(
    !JSON.stringify(a.currentlyPlaying().queryKey).includes("secret-a"),
  );
  assert.equal(a.search("ab").enabled, false);
  assert.equal(a.search("abc").enabled, true);
});

test("infinite queries request the next offset and stop after a short page", async () => {
  const { client, requests, respond } = setup();
  const queries = createListeningQueries(client);
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  try {
    const options = queries.getTracksInfinite(start, end, 2);
    const observer = new InfiniteQueryObserver(cache, options);
    respond([{}, {}]);
    await observer.refetch();
    assert.equal(requests.at(-1)?.params.offset, 0);
    assert.equal(observer.getCurrentResult().hasNextPage, true);
    respond([{}]);
    await observer.fetchNextPage();
    assert.equal(requests.at(-1)?.params.offset, 2);
    assert.equal(observer.getCurrentResult().hasNextPage, false);
    assert.equal(observer.getCurrentResult().data?.pages.length, 2);
    observer.destroy();
    for (const name of [
      "getBestSongsInfinite",
      "getBestArtistsInfinite",
      "getBestAlbumsInfinite",
    ] as const) {
      const config = queries[name](start, end, 2);
      assert.equal(config.getNextPageParam!([], [], 0, []), undefined);
    }
    assert.throws(() => queries.getTracksInfinite(start, end, 0));
  } finally {
    cache.clear();
  }
});

test("query functions return response data and preserve NEVER_LISTENED and HTTP errors", async () => {
  const { client, respond } = setup();
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  try {
    respond({ code: "NEVER_LISTENED" });
    assert.deepEqual(
      await cache.fetchQuery(
        createListeningQueries(client).getTrackStats("track"),
      ),
      { code: "NEVER_LISTENED" },
    );
    respond({ status: false });
    assert.deepEqual(
      await cache.fetchQuery(createAccountQueries(client).me()),
      { status: false },
    );
    respond([]);
    assert.deepEqual(
      await cache.fetchQuery(createImportHistoryQueries(client).getImports()),
      [],
    );
    client.http.defaults.adapter = async () => {
      throw new AxiosError("Forbidden", "ERR_BAD_REQUEST");
    };
    await assert.rejects(
      cache.fetchQuery(createListeningQueries(client).getArtistStats("artist")),
      AxiosError,
    );
  } finally {
    cache.clear();
  }
});

test("query cancellation reaches Axios", async () => {
  const { client } = setup();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    createListeningApi(client, controller.signal).currentlyPlaying(),
    CanceledError,
  );
});

test("same-origin proxy paths remain relative and retain access context", async () => {
  const client = createApiClient({
    baseURL: "/api",
    publicToken: "public-secret",
  });
  assert.equal(client.http.defaults.baseURL, "/api");
  assert.equal(client.http.defaults.params.token, "public-secret");
  assert.throws(() => createApiClient({ baseURL: "//example.test/api" }));
  assert.throws(() => createApiClient({ baseURL: "/api?token=secret" }));
});

test("logout posts through the configured client and propagates failures", async () => {
  const { logout } = await import("../src/features/logout");
  const { client, requests } = setup();
  await logout(client);
  assert.equal(requests[0]?.method, "post");
  assert.equal(requests[0]?.url, "/logout");
  assert.equal(requests[0]?.withCredentials, true);
  client.http.defaults.adapter = async () => {
    throw new AxiosError("Network failure");
  };
  await assert.rejects(logout(client), AxiosError);
});

test("shared account lookup rejects cookie fallback and accepts only the requested public token", async () => {
  const { client, respond } = setup("requested-share");
  const api = createAccountApi(client);
  respond({
    status: true,
    user: { username: "Cookie account", publicToken: "other-share" },
  });
  assert.deepEqual(await api.me(), { status: false });
  respond({
    status: true,
    user: { username: "Shared account", publicToken: "requested-share" },
  });
  const account = await api.me();
  assert.equal(account.status, true);
  if (account.status) assert.equal(account.user.username, "Shared account");
});

test("longest sessions preserve dates, limit and shared account context", async () => {
  const { client, requests, respond } = setup("session-share");
  const sessions = [
    { sessionLength: 3_600_000, distanceToLast: { distance: [] } },
  ];
  respond(sessions);
  const query = createListeningQueries(client).getLongestSessions(start, end);
  assert.deepEqual(await new QueryClient().fetchQuery(query), sessions);
  assert.equal(requests[0]?.url, "/spotify/top/sessions");
  assert.deepEqual(requests[0]?.params, {
    token: "session-share",
    start,
    end,
    nb: 30,
  });
  assert.notDeepEqual(
    query.queryKey,
    createListeningQueries(client).getLongestSessions(new Date(0), end)
      .queryKey,
  );
});

test("track playback posts the track id and propagates Spotify errors", async () => {
  const { client, requests } = setup();
  await createListeningApi(client).playTrack("track/id");
  assert.equal(requests[0]?.method, "post");
  assert.equal(requests[0]?.url, "/spotify/play");
  assert.deepEqual(JSON.parse(String(requests[0]?.data)), { id: "track/id" });
  const failure = new AxiosError("No active device");
  client.http.defaults.adapter = async () => {
    throw failure;
  };
  await assert.rejects(
    createListeningApi(client).playTrack("track/id"),
    (error) => error === failure,
  );
});

test("playback controls use validated action routes and propagate failures", async () => {
  const { client, requests } = setup();
  const controller = new AbortController();
  for (const action of ["resume", "pause", "next", "previous"] as const) {
    await createListeningApi(client, controller.signal).controlPlayback(action);
  }
  assert.deepEqual(
    requests.map((request) => request.url),
    [
      "/spotify/playback/resume",
      "/spotify/playback/pause",
      "/spotify/playback/next",
      "/spotify/playback/previous",
    ],
  );
  assert.ok(
    requests.every(
      (request) =>
        request.method === "post" &&
        request.data === undefined &&
        request.signal === controller.signal,
    ),
  );
  const failure = new AxiosError("No active device");
  client.http.defaults.adapter = async () => {
    throw failure;
  };
  await assert.rejects(
    createListeningApi(client).controlPlayback("next"),
    (error) => error === failure,
  );
});

test("lyrics lookup preserves encoded track id, shared access and cancellation", async () => {
  const { client, requests, respond } = setup("shared");
  respond({
    id: 123,
    instrumental: false,
    plainLyrics: "Hello",
    syncedLyrics: "[00:00.00]Hello",
  });
  const query = createListeningQueries(client).getLyrics("track/id");
  const cache = new QueryClient();
  assert.equal((await cache.fetchQuery(query))?.id, 123);
  assert.equal(requests[0]?.url, "/lyrics/track%2Fid");
  assert.equal(requests[0]?.params.token, "shared");
  assert.ok(requests[0]?.signal);
  respond(null);
  assert.equal(await createListeningApi(client).getLyrics("missing"), null);
  cache.clear();
});

test("lyrics automatically recover from transient failures despite global retries being disabled", async () => {
  const { client } = setup();
  let calls = 0;
  client.http.defaults.adapter = async (config) => {
    calls++;
    if (calls < 3) {
      throw new AxiosError(
        "Temporary outage",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        {
          config,
          data: null,
          status: 503,
          statusText: "Unavailable",
          headers: { "retry-after": "1" },
        },
      );
    }
    return { config, data: null, status: 200, statusText: "OK", headers: {} };
  };
  const queries = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  try {
    assert.equal(
      await queries.fetchQuery({
        ...createListeningQueries(client).getLyrics("track"),
        retryDelay: 0,
      }),
      null,
    );
    assert.equal(calls, 3);
  } finally {
    queries.clear();
  }
});

test("lyrics retries are bounded, respect Retry-After and exclude permanent or cancelled failures", () => {
  const { client } = setup();
  const { retry, retryDelay } =
    createListeningQueries(client).getLyrics("track");
  assert.equal(typeof retry, "function");
  assert.equal(typeof retryDelay, "function");
  if (typeof retry !== "function" || typeof retryDelay !== "function")
    throw new Error("Expected retry policies");
  const errorFor = (status: number, header: string = "3") =>
    new AxiosError("Failed", "ERR_BAD_RESPONSE", undefined, undefined, {
      config: {} as InternalAxiosRequestConfig,
      data: null,
      status,
      statusText: "Error",
      headers: { "retry-after": header },
    });
  for (const status of [429, 502, 503, 504]) {
    assert.equal(retry(0, errorFor(status)), true);
    assert.equal(retry(2, errorFor(status)), false);
  }
  for (const status of [400, 401, 403, 404])
    assert.equal(retry(0, errorFor(status)), false);
  assert.equal(retry(0, new CanceledError()), false);
  assert.equal(retry(0, new AxiosError("Network", "ERR_NETWORK")), true);
  assert.equal(retryDelay(0, errorFor(503)), 3000);
  assert.ok(
    retryDelay(0, errorFor(503, new Date(Date.now() + 60000).toUTCString())) >
      58000,
  );
  assert.equal(retryDelay(0, errorFor(503, "invalid")), 1000);
});
