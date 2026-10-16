import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createAccountApi } from "./api";

type Api = ReturnType<typeof createAccountApi>;

export function createAccountQueries(client: ApiClient) {
  return {
    version: (...args: Parameters<Api["version"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "account", "version", ...args],
        queryFn: ({ signal }) =>
          createAccountApi(client, signal).version(...args),
      }),
    me: (...args: Parameters<Api["me"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "account", "me", ...args],
        queryFn: ({ signal }) => createAccountApi(client, signal).me(...args),
      }),
    sme: (...args: Parameters<Api["sme"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "account", "sme", ...args],
        queryFn: ({ signal }) => createAccountApi(client, signal).sme(...args),
      }),
    globalPreferences: (...args: Parameters<Api["globalPreferences"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "account", "globalPreferences", ...args],
        queryFn: ({ signal }) =>
          createAccountApi(client, signal).globalPreferences(...args),
      }),
    getAccounts: (...args: Parameters<Api["getAccounts"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "account", "getAccounts", ...args],
        queryFn: ({ signal }) =>
          createAccountApi(client, signal).getAccounts(...args),
      }),
  };
}
