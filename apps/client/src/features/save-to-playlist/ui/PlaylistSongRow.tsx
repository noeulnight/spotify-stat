import { useAccount } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import type { ComponentProps } from "react";
import { MediaActionsProvider } from "../../../entities/listening";
import { TableCell, TableHead, TableRow } from "../../../shared/ui/table";
import { usePlaylistSelection } from "./PlaylistSelection";
import { SaveToPlaylist } from "./SaveToPlaylist";

export function PlaylistSongRow({
  id,
  title,
  publicToken,
  children,
  ...props
}: Omit<ComponentProps<typeof TableRow>, "id" | "title"> & {
  id: string;
  title: string;
  publicToken?: string;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const writable = !publicToken && account.data?.status === true;
  const selection = usePlaylistSelection();
  return (
    <SaveToPlaylist
      title={title}
      songIds={[id]}
      publicToken={publicToken}
      onSelectSong={selection ? () => selection.select(id) : undefined}
      contextTrigger={
        <TableRow
          {...props}
          data-state={
            selection?.selecting && selection.selected.has(id)
              ? "selected"
              : undefined
          }
        >
          <MediaActionsProvider value={undefined}>
            {children}
          </MediaActionsProvider>
          {writable && (
            <TableCell className="w-10 text-right">
              <div className="flex justify-end">
                <SaveToPlaylist
                  songIds={[id]}
                  title={title}
                  variant="menu"
                  onSelectSong={
                    selection ? () => selection.select(id) : undefined
                  }
                />
              </div>
            </TableCell>
          )}
        </TableRow>
      }
    />
  );
}

export function PlaylistActionsHead({ publicToken }: { publicToken?: string }) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  return !publicToken && account.data?.status === true ? (
    <TableHead scope="col" className="w-10">
      <span className="sr-only">Actions</span>
    </TableHead>
  ) : null;
}
