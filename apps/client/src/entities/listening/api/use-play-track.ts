import { useMutation, type QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createListeningApi } from "./api";
import { createListeningQueries } from "./queries";

export function usePlayTrack(client: ApiClient, queryClient: QueryClient) {
  return useMutation(
    {
      mutationFn: (id: string) => createListeningApi(client).playTrack(id),
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: createListeningQueries(client).currentlyPlaying().queryKey,
          refetchType: "all",
        }),
    },
    queryClient,
  );
}
