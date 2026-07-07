const BLOCK_TYPES = new Set(["Scene Heading", "Action", "Transition", "Shot", "General"]);
const UPPER_TYPES = new Set(["Scene Heading", "Character", "Transition"]);

/**
 * Walks Final Draft XML <Paragraph Type="..."> elements into the same plain
 * conventional text screenplay.ts's line classifier expects, mirroring
 * fountain.ts's normalization so both import paths share one renderer.
 */
export function parseFdx(xmlText: string): string {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror") || doc.documentElement.nodeName !== "FinalDraft") {
    throw new Error("Could not read this as Final Draft XML.");
  }

  const paragraphs = Array.from(doc.querySelectorAll("Paragraph"));
  const lines: string[] = [];

  for (const p of paragraphs) {
    const type = p.getAttribute("Type") ?? "Action";
    const text = Array.from(p.querySelectorAll("Text"))
      .map((t) => t.textContent ?? "")
      .join("")
      .trim();
    if (!text) continue;

    let line = text;
    if (UPPER_TYPES.has(type)) {
      line = line.toUpperCase();
    }
    if (type === "Parenthetical" && !line.startsWith("(")) {
      line = `(${line})`;
    }

    lines.push(line);
    if (BLOCK_TYPES.has(type)) lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
