import { useAccount } from "../../../entities/account";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createListeningQueries } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { getHourlyDistribution } from "./distribution-series";

export function useHourlyItems(
  period: { start: Date; end: Date },
  enabled: boolean,
  publicToken?: string,
) {
  const [kind, setKind] = useState("artists");
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const itemCount = account.data?.status
    ? (account.data.user.settings?.nbElements ?? 10)
    : 10;
  const queries = createListeningQueries(client);
  const { start, end } = period;
  const options =
    kind === "songs"
      ? queries.getBestSongsOfHour(start, end)
      : kind === "albums"
        ? queries.getBestAlbumsOfHour(start, end)
        : queries.getBestArtistsOfHour(start, end);
  const query = useQuery({ ...options, enabled }, queryClient);
  return {
    kind,
    setKind,
    query,
    distribution: getHourlyDistribution(query.data ?? [], itemCount),
  };
}
