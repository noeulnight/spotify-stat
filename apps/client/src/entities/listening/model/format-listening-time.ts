export function formatListeningTime(durationMs: number | undefined) {
  if (
    durationMs === undefined ||
    !Number.isFinite(durationMs) ||
    durationMs < 0
  )
    return undefined;
  const minutes = Math.floor(durationMs / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
