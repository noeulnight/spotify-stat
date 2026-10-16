import { useMutation, type QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createListeningApi } from "./api";
import { createListeningQueries } from "./queries";
import type { PlaybackAction } from "./types";

export function usePlaybackControl(
  client: ApiClient,
  queryClient: QueryClient,
) {
  return useMutation(
    {
      mutationFn: (action: PlaybackAction) =>
        createListeningApi(client).controlPlayback(action),
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: createListeningQueries(client).currentlyPlaying().queryKey,
          refetchType: "all",
        }),
    },
    queryClient,
  );
}
