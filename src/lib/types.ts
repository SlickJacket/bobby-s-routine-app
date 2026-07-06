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

export const DEFAULT_IDEA_TAGS = [
  "Standup",
  "Sketch",
  "Short Story",
  "Short Film",
  "Feature",
  "Pickupline Episode",
  "Other",
];

export type IdeaTag = string;

export interface Idea {
  id: string;
  createdAt: string; // ISO timestamp
  title?: string;
  text: string;
  tag: IdeaTag;
}
