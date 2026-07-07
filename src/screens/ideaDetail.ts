import { addProject, addType, deleteIdea, getIdea, getProjects, getTypes, updateIdea } from "../lib/db";
import { getRouteParam, navigate } from "../lib/router";
import {
  iconArrowDown,
  iconArrowUp,
  iconBook,
  iconChevronLeft,
  iconEye,
  iconFileUp,
  iconPlus,
  iconTrash,
  iconX,
} from "../lib/icons";
import { REFERENCE_CATEGORIES } from "../lib/reference";
import { showToast } from "../lib/toast";
import { renderMarkdown } from "../lib/markdown";
import { renderScreenplay } from "../lib/screenplay";
import { parseFountain } from "../lib/fountain";
import { parseFdx } from "../lib/fdx";
import { SAVE_THE_CAT_BEATS } from "../lib/beatSheet";
import { parseBeatBoard, renderBeatBoard, serializeBeatBoard } from "../lib/beatBoard";
import {
  GENRES,
  PRIORITIES,
  STAGES,
  type Genre,
  type Idea,
  type Page,
  type PageTemplate,
  type Priority,
  type Stage,
} from "../lib/types";

const TEMPLATE_LABELS: Record<PageTemplate, string> = {
  brainstorm: "Brainstorm",
  beatsheet: "Beat Sheet",
  beatboard: "Beat Board",
  screenplay: "Screenplay",
  bitlist: "Bit List",
  characters: "Character Notes",
  blank: "Blank",
  "imported-script": "Imported Script",
};

const STARTER_CONTENT: Record<PageTemplate, string> = {
  brainstorm:
    "## Logline\n\n\n## Genre\n\n\n## Premise\n\n\n## Comparable Titles\n\n\n## What's funny about it\n\n\n## Audience\n\n",
  beatsheet: SAVE_THE_CAT_BEATS.map((b) => `## ${b.name} (${b.percent})\n${b.blurb}\n\n`).join(""),
  beatboard: "",
  screenplay: "FADE IN:\n\nINT. LOCATION - DAY\n\nAction goes here.\n\nCHARACTER NAME\nDialogue goes here.\n",
  bitlist: "| Premise | Punchline | Tag(s) |\n| --- | --- | --- |\n|  |  |  |\n",
  characters:
    "## Want (external goal)\n\n\n## Need (internal truth)\n\n\n## Flaw\n\n\n## Voice\n\n\n## Relationships\n\n\n## Arc\n\n",
  blank: "",
  "imported-script": "",
};

const TEMPLATE_DESCRIPTIONS: Record<Exclude<PageTemplate, "imported-script">, string> = {
  brainstorm: "Logline, genre, premise, comps, audience.",
  beatsheet: "Blake Snyder's 15-beat structure, with page guidance.",
  beatboard: "Corkboard: one card per scene across the 15 beats.",
  screenplay: "Monospace, scene/character/dialogue styling.",
  bitlist: "Premise → punchline → tag(s).",
  characters: "Want vs. need, flaw, voice, relationships, arc.",
  blank: "Empty markdown page.",
};

const ADDABLE_TEMPLATES: Exclude<PageTemplate, "imported-script">[] = [
  "brainstorm",
  "beatsheet",
  "beatboard",
  "screenplay",
  "bitlist",
  "characters",
  "blank",
];

function usesScreenplayRendering(template: PageTemplate): boolean {
  return template === "screenplay" || template === "imported-script";
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function populateSelect(select: HTMLSelectElement, options: readonly string[], current: string, extraOption?: string): void {
  select.innerHTML = "";
  options.forEach((opt) => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    if (opt === current) el.selected = true;
    select.appendChild(el);
  });
  if (extraOption) {
    const el = document.createElement("option");
    el.value = "__add__";
    el.textContent = extraOption;
    select.appendChild(el);
  }
}

