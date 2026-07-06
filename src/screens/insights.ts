import { addDays, getAllDays, getDaysInRange, getHabitList, todayKey } from "../lib/db";
import { completionPct, longestStreakForHabit } from "../lib/stats";
import { generateSummary, shareOrCopy } from "../lib/export";
import { showToast } from "../lib/toast";
import { navigate } from "../lib/router";
import type { DayRecord } from "../lib/types";

type RangeKey = "7" | "30" | "90" | "all" | "custom";
type SortCol = "date" | "pct" | "mood" | "energy";

export async function mount(container: HTMLElement): Promise<void> {
  const habitList = await getHabitList();
  const allDays = await getAllDays();

  const root = document.createElement("div");
  root.innerHTML = `<h1>Insights</h1>`;
  container.appendChild(root);

  if (allDays.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.style.marginTop = "16px";
    empty.innerHTML = `<p class="muted">No days logged yet. Log a day on Call Sheet, then come back here.</p>`;
    root.appendChild(empty);
    return;
  }

  let rangeKey: RangeKey = "30";
  let customFrom = addDays(todayKey(), -29);
  let customTo = todayKey();
  let selectedHabit = habitList[0] ?? "";
  let skipFilterHabit = "";
  let sortCol: SortCol = "date";
  let sortDir: "asc" | "desc" = "desc";

  const rangeBar = document.createElement("div");
  rangeBar.className = "chip-row";
  rangeBar.style.marginTop = "16px";
  root.appendChild(rangeBar);

  const exportBtn = document.createElement("button");
  exportBtn.className = "card";
  exportBtn.style.cssText =
    "margin-top:10px;width:100%;text-align:center;color:var(--gold);font-weight:600";
  exportBtn.textContent = "Export This Range";
  exportBtn.addEventListener("click", async () => {
    const { start, end } = getRangeBounds();
    const summary = await generateSummary(start, end);
    const result = await shareOrCopy(summary);
    showToast(result === "shared" ? "Shared" : "Copied");
  });
  root.appendChild(exportBtn);

  const customRow = document.createElement("div");
  customRow.style.cssText = "display:none;gap:10px;margin-top:10px";
  customRow.innerHTML = `
    <input type="date" id="from-date" style="flex:1" />
    <input type="date" id="to-date" style="flex:1" />
  `;
  root.appendChild(customRow);
  const fromInput = customRow.querySelector<HTMLInputElement>("#from-date")!;
  const toInput = customRow.querySelector<HTMLInputElement>("#to-date")!;
  fromInput.value = customFrom;
  toInput.value = customTo;

  const trendSection = document.createElement("div");
  trendSection.className = "card";
  trendSection.style.marginTop = "16px";
  root.appendChild(trendSection);

  const breakdownSection = document.createElement("div");
  breakdownSection.className = "card";
  breakdownSection.style.marginTop = "16px";
  root.appendChild(breakdownSection);

  const sparkSection = document.createElement("div");
  sparkSection.className = "card";
  sparkSection.style.marginTop = "16px";
  root.appendChild(sparkSection);

  const tableSection = document.createElement("div");
  tableSection.style.marginTop = "20px";
  root.appendChild(tableSection);

  function renderRangeBar(): void {
    const options: { key: RangeKey; label: string }[] = [
      { key: "7", label: "7d" },
      { key: "30", label: "30d" },
      { key: "90", label: "90d" },
      { key: "all", label: "All-time" },
      { key: "custom", label: "Custom" },
    ];
    rangeBar.innerHTML = options
      .map((o) => `<button class="chip${o.key === rangeKey ? " active" : ""}" data-key="${o.key}">${o.label}</button>`)
      .join("");
    rangeBar.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        rangeKey = btn.dataset.key as RangeKey;
        customRow.style.display = rangeKey === "custom" ? "flex" : "none";
        renderRangeBar();
        refresh();
      });
    });
  }

  fromInput.addEventListener("change", () => {
    customFrom = fromInput.value;
    refresh();
  });
  toInput.addEventListener("change", () => {
    customTo = toInput.value;
    refresh();
  });

  function getRangeBounds(): { start: string; end: string } {
    let start: string;
    const end: string = rangeKey === "custom" ? customTo : todayKey();
    if (rangeKey === "custom") {
      start = customFrom;
    } else if (rangeKey === "all") {
      start = allDays.reduce((min, d) => (d.date < min ? d.date : min), todayKey());
    } else {
      start = addDays(todayKey(), -(Number(rangeKey) - 1));
    }
    return { start, end };
  }

  async function getFilteredDays(): Promise<DayRecord[]> {
    const { start, end } = getRangeBounds();
    return getDaysInRange(start, end);
  }

  function renderTrend(days: DayRecord[]): void {
    trendSection.innerHTML = `<h3 style="margin-bottom:10px">Daily Completion %</h3>`;
    if (days.length < 7) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = `Log ${7 - days.length} more day${7 - days.length === 1 ? "" : "s"} to see your first trend.`;
      trendSection.appendChild(p);
      return;
    }
    const chart = document.createElement("div");
    chart.style.cssText = "display:flex;gap:3px;align-items:flex-end;height:100px;overflow-x:auto";
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((d) => {
      const pct = completionPct(d);
      const bar = document.createElement("div");
      bar.title = `${d.date}: ${Math.round(pct * 100)}%`;
      bar.style.cssText = `flex:0 0 8px;height:${Math.max(4, Math.round(pct * 100))}%;background:var(--gold);border-radius:2px`;
      chart.appendChild(bar);
    });
    trendSection.appendChild(chart);

    const avg = sorted.reduce((sum, d) => sum + completionPct(d), 0) / sorted.length;
    const avgLine = document.createElement("p");
    avgLine.className = "muted";
    avgLine.style.marginTop = "8px";
    avgLine.textContent = `Average: ${Math.round(avg * 100)}% over ${sorted.length} days`;
    trendSection.appendChild(avgLine);
  }

  function renderBreakdown(days: DayRecord[]): void {
    breakdownSection.innerHTML = `<h3 style="margin-bottom:10px">Per-Habit Breakdown</h3>`;
    const select = document.createElement("select");
    select.style.cssText = "width:100%;padding:10px;background:var(--panel-2);border:1px solid var(--line);border-radius:10px";
    habitList.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      if (h === selectedHabit) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      selectedHabit = select.value;
      refresh();
    });
    breakdownSection.appendChild(select);

    const tracked = days.filter((d) => selectedHabit in d.habits);
    const doneCount = tracked.filter((d) => d.habits[selectedHabit]).length;
    const pct = tracked.length ? Math.round((doneCount / tracked.length) * 100) : 0;
    const longest = longestStreakForHabit(days, selectedHabit);

    const stats = document.createElement("div");
    stats.style.cssText = "display:flex;gap:24px;margin-top:14px";
    stats.innerHTML = `
      <div>
        <div class="display" style="font-size:2rem;color:var(--gold)">${pct}%</div>
        <div class="muted" style="font-size:0.8rem">completion</div>
      </div>
      <div>
        <div class="display" style="font-size:2rem;color:var(--teal)">${longest}</div>
        <div class="muted" style="font-size:0.8rem">longest streak</div>
      </div>
    `;
    breakdownSection.appendChild(stats);
  }

  function renderSpark(days: DayRecord[]): void {
    sparkSection.innerHTML = `<h3 style="margin-bottom:10px">Mood / Energy vs Completion</h3>`;
    if (days.length === 0) {
      sparkSection.innerHTML += `<p class="muted">No data in this range.</p>`;
      return;
    }
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    const rows: { label: string; color: string; values: number[] }[] = [
      { label: "Completion", color: "var(--gold)", values: sorted.map((d) => completionPct(d) * 100) },
      { label: "Mood", color: "var(--velvet)", values: sorted.map((d) => (d.mood / 10) * 100) },
      { label: "Energy", color: "var(--teal)", values: sorted.map((d) => (d.energy / 10) * 100) },
    ];
    rows.forEach((row) => {
      const wrap = document.createElement("div");
      wrap.style.marginTop = "10px";
      wrap.innerHTML = `<div class="muted" style="font-size:0.75rem;margin-bottom:4px">${row.label}</div>`;
      const bars = document.createElement("div");
      bars.style.cssText = "display:flex;gap:2px;align-items:flex-end;height:36px;overflow-x:auto";
      row.values.forEach((v) => {
        const bar = document.createElement("div");
        bar.style.cssText = `flex:0 0 6px;height:${Math.max(4, Math.round(v))}%;background:${row.color};border-radius:2px`;
        bars.appendChild(bar);
      });
      wrap.appendChild(bars);
      sparkSection.appendChild(wrap);
    });
  }

  function renderTable(days: DayRecord[]): void {
    tableSection.innerHTML = `<h3 style="margin-bottom:10px">Log Table</h3>`;

    const filterRow = document.createElement("div");
    filterRow.style.cssText = "margin-bottom:10px";
    const filterSelect = document.createElement("select");
    filterSelect.style.cssText = "width:100%;padding:10px;background:var(--panel-2);border:1px solid var(--line);border-radius:10px";
    filterSelect.innerHTML = `<option value="">Show all days</option>` +
      habitList.map((h) => `<option value="${h}" ${h === skipFilterHabit ? "selected" : ""}>Only days I skipped: ${h}</option>`).join("");
    filterSelect.addEventListener("change", () => {
      skipFilterHabit = filterSelect.value;
      refresh();
    });
    filterRow.appendChild(filterSelect);
    tableSection.appendChild(filterRow);

    let rows = skipFilterHabit
      ? days.filter((d) => d.habits[skipFilterHabit] === false)
      : days;

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = a.date.localeCompare(b.date);
      else if (sortCol === "pct") cmp = completionPct(a) - completionPct(b);
      else if (sortCol === "mood") cmp = a.mood - b.mood;
      else if (sortCol === "energy") cmp = a.energy - b.energy;
      return sortDir === "asc" ? cmp : -cmp;
    });

    if (rows.length === 0) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "No days match this filter.";
      tableSection.appendChild(p);
      return;
    }

    const scrollWrap = document.createElement("div");
    scrollWrap.style.cssText = "overflow-x:auto";
    const table = document.createElement("table");
    table.style.cssText = "border-collapse:collapse;width:100%;font-size:0.85rem;white-space:nowrap";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const columns: { key: SortCol | "habit"; label: string; habit?: string }[] = [
      { key: "date", label: "Date" },
      ...habitList.map((h) => ({ key: "habit" as const, label: h, habit: h })),
      { key: "pct", label: "Daily %" },
      { key: "mood", label: "Mood" },
      { key: "energy", label: "Energy" },
    ];
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.style.cssText = "text-align:left;padding:8px;border-bottom:1px solid var(--line);color:var(--muted);cursor:pointer";
      const arrow = sortCol === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : "";
      th.textContent = col.label + (col.key !== "habit" ? arrow : "");
      if (col.key !== "habit") {
        th.addEventListener("click", () => {
          if (sortCol === col.key) sortDir = sortDir === "asc" ? "desc" : "asc";
          else {
            sortCol = col.key as SortCol;
            sortDir = "desc";
          }
          renderTable(days);
        });
      }
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((d) => {
      const tr = document.createElement("tr");
      const dateCell = `<td style="padding:8px;border-bottom:1px solid var(--line);color:var(--gold);text-decoration:underline;cursor:pointer" data-date="${d.date}">${d.date}</td>`;
      const habitCells = habitList
        .map((h) => {
          const exists = h in d.habits;
          const mark = !exists ? "–" : d.habits[h] ? "✓" : "–";
          const color = !exists ? "var(--muted)" : d.habits[h] ? "var(--teal)" : "var(--muted)";
          return `<td style="padding:8px;border-bottom:1px solid var(--line);color:${color};text-align:center">${mark}</td>`;
        })
        .join("");
      const pct = Math.round(completionPct(d) * 100);
      tr.innerHTML = `
        ${dateCell}
        ${habitCells}
        <td style="padding:8px;border-bottom:1px solid var(--line)">${pct}%</td>
        <td style="padding:8px;border-bottom:1px solid var(--line)">${d.mood}</td>
        <td style="padding:8px;border-bottom:1px solid var(--line)">${d.energy}</td>
      `;
      tr.querySelector<HTMLTableCellElement>("td[data-date]")!.addEventListener("click", () => {
        navigate("call-sheet", d.date);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scrollWrap.appendChild(table);
    tableSection.appendChild(scrollWrap);
  }

  async function refresh(): Promise<void> {
    const days = await getFilteredDays();
    renderTrend(days);
    renderBreakdown(days);
    renderSpark(days);
    renderTable(days);
  }

  renderRangeBar();
  await refresh();
}
