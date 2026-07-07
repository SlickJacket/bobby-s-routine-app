export type ScreenplayLineType =
  | "scene-heading"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "action"
  | "blank";

export interface ScreenplayLine {
  type: ScreenplayLineType;
  text: string;
}

const SCENE_HEADING_RE = /^(INT|EXT|EST|I\/E|INT\.?\/EXT)[.\s/]/i;
const TRANSITION_RE = /^[A-Z][A-Z0-9 ,'.-]*(TO:|IN:|OUT\.)$/;
const PARENTHETICAL_RE = /^\(.*\)$/;

function isCharacterCue(line: string): boolean {
  return (
    line.length > 0 &&
    line.length <= 40 &&
    line === line.toUpperCase() &&
    /[A-Z]/.test(line) &&
    !SCENE_HEADING_RE.test(line) &&
    !TRANSITION_RE.test(line)
  );
}

export function classifyScreenplayLines(text: string): ScreenplayLine[] {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines: ScreenplayLine[] = [];
  let inDialogueBlock = false;

  for (const raw of rawLines) {
    const line = raw.trim();

    if (!line) {
      lines.push({ type: "blank", text: "" });
      inDialogueBlock = false;
      continue;
    }

    if (SCENE_HEADING_RE.test(line)) {
      lines.push({ type: "scene-heading", text: line });
      inDialogueBlock = false;
    } else if (TRANSITION_RE.test(line)) {
      lines.push({ type: "transition", text: line });
      inDialogueBlock = false;
    } else if (PARENTHETICAL_RE.test(line)) {
      lines.push({ type: "parenthetical", text: line });
      inDialogueBlock = true;
    } else if (!inDialogueBlock && isCharacterCue(line)) {
      lines.push({ type: "character", text: line });
      inDialogueBlock = true;
    } else if (inDialogueBlock) {
      lines.push({ type: "dialogue", text: line });
    } else {
      lines.push({ type: "action", text: line });
    }
  }

  return lines;
}

export function renderScreenplay(text: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "screenplay";

  for (const line of classifyScreenplayLines(text)) {
    if (line.type === "blank") {
      const spacer = document.createElement("div");
      spacer.className = "sp-blank";
      container.appendChild(spacer);
      continue;
    }
    const el = document.createElement("p");
    el.className = `sp-${line.type}`;
    el.textContent = line.text;
    container.appendChild(el);
  }

  return container;
}
