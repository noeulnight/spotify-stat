import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createImportHistoryApi } from "./api";

type Api = ReturnType<typeof createImportHistoryApi>;

export function createImportHistoryQueries(client: ApiClient) {
  return {
    getImports: (...args: Parameters<Api["getImports"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "import-history", "getImports", ...args],
        queryFn: ({ signal }) =>
          createImportHistoryApi(client, signal).getImports(...args),
        refetchInterval: (query) =>
          query.state.data?.some((item) => item.status === "progress")
            ? 2_000
            : false,
      }),
  };
}
