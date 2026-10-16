import type { ReactNode } from "react";
import { MediaActionsProvider } from "../../../entities/listening";
import { usePlaylistSelection } from "./PlaylistSelection";
import { SaveToPlaylist } from "./SaveToPlaylist";

function renderTrackActions(id: string, title: string) {
  return <TrackActions id={id} title={title} />;
}

function TrackActions({ id, title }: { id: string; title: string }) {
  const selection = usePlaylistSelection();
  return (
    <SaveToPlaylist
      songIds={[id]}
      title={title}
      variant="menu"
      onSelectSong={selection ? () => selection.select(id) : undefined}
    />
  );
}

export function PlaylistActions({ children }: { children: ReactNode }) {
  return (
    <MediaActionsProvider value={renderTrackActions}>
      {children}
    </MediaActionsProvider>
  );
}

export function PlaylistActionsEnd({
  id,
  title,
  publicToken,
  children,
}: {
  id?: string;
  title: string;
  publicToken?: string;
  children: ReactNode;
}) {
  return (
    <>
      <MediaActionsProvider value={undefined}>{children}</MediaActionsProvider>
      {id && !publicToken && <TrackActions id={id} title={title} />}
    </>
  );
}
