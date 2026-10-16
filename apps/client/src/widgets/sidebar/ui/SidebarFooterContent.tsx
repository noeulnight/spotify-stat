import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../../../features/logout";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../shared/ui/dropdown-menu";
import { RiUserFill, RiLogoutBoxRLine } from "react-icons/ri";
import { useAccount } from "../../../entities/account";
import { useCurrentlyPlaying } from "../../../entities/listening";
import { ThemeSelect } from "../../../features/change-theme";
import { LoginButton } from "../../../features/spotify-login";
import { LyricsViewer } from "../../../features/view-lyrics";
import type { ApiClient } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";

export function SidebarFooterContent({
  client,
  publicToken,
}: {
  client: ApiClient;
  publicToken?: string;
}) {
  const queryClient = useQueryClient();
  const signOut = useMutation({
    mutationFn: () => logout(client),
    onSuccess: () => {
      queryClient.clear();
      window.location.assign("/");
    },
  });
  const account = useAccount(client);
  const playback = useCurrentlyPlaying(client, account.data?.status === true);

  if (account.isPending) {
    return (
      <div className="flex items-center gap-2 px-2">
        <div
          className="min-w-0 flex-1"
          role="status"
          aria-label="Loading account"
        >
          <Skeleton className="h-4 w-28" />
        </div>
        <ThemeSelect />
      </div>
    );
  }

  if (account.isError) {
    return (
      <div className="space-y-2">
        <p className="px-2 text-sm text-muted-foreground" role="alert">
          {publicToken ? "Share unavailable" : "Account unavailable"}
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void account.refetch()}
        >
          Retry
        </Button>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {!publicToken && <LoginButton client={client} />}
          </div>
          <ThemeSelect />
        </div>
      </div>
    );
  }

  if (!account.data.status) {
    return (
      <div className="flex items-center gap-2 px-2">
        <div className="min-w-0 flex-1">
          {publicToken ? (
            <p className="text-sm text-muted-foreground" role="alert">
              Invalid or expired share link
            </p>
          ) : (
            <LoginButton client={client} />
          )}
        </div>
        <ThemeSelect />
      </div>
    );
  }

  const current = playback.data;

  return (
    <div className="space-y-1">
      <section aria-label="Now playing" className="px-2 py-2 empty:hidden">
        {playback.isPending ? (
          <div
            role="status"
            aria-label="Loading playback"
            className="flex items-center gap-3"
          >
            <Skeleton className="size-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ) : playback.isError ? (
          <div className="space-y-1">
            <p role="alert" className="text-sm text-muted-foreground">
              Playback unavailable
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void playback.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          current && (
            <LyricsViewer playback={current} publicToken={publicToken} />
          )
        )}
      </section>
      <div className="flex min-w-0 items-center gap-2 px-2 py-1">
        {publicToken ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <RiUserFill
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <LoginButton
              client={client}
              label={`${account.data.user.username} (Guest)`}
              variant="ghost"
              className="min-w-0 flex-1 cursor-pointer justify-start px-0"
            />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="min-w-0 flex-1 justify-start px-0"
                />
              }
              disabled={signOut.isPending}
              aria-label={`Account: ${account.data.user.username}`}
            >
              <RiUserFill
                aria-hidden="true"
                className="text-muted-foreground"
              />
              <span className="truncate" title={account.data.user.username}>
                {account.data.user.username}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
              >
                <RiLogoutBoxRLine aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <ThemeSelect />
      </div>
      {signOut.isError && (
        <p role="alert" className="px-2 text-xs text-destructive">
          Could not log out. Try again.
        </p>
      )}
    </div>
  );
}
