import { useQuery } from "@tanstack/react-query";
import { useAccount, createAccountQueries } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { LoginButton } from "./LoginButton";
export function SpotifyConnection() {
  const { client, queryClient } = useApiRuntime();
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true;
  const spotify = useQuery(
    { ...createAccountQueries(client).sme(), enabled },
    queryClient,
  );
  if (!enabled) return null;
  return (
    <Card aria-label="Spotify connection">
      <CardHeader>
        <CardTitle>Spotify connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {spotify.isPending ? (
          <Skeleton
            className="h-10 w-full"
            aria-label="Loading Spotify account"
          />
        ) : spotify.isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm">
              Spotify connection unavailable. Reconnect your account.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void spotify.refetch()}
            >
              Retry connection
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium">{spotify.data.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {spotify.data.product}
            </p>
          </div>
        )}
        <LoginButton client={client} label="Reconnect Spotify" />
      </CardContent>
    </Card>
  );
}
