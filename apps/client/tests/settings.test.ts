import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../src/shared/api";
import {
  createSettingsApi,
  type Settings,
} from "../src/features/account-settings/api/settings";
import {
  validateSettings,
  validateShareKey,
} from "../src/features/account-settings/model/validation";
import { createAccountDateFormat } from "../src/entities/account/model/date-format";

const settings: Settings = {
  historyLine: false,
  preferredStatsPeriod: "month",
  nbElements: 10,
  metricUsed: "duration",
  darkMode: "follow",
  timezone: "Asia/Seoul",
  dateFormat: "ko-KR",
};

test("settings preserve the legacy boolean-string contract and authenticated write endpoints", async () => {
  const client = createApiClient({ baseURL: "https://example.test/api" });
  const requests: { url?: string; method?: string; data: unknown }[] = [];
  client.http.defaults.adapter = async (config) => {
    requests.push({
      url: config.url,
      method: config.method,
      data: config.data ? JSON.parse(config.data) : undefined,
    });
    return {
      data:
        config.url === "/generate-public-token"
          ? "new-public-token"
          : undefined,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const api = createSettingsApi(client);
  await api.save(settings);
  await api.rename("Listener");
  assert.equal(await api.createShare(), "new-public-token");
  await api.revokeShare();
  assert.deepEqual(requests, [
    {
      url: "/settings",
      method: "post",
      data: { ...settings, historyLine: "false" },
    },
    { url: "/rename", method: "put", data: { newName: "Listener" } },
    { url: "/generate-public-token", method: "post", data: undefined },
    { url: "/delete-public-token", method: "post", data: undefined },
  ]);
  const publicClient = createApiClient({
    baseURL: "https://example.test/api",
    publicToken: "public-token",
  });
  publicClient.http.defaults.adapter = () => {
    throw new Error("Must not send a write");
  };
  const readOnly = createSettingsApi(publicClient);
  await assert.rejects(readOnly.save(settings), /read-only/);
  await assert.rejects(readOnly.rename("Listener"), /read-only/);
  await assert.rejects(readOnly.createShare(), /read-only/);
  await assert.rejects(readOnly.revokeShare(), /read-only/);
});

test("settings validate count bounds and Intl locale/time-zone values", () => {
  assert.equal(validateSettings(settings), null);
  for (const nbElements of [4, 51, 5.5, NaN])
    assert.ok(validateSettings({ ...settings, nbElements }));
  assert.ok(validateSettings({ ...settings, timezone: "invalid-zone" }));
  assert.ok(validateSettings({ ...settings, dateFormat: "YYYY-MM-DD" }));
  assert.equal(
    validateSettings({ ...settings, dateFormat: "default", timezone: "UTC" }),
    null,
  );
});

test("date preferences retain the selected account time zone and tolerate old invalid locale values", () => {
  const date = new Date("2026-10-15T17:00:00Z");
  const korean = createAccountDateFormat(settings);
  assert.equal(korean.resolvedOptions().timeZone, "Asia/Seoul");
  assert.equal(korean.resolvedOptions().locale, "ko-KR");
  assert.equal(
    korean.formatToParts(date).find((part) => part.type === "day")?.value,
    "16",
  );
  assert.doesNotThrow(() =>
    createAccountDateFormat({ ...settings, dateFormat: "YYYY-MM-DD" }).format(
      date,
    ),
  );
});

test("50 chart items respect the backend 30-item request limit", async () => {
  const { createListeningApi } =
    await import("../src/entities/listening/api/api");
  const client = createApiClient({ baseURL: "https://example.test/api" });
  const requests: { nb: number; offset: number }[] = [];
  client.http.defaults.adapter = async (config) => {
    const { nb, offset } = config.params;
    requests.push({ nb, offset });
    assert.ok(nb <= 30);
    return {
      data: Array.from({ length: nb }, (_, i) => ({
        count: 1,
        artist: { id: String(offset + i) },
      })),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const result = await createListeningApi(client).getBestArtists(
    new Date(0),
    new Date(),
    50,
    10,
  );
  assert.equal(result.length, 50);
  assert.deepEqual(requests, [
    { nb: 30, offset: 10 },
    { nb: 20, offset: 40 },
  ]);
  requests.length = 0;
  client.http.defaults.adapter = async (config) => {
    requests.push(config.params);
    return { data: [], status: 200, statusText: "OK", headers: {}, config };
  };
  assert.deepEqual(
    await createListeningApi(client).getBestArtists(
      new Date(0),
      new Date(),
      50,
      0,
    ),
    [],
  );
  assert.equal(requests.length, 1);
});

test("sharing key changes check availability, preserve conflicts, and reject public-client writes", async () => {
  const client = createApiClient({ baseURL: "/api" });
  const requests: {
    method?: string;
    url?: string;
    data: unknown;
    params: unknown;
  }[] = [];
  client.http.defaults.adapter = async (config) => {
    requests.push({
      method: config.method,
      url: config.url,
      data: config.data && JSON.parse(config.data),
      params: config.params,
    });
    return {
      data:
        config.method === "get"
          ? { key: "new-key", available: true }
          : "new-key",
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  const api = createSettingsApi(client);
  assert.deepEqual(await api.checkShareKey("new-key"), {
    key: "new-key",
    available: true,
  });
  assert.equal(await api.changeShareKey("new-key"), "new-key");
  assert.equal(requests[0].url, "/public-token/availability");
  assert.deepEqual(requests[0].params, { key: "new-key" });
  assert.equal(requests[1].method, "put");
  assert.deepEqual(requests[1].data, { key: "new-key" });
  const { AxiosError } = await import("axios");
  client.http.defaults.adapter = async (config) => {
    throw new AxiosError("Conflict", "ERR_BAD_REQUEST", config, undefined, {
      data: { code: "PUBLIC_TOKEN_TAKEN" },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config,
    });
  };
  await assert.rejects(
    api.changeShareKey("taken-key"),
    (error) => error instanceof AxiosError && error.response?.status === 409,
  );
  const shared = createSettingsApi(
    createApiClient({ baseURL: "/api", publicToken: "guest" }),
  );
  await assert.rejects(shared.checkShareKey("new-key"), /read-only/);
  await assert.rejects(shared.changeShareKey("new-key"), /read-only/);
});

test("sharing keys have URL-safe characters and bounded lengths", () => {
  for (const key of ["abc", "My-Key_123", "a".repeat(64)])
    assert.equal(validateShareKey(key), null);
  for (const key of [
    "",
    "ab",
    "has space",
    "bad/key",
    "한글키",
    "a".repeat(65),
  ])
    assert.ok(validateShareKey(key));
});
