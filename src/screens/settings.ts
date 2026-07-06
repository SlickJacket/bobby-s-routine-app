import {
  addDays,
  exportBackup,
  getHabitList,
  HABIT_LIST_CAP,
  importBackup,
  isValidBackup,
  setHabitList,
  todayKey,
} from "../lib/db";
import { navigate } from "../lib/router";
import { iconChevronLeft, iconDownload, iconPlus, iconTrash, iconUpload } from "../lib/icons";
import { showToast } from "../lib/toast";
import { generateSummary, shareOrCopy } from "../lib/export";

export async function mount(container: HTMLElement): Promise<void> {
  const list = await getHabitList();

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back-btn" aria-label="Back">${iconChevronLeft}</button>
      <h1>Edit Cues</h1>
      <div style="width:44px"></div>
    </div>
    <p class="muted" style="margin:12px 0 16px">
      Up to ${HABIT_LIST_CAP} cues. Changing a name here only affects today onward —
      past days keep the names they were logged with.
    </p>
    <div id="habit-rows" style="display:flex;flex-direction:column;gap:10px"></div>
    <button id="add-btn" class="card" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;width:100%;color:var(--gold);font-weight:600">
      ${iconPlus} Add Cue
    </button>

    <h3 style="margin-top:28px">Weekly Review Export</h3>
    <p class="muted" style="margin:8px 0 12px">
      Generates a plain-text summary you can paste into a claude.ai chat.
    </p>
    <div style="display:flex;gap:10px">
      <input type="date" id="export-from" style="flex:1" />
      <input type="date" id="export-to" style="flex:1" />
    </div>
    <button id="export-btn" class="card" style="margin-top:12px;width:100%;text-align:center;color:var(--gold);font-weight:600">
      Copy / Share Summary
    </button>

    <h3 style="margin-top:28px">Backup & Restore</h3>
    <p class="muted" style="margin:8px 0 12px">
      Everything here lives only on this phone. Download a backup file occasionally so a lost
      or reset phone doesn't mean lost history.
    </p>
    <div style="display:flex;gap:10px">
      <button id="backup-btn" class="card" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold);font-weight:600">
        ${iconDownload} Backup
      </button>
      <button id="restore-btn" class="card" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--velvet);font-weight:600">
        ${iconUpload} Restore
      </button>
    </div>
    <input type="file" id="restore-input" accept="application/json" style="display:none" />
  `;
  container.appendChild(root);

  const exportFrom = root.querySelector<HTMLInputElement>("#export-from")!;
  const exportTo = root.querySelector<HTMLInputElement>("#export-to")!;
  exportFrom.value = addDays(todayKey(), -6);
  exportTo.value = todayKey();

  root.querySelector<HTMLButtonElement>("#export-btn")!.addEventListener("click", async () => {
    const summary = await generateSummary(exportFrom.value, exportTo.value);
    const result = await shareOrCopy(summary);
    showToast(result === "shared" ? "Shared" : "Copied");
  });

  root.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => {
    navigate("call-sheet");
  });

  root.querySelector<HTMLButtonElement>("#backup-btn")!.addEventListener("click", async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bobbys-life-os-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded");
  });

  const restoreInput = root.querySelector<HTMLInputElement>("#restore-input")!;
  root.querySelector<HTMLButtonElement>("#restore-btn")!.addEventListener("click", () => {
    restoreInput.click();
  });

  restoreInput.addEventListener("change", async () => {
    const file = restoreInput.files?.[0];
    restoreInput.value = "";
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      showToast("Not a valid backup file");
      return;
    }

    if (!isValidBackup(parsed)) {
      showToast("Not a valid backup file");
      return;
    }

    const confirmed = window.confirm(
      `Restore this backup? It will replace everything currently on this phone with the ${parsed.days.length} day(s) and ${parsed.ideas.length} idea(s) in this file. This can't be undone.`
    );
    if (!confirmed) return;

    await importBackup(parsed);
    showToast("Restored");
    navigate("call-sheet");
  });

  const rowsEl = root.querySelector<HTMLDivElement>("#habit-rows")!;
  const addBtn = root.querySelector<HTMLButtonElement>("#add-btn")!;

  async function persist(): Promise<void> {
    await setHabitList(list);
    showToast("Saved");
    renderRows();
  }

  function renderRows(focusLast = false): void {
    rowsEl.innerHTML = "";
    list.forEach((habit, idx) => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 12px";
      row.innerHTML = `
        <input type="text" value="${escapeHtml(habit)}" style="flex:1;background:transparent;border:none;padding:6px 0" />
        <button class="icon-btn" aria-label="Remove cue" style="color:var(--velvet)">${iconTrash}</button>
      `;
      const input = row.querySelector<HTMLInputElement>("input")!;
      const removeBtn = row.querySelector<HTMLButtonElement>("button")!;

      input.addEventListener("blur", async () => {
        const trimmed = input.value.trim();
        list[idx] = trimmed || habit;
        await persist();
      });

      removeBtn.addEventListener("click", async () => {
        list.splice(idx, 1);
        await persist();
      });

      rowsEl.appendChild(row);
      if (focusLast && idx === list.length - 1) {
        input.focus();
      }
    });

    addBtn.style.display = list.length >= HABIT_LIST_CAP ? "none" : "flex";
  }

  addBtn.addEventListener("click", async () => {
    if (list.length >= HABIT_LIST_CAP) return;
    list.push("New Cue");
    await setHabitList(list);
    showToast("Saved");
    renderRows(true);
  });

  renderRows();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
