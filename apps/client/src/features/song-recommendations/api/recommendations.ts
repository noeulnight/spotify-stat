import type { ApiClient } from "../../../shared/api";

export interface RecommendedSong {
  trackId: string;
  title: string | null;
  artists: string[];
  imageUrl: string | null;
  createdAt: string;
}

export interface SpotifySong {
  id: string;
  title: string;
  artists: string[];
  imageUrl: string | null;
  recommended: boolean;
}

export interface Recommendation extends RecommendedSong {
  _id: string;
  trackId: string;
  title: string | null;
  name: string;
  message: string;
  createdAt: string;
}

export function createRecommendationsApi(client: ApiClient) {
  return {
    send: async (body: { trackId: string; name: string; message: string }) => {
      const token = client.http.defaults.params?.token;
      if (!token) throw new Error("A share link is required");
      await client.http.post(
        `/recommendations/${encodeURIComponent(token)}`,
        body,
      );
    },
    search: async (q: string, signal?: AbortSignal) => {
      const token = client.http.defaults.params?.token;
      if (!token) throw new Error("A share link is required");
      return (
        await client.http.get<SpotifySong[]>(
          `/recommendations/${encodeURIComponent(token)}/search`,
          { params: { q }, signal },
        )
      ).data;
    },
    publicList: async (offset: number, signal?: AbortSignal) => {
      const token = client.http.defaults.params?.token;
      if (!token) throw new Error("A share link is required");
      return (
        await client.http.get<RecommendedSong[]>(
          `/recommendations/${encodeURIComponent(token)}`,
          { params: { offset }, signal },
        )
      ).data;
    },
    list: async (offset: number, signal?: AbortSignal) => {
      if (client.http.defaults.params?.token)
        throw new Error("Log in to view recommendations");
      return (
        await client.http.get<Recommendation[]>("/recommendations", {
          params: { offset },
          signal,
        })
      ).data;
    },
    remove: async (id: string) => {
      if (client.http.defaults.params?.token)
        throw new Error("Log in to delete recommendations");
      await client.http.delete(`/recommendations/${encodeURIComponent(id)}`);
    },
  };
}
