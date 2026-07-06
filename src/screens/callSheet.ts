import { addDays, getDay, getTodayDay, saveDay, todayKey } from "../lib/db";
import { computeStreak, habitsDone, lastNDaysStrip } from "../lib/stats";
import { getRouteParam, navigate } from "../lib/router";
import { iconChevronLeft, iconChevronRight, iconGear } from "../lib/icons";
import { showToast } from "../lib/toast";
import type { DayRecord } from "../lib/types";

const MOOD_LABELS = ["Rough", "Bad", "Low", "Off", "Neutral", "Fine", "Good", "Great", "High", "Best"];
const ENERGY_LABELS = ["Drained", "Exhausted", "Tired", "Sluggish", "Steady", "Awake", "Energized", "Strong", "Wired", "Peak"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function mount(container: HTMLElement): Promise<void> {
  const today = todayKey();
  const requested = getRouteParam();
  const viewedDate =
    requested && DATE_RE.test(requested) && requested <= today ? requested : today;

  const day = viewedDate === today ? await getTodayDay() : await getDay(viewedDate);

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <h1>Call Sheet</h1>
      <button class="icon-btn" id="settings-btn" aria-label="Edit cues">${iconGear}</button>
    </div>

    <div class="card" style="margin-top:16px">
      <div id="bulb-row" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px"></div>
      <div id="streak-line" class="muted" style="text-align:center;font-size:0.9rem"></div>
    </div>

    <div class="card" style="margin-top:12px">
      <h3 style="margin-bottom:10px">Last 7 Days</h3>
      <div id="strip" style="display:flex;gap:8px;align-items:flex-end;height:80px"></div>
    </div>

    <div class="card" style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;padding:10px 8px">
      <button class="icon-btn" id="prev-day-btn" aria-label="Previous day">${iconChevronLeft}</button>
      <span id="day-label" class="display" style="font-size:1.2rem"></span>
      <button class="icon-btn" id="next-day-btn" aria-label="Next day">${iconChevronRight}</button>
    </div>

    <div style="margin-top:16px">
      <h3 style="margin-bottom:10px">Cues</h3>
      <div id="habit-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>
    </div>

    <div style="margin-top:20px">
      <h3 style="margin-bottom:10px">Must-Win Tasks</h3>
      <div id="task-list" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>

    <div class="card" style="margin-top:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <label for="mood-slider">Mood</label>
        <span id="mood-val" class="muted"></span>
      </div>
      <input type="range" id="mood-slider" min="1" max="10" step="1" style="width:100%;margin-top:6px" />

      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px">
        <label for="energy-slider">Energy</label>
        <span id="energy-val" class="muted"></span>
      </div>
      <input type="range" id="energy-slider" min="1" max="10" step="1" style="width:100%;margin-top:6px" />
    </div>

    <div style="margin-top:20px">
      <h3 style="margin-bottom:8px">One line that moved the real goal forward</h3>
      <textarea id="note" rows="3" placeholder="Write it here..."></textarea>
    </div>
  `;
  container.appendChild(root);

  const bulbRow = root.querySelector<HTMLDivElement>("#bulb-row")!;
  const streakLine = root.querySelector<HTMLDivElement>("#streak-line")!;
  const strip = root.querySelector<HTMLDivElement>("#strip")!;
  const dayLabelEl = root.querySelector<HTMLSpanElement>("#day-label")!;
  const prevDayBtn = root.querySelector<HTMLButtonElement>("#prev-day-btn")!;
  const nextDayBtn = root.querySelector<HTMLButtonElement>("#next-day-btn")!;
  const habitGrid = root.querySelector<HTMLDivElement>("#habit-grid")!;
  const taskList = root.querySelector<HTMLDivElement>("#task-list")!;
  const moodSlider = root.querySelector<HTMLInputElement>("#mood-slider")!;
  const moodVal = root.querySelector<HTMLSpanElement>("#mood-val")!;
  const energySlider = root.querySelector<HTMLInputElement>("#energy-slider")!;
  const energyVal = root.querySelector<HTMLSpanElement>("#energy-val")!;
  const noteEl = root.querySelector<HTMLTextAreaElement>("#note")!;

  root.querySelector<HTMLButtonElement>("#settings-btn")!.addEventListener("click", () => {
    navigate("settings");
  });

  function dayLabel(date: string): string {
    if (date === today) return "Today";
    if (date === addDays(today, -1)) return "Yesterday";
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  dayLabelEl.textContent = dayLabel(viewedDate);
  nextDayBtn.style.visibility = viewedDate === today ? "hidden" : "visible";
  prevDayBtn.addEventListener("click", () => navigate("call-sheet", addDays(viewedDate, -1)));
  nextDayBtn.addEventListener("click", () => {
    if (viewedDate < today) navigate("call-sheet", addDays(viewedDate, 1));
  });

  async function persist(updated: DayRecord): Promise<void> {
    await saveDay(updated);
    showToast("Saved");
    await renderDerived();
  }

  async function renderDerived(): Promise<void> {
    const todayRecord = viewedDate === today ? day : await getDay(today);
    const doneCount = habitsDone(todayRecord);
    const totalHabits = Object.keys(todayRecord.habits).length;
    bulbRow.innerHTML = Array.from({ length: totalHabits })
      .map((_, i) => {
        const lit = i < doneCount;
        return `<span style="width:16px;height:16px;border-radius:50%;background:${
          lit ? "var(--gold)" : "var(--panel-2)"
        };border:1px solid var(--line);${lit ? "box-shadow:0 0 8px var(--gold)" : ""}"></span>`;
      })
      .join("");

    const streak = await computeStreak();
    streakLine.textContent =
      streak === 0
        ? "No streak yet — log a cue today to start one."
        : `${streak}-day streak`;

    const bars = await lastNDaysStrip(7);
    strip.innerHTML = bars
      .map((b) => {
        const heightPct = Math.max(6, Math.round(b.pct * 100));
        const isToday = b.date === today;
        const color = isToday ? "var(--gold)" : "var(--teal)";
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
            <div style="width:100%;max-width:28px;border-radius:4px;height:${heightPct}%;min-height:4px;background:${color}"></div>
            <span class="muted" style="font-size:0.7rem">${b.dayLabel}</span>
          </div>`;
      })
      .join("");
  }

  function renderHabitGrid(): void {
    habitGrid.innerHTML = "";
    Object.keys(day.habits).forEach((habit) => {
      const done = !!day.habits[habit];
      const tile = document.createElement("button");
      tile.className = "card";
      tile.style.cssText = `text-align:left;padding:14px;min-height:56px;display:flex;align-items:center;justify-content:space-between;border-color:${
        done ? "var(--teal)" : "var(--line)"
      };background:${done ? "rgba(94,234,212,0.08)" : "var(--panel)"}`;
      tile.innerHTML = `
        <span style="font-size:0.9rem;font-weight:600;color:${done ? "var(--teal)" : "var(--ink)"}">${habit}</span>
      `;
      tile.addEventListener("click", async () => {
        day.habits[habit] = !day.habits[habit];
        tile.style.borderColor = day.habits[habit] ? "var(--teal)" : "var(--line)";
        tile.style.background = day.habits[habit] ? "rgba(94,234,212,0.08)" : "var(--panel)";
        tile.querySelector("span")!.style.color = day.habits[habit] ? "var(--teal)" : "var(--ink)";
        await persist(day);
      });
      habitGrid.appendChild(tile);
    });
  }

  function renderTasks(): void {
    taskList.innerHTML = "";
    day.tasks.forEach((task, idx) => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:12px";
      row.innerHTML = `
        <input type="checkbox" style="width:22px;height:22px;flex-shrink:0" ${task.done ? "checked" : ""} />
        <input type="text" placeholder="Must-win task ${idx + 1}" value="${escapeHtml(task.text)}" style="flex:1;background:transparent;border:none;padding:6px 0" />
      `;
      const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      const textInput = row.querySelector<HTMLInputElement>('input[type="text"]')!;

      checkbox.addEventListener("change", async () => {
        task.done = checkbox.checked;
        await persist(day);
      });

      textInput.addEventListener("blur", async () => {
        task.text = textInput.value;
        await persist(day);
      });

      taskList.appendChild(row);
    });
  }

  moodSlider.value = String(day.mood);
  moodVal.textContent = `${day.mood} · ${MOOD_LABELS[day.mood - 1]}`;
  energySlider.value = String(day.energy);
  energyVal.textContent = `${day.energy} · ${ENERGY_LABELS[day.energy - 1]}`;
  noteEl.value = day.note;

  moodSlider.addEventListener("input", () => {
    const v = Number(moodSlider.value);
    moodVal.textContent = `${v} · ${MOOD_LABELS[v - 1]}`;
  });
  moodSlider.addEventListener("change", async () => {
    day.mood = Number(moodSlider.value);
    await persist(day);
  });

  energySlider.addEventListener("input", () => {
    const v = Number(energySlider.value);
    energyVal.textContent = `${v} · ${ENERGY_LABELS[v - 1]}`;
  });
  energySlider.addEventListener("change", async () => {
    day.energy = Number(energySlider.value);
    await persist(day);
  });

  noteEl.addEventListener("blur", async () => {
    day.note = noteEl.value;
    await persist(day);
  });

  renderHabitGrid();
  renderTasks();
  await renderDerived();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
