import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useAccount } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Checkbox } from "../../../shared/ui/checkbox";
import { TableCell, TableHead } from "../../../shared/ui/table";
import { TableStatus } from "../../../shared/ui/table-status";
import { SaveToPlaylist } from "./SaveToPlaylist";

const Selection = createContext<{
  selecting: boolean;
  select: (id: string) => void;
  selected: Set<string>;
  toggle: (id: string, checked: boolean) => void;
  all: boolean;
  partial: boolean;
  empty: boolean;
  toggleAll: (checked: boolean) => void;
} | null>(null);

export function PlaylistSelection({
  songIds,
  publicToken,
  children,
  toolbar,
}: {
  songIds: string[];
  publicToken?: string;
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const available = new Set(songIds);
  const visible = new Set([...selected].filter((id) => available.has(id)));
  const writable = !publicToken && account.data?.status === true;
  const value = writable
    ? {
        selecting,
        select: (id: string) => {
          setSelecting(true);
          setSelected((previous) => new Set([...previous, id]));
        },
        selected: visible,
        toggle: (id: string, checked: boolean) =>
          setSelected((previous) => {
            const next = new Set(previous);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          }),
        all: available.size > 0 && visible.size === available.size,
        partial: visible.size > 0 && visible.size < available.size,
        empty: available.size === 0,
        toggleAll: (checked: boolean) =>
          setSelected(checked ? available : new Set()),
      }
    : null;
  return (
    <Selection.Provider value={value}>
      {toolbar && <div className="mb-3">{toolbar}</div>}
      {children}
      {writable && selecting && (
        <div
          role="toolbar"
          aria-label="Selected songs"
          className="fixed bottom-4 left-1/2 z-30 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-lg border bg-background p-2 shadow-sm [&>*]:shrink-0"
        >
          <span role="status" className="px-2 text-sm tabular-nums">
            {visible.size} selected
          </span>
          <SaveToPlaylist
            songIds={[...visible]}
            onSaved={() => {
              setSelected(new Set());
              setSelecting(false);
            }}
          />
          <Button
            variant="ghost"
            onClick={() => {
              setSelected(new Set());
              setSelecting(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </Selection.Provider>
  );
}

export function PlaylistSelectionHead() {
  const state = useContext(Selection);
  if (!state?.selecting) return null;
  return (
    <TableHead scope="col" className="w-10">
      <Checkbox
        aria-label="Select all loaded songs"
        disabled={state.empty}
        checked={state.all}
        indeterminate={state.partial}
        onCheckedChange={state.toggleAll}
      />
    </TableHead>
  );
}

export function PlaylistSelectionCell({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const state = useContext(Selection);
  if (!state?.selecting) return null;
  return (
    <TableCell>
      <Checkbox
        aria-label={`Select ${title}`}
        checked={state.selected.has(id)}
        onCheckedChange={(checked) => state.toggle(id, checked)}
      />
    </TableCell>
  );
}

export function PlaylistSelectionStatus({
  colSpan,
  ...props
}: ComponentProps<typeof TableStatus>) {
  const state = useContext(Selection);
  return (
    <TableStatus
      colSpan={colSpan + (state?.selecting ? 1 : 0) + (state ? 1 : 0)}
      {...props}
    />
  );
}

export function usePlaylistSelection() {
  return useContext(Selection);
}
