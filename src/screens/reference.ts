import { getRouteParam, navigate } from "../lib/router";
import { iconChevronLeft } from "../lib/icons";
import { REFERENCE_CATEGORIES, type FilledField, type ReferenceBook, type WorkedExample } from "../lib/reference";

const TAB_STORAGE_KEY = "greenRoomReferenceTab";
const SECTION_STORAGE_KEY = "greenRoomReferenceSection";

type Section = "examples" | "learning";

export async function mount(container: HTMLElement): Promise<void> {
  const param = getRouteParam();
  const storedTab = localStorage.getItem(TAB_STORAGE_KEY);
  const initialKey =
    (param && REFERENCE_CATEGORIES.some((c) => c.key === param) && param) ||
    (storedTab && REFERENCE_CATEGORIES.some((c) => c.key === storedTab) && storedTab) ||
    REFERENCE_CATEGORIES[0].key;

  let activeKey = initialKey;
  let activeSection: Section = localStorage.getItem(SECTION_STORAGE_KEY) === "learning" ? "learning" : "examples";

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back-btn" aria-label="Back">${iconChevronLeft}</button>
      <h1>Reference</h1>
      <div style="width:44px"></div>
    </div>
    <p class="muted" style="margin:12px 0 6px">
      How well-known standup, sketches, stories, films, and clown acts map onto Green
      Room's own templates and tools — plus what their key craft books actually teach.
    </p>
    <p class="muted" style="font-size:0.75rem;margin-bottom:16px">
      Filled-in fields below are reconstructions grounded in each act's real, documented
      material and style — not verbatim transcripts.
    </p>
    <div class="chip-row" id="category-tabs" style="margin-bottom:12px"></div>
    <div class="chip-row" id="section-tabs" style="margin-bottom:16px"></div>
    <div id="category-body"></div>
  `;
  container.appendChild(root);

  root.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => navigate("green-room"));

  const tabsEl = root.querySelector<HTMLDivElement>("#category-tabs")!;
  const sectionTabsEl = root.querySelector<HTMLDivElement>("#section-tabs")!;
  const bodyEl = root.querySelector<HTMLDivElement>("#category-body")!;

  function renderTabs(): void {
    tabsEl.innerHTML = "";
    REFERENCE_CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = `chip${cat.key === activeKey ? " active" : ""}`;
      btn.textContent = cat.label;
      btn.addEventListener("click", () => {
        activeKey = cat.key;
        localStorage.setItem(TAB_STORAGE_KEY, activeKey);
        renderTabs();
        renderBody();
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderSectionTabs(): void {
    sectionTabsEl.innerHTML = "";
    (["examples", "learning"] as Section[]).forEach((section) => {
      const btn = document.createElement("button");
      btn.className = `chip${section === activeSection ? " active" : ""}`;
      btn.textContent = section === "examples" ? "Examples" : "Learning";
      btn.addEventListener("click", () => {
        activeSection = section;
        localStorage.setItem(SECTION_STORAGE_KEY, activeSection);
        renderSectionTabs();
        renderBody();
      });
      sectionTabsEl.appendChild(btn);
    });
  }

  function filledFieldRow(field: FilledField): HTMLElement {
    const row = document.createElement("div");
    row.style.marginTop = "8px";
    const label = document.createElement("p");
    label.className = "muted";
    label.style.cssText = "font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em";
    label.textContent = field.label;
    const value = document.createElement("p");
    value.style.marginTop = "2px";
    value.textContent = field.value;
    row.appendChild(label);
    row.appendChild(value);
    return row;
  }

  function exampleCard(ex: WorkedExample): HTMLElement {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "12px";

    const heading = document.createElement("div");
    heading.style.cssText = "display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap";

    const titleWrap = document.createElement("div");
    const title = document.createElement("p");
    title.style.fontWeight = "700";
    title.textContent = ex.title;
    const creator = document.createElement("p");
    creator.className = "muted";
    creator.style.fontSize = "0.85rem";
    creator.textContent = `${ex.creator} · ${ex.year}`;
    titleWrap.appendChild(title);
    titleWrap.appendChild(creator);

    const toolBadge = document.createElement("span");
    toolBadge.className = "chip";
    toolBadge.style.cssText = "border-color:var(--teal);color:var(--teal);flex-shrink:0";
    toolBadge.textContent = ex.tool;

    heading.appendChild(titleWrap);
    heading.appendChild(toolBadge);
    card.appendChild(heading);

    const breakdown = document.createElement("p");
    breakdown.style.marginTop = "10px";
    breakdown.textContent = ex.breakdown;
    card.appendChild(breakdown);

    const filledWrap = document.createElement("div");
    filledWrap.className = "reference-filled";
    const filledLabel = document.createElement("p");
    filledLabel.style.cssText = "font-weight:700;font-size:0.8rem;color:var(--gold)";
    filledLabel.textContent = "Filled out as they would have used it:";
    filledWrap.appendChild(filledLabel);
    ex.filled.forEach((field) => filledWrap.appendChild(filledFieldRow(field)));
    card.appendChild(filledWrap);

    return card;
  }

  function bookCard(book: ReferenceBook): HTMLElement {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "12px";

    const title = document.createElement("p");
    title.style.fontWeight = "700";
    title.textContent = `${book.title} — ${book.author}`;
    card.appendChild(title);

    const why = document.createElement("p");
    why.className = "muted";
    why.style.margin = "6px 0 10px";
    why.textContent = book.why;
    card.appendChild(why);

    const list = document.createElement("ul");
    list.style.cssText = "padding-left:20px;display:flex;flex-direction:column;gap:8px";
    book.points.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      list.appendChild(li);
    });
    card.appendChild(list);

    return card;
  }

  function renderBody(): void {
    bodyEl.innerHTML = "";
    const category = REFERENCE_CATEGORIES.find((c) => c.key === activeKey);
    if (!category) return;

    const intro = document.createElement("p");
    intro.className = "muted";
    intro.style.marginBottom = "16px";
    intro.textContent = category.intro;
    bodyEl.appendChild(intro);

    if (activeSection === "examples") {
      category.examples.forEach((ex) => bodyEl.appendChild(exampleCard(ex)));
    } else {
      category.books.forEach((book) => bodyEl.appendChild(bookCard(book)));
    }
  }

  renderTabs();
  renderSectionTabs();
  renderBody();
}
