import { usePeriod } from "../../../features/filter-period";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import { useTopAlbums } from "../../../entities/listening";

export function useTopAlbumsTable(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const { period, setPeriod } = usePeriod(
    account.data?.status
      ? account.data.user.settings?.preferredStatsPeriod
      : undefined,
  );
  const signedIn = account.data?.status === true;
  const query = useTopAlbums(client, period, signedIn, queryClient);
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
          : "Log in to view top albums"
        : query.isPending
          ? "Loading…"
          : query.isError && !query.data
            ? "Could not load top albums"
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
