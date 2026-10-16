import { useAlbums, type ListeningSession } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";

export function useSessionAlbums(
  session: ListeningSession,
  publicToken?: string,
) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const ids = [
    ...new Set(
      session.distanceToLast.distance
        .map(({ info }) => info.albumId || session.full_tracks[info.id]?.album)
        .filter((id): id is string => !!id),
    ),
  ].sort();
  const query = useAlbums(client, ids, ids.length > 0, queryClient);
  return {
    albums: new Map(query.data?.map((album) => [album.id, album])),
    pending: ids.length > 0 && query.isPending,
    error: query.isError,
    retry: () => void query.refetch(),
  };
}
