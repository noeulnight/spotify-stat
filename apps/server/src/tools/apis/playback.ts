import type { QueuedHttpClient } from "./queueHttpClient";

export const playbackActions = ["resume", "pause", "next", "previous"] as const;
export type PlaybackAction = (typeof playbackActions)[number];

export function controlPlayback(
  client: Pick<QueuedHttpClient, "request">,
  action: PlaybackAction,
) {
  const commands = {
    resume: { method: "put", url: "/me/player/play" },
    pause: { method: "put", url: "/me/player/pause" },
    next: { method: "post", url: "/me/player/next" },
    previous: { method: "post", url: "/me/player/previous" },
  };
  return client.request({
    ...commands[action],
    priority: "high",
    retry429MaxAttempts: 0,
    responseType: "none",
  });
}
