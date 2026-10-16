import { useState } from "react";
import { useAccount } from "../../../entities/account";
import { useRecentTracks as useRecentTracksQuery } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";

export function useRecentTracks(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const [end] = useState(() => new Date());
  const account = useAccount(client, queryClient);
  const signedIn = account.data?.status === true;
  const query = useRecentTracksQuery(client, end, signedIn, queryClient);
  const rows = signedIn ? (query.data?.pages.flat() ?? []) : [];
  const isPending = account.isPending || (signedIn && query.isPending);
  const error = account.isError || (signedIn && query.isError && !query.data);
  const message = account.isError
    ? publicToken
      ? "Share unavailable"
      : "Account unavailable"
    : !signedIn
      ? publicToken
        ? "Invalid or expired share link"
        : "Log in to view recent plays"
      : query.isError && !query.data
        ? "Could not load recent plays"
        : !rows.length
          ? "No recent plays"
          : null;

  return {
    rows,
    isPending,
    error,
    message,
    retry: () => void (account.isError ? account.refetch() : query.refetch()),
    hasMore: signedIn && query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    loadMore: () => void query.fetchNextPage(),
  };
}
