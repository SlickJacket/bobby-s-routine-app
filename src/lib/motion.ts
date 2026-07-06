export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Bursts a handful of small gold sparks outward from the given element. No-op under reduced motion. */
export function spark(host: HTMLElement, count = 8): void {
  if (prefersReducedMotion()) return;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 22 + Math.random() * 14;
    const el = document.createElement("span");
    el.className = "spark";
    el.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    el.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    el.addEventListener("animationend", () => el.remove());
    host.appendChild(el);
  }
}

/** Animates a number counting from `from` to `to` over `durationMs`, respecting reduced motion. */
export function animateCount(
  el: HTMLElement,
  from: number,
  to: number,
  durationMs = 350
): void {
  if (from === to) {
    el.textContent = String(to);
    return;
  }
  if (prefersReducedMotion()) {
    el.textContent = String(to);
    return;
  }

  const start = performance.now();
  function tick(now: number): void {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(from + (to - from) * eased);
    el.textContent = String(value);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
