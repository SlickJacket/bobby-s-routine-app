/**
 * Normalizes a Fountain document's forced-syntax sigils (., @, !, ~, >...<)
 * into plain conventional text that screenplay.ts's line classifier already
 * understands, so imported and hand-typed screenplay pages share one renderer.
 */
export function parseFountain(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n");
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  text = text.replace(/\[\[[\s\S]*?\]\]/g, "");

  const lines = text.split("\n").map((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith(".") && !trimmed.startsWith("..")) {
      return trimmed.slice(1).toUpperCase();
    }
    if (trimmed.startsWith("@")) {
      return trimmed.slice(1).toUpperCase();
    }
    if (trimmed.startsWith("!")) {
      return trimmed.slice(1);
    }
    if (trimmed.startsWith("~")) {
      return trimmed.slice(1);
    }
    if (trimmed.startsWith(">") && trimmed.endsWith("<")) {
      return trimmed.slice(1, -1).trim();
    }
    if (trimmed.startsWith(">")) {
      return trimmed.slice(1).trim();
    }
    if (trimmed.startsWith("===")) {
      return "";
    }
    if (/^#{1,3}\s/.test(trimmed)) {
      return "";
    }
    return line;
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
