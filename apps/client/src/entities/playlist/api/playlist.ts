import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";

export interface Playlist {
  id: string;
  name: string;
}

export type PlaylistDestination =
  { playlistId: string; name?: never } | { name: string; playlistId?: never };

export function createPlaylistApi(client: ApiClient) {
  return {
    list: async (signal?: AbortSignal) =>
      (await client.http.get<Playlist[]>("/spotify/playlists", { signal }))
        .data,
    addSongs: async (songIds: string[], destination: PlaylistDestination) => {
      const ids = [...new Set(songIds)];
      if (!ids.length || ids.some((id) => !/^[a-zA-Z0-9]{22}$/.test(id)))
        throw new Error("Select valid Spotify tracks.");
      if (!(destination.playlistId || destination.name?.trim()))
        throw new Error("Choose a playlist or enter a name.");
      await client.http.post("/spotify/playlist/create", {
        type: "specific",
        songIds: ids,
        ...destination,
        ...(destination.name ? { name: destination.name.trim() } : {}),
      });
    },
  };
}

export function playlistQuery(client: ApiClient) {
  return queryOptions({
    queryKey: [...client.queryKey, "playlist", "list"],
    queryFn: ({ signal }) => createPlaylistApi(client).list(signal),
  });
}
