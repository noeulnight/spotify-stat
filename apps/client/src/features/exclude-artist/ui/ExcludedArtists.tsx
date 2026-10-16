import { useQuery } from "@tanstack/react-query";
import { createListeningQueries, MediaInfo } from "../../../entities/listening";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import { Skeleton } from "../../../shared/ui/skeleton";
import { useExclusion } from "../model/use-exclusion";
export function ExcludedArtists() {
  const state = useExclusion();
  const artists = useQuery(
    {
      ...createListeningQueries(state.client).getArtists(state.ids),
      enabled: state.writable && state.ids.length > 0,
    },
    state.queryClient,
  );
  if (!state.writable) return null;
  return (
    <Card aria-label="Excluded artists">
      <CardHeader>
        <CardTitle>Excluded artists</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!state.ids.length ? (
          <p className="text-sm text-muted-foreground">No excluded artists</p>
        ) : (
          <>
            {artists.isPending && (
              <Skeleton
                className="h-10 w-full"
                aria-label="Loading excluded artists"
              />
            )}
            {artists.isError && (
              <div role="alert">
                <p className="text-sm">Could not load artist names</p>
                <Button variant="ghost" onClick={() => void artists.refetch()}>
                  Retry
                </Button>
              </div>
            )}
            <ul className="divide-y">
              {state.ids.map((id) => {
                const artist = artists.data?.find((entry) => entry.id === id);
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <MediaInfo
                        artistId={id}
                        title={artist?.name ?? id}
                        imageUrl={artist?.images?.[0]?.url}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={state.mutation.isPending}
                      onClick={() =>
                        state.mutation.mutate({ id, excluded: false })
                      }
                    >
                      Include
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {state.mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not update artist. Try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
