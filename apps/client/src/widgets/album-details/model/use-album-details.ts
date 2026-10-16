import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import {
  createListeningQueries,
  getAlbumOverview,
  getRankedNeighbors,
  useAlbums,
} from "../../../entities/listening";

export function useAlbumDetails(id: string, publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const queries = createListeningQueries(client);
  const album = useAlbums(client, [id], enabled, queryClient);
  const statsQuery = useQuery(
    { ...queries.getAlbumStats(id), enabled },
    queryClient,
  );
  const stats = enabled ? statsQuery.data : undefined;
  const rank = useQuery(
    { ...queries.getAlbumRank(id), enabled: !!stats?.tracks.length },
    queryClient,
  );
  const error = account.error ?? album.error ?? statsQuery.error;
  const isPending =
    account.isPending ||
    (enabled && !error && (album.isPending || statsQuery.isPending));
  const message = account.isPending
    ? "Loading…"
    : account.isError
      ? publicToken
        ? "Share unavailable"
        : "Account unavailable"
      : !enabled
        ? publicToken
          ? "Invalid or expired share link"
          : "Log in to view this album"
        : isAxiosError(error) && error.response?.status === 404
          ? "Album not found"
          : album.isError || statsQuery.isError
            ? "Could not load album"
            : album.isPending || statsQuery.isPending
              ? "Loading…"
              : !stats
                ? "Album not found"
                : null;
  return {
    isPending,
    album: stats?.album,
    stats,
    overview: stats ? getAlbumOverview(stats) : undefined,
    neighbors: getRankedNeighbors(id, rank.data),
    rankPending: rank.isPending && !!stats?.tracks.length,
    rankError: rank.isError,
    retryRank: () => void rank.refetch(),
    message,
    error: !!error,
    retry: () => {
      if (account.isError) void account.refetch();
      else {
        void album.refetch();
        void statsQuery.refetch();
      }
    },
  };
}
