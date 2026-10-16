import { useMemo, useState } from "react";

export const periods = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 365 days" },
  { value: "all", label: "All time" },
];

export function getPeriod(value: string, end: Date) {
  return {
    start:
      value === "all"
        ? new Date(0)
        : new Date(end.getTime() - Number(value) * 86_400_000),
    end,
  };
}

export function usePeriod(preferred?: string) {
  const defaults: Record<string, string> = {
    day: "1",
    week: "7",
    month: "30",
    year: "365",
  };
  const value = defaults[preferred ?? ""] ?? "30";
  const [end] = useState(() => new Date());
  const initial = useMemo(
    () => ({ value, ...getPeriod(value, end) }),
    [value, end],
  );
  const [selection, setSelection] = useState<typeof initial | null>(null);
  return {
    period: selection ?? initial,
    setPeriod: (value: string) =>
      setSelection({ value, ...getPeriod(value, new Date()) }),
  };
}
