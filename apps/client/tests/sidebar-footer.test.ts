import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "../src/shared/api";
import { createAccountQueries } from "../src/entities/account";
import {
  createListeningQueries,
  type CurrentlyPlayingResponse,
} from "../src/entities/listening";
import { SidebarProvider } from "../src/shared/ui/sidebar";

const cssHook = registerHooks({
  load(url, context, nextLoad) {
    return url.endsWith("/lyrics-text.css")
      ? { format: "module", source: "", shortCircuit: true }
      : nextLoad(url, context);
  },
});
const { SidebarFooterContent } =
  await import("../src/widgets/sidebar/ui/SidebarFooterContent");
cssHook.deregister();

function renderFooter(signedIn: boolean) {
  const client = createApiClient({ baseURL: "/api" });
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  cache.setQueryData(
    createAccountQueries(client).me().queryKey,
    signedIn
      ? {
          status: true,
          user: {
            username: "Listener",
            admin: false,
            _id: "listener",
            id: "listener",
            expiresIn: 0,
            accessToken: null,
            refreshToken: null,
            lastTimestamp: 0,
            publicToken: null,
            firstListenedAt: "2026-01-01",
            settings: {
              historyLine: false,
              preferredStatsPeriod: "month",
              nbElements: 20,
              metricUsed: "number",
              darkMode: "follow",
              timezone: null,
              dateFormat: "YYYY-MM-DD",
              blacklistedArtists: [],
            },
          },
        }
      : { status: false },
  );
  cache.setQueryData<CurrentlyPlayingResponse | null>(
    createListeningQueries(client).currentlyPlaying().queryKey,
    (): CurrentlyPlayingResponse => ({
      isPlaying: false,
      progressMs: 0,
      fetchedAt: 0,
      track: {
        id: "track",
        name: "Private track",
        uri: "spotify:track:track",
        durationMs: 180000,
      },
      album: { id: "album", name: "Album", imageUrl: null },
      artists: [{ id: "artist", name: "Artist" }],
    }),
  );
  try {
    return renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: cache },
        createElement(
          SidebarProvider,
          null,
          createElement(SidebarFooterContent, { client }),
        ),
      ),
    );
  } finally {
    cache.clear();
  }
}

test("signed-out footer links to backend OAuth and hides cached playback", () => {
  const html = renderFooter(false);
  assert.match(html, /href="\/api\/oauth\/spotify"/);
  assert.match(html, /Log in with Spotify/);
  assert.doesNotMatch(html, /Private track|Listener/);
});

test("signed-in footer displays the account and current track", () => {
  const html = renderFooter(true);
  assert.match(html, /Listener/);
  assert.match(html, /Private track/);
  assert.match(html, /Artist/);
  assert.match(html, /aria-label="Now playing"/);
  assert.doesNotMatch(html, /Log in with Spotify/);
});
