import { useState } from "react";
import { CopyIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { useSettings } from "../model/use-settings";
import { createShareLink, isShareablePage } from "../model/share-link";

async function copyLink(url: string | Promise<string>) {
  try {
    if (
      typeof url !== "string" &&
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard?.write
    ) {
      // Start the clipboard write during the click, before token creation finishes.
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": url.then(
            (link) => new Blob([link], { type: "text/plain" }),
          ),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(await url);
    }
    toast.success("Link copied");
  } catch {
    if (typeof url !== "string") await url.catch(() => undefined);
    toast.error("Could not copy link");
  }
}

export function SharePageButton({
  activePath,
  publicToken,
}: {
  activePath: string;
  publicToken?: string;
}) {
  if (!isShareablePage(activePath)) return null;
  if (publicToken)
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = createShareLink(window.location.href, publicToken);
          if (url) void copyLink(url);
        }}
      >
        <CopyIcon />
        Copy link
      </Button>
    );
  return <AccountShareButton />;
}

function AccountShareButton() {
  const state = useSettings();
  const [copying, setCopying] = useState(false);
  const user = state.account.data?.status ? state.account.data.user : null;
  if (!user) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={copying}
      title="Copy a public link to your listening history and statistics"
      onClick={async () => {
        const currentUrl = window.location.href;
        const linkFor = (token: string) => {
          const url = createShareLink(currentUrl, token);
          if (!url) throw new Error("This page cannot be shared");
          return url;
        };
        setCopying(true);
        try {
          await copyLink(
            user.publicToken
              ? linkFor(user.publicToken)
              : state.createShare.mutateAsync().then(linkFor),
          );
        } finally {
          setCopying(false);
        }
      }}
    >
      <Share2Icon />
      {copying ? "Copying…" : "Share"}
    </Button>
  );
}
