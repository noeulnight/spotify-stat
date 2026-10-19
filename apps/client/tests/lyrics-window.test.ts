import assert from "node:assert/strict";
import test from "node:test";
import { openLyricsWindow } from "../src/features/view-lyrics/lib/open-lyrics-window";

type Host = NonNullable<Parameters<typeof openLyricsWindow>[1]>;

function fakeWindow() {
  const children: unknown[] = [];
  return {
    closed: false,
    focused: false,
    close() {
      this.closed = true;
    },
    focus() {
      this.focused = true;
    },
    document: {
      title: "",
      body: {
        style: { margin: "" },
        append: (child: unknown) => children.push(child),
      },
      createElement: (tag: string) => ({
        tag,
        title: "",
        src: "",
        style: { cssText: "" },
      }),
    },
    children,
  };
}

test("lyrics windows use native PiP when available and Firefox-style popups otherwise", async () => {
  const popup = fakeWindow();
  const calls: unknown[][] = [];
  const fallback = {
    location: { href: "https://spotify.lth.so/share/hyun/now-playing" },
    open: (...args: unknown[]) => {
      calls.push(args);
      return popup;
    },
  } as unknown as Host;
  await openLyricsWindow("a/b?c", fallback);
  assert.deepEqual(calls[0], [
    "https://spotify.lth.so/share/a%2Fb%3Fc/lyrics-window",
    "_blank",
    "popup,width=400,height=560",
  ]);
  await openLyricsWindow("a/b?c", fallback);
  assert.equal(calls.length, 1);
  assert.equal(popup.focused, true);

  const pip = fakeWindow();
  let dimensions: unknown;
  const native = {
    ...fallback,
    documentPictureInPicture: {
      requestWindow: async (options: unknown) => {
        dimensions = options;
        return pip;
      },
    },
  } as unknown as Host;
  await openLyricsWindow(undefined, native);
  assert.equal(popup.closed, true);
  assert.deepEqual(dimensions, { width: 400, height: 560 });
  assert.equal(pip.document.title, "Lyrics · Spotistat");
  assert.equal(pip.document.body.style.margin, "0");
  assert.equal(pip.children.length, 1);
  assert.deepEqual(pip.children[0], {
    tag: "iframe",
    title: "Lyrics",
    src: "https://spotify.lth.so/lyrics-window",
    style: { cssText: "display:block;width:100%;height:100dvh;border:0" },
  });
  pip.close();
  await openLyricsWindow(undefined, fallback);
  assert.equal(calls.length, 2);
  popup.close();

  const blocked = { ...fallback, open: () => null } as unknown as Host;
  await assert.rejects(openLyricsWindow(undefined, blocked), /Allow pop-ups/);
  const denied = {
    ...blocked,
    documentPictureInPicture: {
      requestWindow: async () => {
        throw new Error("Not allowed");
      },
    },
  } as unknown as Host;
  await assert.rejects(openLyricsWindow(undefined, denied), /Not allowed/);
});
