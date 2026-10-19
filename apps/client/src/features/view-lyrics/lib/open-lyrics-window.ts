type LyricsWindowHost = Pick<Window, "location" | "open"> & {
  documentPictureInPicture?: {
    requestWindow(options: { width: number; height: number }): Promise<Window>;
  };
};

let activeWindow: Window | null = null;
let activeUrl: string | null = null;

export async function openLyricsWindow(
  publicToken?: string,
  host: LyricsWindowHost = window,
) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  const url = new URL(`${prefix}/lyrics-window`, host.location.href).href;
  if (activeWindow && !activeWindow.closed) {
    if (activeUrl === url) {
      activeWindow.focus();
      return;
    }
    activeWindow.close();
  }
  if (host.documentPictureInPicture) {
    const floating = await host.documentPictureInPicture.requestWindow({
      width: 400,
      height: 560,
    });
    try {
      floating.document.title = "Lyrics · Spotistat";
      floating.document.body.style.margin = "0";
      const frame = floating.document.createElement("iframe");
      frame.title = "Lyrics";
      frame.src = url;
      frame.style.cssText = "display:block;width:100%;height:100dvh;border:0";
      floating.document.body.append(frame);
      activeWindow = floating;
    } catch (error) {
      floating.close();
      throw error;
    }
  } else {
    const floating = host.open(url, "_blank", "popup,width=400,height=560");
    if (!floating) throw new Error("Allow pop-ups to open lyrics.");
    activeWindow = floating;
  }
  activeUrl = url;
}
