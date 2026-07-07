export interface TaskItem {
  text: string;
  done: boolean;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD, local
  habits: Record<string, boolean>;
  tasks: TaskItem[];
  mood: number;
  energy: number;
  note: string;
}

export const PRIORITIES = ["Hot", "High", "Normal", "Someday"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const STAGES = [
  "Inbox",
  "Developing",
  "Drafting",
  "Polishing",
  "Performed/Published",
] as const;

export type Stage = (typeof STAGES)[number];

export const DEFAULT_PROJECTS = ["Pickupline", "Hustle", "Unassigned"];

export const GENRES = [
  "N/A",
  "Monster in the House",
  "Golden Fleece",
  "Out of the Bottle",
  "Dude with a Problem",
  "Rites of Passage",
  "Buddy Love",
  "Whydunit",
  "Fool Triumphant",
  "Institutionalized",
  "Superhero",
] as const;

export type Genre = (typeof GENRES)[number];

export type PageTemplate =
  | "brainstorm"
  | "beatsheet"
  | "beatboard"
  | "screenplay"
  | "bitlist"
  | "characters"
  | "blank"
  | "imported-script";

export interface PageImportMeta {
  sourceFilename: string;
  sourceFormat: "fountain" | "fdx";
  importedAt: string; // ISO timestamp
}

export interface Page {
  id: string;
  title: string;
  template: PageTemplate;
  content: string;
  order: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  importMeta?: PageImportMeta;
}

export interface Idea {
  id: string;
  title: string;
  oneLiner: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  type: string;
  project: string;
  priority: Priority;
  stage: Stage;
  genre: Genre;
  pages: Page[];
}
