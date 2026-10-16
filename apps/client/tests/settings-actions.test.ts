import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { createApiClient } from "../src/shared/api";
import { createAdminSettingsApi } from "../src/features/admin-settings/api/api";
import { createArtistExclusionApi } from "../src/features/exclude-artist/api/api";
function setup(publicToken?: string) {
  const client = createApiClient({
    baseURL: "https://example.test/api",
    publicToken,
  });
  const requests: InternalAxiosRequestConfig[] = [];
  client.http.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      data: { allowRegistrations: false, allowAffinity: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  return { client, requests };
}
test("admin and exclusion actions preserve endpoint, ID and boolean contracts", async () => {
  const { client, requests } = setup();
  const admin = createAdminSettingsApi(client),
    artist = createArtistExclusionApi(client);
  await admin.setAdmin("user/id", false);
  await admin.savePreferences({ allowRegistrations: false });
  await admin.deleteAccount("user/id");
  await artist.setExcluded("artist/id", true);
  await artist.setExcluded("artist/id", false);
  assert.deepEqual(
    requests.map((request) => [request.method, request.url]),
    [
      ["put", "/admin/user%2Fid"],
      ["post", "/global/preferences"],
      ["delete", "/account/user%2Fid"],
      ["post", "/artist/blacklist/artist%2Fid"],
      ["post", "/artist/unblacklist/artist%2Fid"],
    ],
  );
  assert.deepEqual(JSON.parse(requests[0].data), { status: false });
  assert.deepEqual(JSON.parse(requests[1].data), { allowRegistrations: false });
});
test("shared clients cannot perform admin or exclusion mutations", async () => {
  const { client, requests } = setup("shared");
  const admin = createAdminSettingsApi(client);
  await assert.rejects(admin.setAdmin("id", true), /read-only/);
  await assert.rejects(admin.deleteAccount("id"), /read-only/);
  await assert.rejects(
    admin.savePreferences({ allowAffinity: true }),
    /read-only/,
  );
  await assert.rejects(
    createArtistExclusionApi(client).setExcluded("id", true),
    /read-only/,
  );
  assert.equal(requests.length, 0);
});
test("mutation failures propagate for retry feedback", async () => {
  const { client } = setup();
  client.http.defaults.adapter = async (config) => {
    throw new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, undefined, {
      data: {},
      status: 403,
      statusText: "Forbidden",
      headers: {},
      config,
    });
  };
  await assert.rejects(
    createAdminSettingsApi(client).deleteAccount("id"),
    (error) => error instanceof AxiosError && error.response?.status === 403,
  );
  await assert.rejects(
    createArtistExclusionApi(client).setExcluded("id", true),
    /Forbidden/,
  );
});
