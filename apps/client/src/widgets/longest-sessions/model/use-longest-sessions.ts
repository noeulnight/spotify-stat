import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "../../../features/filter-period";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import { createListeningQueries } from "../../../entities/listening";

export function useLongestSessions(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const { period, setPeriod } = usePeriod(
    account.data?.status
      ? account.data.user.settings?.preferredStatsPeriod
      : undefined,
  );
  const signedIn = account.data?.status === true;
  const query = useQuery(
    {
      ...createListeningQueries(client).getLongestSessions(
        period.start,
        period.end,
      ),
      enabled: signedIn,
    },
    queryClient,
  );
  const rows = signedIn ? (query.data ?? []) : [];
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
          : "Log in to view sessions"
        : query.isPending
          ? "Loading…"
          : query.isError && !query.data
            ? "Could not load sessions"
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
    message,
    error,
    retry,
    isPending: account.isPending || (signedIn && query.isPending),
  };
}
