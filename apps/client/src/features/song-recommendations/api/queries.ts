import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createRecommendationsApi } from "./recommendations";

export function createRecommendationQueries(client: ApiClient) {
  const api = createRecommendationsApi(client);
  const queryKey = [...client.queryKey, "recommendations"];
  return {
    queryKey,
    search: (q: string) =>
      queryOptions({
        queryKey: [...queryKey, "search", q],
        queryFn: ({ signal }) => api.search(q, signal),
      }),
    publicList: (offset: number) =>
      queryOptions({
        queryKey: [...queryKey, "public", offset],
        queryFn: ({ signal }) => api.publicList(offset, signal),
      }),
    inbox: (offset: number) =>
      queryOptions({
        queryKey: [...queryKey, "inbox", offset],
        queryFn: ({ signal }) => api.list(offset, signal),
      }),
  };
}
