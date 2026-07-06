let toastEl: HTMLDivElement | null = null;
let hideTimer: number | undefined;

function ensureToastEl(): HTMLDivElement {
  if (toastEl) return toastEl;
  toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.appendChild(toastEl);
  return toastEl;
}

export function showToast(message: string, durationMs = 1000): void {
  const el = ensureToastEl();
  el.classList.remove("undo");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => el.classList.remove("show"), durationMs);
}

export function showUndoToast(
  message: string,
  onUndo: () => void,
  durationMs = 4000
): void {
  const el = ensureToastEl();
  el.classList.add("undo");
  el.innerHTML = "";

  const span = document.createElement("span");
  span.textContent = message;

  const btn = document.createElement("button");
  btn.textContent = "Undo";
  btn.onclick = () => {
    onUndo();
    el.classList.remove("show");
  };

  el.appendChild(span);
  el.appendChild(btn);
  el.classList.add("show");

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => el.classList.remove("show"), durationMs);
}
