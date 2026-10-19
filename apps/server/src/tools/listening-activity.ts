export type ListeningDay = { _id: string; count: number };

const dayMs = 86_400_000;

export function summarizeListeningActivity(
  days: ListeningDay[],
  today: string,
) {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const sorted = days
    .filter((day) => day._id <= today)
    .sort((a, b) => a._id.localeCompare(b._id));
  const monthCounts = new Map<string, number>();
  let currentCount = 0;
  let previousCount = 0;
  let streak = 0;
  let longestStreak = 0;
  let previousDay = -Infinity;
  let peakDay: { date: string; count: number } | null = null;
  for (const day of sorted) {
    const dateMs = Date.parse(`${day._id}T00:00:00Z`);
    const age = (todayMs - dateMs) / dayMs;
    if (age < 30) currentCount += day.count;
    else if (age < 60) previousCount += day.count;
    const month = day._id.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + day.count);
    streak = dateMs - previousDay === dayMs ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    previousDay = dateMs;
    if (!peakDay || day.count > peakDay.count)
      peakDay = { date: day._id, count: day.count };
  }
  const currentMonth = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(
      Date.UTC(
        currentMonth.getUTCFullYear(),
        currentMonth.getUTCMonth() - 11 + index,
        1,
      ),
    )
      .toISOString()
      .slice(0, 7);
    return { month, count: monthCounts.get(month) ?? 0 };
  });
  return {
    months,
    recent: { count: currentCount, previousCount, through: today },
    listeningDays: sorted.length,
    longestStreak,
    peakDay,
  };
}
