import { addIdea, getAllIdeas, getProjects, getTypes, updateIdea } from "../lib/db";
import { navigate } from "../lib/router";
import { iconBook, iconExternalLink, iconFilter, iconGear, iconMic, iconPlus } from "../lib/icons";
import { showToast } from "../lib/toast";
import { GREEN_ROOM_LABEL } from "../lib/config";
import { GENRES, PRIORITIES, STAGES, type Idea, type Priority } from "../lib/types";

const TAG_PALETTE = ["var(--gold)", "var(--velvet)", "var(--teal)"];
const DESKTOP_BREAKPOINT = 820;
const VIEW_STORAGE_KEY = "greenRoomView";

type ViewMode = "list" | "kanban";
type SortKey = "title" | "type" | "project" | "priority" | "stage" | "genre" | "updatedAt";

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function isDesktopWidth(): boolean {
  return window.innerWidth >= DESKTOP_BREAKPOINT;
}

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

function priorityBadge(p: Priority): string {
  if (p === "Hot") {
    return `<span class="chip" style="border-color:var(--velvet);color:var(--velvet)">🔥 Hot</span>`;
  }
  const color = p === "High" ? "var(--gold)" : p === "Normal" ? "var(--teal)" : "var(--muted)";
  return `<span class="priority-dot-row"><span class="priority-dot" style="background:${color}"></span>${p}</span>`;
}

function sortLabel(key: SortKey): string {
  switch (key) {
    case "title":
      return "Title";
    case "type":
      return "Type";
    case "project":
      return "Project";
    case "priority":
      return "Priority";
    case "stage":
      return "Stage";
    case "genre":
      return "Genre";
    case "updatedAt":
      return "Updated";
  }
}

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

