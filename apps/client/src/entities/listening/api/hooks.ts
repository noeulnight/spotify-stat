import {
  useQuery,
  useInfiniteQuery,
  type QueryClient,
} from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createListeningQueries } from "./queries";

export function useRecentTracks(
  client: ApiClient,
  end: Date,
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useInfiniteQuery(
    {
      ...createListeningQueries(client).getTracksInfinite(new Date(0), end, 20),
      enabled,
    },
    queryClient,
  );
}

export function useSearch(
  client: ApiClient,
  query: string,
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useQuery(
    {
      ...createListeningQueries(client).search(query),
      enabled: enabled && query.length >= 3 && query.length <= 64,
    },
    queryClient,
  );
}

export function useCurrentlyPlaying(client: ApiClient, enabled: boolean) {
  return useQuery({
    ...createListeningQueries(client).currentlyPlaying(),
    enabled,
    refetchIntervalInBackground: false,
  });
}

export function useTopSongs(
  client: ApiClient,
  period: { start: Date; end: Date },
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useInfiniteQuery(
    {
      ...createListeningQueries(client).getBestSongsInfinite(
        period.start,
        period.end,
        20,
      ),
      enabled,
    },
    queryClient,
  );
}

export function useTopAlbums(
  client: ApiClient,
  period: { start: Date; end: Date },
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useInfiniteQuery(
    {
      ...createListeningQueries(client).getBestAlbumsInfinite(
        period.start,
        period.end,
        20,
      ),
      enabled,
    },
    queryClient,
  );
}

export function useTopArtists(
  client: ApiClient,
  period: { start: Date; end: Date },
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useInfiniteQuery(
    {
      ...createListeningQueries(client).getBestArtistsInfinite(
        period.start,
        period.end,
        20,
      ),
      enabled,
    },
    queryClient,
  );
}

export function useArtists(
  client: ApiClient,
  ids: string[],
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useQuery(
    { ...createListeningQueries(client).getArtists(ids), enabled },
    queryClient,
  );
}

export function useTracks(
  client: ApiClient,
  ids: string[],
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useQuery(
    { ...createListeningQueries(client).getTrackDetails(ids), enabled },
    queryClient,
  );
}

export function useAlbums(
  client: ApiClient,
  ids: string[],
  enabled: boolean,
  queryClient?: QueryClient,
) {
  return useQuery(
    { ...createListeningQueries(client).getAlbums(ids), enabled },
    queryClient,
  );
}
