import { getIdeaTags, IDEA_TAG_CAP, setIdeaTags } from "../lib/db";
import { navigate } from "../lib/router";
import { iconChevronLeft, iconPlus, iconTrash } from "../lib/icons";
import { showToast } from "../lib/toast";

export async function mount(container: HTMLElement): Promise<void> {
  const list = await getIdeaTags();

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back-btn" aria-label="Back">${iconChevronLeft}</button>
      <h1>Edit Tags</h1>
      <div style="width:44px"></div>
    </div>
    <p class="muted" style="margin:12px 0 16px">
      Up to ${IDEA_TAG_CAP} tags. Renaming or removing a tag here doesn't change ideas
      already saved under it — they keep the tag they were logged with.
    </p>
    <div id="tag-rows" style="display:flex;flex-direction:column;gap:10px"></div>
    <button id="add-btn" class="card" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;width:100%;color:var(--gold);font-weight:600">
      ${iconPlus} Add Tag
    </button>
  `;
  container.appendChild(root);

  root.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => {
    navigate("ideas");
  });

  const rowsEl = root.querySelector<HTMLDivElement>("#tag-rows")!;
  const addBtn = root.querySelector<HTMLButtonElement>("#add-btn")!;

  async function persist(): Promise<void> {
    await setIdeaTags(list);
    showToast("Saved");
    renderRows();
  }

  function renderRows(focusLast = false): void {
    rowsEl.innerHTML = "";
    list.forEach((tag, idx) => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 12px";
      row.innerHTML = `
        <input type="text" value="${escapeHtml(tag)}" style="flex:1;background:transparent;border:none;padding:6px 0" />
        <button class="icon-btn" aria-label="Remove tag" style="color:var(--velvet)">${iconTrash}</button>
      `;
      const input = row.querySelector<HTMLInputElement>("input")!;
      const removeBtn = row.querySelector<HTMLButtonElement>("button")!;

      input.addEventListener("blur", async () => {
        const trimmed = input.value.trim();
        list[idx] = trimmed || tag;
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

    addBtn.style.display = list.length >= IDEA_TAG_CAP ? "none" : "flex";
  }

  addBtn.addEventListener("click", async () => {
    if (list.length >= IDEA_TAG_CAP) return;
    list.push("New Tag");
    await setIdeaTags(list);
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
