import { getDaysInRange, getHabitList, getIdeasInRange } from "./db";
import { completionPct } from "./stats";

function formatShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function habitShortLabel(habit: string): string {
  // "Write (Pickupline)" -> "Write", "Sleep 7+" stays as-is
  const paren = habit.indexOf(" (");
  return paren === -1 ? habit : habit.slice(0, paren);
}

export async function generateSummary(
  startDate: string,
  endDate: string
): Promise<string> {
  const [days, habitList] = await Promise.all([
    getDaysInRange(startDate, endDate),
    getHabitList(),
  ]);
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  const lines: string[] = [];

  const isWeek = sorted.length === 7 || (sorted.length === 0 && startDate !== endDate);
  const rangeLabel = `${formatShort(startDate)} – ${formatShort(endDate)}`;
  const endYear = Number(endDate.split("-")[0]);
  lines.push(`${isWeek ? "Week of" : "Range:"} ${rangeLabel}, ${endYear}`);

  if (sorted.length === 0) {
    lines.push("No days logged in this range.");
  } else {
    const avgPct =
      sorted.reduce((sum, d) => sum + completionPct(d), 0) / sorted.length;
    const goodDays = sorted.filter((d) => completionPct(d) >= 0.6).length;
    lines.push(
      `Habit completion: ${Math.round(avgPct * 100)}% (${goodDays}/${sorted.length} days ≥ 60%)`
    );

    const habitLines: string[] = habitList.map((h) => {
      const tracked = sorted.filter((d) => h in d.habits);
      const done = tracked.filter((d) => d.habits[h]).length;
      return `${habitShortLabel(h)}: ${done}/${tracked.length}`;
    });
    for (let i = 0; i < habitLines.length; i += 5) {
      lines.push(habitLines.slice(i, i + 5).join(" · "));
    }

    const avgMood = sorted.reduce((sum, d) => sum + d.mood, 0) / sorted.length;
    const avgEnergy = sorted.reduce((sum, d) => sum + d.energy, 0) / sorted.length;
    lines.push(`Avg mood: ${avgMood.toFixed(1)} · Avg energy: ${avgEnergy.toFixed(1)}`);

    const totalTasks = sorted.reduce((sum, d) => sum + d.tasks.length, 0);
    const doneTasks = sorted.reduce(
      (sum, d) => sum + d.tasks.filter((t) => t.done).length,
      0
    );
    lines.push(`Must-win tasks completed: ${doneTasks}/${totalTasks}`);
  }

  const startISO = `${startDate}T00:00:00`;
  const endISO = `${endDate}T23:59:59.999`;
  const ideas = await getIdeasInRange(startISO, endISO);
  if (ideas.length === 0) {
    lines.push("New ideas logged: 0");
  } else {
    const counts = new Map<string, number>();
    ideas.forEach((i) => counts.set(i.type, (counts.get(i.type) ?? 0) + 1));
    const breakdown = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${count} ${type}`)
      .join(", ");
    lines.push(`New ideas logged: ${ideas.length} (${breakdown})`);
  }

  return lines.join("\n");
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied"> {
  const nav = navigator as Navigator & {
    share?: (data: { text: string; title?: string }) => Promise<void>;
    canShare?: (data: { text: string }) => boolean;
  };
  if (nav.share && (!nav.canShare || nav.canShare({ text }))) {
    try {
      await nav.share({ text, title: "Weekly Review" });
      return "shared";
    } catch {
      // fall through to clipboard if share is cancelled/unsupported at runtime
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
