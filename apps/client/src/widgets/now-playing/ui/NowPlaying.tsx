import { NowPlayingPage } from "../../../features/view-lyrics";
import { PlaylistActions } from "../../../features/save-to-playlist";
import { Toaster } from "../../../shared/ui/sonner";

export function NowPlaying({
  publicToken,
  floating = false,
}: {
  publicToken?: string;
  floating?: boolean;
}) {
  return (
    <PlaylistActions>
      {floating && <Toaster />}
      <NowPlayingPage publicToken={publicToken} floating={floating} />
    </PlaylistActions>
  );
}
