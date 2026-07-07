import {
  deleteProject,
  deleteType,
  getProjects,
  getTypes,
  PROJECT_LIST_CAP,
  renameProject,
  renameType,
  setProjects,
  setTypes,
  TYPE_LIST_CAP,
} from "../lib/db";
import { navigate } from "../lib/router";
import { iconChevronLeft, iconPlus, iconTrash } from "../lib/icons";
import { showToast } from "../lib/toast";

const FALLBACK_TYPE = "Other";
const FALLBACK_PROJECT = "Unassigned";

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

interface FieldApi {
  setList: (list: string[]) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  remove: (name: string) => Promise<void>;
}

function mountFieldEditor(
  rowsEl: HTMLDivElement,
  addBtn: HTMLButtonElement,
  list: string[],
  fallback: string,
  cap: number,
  api: FieldApi
): void {
  function renderRows(focusLast = false): void {
    rowsEl.innerHTML = "";
    list.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 12px";
      row.innerHTML = `
        <input type="text" value="${escapeHtml(name)}" style="flex:1;background:transparent;border:none;padding:6px 0" />
        <button class="icon-btn" aria-label="Remove" style="color:var(--velvet)"${name === fallback ? " disabled" : ""}>${iconTrash}</button>
      `;
      const input = row.querySelector<HTMLInputElement>("input")!;
      const removeBtn = row.querySelector<HTMLButtonElement>("button")!;

      input.addEventListener("blur", async () => {
        const trimmed = input.value.trim();
        if (!trimmed || trimmed === name) {
          input.value = name;
          return;
        }
        const oldName = name;
        list[idx] = trimmed;
        await api.setList(list);
        await api.rename(oldName, trimmed);
        showToast("Saved");
        renderRows();
      });

      removeBtn.addEventListener("click", async () => {
        if (name === fallback) return;
        list.splice(idx, 1);
        await api.setList(list);
        await api.remove(name);
        showToast("Saved");
        renderRows();
      });

      rowsEl.appendChild(row);
      if (focusLast && idx === list.length - 1) input.focus();
    });

    addBtn.style.display = list.length >= cap ? "none" : "flex";
  }

  addBtn.addEventListener("click", async () => {
    if (list.length >= cap) return;
    list.push("New");
    await api.setList(list);
    renderRows(true);
  });

  renderRows();
}

export async function mount(container: HTMLElement): Promise<void> {
  const types = await getTypes();
  const projects = await getProjects();

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back-btn" aria-label="Back">${iconChevronLeft}</button>
      <h1>Types &amp; Projects</h1>
      <div style="width:44px"></div>
    </div>

    <h3 style="margin-top:18px">Types</h3>
    <p class="muted" style="margin:8px 0 12px">
      Renaming a type updates every idea using it. Deleting reassigns those ideas to
      "${FALLBACK_TYPE}" — "${FALLBACK_TYPE}" itself can't be deleted.
    </p>
    <div id="type-rows" style="display:flex;flex-direction:column;gap:10px"></div>
    <button id="add-type-btn" class="card" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;width:100%;color:var(--gold);font-weight:600">
      ${iconPlus} Add Type
    </button>

    <h3 style="margin-top:28px">Projects</h3>
    <p class="muted" style="margin:8px 0 12px">
      Renaming a project updates every idea using it. Deleting reassigns those ideas to
      "${FALLBACK_PROJECT}" — "${FALLBACK_PROJECT}" itself can't be deleted.
    </p>
    <div id="project-rows" style="display:flex;flex-direction:column;gap:10px"></div>
    <button id="add-project-btn" class="card" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;width:100%;color:var(--gold);font-weight:600">
      ${iconPlus} Add Project
    </button>
  `;
  container.appendChild(root);

  root.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => navigate("green-room"));

  mountFieldEditor(
    root.querySelector<HTMLDivElement>("#type-rows")!,
    root.querySelector<HTMLButtonElement>("#add-type-btn")!,
    types,
    FALLBACK_TYPE,
    TYPE_LIST_CAP,
    { setList: setTypes, rename: renameType, remove: deleteType }
  );

  mountFieldEditor(
    root.querySelector<HTMLDivElement>("#project-rows")!,
    root.querySelector<HTMLButtonElement>("#add-project-btn")!,
    projects,
    FALLBACK_PROJECT,
    PROJECT_LIST_CAP,
    { setList: setProjects, rename: renameProject, remove: deleteProject }
  );
}
