import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import {
  createListeningQueries,
  getRankedNeighbors,
} from "../../../entities/listening";

export function useArtistDetails(id: string, publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const queries = createListeningQueries(client);
  const artist = useQuery(
    { ...queries.getArtists([id]), enabled },
    queryClient,
  );
  const stats = useQuery(
    { ...queries.getArtistStats(id), enabled },
    queryClient,
  );
  const rank = useQuery(
    {
      ...queries.getArtistRank(id),
      enabled:
        enabled &&
        !!artist.data?.length &&
        !!stats.data &&
        !("code" in stats.data),
    },
    queryClient,
  );
  const error = account.error ?? artist.error ?? stats.error;
  const isPending =
    account.isPending ||
    (enabled && !error && (artist.isPending || stats.isPending));
  const message = account.isPending
    ? "Loading…"
    : account.isError
      ? publicToken
        ? "Share unavailable"
        : "Account unavailable"
      : !enabled
        ? publicToken
          ? "Invalid or expired share link"
          : "Log in to view this artist"
        : isAxiosError(error) && error.response?.status === 404
          ? "Artist not found"
          : artist.isError || stats.isError
            ? "Could not load artist"
            : artist.isPending || stats.isPending
              ? "Loading…"
              : !artist.data?.length
                ? "Artist not found"
                : null;
  return {
    isPending,
    neighbors: getRankedNeighbors(id, rank.data),
    rankPending: rank.isPending,
    rankError: rank.isError,
    retryRank: () => void rank.refetch(),
    artist: enabled ? artist.data?.[0] : undefined,
    stats:
      enabled && stats.data && !("code" in stats.data) ? stats.data : undefined,
    message,
    error: Boolean(error),
    retry: () => {
      if (account.isError) void account.refetch();
      else {
        void artist.refetch();
        void stats.refetch();
      }
    },
  };
}
