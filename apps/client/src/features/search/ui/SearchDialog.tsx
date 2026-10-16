import { navigate } from "astro:transitions/client";
import { SearchIcon } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../shared/ui/command";
import { MediaInfo } from "../../../entities/listening";
import { Skeleton } from "../../../shared/ui/skeleton";
import { SidebarMenuButton } from "../../../shared/ui/sidebar";
import { useSearchDialog } from "../model/use-search-dialog";

export function SearchDialog({ publicToken }: { publicToken?: string }) {
  const {
    open,
    setOpen,
    input,
    setInput,
    query,
    account,
    signedIn,
    search,
    pending,
  } = useSearchDialog(publicToken);
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  const groups = [
    {
      heading: "Songs",
      path: "songs",
      items:
        search.data?.tracks.map((track) => ({
          id: track.id,
          name: track.name,
          image: track.full_album?.images?.[0]?.url,
          description: track.full_artists
            ?.map((artist) => artist.name)
            .join(", "),
        })) ?? [],
    },
    {
      heading: "Albums",
      path: "albums",
      items:
        search.data?.albums.map((album) => ({
          id: album.id,
          name: album.name,
          image: album.images?.[0]?.url,
          description: album.full_artists
            ?.map((artist) => artist.name)
            .join(", "),
        })) ?? [],
    },
    {
      heading: "Artists",
      path: "artists",
      items:
        search.data?.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image: artist.images?.[0]?.url,
          description: undefined,
        })) ?? [],
    },
  ];
  const message = account.isError
    ? "Account unavailable"
    : !signedIn && !account.isPending
      ? publicToken
        ? "Invalid or expired share link"
        : "Log in to search"
      : input.trim().length < 3
        ? "Enter at least 3 characters"
        : search.isError && input.trim() === query
          ? "Could not search"
          : !groups.some((group) => group.items.length)
            ? "No results"
            : null;

  return (
    <>
      <SidebarMenuButton
        onClick={() => setOpen(true)}
        aria-label="Search"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <SearchIcon />
        <span>Search</span>
        <kbd className="ml-auto text-xs text-muted-foreground">⌘ K</kbd>
      </SidebarMenuButton>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search songs, albums, and artists"
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={setInput}
            maxLength={64}
            placeholder="Search songs, albums, artists…"
            aria-label="Search songs, albums, artists"
          />
          <CommandList aria-busy={pending}>
            {pending ? (
              <div
                role="status"
                aria-label="Searching"
                className="space-y-3 p-3"
              >
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            ) : message ? (
              <div
                role={account.isError || search.isError ? "alert" : "status"}
                className="space-y-2 p-6 text-center text-sm text-muted-foreground"
              >
                <p>{message}</p>
                {(account.isError ||
                  (signedIn && search.isError && input.trim() === query)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void (account.isError
                        ? account.refetch()
                        : search.refetch())
                    }
                  >
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              groups.map(
                (group) =>
                  group.items.length > 0 && (
                    <CommandGroup key={group.path} heading={group.heading}>
                      {group.items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${group.path}/${item.id}`}
                          onSelect={() => {
                            setOpen(false);
                            void navigate(
                              `${prefix}/${group.path}/${encodeURIComponent(item.id)}`,
                            );
                          }}
                        >
                          <MediaInfo
                            trackId={
                              group.path === "songs" ? item.id : undefined
                            }
                            publicToken={publicToken}
                            title={item.name}
                            imageUrl={item.image}
                            subTitle={item.description}
                            round={group.path === "artists"}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ),
              )
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
