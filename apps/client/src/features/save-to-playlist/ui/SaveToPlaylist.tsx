import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "../../../shared/ui/context-menu";
import { useState, type ReactElement } from "react";
import { EllipsisIcon, ListPlusIcon } from "lucide-react";
import { useAccount } from "../../../entities/account";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../shared/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPlaylistApi,
  playlistQuery,
  type PlaylistDestination,
} from "../../../entities/playlist";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";

export function SaveToPlaylist({
  songIds,
  onSaved,
  variant = "default",
  title,
  publicToken,
  contextTrigger,
  onSelectSong,
}: {
  songIds: string[];
  onSaved?: () => void;
  variant?: "default" | "menu" | "icon";
  title?: string;
  publicToken?: string;
  contextTrigger?: ReactElement;
  onSelectSong?: () => void;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("new");
  const [name, setName] = useState("");
  const playlists = useQuery(
    {
      ...playlistQuery(client),
      enabled: open && !publicToken && account.data?.status === true,
    },
    queryClient,
  );
  const save = useMutation(
    {
      mutationFn: (target: PlaylistDestination) =>
        createPlaylistApi(client).addSongs(songIds, target),
      retry: false,
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: playlistQuery(client).queryKey,
        });
        toast.success("Added to playlist");
        setOpen(false);
        setName("");
        onSaved?.();
      },
      onError: () =>
        toast.error(
          "Could not save all tracks. Check the playlist in Spotify before trying again.",
        ),
    },
    queryClient,
  );
  const items = [
    { value: "new", label: "New playlist" },
    ...(playlists.data ?? []).map((playlist) => ({
      value: playlist.id,
      label: playlist.name,
    })),
  ];

  if (publicToken || account.data?.status !== true)
    return contextTrigger ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!save.isPending) setOpen(value);
      }}
    >
      {contextTrigger ? (
        <ContextMenu>
          <ContextMenuTrigger render={contextTrigger} />
          <ContextMenuContent onClick={(event) => event.stopPropagation()}>
            <ContextMenuItem onClick={() => setOpen(true)}>
              Add to playlist
            </ContextMenuItem>
            {onSelectSong && (
              <ContextMenuItem onClick={onSelectSong}>
                Select song
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ) : variant === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={`Actions for ${title ?? "song"}`}
              />
            }
          >
            <EllipsisIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <ListPlusIcon aria-hidden="true" />
              Add to playlist
            </DropdownMenuItem>
            {onSelectSong && (
              <DropdownMenuItem onClick={onSelectSong}>
                Select song
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DialogTrigger
          render={
            <Button
              variant={variant === "icon" ? "ghost" : "default"}
              size={variant === "icon" ? "icon" : "default"}
              disabled={!songIds.length}
              aria-label={
                variant === "icon"
                  ? "Add to playlist"
                  : `Add ${songIds.length} songs to playlist`
              }
              title={variant === "icon" ? "Add to playlist" : undefined}
            />
          }
        >
          {variant === "icon" ? (
            <ListPlusIcon aria-hidden="true" />
          ) : (
            `Add ${songIds.length} ${songIds.length === 1 ? "song" : "songs"}`
          )}
        </DialogTrigger>
      )}
      <DialogContent
        showCloseButton={!save.isPending}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              save.isPending ||
              !songIds.length ||
              (destination === "new" && !name.trim())
            )
              return;
            save.mutate(
              destination === "new"
                ? { name: name.trim() }
                : { playlistId: destination },
            );
          }}
        >
          <DialogHeader>
            <DialogTitle>Add to playlist</DialogTitle>
            <DialogDescription>
              {songIds.length} {songIds.length === 1 ? "song" : "songs"}{" "}
              selected
            </DialogDescription>
          </DialogHeader>
          <Select
            items={items}
            value={destination}
            onValueChange={(value) => {
              if (value) setDestination(value);
            }}
            disabled={save.isPending}
          >
            <SelectTrigger aria-label="Playlist" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {playlists.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading playlists…
            </p>
          )}
          {playlists.isError && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span role="alert">Could not load playlists</span>
              <Button
                type="button"
                variant="ghost"
                disabled={playlists.isFetching || save.isPending}
                onClick={() => void playlists.refetch()}
              >
                Retry
              </Button>
            </div>
          )}
          {destination === "new" && (
            <label className="grid gap-2 text-sm">
              Playlist name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                disabled={save.isPending}
              />
              <span className="text-xs text-muted-foreground">
                New playlists are public.
              </span>
            </label>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                save.isPending ||
                !songIds.length ||
                (destination === "new" && !name.trim())
              }
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
