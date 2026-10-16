import { usePeriod } from "../../../features/filter-period";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import { useTopSongs } from "../../../entities/listening";

export function useTopSongsTable(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const { period, setPeriod } = usePeriod(
    account.data?.status
      ? account.data.user.settings?.preferredStatsPeriod
      : undefined,
  );
  const signedIn = account.data?.status === true;
  const query = useTopSongs(client, period, signedIn, queryClient);
  const rows = query.data?.pages.flat() ?? [];
  const error = account.isError || (signedIn && query.isError && !query.data);
  const message = account.isPending
    ? "Loading…"
    : account.isError
      ? publicToken
        ? "Share unavailable"
        : "Account unavailable"
      : !signedIn
        ? publicToken
          ? "Invalid or expired share link"
          : "Log in to view top songs"
        : query.isPending
          ? "Loading…"
          : query.isError && !query.data
            ? "Could not load top songs"
            : !rows.length
              ? "No data"
              : null;
  const retry = () => {
    if (account.isError) void account.refetch();
    else void query.refetch();
  };

  return {
    rows,
    period,
    setPeriod,
    hasMore: signedIn && query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    loadMore: () => void query.fetchNextPage(),
    message,
    error,
    retry,
    isPending: account.isPending || (signedIn && query.isPending),
  };
}
