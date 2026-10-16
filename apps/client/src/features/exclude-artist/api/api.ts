import type { ApiClient } from "../../../shared/api";
export function createArtistExclusionApi(client: ApiClient) {
  return {
    setExcluded: async (id: string, excluded: boolean) => {
      if (client.http.defaults.params?.token)
        throw new Error("Shared accounts are read-only");
      await client.http.post(
        `/artist/${excluded ? "blacklist" : "unblacklist"}/${encodeURIComponent(id)}`,
      );
    },
  };
}
