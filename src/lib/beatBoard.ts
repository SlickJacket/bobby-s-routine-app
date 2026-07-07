import { SAVE_THE_CAT_BEATS } from "./beatSheet";
import { iconArrowDown, iconArrowUp, iconMove, iconX } from "./icons";

export interface BeatCard {
  id: string;
  beat: string;
  text: string;
  order: number;
}

export function parseBeatBoard(content: string): BeatCard[] {
  if (!content.trim()) return [];
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as BeatCard[]) : [];
  } catch {
    return [];
  }
}

export function serializeBeatBoard(cards: BeatCard[]): string {
  return JSON.stringify(cards);
}

function isDesktopWidth(): boolean {
  return window.innerWidth >= 820;
}

function nextOrderInBeat(cards: BeatCard[], beat: string): number {
  const inBeat = cards.filter((c) => c.beat === beat);
  return inBeat.length === 0 ? 0 : Math.max(...inBeat.map((c) => c.order)) + 1;
}

export function renderBeatBoard(cards: BeatCard[], onChange: (cards: BeatCard[]) => void): HTMLElement {
  const board = document.createElement("div");
  board.className = "beat-board";

  function openMoveSheet(card: BeatCard): void {
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    const sheet = document.createElement("div");
    sheet.className = "sheet card";
    sheet.innerHTML = `<p class="muted" style="margin-bottom:10px">Move card to:</p>`;

    SAVE_THE_CAT_BEATS.forEach((beat) => {
      const btn = document.createElement("button");
      btn.className = `card sheet-option${beat.name === card.beat ? " active" : ""}`;
      btn.textContent = beat.name;
      btn.addEventListener("click", () => {
        if (beat.name !== card.beat) {
          card.beat = beat.name;
          card.order = nextOrderInBeat(cards, beat.name);
          onChange(cards);
          rerender();
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

  function reorder(card: BeatCard, delta: number): void {
    const inBeat = cards.filter((c) => c.beat === card.beat).sort((a, b) => a.order - b.order);
    const idx = inBeat.findIndex((c) => c.id === card.id);
    const swapIdx = idx + delta;
    if (idx === -1 || swapIdx < 0 || swapIdx >= inBeat.length) return;
    const tmp = inBeat[idx].order;
    inBeat[idx].order = inBeat[swapIdx].order;
    inBeat[swapIdx].order = tmp;
    onChange(cards);
    rerender();
  }

  function deleteCard(card: BeatCard): void {
    const idx = cards.findIndex((c) => c.id === card.id);
    if (idx !== -1) cards.splice(idx, 1);
    onChange(cards);
    rerender();
  }

  function renderCard(card: BeatCard, idx: number, total: number): HTMLElement {
    const el = document.createElement("div");
    el.className = "beat-card";
    el.draggable = isDesktopWidth();

    const textEl = document.createElement("p");
    textEl.className = `beat-card-text${card.text ? "" : " muted"}`;
    textEl.textContent = card.text || "Tap to add a scene...";
    textEl.addEventListener("click", () => {
      const textarea = document.createElement("textarea");
      textarea.className = "beat-card-input";
      textarea.value = card.text;
      textarea.rows = 3;
      el.replaceChild(textarea, textEl);
      textarea.focus();
      textarea.addEventListener("blur", () => {
        card.text = textarea.value.trim();
        onChange(cards);
        rerender();
      });
    });
    el.appendChild(textEl);

    const controls = document.createElement("div");
    controls.className = "beat-card-controls";

    const moveBtn = document.createElement("button");
    moveBtn.className = "icon-btn";
    moveBtn.setAttribute("aria-label", "Move to another beat");
    moveBtn.style.cssText = "width:22px;height:22px";
    moveBtn.innerHTML = iconMove;
    moveBtn.addEventListener("click", () => openMoveSheet(card));

    const upBtn = document.createElement("button");
    upBtn.className = "icon-btn";
    upBtn.setAttribute("aria-label", "Move up");
    upBtn.style.cssText = "width:22px;height:22px";
    upBtn.innerHTML = iconArrowUp;
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => reorder(card, -1));

    const downBtn = document.createElement("button");
    downBtn.className = "icon-btn";
    downBtn.setAttribute("aria-label", "Move down");
    downBtn.style.cssText = "width:22px;height:22px";
    downBtn.innerHTML = iconArrowDown;
    downBtn.disabled = idx === total - 1;
    downBtn.addEventListener("click", () => reorder(card, 1));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn";
    deleteBtn.setAttribute("aria-label", "Delete card");
    deleteBtn.style.cssText = "width:22px;height:22px;color:var(--velvet)";
    deleteBtn.innerHTML = iconX;
    deleteBtn.addEventListener("click", () => deleteCard(card));

    controls.appendChild(moveBtn);
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(deleteBtn);
    el.appendChild(controls);

    el.addEventListener("dragstart", (e) => {
      if (!isDesktopWidth()) return;
      e.dataTransfer?.setData("text/plain", card.id);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));

    return el;
  }

  function rerender(): void {
    board.innerHTML = "";

    SAVE_THE_CAT_BEATS.forEach((beat) => {
      const col = document.createElement("div");
      col.className = "beat-column";

      const header = document.createElement("div");
      header.className = "beat-column-header";
      header.innerHTML = `<h3>${beat.name}</h3><span class="muted" style="font-size:0.72rem">${beat.percent}</span>`;
      col.appendChild(header);

      const blurb = document.createElement("p");
      blurb.className = "muted beat-column-blurb";
      blurb.textContent = beat.blurb;
      col.appendChild(blurb);

      const cardsWrap = document.createElement("div");
      cardsWrap.className = "beat-cards";

      cardsWrap.addEventListener("dragover", (e) => {
        if (!isDesktopWidth()) return;
        e.preventDefault();
        cardsWrap.classList.add("drag-over");
      });
      cardsWrap.addEventListener("dragleave", () => cardsWrap.classList.remove("drag-over"));
      cardsWrap.addEventListener("drop", (e) => {
        e.preventDefault();
        cardsWrap.classList.remove("drag-over");
        const id = e.dataTransfer?.getData("text/plain");
        const dragged = cards.find((c) => c.id === id);
        if (!dragged || dragged.beat === beat.name) return;
        dragged.beat = beat.name;
        dragged.order = nextOrderInBeat(cards, beat.name);
        onChange(cards);
        rerender();
      });

      const beatCards = cards.filter((c) => c.beat === beat.name).sort((a, b) => a.order - b.order);
      beatCards.forEach((card, idx) => cardsWrap.appendChild(renderCard(card, idx, beatCards.length)));
      col.appendChild(cardsWrap);

      const addBtn = document.createElement("button");
      addBtn.className = "icon-btn beat-add-btn";
      addBtn.innerHTML = `<span style="font-size:0.8rem;font-weight:600">+ Add card</span>`;
      addBtn.addEventListener("click", () => {
        cards.push({
          id: crypto.randomUUID(),
          beat: beat.name,
          text: "",
          order: nextOrderInBeat(cards, beat.name),
        });
        onChange(cards);
        rerender();
      });
      col.appendChild(addBtn);

      board.appendChild(col);
    });
  }

  rerender();
  return board;
}
