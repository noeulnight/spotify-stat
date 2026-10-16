import { useQuery } from "@tanstack/react-query";
import { useAccount } from "../../../entities/account";
import { createListeningQueries, Timesplit } from "../../../entities/listening";
import { usePeriod } from "../../../features/filter-period";
import { useApiRuntime } from "../../../shared/api";
import { getActivitySeries } from "./stats-series";

export function useStats(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const itemCount = account.data?.status
    ? (account.data.user.settings?.nbElements ?? 20)
    : 20;
  const { period, setPeriod } = usePeriod(
    account.data?.status
      ? account.data.user.settings?.preferredStatsPeriod
      : undefined,
  );
  const monthly = period.value === "365" || period.value === "all";
  const split = monthly ? Timesplit.month : Timesplit.day;
  const { start, end } = period;
  const queries = createListeningQueries(client);
  const songs = useQuery(
    { ...queries.songsPer(start, end, Timesplit.all), enabled },
    queryClient,
  );
  const time = useQuery(
    { ...queries.timePer(start, end, Timesplit.all), enabled },
    queryClient,
  );
  const artists = useQuery(
    { ...queries.differentArtistsPer(start, end, Timesplit.all), enabled },
    queryClient,
  );
  const activity = useQuery(
    { ...queries.songsPer(start, end, split), enabled },
    queryClient,
  );
  const hours = useQuery(
    { ...queries.timePerHourOfDay(start, end), enabled },
    queryClient,
  );
  const timeActivity = useQuery(
    { ...queries.timePer(start, end, split), enabled },
    queryClient,
  );
  const artistActivity = useQuery(
    { ...queries.differentArtistsPer(start, end, split), enabled },
    queryClient,
  );
  const releases = useQuery(
    { ...queries.albumDateRatio(start, end, split), enabled },
    queryClient,
  );
  const collaborators = useQuery(
    { ...queries.featRatio(start, end, split), enabled },
    queryClient,
  );
  const artistDistribution = useQuery(
    { ...queries.mostListenedArtist(start, end, split), enabled },
    queryClient,
  );
  const bestArtists = useQuery(
    { ...queries.getBestArtists(start, end, itemCount, 0), enabled },
    queryClient,
  );
  const duration =
    account.data?.status === true &&
    account.data.user.settings?.metricUsed === "duration";
  const message = account.isPending
    ? "Loading…"
    : account.isError
      ? publicToken
        ? "Share unavailable"
        : "Account unavailable"
      : !enabled
        ? publicToken
          ? "Invalid or expired share link"
          : "Log in to view stats"
        : null;
  return {
    itemCount,
    period,
    setPeriod,
    monthly,
    enabled,
    duration,
    historyLine:
      account.data?.status === true &&
      account.data.user.settings?.historyLine === true,
    timeActivity,
    artistActivity,
    releases,
    collaborators,
    artistDistribution,
    bestArtists,
    songs,
    time,
    artists,
    activity,
    hours,
    activitySeries: getActivitySeries(
      enabled ? (activity.data ?? []) : [],
      monthly,
    ),
    message,
    accountError: account.isError,
    retryAccount: () => void account.refetch(),
  };
}
