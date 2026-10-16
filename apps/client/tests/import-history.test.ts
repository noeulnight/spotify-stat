import assert from "node:assert/strict";
import test from "node:test";
import type { InternalAxiosRequestConfig } from "axios";
import { createApiClient } from "../src/shared/api";
import { createImportHistoryApi } from "../src/features/import-history/api/api";
import { ImporterStateType } from "../src/features/import-history/api/types";
import { validateImportFiles } from "../src/features/import-history/model/files";

test("import files enforce backend count, size and JSON file limits", () => {
  const json = new File(["[]"], "history.json");
  assert.equal(validateImportFiles([json]), null);
  assert.equal(validateImportFiles([]), "Select JSON files");
  assert.equal(
    validateImportFiles(Array(51).fill(json)),
    "Select up to 50 files",
  );
  assert.equal(
    validateImportFiles([new File(["zip"], "history.zip")]),
    "Only JSON files are supported",
  );
  assert.equal(
    validateImportFiles([new File([], "empty.json")]),
    "Files must not be empty",
  );
  assert.equal(
    validateImportFiles([
      new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.json"),
    ]),
    "Each file must be 20 MB or smaller",
  );
});

test("import API uses multipart imports, retry state ID and encoded cleanup ID", async () => {
  const client = createApiClient({ baseURL: "https://example.test/api" });
  const requests: InternalAxiosRequestConfig[] = [];
  client.http.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: [], status: 200, statusText: "OK", headers: {}, config };
  };
  const api = createImportHistoryApi(client);
  const file = new File(["[]"], "history.json");
  await api.upload(ImporterStateType.fullPrivacy, [file], () => {});
  await api.upload(ImporterStateType.privacy, [file], () => {});
  await api.retry("failed-id");
  await api.clean("failed/id");
  assert.equal(requests[0].url, "/import/full-privacy");
  assert.equal(requests[1].url, "/import/privacy");
  assert.equal(requests[0].data.getAll("imports").length, 1);
  assert.equal(requests[0].data.get("imports").name, "history.json");
  assert.deepEqual(JSON.parse(requests[2].data), {
    existingStateId: "failed-id",
  });
  assert.equal(requests[3].method, "delete");
  assert.equal(requests[3].url, "/import/clean/failed%2Fid");
});
