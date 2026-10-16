import { Button } from "../../../shared/ui/button";
import { useExclusion } from "../model/use-exclusion";
export function ExcludeArtistButton({
  id,
  publicToken,
}: {
  id: string;
  publicToken?: string;
}) {
  const state = useExclusion(publicToken);
  if (!state.writable) return null;
  const excluded = state.ids.includes(id);
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={state.mutation.isPending}
        onClick={() => state.mutation.mutate({ id, excluded: !excluded })}
      >
        {state.mutation.isPending
          ? "Saving…"
          : excluded
            ? "Include in statistics"
            : "Exclude from statistics"}
      </Button>
      {excluded && (
        <p className="text-xs text-muted-foreground">
          Excluded from statistics
        </p>
      )}
      {state.mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not update artist. Try again.
        </p>
      )}
    </div>
  );
}