export async function mount(container: HTMLElement): Promise<void> {
  const id = getRouteParam();
  const loaded = id ? await getIdea(id) : undefined;
  if (!loaded) {
    navigate("green-room");
    return;
  }
  const idea: Idea = loaded;

  let projectsCanonical = await getProjects();
  let typesCanonical = await getTypes();
  let activePageId: string | null = null;

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back-btn" aria-label="Back">${iconChevronLeft}</button>
      <h1>Idea</h1>
      <button class="icon-btn" id="delete-idea-btn" aria-label="Delete idea" style="color:var(--velvet)">${iconTrash}</button>
    </div>

    <div class="card" style="margin-top:14px">
      <input type="text" id="title-input" placeholder="Title" style="font-weight:700;font-size:1.1rem;background:transparent;border:none;padding:6px 0;width:100%" />
      <textarea id="oneliner-input" rows="2" placeholder="One-liner"></textarea>
      <div class="detail-meta-grid">
        <label>Type<select id="type-select"></select></label>
        <label>Project<select id="project-select"></select></label>
        <label>Priority<select id="priority-select"></select></label>
        <label>Stage<select id="stage-select"></select></label>
        <label>Genre<select id="genre-select"></select></label>
      </div>
      <button class="icon-btn" id="inspiration-btn" style="width:auto;gap:6px;margin-top:12px;color:var(--teal)">
        ${iconBook}<span style="font-size:0.85rem;font-weight:600">Need inspiration?</span>
      </button>
    </div>

    <div id="import-banner"></div>

    <div class="pages-layout" id="pages-layout">
      <div class="pages-sidebar" id="pages-sidebar">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>Pages</h3>
          <button class="icon-btn" id="add-page-btn" aria-label="Add page">${iconPlus}</button>
        </div>
        <div id="pages-list" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
        <button class="icon-btn" id="import-script-btn" style="width:auto;gap:6px;margin-top:14px;color:var(--gold)">
          ${iconFileUp}<span style="font-size:0.85rem;font-weight:600">Import Script</span>
        </button>
        <input type="file" id="import-input" accept=".fountain,.fdx,.fadein" style="display:none" />
      </div>
      <div class="pages-editor" id="pages-editor"></div>
    </div>
  `;
  container.appendChild(root);

  root.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => navigate("green-room"));

  const titleInput = root.querySelector<HTMLInputElement>("#title-input")!;
  const onelinerInput = root.querySelector<HTMLTextAreaElement>("#oneliner-input")!;
  const typeSelect = root.querySelector<HTMLSelectElement>("#type-select")!;
  const projectSelect = root.querySelector<HTMLSelectElement>("#project-select")!;
  const prioritySelect = root.querySelector<HTMLSelectElement>("#priority-select")!;
  const stageSelect = root.querySelector<HTMLSelectElement>("#stage-select")!;
  const genreSelect = root.querySelector<HTMLSelectElement>("#genre-select")!;
  const importBannerEl = root.querySelector<HTMLDivElement>("#import-banner")!;
  const pagesLayoutEl = root.querySelector<HTMLDivElement>("#pages-layout")!;
  const pagesListEl = root.querySelector<HTMLDivElement>("#pages-list")!;
  const editorEl = root.querySelector<HTMLDivElement>("#pages-editor")!;
  const addPageBtn = root.querySelector<HTMLButtonElement>("#add-page-btn")!;
  const importScriptBtn = root.querySelector<HTMLButtonElement>("#import-script-btn")!;
  const importInput = root.querySelector<HTMLInputElement>("#import-input")!;

  titleInput.value = idea.title;
  onelinerInput.value = idea.oneLiner;
  populateSelect(prioritySelect, PRIORITIES, idea.priority);
  populateSelect(stageSelect, STAGES, idea.stage);
  populateSelect(genreSelect, GENRES, idea.genre);

  function refreshProjectSelect(): void {
    const options = Array.from(new Set([...projectsCanonical, idea.project]));
    populateSelect(projectSelect, options, idea.project, "+ Add project...");
  }
  refreshProjectSelect();

  function refreshTypeSelect(): void {
    const options = Array.from(new Set([...typesCanonical, idea.type]));
    populateSelect(typeSelect, options, idea.type, "+ Add type...");
  }
  refreshTypeSelect();

  async function persistIdea(): Promise<void> {
    idea.updatedAt = new Date().toISOString();
    await updateIdea(idea);
  }

  titleInput.addEventListener("blur", async () => {
    idea.title = titleInput.value.trim() || idea.title;
    await persistIdea();
  });

  onelinerInput.addEventListener("blur", async () => {
    idea.oneLiner = onelinerInput.value;
    await persistIdea();
  });

  typeSelect.addEventListener("change", async () => {
    if (typeSelect.value === "__add__") {
      const name = window.prompt("New type name:")?.trim();
      if (!name) {
        refreshTypeSelect();
        return;
      }
      typesCanonical = await addType(name);
      idea.type = name;
    } else {
      idea.type = typeSelect.value;
    }
    await persistIdea();
    refreshTypeSelect();
  });

  prioritySelect.addEventListener("change", async () => {
    idea.priority = prioritySelect.value as Priority;
    await persistIdea();
  });

  stageSelect.addEventListener("change", async () => {
    idea.stage = stageSelect.value as Stage;
    await persistIdea();
  });

  genreSelect.addEventListener("change", async () => {
    idea.genre = genreSelect.value as Genre;
    await persistIdea();
  });

  projectSelect.addEventListener("change", async () => {
    if (projectSelect.value === "__add__") {
      const name = window.prompt("New project name:")?.trim();
      if (!name) {
        refreshProjectSelect();
        return;
      }
      projectsCanonical = await addProject(name);
      idea.project = name;
    } else {
      idea.project = projectSelect.value;
    }
    await persistIdea();
    refreshProjectSelect();
  });

  root.querySelector<HTMLButtonElement>("#inspiration-btn")!.addEventListener("click", () => {
    const matches = REFERENCE_CATEGORIES.some((c) => c.key === idea.type);
    navigate("green-room-reference", matches ? idea.type : undefined);
  });

  root.querySelector<HTMLButtonElement>("#delete-idea-btn")!.addEventListener("click", async () => {
    const confirmed = window.confirm(`Delete "${idea.title}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteIdea(idea.id);
    navigate("green-room");
  });

  function renderPagesList(): void {
    pagesListEl.innerHTML = "";
    const sorted = [...idea.pages].sort((a, b) => a.order - b.order);

    if (sorted.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No pages yet.";
      pagesListEl.appendChild(empty);
      return;
    }

    sorted.forEach((page, idx) => {
      const row = document.createElement("div");
      row.className = `card page-row${page.id === activePageId ? " active" : ""}`;
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(page.title)}</p>
            <p class="muted" style="font-size:0.75rem">${TEMPLATE_LABELS[page.template]}</p>
          </div>
          <div style="display:flex;flex-direction:column">
            <button class="icon-btn move-up" aria-label="Move up" style="width:26px;height:26px">${iconArrowUp}</button>
            <button class="icon-btn move-down" aria-label="Move down" style="width:26px;height:26px">${iconArrowDown}</button>
          </div>
        </div>
      `;
      const upBtn = row.querySelector<HTMLButtonElement>(".move-up")!;
      const downBtn = row.querySelector<HTMLButtonElement>(".move-down")!;
      upBtn.disabled = idx === 0;
      downBtn.disabled = idx === sorted.length - 1;
      upBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        movePage(page.id, -1);
      });
      downBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        movePage(page.id, 1);
      });
      row.addEventListener("click", () => openPage(page.id));
      pagesListEl.appendChild(row);
    });
  }

  async function movePage(pageId: string, delta: number): Promise<void> {
    const sorted = [...idea.pages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === pageId);
    const swapIdx = idx + delta;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const tmp = sorted[idx].order;
    sorted[idx].order = sorted[swapIdx].order;
    sorted[swapIdx].order = tmp;
    await persistIdea();
    renderPagesList();
  }

  async function deletePage(pageId: string): Promise<void> {
    const confirmed = window.confirm("Delete this page? This can't be undone.");
    if (!confirmed) return;
    idea.pages = idea.pages.filter((p) => p.id !== pageId);
    if (activePageId === pageId) activePageId = null;
    await persistIdea();
    renderPagesList();
    renderEditor();
  }

  function openPage(pageId: string): void {
    activePageId = pageId;
    renderPagesList();
    renderEditor();
    pagesLayoutEl.classList.add("mobile-editor-open");
  }

  function closeEditorMobile(): void {
    activePageId = null;
    pagesLayoutEl.classList.remove("mobile-editor-open");
    renderPagesList();
    renderEditor();
  }

  function renderEditor(): void {
    editorEl.innerHTML = "";
    const page = idea.pages.find((p) => p.id === activePageId);
    if (!page) {
      const msg = document.createElement("p");
      msg.className = "muted";
      msg.textContent = "Select a page, or add one.";
      editorEl.appendChild(msg);
      return;
    }

    const header = document.createElement("div");
    header.className = "editor-header";

    const backBtn = document.createElement("button");
    backBtn.className = "icon-btn back-to-list";
    backBtn.setAttribute("aria-label", "Back to pages");
    backBtn.innerHTML = iconChevronLeft;
    backBtn.addEventListener("click", closeEditorMobile);

    const pageTitleInput = document.createElement("input");
    pageTitleInput.type = "text";
    pageTitleInput.value = page.title;
    pageTitleInput.style.cssText = "flex:1;min-width:0;background:transparent;border:none;font-weight:700";
    pageTitleInput.addEventListener("blur", async () => {
      page.title = pageTitleInput.value.trim() || page.title;
      page.updatedAt = new Date().toISOString();
      await persistIdea();
      renderPagesList();
    });

    const previewToggle = document.createElement("button");
    previewToggle.className = "icon-btn preview-toggle";
    previewToggle.setAttribute("aria-label", "Toggle preview");
    previewToggle.innerHTML = iconEye;

    header.appendChild(backBtn);
    header.appendChild(pageTitleInput);
    if (page.template !== "beatboard") header.appendChild(previewToggle);
    editorEl.appendChild(header);

    if (page.template === "beatboard") {
      const board = renderBeatBoard(parseBeatBoard(page.content), async (cards) => {
        page.content = serializeBeatBoard(cards);
        page.updatedAt = new Date().toISOString();
        await persistIdea();
      });
      editorEl.appendChild(board);

      const deleteBoardBtn = document.createElement("button");
      deleteBoardBtn.className = "icon-btn";
      deleteBoardBtn.style.cssText = "margin-top:14px;color:var(--velvet);width:auto;gap:6px";
      deleteBoardBtn.innerHTML = `${iconTrash}<span style="font-size:0.85rem;font-weight:600">Delete Page</span>`;
      deleteBoardBtn.addEventListener("click", () => deletePage(page.id));
      editorEl.appendChild(deleteBoardBtn);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.className = usesScreenplayRendering(page.template) ? "page-textarea mono" : "page-textarea";
    textarea.value = page.content;
    textarea.rows = 20;

    const previewEl = document.createElement("div");
    previewEl.className = "page-preview";
    previewEl.style.display = "none";

    let previewMode = false;
    previewToggle.addEventListener("click", () => {
      previewMode = !previewMode;
      if (previewMode) {
        previewEl.innerHTML = "";
        if (usesScreenplayRendering(page.template)) previewEl.appendChild(renderScreenplay(textarea.value));
        else previewEl.innerHTML = renderMarkdown(textarea.value);
      }
      textarea.style.display = previewMode ? "none" : "block";
      previewEl.style.display = previewMode ? "block" : "none";
    });

    textarea.addEventListener("blur", async () => {
      page.content = textarea.value;
      page.updatedAt = new Date().toISOString();
      await persistIdea();
    });

    editorEl.appendChild(textarea);
    editorEl.appendChild(previewEl);

    if (page.importMeta) {
      const meta = document.createElement("p");
      meta.className = "muted";
      meta.style.cssText = "font-size:0.75rem;margin-top:10px";
      meta.textContent = `Imported from ${page.importMeta.sourceFilename} (${page.importMeta.sourceFormat.toUpperCase()}) on ${new Date(page.importMeta.importedAt).toLocaleDateString()}`;
      editorEl.appendChild(meta);
    }

    const deletePageBtn = document.createElement("button");
    deletePageBtn.className = "icon-btn";
    deletePageBtn.style.cssText = "margin-top:14px;color:var(--velvet);width:auto;gap:6px";
    deletePageBtn.innerHTML = `${iconTrash}<span style="font-size:0.85rem;font-weight:600">Delete Page</span>`;
    deletePageBtn.addEventListener("click", () => deletePage(page.id));
    editorEl.appendChild(deletePageBtn);
  }

  async function addPage(template: PageTemplate): Promise<void> {
    const now = new Date().toISOString();
    const content =
      template === "beatboard"
        ? serializeBeatBoard(
            SAVE_THE_CAT_BEATS.map((b) => ({ id: crypto.randomUUID(), beat: b.name, text: "", order: 0 }))
          )
        : STARTER_CONTENT[template];
    const page: Page = {
      id: crypto.randomUUID(),
      title: TEMPLATE_LABELS[template],
      template,
      content,
      order: idea.pages.length,
      createdAt: now,
      updatedAt: now,
    };
    idea.pages.push(page);
    await persistIdea();
    renderPagesList();
    openPage(page.id);
  }

  function openTemplatePicker(): void {
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    const sheet = document.createElement("div");
    sheet.className = "sheet card";
    sheet.innerHTML = `<p class="muted" style="margin-bottom:10px">Add a page</p>`;

    const grid = document.createElement("div");
    grid.className = "template-grid";
    ADDABLE_TEMPLATES.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "card template-option";
      btn.innerHTML = `<p style="font-weight:700">${TEMPLATE_LABELS[key]}</p><p class="muted" style="font-size:0.8rem;margin-top:4px">${TEMPLATE_DESCRIPTIONS[key]}</p>`;
      btn.addEventListener("click", async () => {
        await addPage(key);
        overlay.remove();
      });
      grid.appendChild(btn);
    });
    sheet.appendChild(grid);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  addPageBtn.addEventListener("click", openTemplatePicker);

  function showImportSuggestion(): void {
    importBannerEl.innerHTML = "";
    const banner = document.createElement("div");
    banner.className = "card suggestion-banner";

    const label = document.createElement("span");
    label.style.flex = "1";
    label.textContent = "This looks script-ready — move to Polishing?";

    const moveBtn = document.createElement("button");
    moveBtn.className = "icon-btn";
    moveBtn.style.cssText = "width:auto;color:var(--gold);font-weight:700";
    moveBtn.textContent = "Move";
    moveBtn.addEventListener("click", async () => {
      idea.stage = "Polishing";
      stageSelect.value = idea.stage;
      await persistIdea();
      importBannerEl.innerHTML = "";
      showToast("Moved to Polishing");
    });

    const dismissBtn = document.createElement("button");
    dismissBtn.className = "icon-btn";
    dismissBtn.setAttribute("aria-label", "Dismiss");
    dismissBtn.innerHTML = iconX;
    dismissBtn.addEventListener("click", () => {
      importBannerEl.innerHTML = "";
    });

    banner.appendChild(label);
    banner.appendChild(moveBtn);
    banner.appendChild(dismissBtn);
    importBannerEl.appendChild(banner);
  }

  importScriptBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    importInput.value = "";
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    let format: "fountain" | "fdx";
    if (lowerName.endsWith(".fountain")) {
      format = "fountain";
    } else if (lowerName.endsWith(".fdx")) {
      format = "fdx";
    } else if (lowerName.endsWith(".fadein")) {
      showToast("Fade In's native format isn't supported — export as Fountain or Final Draft XML from Fade In first.", 4500);
      return;
    } else {
      showToast("Unsupported file — use a .fountain or .fdx export from Fade In.", 4000);
      return;
    }

    const raw = await file.text();
    let content: string;
    try {
      content = format === "fountain" ? parseFountain(raw) : parseFdx(raw);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not parse this file.", 4000);
      return;
    }

    const now = new Date().toISOString();
    const page: Page = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.(fountain|fdx)$/i, ""),
      template: "imported-script",
      content,
      order: idea.pages.length,
      createdAt: now,
      updatedAt: now,
      importMeta: { sourceFilename: file.name, sourceFormat: format, importedAt: now },
    };
    idea.pages.push(page);
    await persistIdea();
    renderPagesList();
    openPage(page.id);
    showToast("Imported");

    if (idea.stage !== "Polishing" && idea.stage !== "Performed/Published") {
      showImportSuggestion();
    }
  });

  renderPagesList();
  renderEditor();
}
