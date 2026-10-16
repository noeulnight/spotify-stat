import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import {
  createListeningQueries,
  getRankedNeighbors,
  useTracks,
} from "../../../entities/listening";

export function useSongDetails(id: string, publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const queries = createListeningQueries(client);
  const song = useTracks(client, [id], enabled, queryClient);
  const statsQuery = useQuery(
    { ...queries.getTrackStats(id), enabled },
    queryClient,
  );
  const stats =
    enabled && statsQuery.data && !("code" in statsQuery.data)
      ? statsQuery.data
      : undefined;
  const track = enabled ? song.data?.[0] : undefined;
  const album = useQuery(
    {
      ...queries.getAlbums(track?.album ? [track.album] : []),
      enabled: !!track?.album && statsQuery.isSuccess && !stats,
    },
    queryClient,
  );
  const artists = useQuery(
    {
      ...queries.getArtists(track?.artists ?? []),
      enabled: !!track?.artists?.length,
    },
    queryClient,
  );
  const rank = useQuery(
    { ...queries.getTrackRank(id), enabled: !!stats },
    queryClient,
  );
  const error = account.error ?? song.error ?? statsQuery.error;
  const isPending =
    account.isPending ||
    (enabled && !error && (song.isPending || statsQuery.isPending));
  const message = account.isPending
    ? "Loading…"
    : account.isError
      ? publicToken
        ? "Share unavailable"
        : "Account unavailable"
      : !enabled
        ? publicToken
          ? "Invalid or expired share link"
          : "Log in to view this song"
        : isAxiosError(error) && error.response?.status === 404
          ? "Song not found"
          : song.isError || statsQuery.isError
            ? "Could not load song"
            : song.isPending || statsQuery.isPending
              ? "Loading…"
              : !track
                ? "Song not found"
                : null;
  return {
    isPending,
    track,
    stats,
    album: stats?.album ?? album.data?.[0],
    artists: artists.data ?? (stats?.artist ? [stats.artist] : []),
    metadataError: album.isError || artists.isError,
    retryMetadata: () => {
      if (album.isError) void album.refetch();
      if (artists.isError) void artists.refetch();
    },
    neighbors: getRankedNeighbors(id, rank.data),
    rankPending: rank.isPending,
    rankError: rank.isError,
    retryRank: () => void rank.refetch(),
    message,
    error: !!error,
    retry: () => {
      if (account.isError) void account.refetch();
      else {
        void song.refetch();
        void statsQuery.refetch();
      }
    },
  };
}
