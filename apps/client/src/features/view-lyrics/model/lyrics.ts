export interface LyricLine {
  timeMs: number;
  text: string;
}

export function parseLyrics(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  const offset = Number(/\[offset:\s*([+-]?\d+)\]/i.exec(lrc)?.[1] ?? 0);
  const lines: LyricLine[] = [];
  for (const line of lrc.split(/\r?\n/)) {
    const stamps = [...line.matchAll(/\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];
    const text = line.replace(/\[[^\]]*\]/g, "").trim();
    for (const stamp of stamps) {
      const timeMs =
        Number(stamp[1]) * 60_000 +
        Number(stamp[2]) * 1000 +
        Number((stamp[3] ?? "").padEnd(3, "0")) +
        offset;
      lines.push({ timeMs: Math.max(0, timeMs), text });
    }
  }
  const grouped = new Map<number, string[]>();
  for (const line of lines.sort((a, b) => a.timeMs - b.timeMs)) {
    const texts = grouped.get(line.timeMs) ?? [];
    if (line.text) texts.push(line.text);
    grouped.set(line.timeMs, texts);
  }
  return [...grouped].map(([timeMs, texts]) => ({
    timeMs,
    text: texts.join("\n"),
  }));
}

export function activeLyricIndex(lines: LyricLine[], positionMs: number) {
  let index = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.timeMs > positionMs) break;
    index = i;
  }
  return index;
}
