import {
  addIdea,
  deleteIdea,
  getAllIdeas,
  getIdeaTags,
  getLastTag,
  updateIdea,
} from "../lib/db";
import { navigate } from "../lib/router";
import { iconGear, iconTrash } from "../lib/icons";
import { showToast, showUndoToast } from "../lib/toast";
import type { Idea, IdeaTag } from "../lib/types";

const TAG_PALETTE = ["var(--gold)", "var(--velvet)", "var(--teal)"];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export async function mount(container: HTMLElement): Promise<void> {
  let ideas = await getAllIdeas();
  const tags = await getIdeaTags();
  const lastTag = await getLastTag();
  let currentTag: IdeaTag = tags.includes(lastTag) ? lastTag : (tags[0] ?? "Other");
  let filterTag: IdeaTag | "All" = "All";

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <h1>Ideas</h1>
      <button class="icon-btn" id="tags-btn" aria-label="Edit tags">${iconGear}</button>
    </div>
    <div class="card" style="margin-top:14px">
      <input type="text" id="title-input" placeholder="Title (optional)" style="background:transparent;border:none;padding:6px 0;font-weight:600" />
      <textarea id="idea-input" placeholder="Catch it before it evaporates..." rows="3" style="margin-top:6px"></textarea>
      <div id="tag-chips" class="chip-row" style="margin-top:10px"></div>
      <button id="save-idea-btn" class="card" style="margin-top:12px;width:100%;text-align:center;color:var(--bg);background:var(--gold);font-weight:700;border:none">
        Save
      </button>
    </div>

    <div id="filter-chips" class="chip-row" style="margin-top:20px"></div>
    <div id="idea-list" style="margin-top:14px;display:flex;flex-direction:column;gap:18px"></div>
  `;
  container.appendChild(root);

  root.querySelector<HTMLButtonElement>("#tags-btn")!.addEventListener("click", () => {
    navigate("idea-tags");
  });

  const titleInput = root.querySelector<HTMLInputElement>("#title-input")!;
  const ideaInput = root.querySelector<HTMLTextAreaElement>("#idea-input")!;
  const tagChips = root.querySelector<HTMLDivElement>("#tag-chips")!;
  const saveBtn = root.querySelector<HTMLButtonElement>("#save-idea-btn")!;
  const filterChips = root.querySelector<HTMLDivElement>("#filter-chips")!;
  const listEl = root.querySelector<HTMLDivElement>("#idea-list")!;

  function allKnownTags(): string[] {
    return Array.from(new Set([...tags, ...ideas.map((i) => i.tag)]));
  }

  function renderTagChips(): void {
    tagChips.innerHTML = tags
      .map(
        (tag) =>
          `<button class="chip${tag === currentTag ? " active" : ""}" data-tag="${tag}">${tag}</button>`
      )
      .join("");
    tagChips.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTag = btn.dataset.tag as IdeaTag;
        renderTagChips();
      });
    });
  }

  function renderFilterChips(): void {
    const all: (IdeaTag | "All")[] = ["All", ...allKnownTags()];
    filterChips.innerHTML = all
      .map(
        (tag) =>
          `<button class="chip${tag === filterTag ? " active" : ""}" data-tag="${tag}">${tag}</button>`
      )
      .join("");
    filterChips.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterTag = btn.dataset.tag as IdeaTag | "All";
        renderFilterChips();
        renderList();
      });
    });
  }

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yest)) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function renderList(): void {
    listEl.innerHTML = "";
    const filtered =
      filterTag === "All" ? ideas : ideas.filter((i) => i.tag === filterTag);

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent =
        ideas.length === 0
          ? "No ideas yet. Whatever just happened, write it down."
          : "Nothing tagged this way yet.";
      listEl.appendChild(empty);
      return;
    }

    const groups = new Map<string, Idea[]>();
    for (const idea of filtered) {
      const label = dayLabel(idea.createdAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(idea);
    }

    for (const [label, groupIdeas] of groups) {
      const section = document.createElement("div");
      const heading = document.createElement("h3");
      heading.className = "muted";
      heading.style.cssText = "font-size:0.8rem;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em";
      heading.textContent = label;
      section.appendChild(heading);

      const rows = document.createElement("div");
      rows.style.cssText = "display:flex;flex-direction:column;gap:8px";

      for (const idea of groupIdeas) {
        rows.appendChild(renderIdeaCard(idea));
      }

      section.appendChild(rows);
      listEl.appendChild(section);
    }
  }

  function renderIdeaCard(idea: Idea): HTMLElement {
    const card = document.createElement("div");
    card.className = "card";
    let expanded = false;

    function renderCollapsed(): void {
      const titleHtml = idea.title
        ? `<p style="font-weight:700;margin-bottom:2px">${escapeHtml(idea.title)}</p>`
        : "";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div style="flex:1">
            ${titleHtml}
            <p style="white-space:pre-wrap">${escapeHtml(idea.text)}</p>
          </div>
          <span class="muted" style="font-size:0.7rem;flex-shrink:0">${timeLabel(idea.createdAt)}</span>
        </div>
        <span class="chip" style="margin-top:8px;border-color:${tagColor(idea.tag)};color:${tagColor(idea.tag)}">${idea.tag}</span>
      `;
    }

    function renderExpanded(): void {
      card.innerHTML = "";

      const titleField = document.createElement("input");
      titleField.type = "text";
      titleField.value = idea.title ?? "";
      titleField.placeholder = "Title (optional)";
      titleField.style.cssText = "background:transparent;border:none;padding:6px 0;font-weight:700;width:100%";
      card.appendChild(titleField);

      const textarea = document.createElement("textarea");
      textarea.value = idea.text;
      textarea.rows = 4;
      textarea.style.marginTop = "4px";
      card.appendChild(textarea);

      const chipRow = document.createElement("div");
      chipRow.className = "chip-row";
      chipRow.style.marginTop = "10px";
      const editableTags = Array.from(new Set([...tags, idea.tag]));
      editableTags.forEach((tag) => {
        const chip = document.createElement("button");
        chip.className = `chip${tag === idea.tag ? " active" : ""}`;
        chip.textContent = tag;
        chip.addEventListener("click", async () => {
          idea.tag = tag;
          await updateIdea(idea);
          renderExpanded();
        });
        chipRow.appendChild(chip);
      });
      card.appendChild(chipRow);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "icon-btn";
      deleteBtn.style.cssText = "margin-top:10px;color:var(--velvet);gap:6px;width:auto";
      deleteBtn.innerHTML = `${iconTrash}<span style="font-size:0.85rem;font-weight:600">Delete</span>`;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDelete(idea);
      });
      card.appendChild(deleteBtn);

      titleField.addEventListener("blur", async () => {
        idea.title = titleField.value.trim();
        await updateIdea(idea);
      });

      textarea.addEventListener("blur", async () => {
        idea.text = textarea.value;
        await updateIdea(idea);
      });

      textarea.focus();
    }

    function collapse(): void {
      expanded = false;
      renderCollapsed();
    }

    card.addEventListener("click", (e) => {
      if (expanded) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "BUTTON") return;
      expanded = true;
      renderExpanded();
    });

    document.addEventListener("click", (e) => {
      if (expanded && !card.contains(e.target as Node)) collapse();
    });

    let pressTimer: number | undefined;
    const startPress = () => {
      pressTimer = window.setTimeout(() => handleDelete(idea), 550);
    };
    const cancelPress = () => window.clearTimeout(pressTimer);
    card.addEventListener("pointerdown", startPress);
    card.addEventListener("pointerup", cancelPress);
    card.addEventListener("pointerleave", cancelPress);
    card.addEventListener("pointercancel", cancelPress);

    renderCollapsed();
    return card;
  }

  async function handleDelete(idea: Idea): Promise<void> {
    ideas = ideas.filter((i) => i.id !== idea.id);
    await deleteIdea(idea.id);
    renderList();
    showUndoToast("Idea deleted", async () => {
      await addIdea(idea);
      ideas = await getAllIdeas();
      renderList();
    });
  }

  async function handleSave(): Promise<void> {
    const text = ideaInput.value.trim();
    if (!text) {
      ideaInput.focus();
      return;
    }
    const title = titleInput.value.trim();
    const idea: Idea = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...(title ? { title } : {}),
      text,
      tag: currentTag,
    };
    await addIdea(idea);
    ideas = await getAllIdeas();
    titleInput.value = "";
    ideaInput.value = "";
    showToast("Saved");
    renderList();
    ideaInput.focus();
  }

  saveBtn.addEventListener("click", handleSave);
  ideaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  });

  renderTagChips();
  renderFilterChips();
  renderList();

  ideaInput.focus();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
