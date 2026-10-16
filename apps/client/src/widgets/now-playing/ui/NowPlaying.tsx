import { NowPlayingPage } from "../../../features/view-lyrics";
import { PlaylistActions } from "../../../features/save-to-playlist";

export function NowPlaying({ publicToken }: { publicToken?: string }) {
  return (
    <PlaylistActions>
      <NowPlayingPage publicToken={publicToken} />
    </PlaylistActions>
  );
}
