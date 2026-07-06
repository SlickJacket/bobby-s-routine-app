import { addDays, getDayRaw, todayKey } from "./db";
import type { DayRecord } from "./types";

export function habitsDone(day: DayRecord | undefined): number {
  if (!day) return 0;
  return Object.values(day.habits).filter(Boolean).length;
}

export function completionPct(day: DayRecord | undefined): number {
  if (!day) return 0;
  const habitCount = Object.keys(day.habits).length;
  if (habitCount === 0) return 0;
  return habitsDone(day) / habitCount;
}

export async function computeStreak(): Promise<number> {
  let streak = 0;
  let cursor = todayKey();
  let isToday = true;

  while (true) {
    const day = await getDayRaw(cursor);
    const done = habitsDone(day);

    if (isToday) {
      if (done > 0) streak++;
      isToday = false;
    } else {
      if (done > 0) streak++;
      else break;
    }
    cursor = addDays(cursor, -1);

    // safety valve to avoid infinite loop on corrupted data
    if (streak > 3650) break;
  }

  return streak;
}

export interface DayBar {
  date: string;
  dayLabel: string;
  pct: number;
}

export async function lastNDaysStrip(n: number): Promise<DayBar[]> {
  const bars: DayBar[] = [];
  let cursor = todayKey();
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < n; i++) {
    const day = await getDayRaw(cursor);
    const [y, m, d] = cursor.split("-").map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    bars.unshift({
      date: cursor,
      dayLabel: labels[dow],
      pct: completionPct(day),
    });
    cursor = addDays(cursor, -1);
  }

  return bars;
}

export function longestStreakForHabit(days: DayRecord[], habit: string): number {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const day of sorted) {
    const done = !!day.habits[habit];
    const consecutive = prevDate === null || addDays(prevDate, 1) === day.date;
    if (done) {
      current = consecutive ? current + 1 : 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
    prevDate = day.date;
  }

  return longest;
}
