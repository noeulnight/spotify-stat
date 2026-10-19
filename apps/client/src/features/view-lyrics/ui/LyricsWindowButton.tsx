import { useState } from "react";
import { PictureInPicture2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { openLyricsWindow } from "../lib/open-lyrics-window";

export function LyricsWindowButton({ publicToken }: { publicToken?: string }) {
  const [opening, setOpening] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Open lyrics window"
      title="Open lyrics window"
      disabled={opening}
      onClick={async () => {
        setOpening(true);
        try {
          await openLyricsWindow(publicToken);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Could not open lyrics.",
          );
        } finally {
          setOpening(false);
        }
      }}
    >
      <PictureInPicture2 aria-hidden="true" />
    </Button>
  );
}
