export function getRankedNeighbors(
  id: string,
  rank: { index: number; results: { id: string }[] } | null | undefined,
): { position?: number; previous?: string; next?: string } {
  if (!rank || rank.index < 0 || !rank.results) return {};
  const current = rank.results.findIndex((item) => item.id === id);
  if (current < 0) return {};
  return {
    position: rank.index + 1,
    previous: rank.results[current - 1]?.id,
    next: rank.results[current + 1]?.id,
  };
}
