import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "../../../entities/account";
import { createListeningQueries, Timesplit } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { getHomePeriods } from "./home-periods";

export function useHome(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const preferences = account.data?.status
    ? account.data.user.settings
    : undefined;
  const [initialEnd] = useState(() => new Date());
  const defaultPeriod =
    preferences?.preferredStatsPeriod === "day"
      ? "today"
      : (preferences?.preferredStatsPeriod ?? "week");
  const initial = useMemo(
    () => getHomePeriods(initialEnd, defaultPeriod),
    [initialEnd, defaultPeriod],
  );
  const [selection, setPeriod] = useState<ReturnType<
    typeof getHomePeriods
  > | null>(null);
  const period = selection ?? initial;
  const itemCount = preferences?.nbElements ?? 5;
  const [tab, setTab] = useState("songs");
  const { start, end, previousStart, previousEnd } = period;
  const compare = enabled && period.value !== "all";
  const split =
    period.value === "today"
      ? Timesplit.hour
      : period.value === "year" || period.value === "all"
        ? Timesplit.month
        : Timesplit.day;
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
  const previousSongs = useQuery(
    {
      ...queries.songsPer(previousStart, previousEnd, Timesplit.all),
      enabled: compare,
    },
    queryClient,
  );
  const previousTime = useQuery(
    {
      ...queries.timePer(previousStart, previousEnd, Timesplit.all),
      enabled: compare,
    },
    queryClient,
  );
  const previousArtists = useQuery(
    {
      ...queries.differentArtistsPer(previousStart, previousEnd, Timesplit.all),
      enabled: compare,
    },
    queryClient,
  );
  const activity = useQuery(
    { ...queries.timePer(start, end, split), enabled },
    queryClient,
  );
  const hours = useQuery(
    { ...queries.timePerHourOfDay(start, end), enabled },
    queryClient,
  );
  const history = useQuery(
    { ...queries.getTracks(start, end, 8, 0), enabled },
    queryClient,
  );
  const topSongs = useQuery(
    { ...queries.getBestSongs(start, end, itemCount, 0), enabled },
    queryClient,
  );
  const topArtists = useQuery(
    { ...queries.getBestArtists(start, end, itemCount, 0), enabled },
    queryClient,
  );
  return {
    itemCount,
    historyLine: preferences?.historyLine === true,
    account,
    enabled,
    songs,
    time,
    artists,
    previousSongs,
    previousTime,
    previousArtists,
    activity,
    hours,
    split: split as Timesplit.hour | Timesplit.day | Timesplit.month,
    history,
    topSongs,
    topArtists,
    tab,
    setTab,
    period,
    setPeriod: (value: string) => setPeriod(getHomePeriods(new Date(), value)),
    duration:
      account.data?.status === true &&
      account.data.user.settings?.metricUsed === "duration",
  };
}