export async function mount(container: HTMLElement): Promise<void> {
  let ideasList = await getAllIdeas();
  let projectsCanonical = await getProjects();
  let typesCanonical = await getTypes();

  let viewMode: ViewMode = localStorage.getItem(VIEW_STORAGE_KEY) === "kanban" ? "kanban" : "list";
  let sortKey: SortKey = "updatedAt";
  let sortDir: "asc" | "desc" = "desc";
  let filtersOpen = false;
  const filterTypes = new Set<string>();
  const filterProjects = new Set<string>();
  const filterPriorities = new Set<string>();
  const filterStages = new Set<string>();
  const filterGenres = new Set<string>();

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <h1>${GREEN_ROOM_LABEL}</h1>
      <div class="chip-row" id="view-toggle">
        <button class="chip" data-view="list">List</button>
        <button class="chip" data-view="kanban">Kanban</button>
      </div>
      <button class="icon-btn" id="reference-btn" aria-label="Reference">${iconBook}</button>
      <button class="icon-btn" id="settings-btn" aria-label="Types & projects">${iconGear}</button>
    </div>

    <div class="card" style="margin-top:14px">
      <div style="display:flex;gap:8px;align-items:center">
        <input type="text" id="capture-input" placeholder="Catch it before it evaporates..." style="flex:1" />
        <button id="mic-btn" class="icon-btn" aria-label="Voice capture" style="display:none">${iconMic}</button>
        <button id="capture-save-btn" class="icon-btn" aria-label="Save idea" style="color:var(--gold)">${iconPlus}</button>
      </div>
    </div>

    <div id="filter-bar" style="margin-top:16px"></div>
    <div id="green-room-body" style="margin-top:14px"></div>
  `;
  container.appendChild(root);

  const viewToggle = root.querySelector<HTMLDivElement>("#view-toggle")!;
  const captureInput = root.querySelector<HTMLInputElement>("#capture-input")!;
  const micBtn = root.querySelector<HTMLButtonElement>("#mic-btn")!;
  const captureSaveBtn = root.querySelector<HTMLButtonElement>("#capture-save-btn")!;
  const filterBarEl = root.querySelector<HTMLDivElement>("#filter-bar")!;
  const bodyEl = root.querySelector<HTMLDivElement>("#green-room-body")!;

  root.querySelector<HTMLButtonElement>("#settings-btn")!.addEventListener("click", () => {
    navigate("green-room-settings");
  });

  root.querySelector<HTMLButtonElement>("#reference-btn")!.addEventListener("click", () => {
    navigate("green-room-reference");
  });

  function knownProjects(): string[] {
    return Array.from(new Set([...projectsCanonical, ...ideasList.map((i) => i.project)]));
  }

  function knownTypes(): string[] {
    return Array.from(new Set([...typesCanonical, ...ideasList.map((i) => i.type)]));
  }

  function activeFilterCount(): number {
    return (
      filterTypes.size + filterProjects.size + filterPriorities.size + filterStages.size + filterGenres.size
    );
  }

  function applyFilters(list: Idea[]): Idea[] {
    return list.filter(
      (i) =>
        (filterTypes.size === 0 || filterTypes.has(i.type)) &&
        (filterProjects.size === 0 || filterProjects.has(i.project)) &&
        (filterPriorities.size === 0 || filterPriorities.has(i.priority)) &&
        (filterStages.size === 0 || filterStages.has(i.stage)) &&
        (filterGenres.size === 0 || filterGenres.has(i.genre))
    );
  }

  function sortIdeas(list: Idea[]): Idea[] {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => a[sortKey].localeCompare(b[sortKey]) * dir);
  }

  function filterGroup(label: string, options: readonly string[], activeSet: Set<string>): HTMLElement {
    const wrap = document.createElement("div");
    const heading = document.createElement("p");
    heading.className = "muted";
    heading.style.cssText = "font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px";
    heading.textContent = label;
    wrap.appendChild(heading);

    const row = document.createElement("div");
    row.className = "chip-row";
    options.forEach((opt) => {
      const chip = document.createElement("button");
      chip.className = `chip${activeSet.has(opt) ? " active" : ""}`;
      chip.textContent = opt;
      chip.addEventListener("click", () => {
        if (activeSet.has(opt)) activeSet.delete(opt);
        else activeSet.add(opt);
        renderFilterBar();
        renderBody();
      });
      row.appendChild(chip);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function renderFilterBar(): void {
    filterBarEl.innerHTML = "";
    if (viewMode !== "list") return;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "icon-btn";
    toggleBtn.style.cssText = "width:auto;gap:6px;color:var(--muted)";
    const count = activeFilterCount();
    toggleBtn.innerHTML = `${iconFilter}<span style="font-size:0.85rem;font-weight:600">Filters${count ? ` (${count})` : ""}</span>`;
    toggleBtn.addEventListener("click", () => {
      filtersOpen = !filtersOpen;
      renderFilterBar();
    });
    filterBarEl.appendChild(toggleBtn);

    if (!filtersOpen) return;

    const panel = document.createElement("div");
    panel.className = "card";
    panel.style.cssText = "margin-top:10px;display:flex;flex-direction:column;gap:12px";
    panel.appendChild(filterGroup("Type", knownTypes(), filterTypes));
    panel.appendChild(filterGroup("Project", knownProjects(), filterProjects));
    panel.appendChild(filterGroup("Priority", PRIORITIES, filterPriorities));
    panel.appendChild(filterGroup("Stage", STAGES, filterStages));
    panel.appendChild(filterGroup("Genre", GENRES, filterGenres));
    filterBarEl.appendChild(panel);
  }

  function renderList(): void {
    bodyEl.innerHTML = "";
    const rows = sortIdeas(applyFilters(ideasList));

    const sortSelect = document.createElement("select");
    sortSelect.className = "mobile-sort-select";
    (["updatedAt", "title", "type", "project", "priority", "stage", "genre"] as SortKey[]).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `Sort: ${sortLabel(key)}`;
      if (key === sortKey) opt.selected = true;
      sortSelect.appendChild(opt);
    });
    sortSelect.addEventListener("change", () => {
      sortKey = sortSelect.value as SortKey;
      renderList();
    });
    bodyEl.appendChild(sortSelect);

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.style.marginTop = "12px";
      empty.textContent =
        ideasList.length === 0
          ? "No ideas yet. Whatever just happened, write it down."
          : "Nothing matches these filters.";
      bodyEl.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrap";
    const table = document.createElement("table");
    table.className = "idea-table";

    const cols: { key: SortKey; label: string }[] = [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "project", label: "Project" },
      { key: "priority", label: "Priority" },
      { key: "stage", label: "Stage" },
      { key: "genre", label: "Genre" },
      { key: "updatedAt", label: "Updated" },
    ];

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    cols.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label + (col.key === sortKey ? (sortDir === "asc" ? " ▲" : " ▼") : "");
      th.addEventListener("click", () => {
        if (sortKey === col.key) sortDir = sortDir === "asc" ? "desc" : "asc";
        else {
          sortKey = col.key;
          sortDir = "asc";
        }
        renderList();
      });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((idea) => {
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      tr.addEventListener("click", () => navigate("green-room-detail", idea.id));

      const cells: [string, string][] = [
        ["Title", idea.title],
        ["Type", idea.type],
        ["Project", idea.project],
        ["Priority", idea.priority],
        ["Stage", idea.stage],
        ["Genre", idea.genre],
        ["Updated", formatUpdated(idea.updatedAt)],
      ];
      cells.forEach(([label, value]) => {
        const td = document.createElement("td");
        td.dataset.label = label;
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    bodyEl.appendChild(wrapper);
  }

  function openStageSheet(idea: Idea): void {
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";

    const sheet = document.createElement("div");
    sheet.className = "sheet card";
    sheet.innerHTML = `<p class="muted" style="margin-bottom:10px">Move "${escapeHtml(idea.title)}" to:</p>`;

    STAGES.forEach((stage) => {
      const btn = document.createElement("button");
      btn.className = `card sheet-option${stage === idea.stage ? " active" : ""}`;
      btn.textContent = stage;
      btn.addEventListener("click", async () => {
        if (stage !== idea.stage) {
          idea.stage = stage;
          idea.updatedAt = new Date().toISOString();
          await updateIdea(idea);
          renderKanban();
        }
        overlay.remove();
      });
      sheet.appendChild(btn);
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  function renderKanbanCard(idea: Idea): HTMLElement {
    const card = document.createElement("div");
    card.className = "card kanban-card";
    card.draggable = isDesktopWidth();

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
        <p style="font-weight:700;flex:1">${escapeHtml(idea.title)}</p>
        <button class="icon-btn open-btn" aria-label="Open" style="width:28px;height:28px;color:var(--muted)">${iconExternalLink}</button>
      </div>
      <div class="chip-row" style="margin-top:8px;gap:6px">
        <span class="chip" style="border-color:${tagColor(idea.type)};color:${tagColor(idea.type)}">${idea.type}</span>
        <span class="chip">${escapeHtml(idea.project)}</span>
        ${idea.genre !== "N/A" ? `<span class="chip">${escapeHtml(idea.genre)}</span>` : ""}
      </div>
      <div style="margin-top:8px">${priorityBadge(idea.priority)}</div>
    `;

    card.querySelector<HTMLButtonElement>(".open-btn")!.addEventListener("click", (e) => {
      e.stopPropagation();
      navigate("green-room-detail", idea.id);
    });

    card.addEventListener("dragstart", (e) => {
      if (!isDesktopWidth()) return;
      e.dataTransfer?.setData("text/plain", idea.id);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));

    card.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".open-btn")) return;
      if (isDesktopWidth()) navigate("green-room-detail", idea.id);
      else openStageSheet(idea);
    });

    return card;
  }

  function renderKanban(): void {
    bodyEl.innerHTML = "";
    const board = document.createElement("div");
    board.className = "kanban-board";

    STAGES.forEach((stage) => {
      const col = document.createElement("div");
      col.className = "kanban-col";

      const header = document.createElement("h3");
      const count = ideasList.filter((i) => i.stage === stage).length;
      header.innerHTML = `${stage} <span class="muted" style="font-size:0.8rem;font-weight:400">(${count})</span>`;
      col.appendChild(header);

      const dropzone = document.createElement("div");
      dropzone.className = "kanban-cards";
      dropzone.dataset.stage = stage;

      dropzone.addEventListener("dragover", (e) => {
        if (!isDesktopWidth()) return;
        e.preventDefault();
        dropzone.classList.add("drag-over");
      });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        const id = e.dataTransfer?.getData("text/plain");
        const idea = ideasList.find((i) => i.id === id);
        if (!idea || idea.stage === stage) return;
        idea.stage = stage;
        idea.updatedAt = new Date().toISOString();
        await updateIdea(idea);
        renderKanban();
      });

      ideasList.filter((i) => i.stage === stage).forEach((idea) => dropzone.appendChild(renderKanbanCard(idea)));

      col.appendChild(dropzone);
      board.appendChild(col);
    });

    bodyEl.appendChild(board);
  }

  function renderBody(): void {
    if (viewMode === "list") renderList();
    else renderKanban();
  }

  viewToggle.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewMode);
    btn.addEventListener("click", () => {
      viewMode = btn.dataset.view as ViewMode;
      localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
      viewToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderFilterBar();
      renderBody();
    });
  });

  async function handleCapture(): Promise<void> {
    const text = captureInput.value.trim();
    if (!text) {
      captureInput.focus();
      return;
    }
    const now = new Date().toISOString();
    const idea: Idea = {
      id: crypto.randomUUID(),
      title: text.length > 60 ? text.slice(0, 60) : text,
      oneLiner: text,
      createdAt: now,
      updatedAt: now,
      type: "Other",
      project: "Unassigned",
      priority: "Normal",
      stage: "Inbox",
      genre: "N/A",
      pages: [],
    };
    await addIdea(idea);
    ideasList = [idea, ...ideasList];
    captureInput.value = "";
    showToast("Saved");
    renderBody();
  }

  captureSaveBtn.addEventListener("click", handleCapture);
  captureInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCapture();
    }
  });

  function setupMic(): void {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    micBtn.style.display = "flex";

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    let listening = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      captureInput.value = captureInput.value ? `${captureInput.value} ${transcript}` : transcript;
    };
    recognition.onend = () => {
      listening = false;
      micBtn.classList.remove("active");
    };
    recognition.onerror = () => {
      listening = false;
      micBtn.classList.remove("active");
    };

    micBtn.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
        return;
      }
      listening = true;
      micBtn.classList.add("active");
      recognition.start();
    });
  }

  setupMic();

  let resizeTimer: number | undefined;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (viewMode === "kanban" && document.body.contains(bodyEl)) renderKanban();
    }, 150);
  });

  renderFilterBar();
  renderBody();
}
