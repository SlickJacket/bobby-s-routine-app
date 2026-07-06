import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DEFAULT_IDEA_TAGS, type DayRecord, type Idea, type IdeaTag } from "./types";

export const DEFAULT_HABITS = [
  "Write (Pickupline)",
  "Workout",
  "Swedish",
  "Drums",
  "Read",
  "Software/AI",
  "Sleep 7+",
  "Water",
  "Morning Routine",
  "Deep Work Block",
];

export const HABIT_LIST_CAP = 12;
export const IDEA_TAG_CAP = 16;

type MetaRecord =
  | { id: "habitList"; list: string[] }
  | { id: "ideaTags"; list: string[] }
  | { id: "lastTag"; tag: IdeaTag };

interface AppDB extends DBSchema {
  days: { key: string; value: DayRecord };
  ideas: { key: string; value: Idea; indexes: { createdAt: string } };
  meta: { key: string; value: MetaRecord };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>("bobby-life-os", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("days")) {
          db.createObjectStore("days", { keyPath: "date" });
        }
        if (!db.objectStoreNames.contains("ideas")) {
          const store = db.createObjectStore("ideas", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return todayKey(date);
}

// --- Habit list ---

export async function getHabitList(): Promise<string[]> {
  const db = await getDB();
  const rec = await db.get("meta", "habitList");
  if (rec && rec.id === "habitList") return rec.list;
  await db.put("meta", { id: "habitList", list: DEFAULT_HABITS });
  return DEFAULT_HABITS;
}

export async function setHabitList(list: string[]): Promise<void> {
  const db = await getDB();
  const capped = list.slice(0, HABIT_LIST_CAP);
  await db.put("meta", { id: "habitList", list: capped });
}

// --- Day records ---

export function blankDay(date: string, habitList: string[]): DayRecord {
  return {
    date,
    habits: Object.fromEntries(habitList.map((h) => [h, false])),
    tasks: [
      { text: "", done: false },
      { text: "", done: false },
      { text: "", done: false },
    ],
    mood: 5,
    energy: 5,
    note: "",
  };
}

export async function getDay(date: string): Promise<DayRecord> {
  const db = await getDB();
  const rec = await db.get("days", date);
  if (rec) return rec;
  const habitList = await getHabitList();
  return blankDay(date, habitList);
}

export async function getDayRaw(date: string): Promise<DayRecord | undefined> {
  const db = await getDB();
  return db.get("days", date);
}

/**
 * Like getDay, but for today only: reconciles an already-saved today record
 * against the current habit list (renames/adds/removes cues) so edits made
 * in Settings show up immediately, instead of freezing at whatever habit
 * names existed when today's record was first created.
 */
export async function getTodayDay(): Promise<DayRecord> {
  const date = todayKey();
  const [habitList, existing] = await Promise.all([getHabitList(), getDayRaw(date)]);
  if (!existing) return blankDay(date, habitList);

  const oldKeys = Object.keys(existing.habits);
  const unchanged =
    oldKeys.length === habitList.length && habitList.every((h, i) => oldKeys[i] === h);
  if (unchanged) return existing;

  const habits =
    oldKeys.length === habitList.length
      ? // same count: most likely a rename, preserve completion by position
        Object.fromEntries(habitList.map((h, i) => [h, existing.habits[oldKeys[i]]]))
      : // count changed: most likely an add/remove, preserve completion by exact name
        Object.fromEntries(habitList.map((h) => [h, existing.habits[h] ?? false]));

  const reconciled: DayRecord = { ...existing, habits };
  await saveDay(reconciled);
  return reconciled;
}

export async function saveDay(day: DayRecord): Promise<void> {
  const db = await getDB();
  await db.put("days", day);
}

export async function getAllDays(): Promise<DayRecord[]> {
  const db = await getDB();
  return db.getAll("days");
}

export async function getDaysInRange(
  startDate: string,
  endDate: string
): Promise<DayRecord[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(startDate, endDate);
  return db.getAll("days", range);
}

// --- Ideas ---

export async function addIdea(idea: Idea): Promise<void> {
  const db = await getDB();
  await db.put("ideas", idea);
  await db.put("meta", { id: "lastTag", tag: idea.tag });
}

export async function updateIdea(idea: Idea): Promise<void> {
  const db = await getDB();
  await db.put("ideas", idea);
}

export async function deleteIdea(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("ideas", id);
}

export async function getAllIdeas(): Promise<Idea[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("ideas", "createdAt");
  return all.reverse();
}

export async function getIdeasInRange(
  startISO: string,
  endISO: string
): Promise<Idea[]> {
  const all = await getAllIdeas();
  return all.filter((i) => i.createdAt >= startISO && i.createdAt <= endISO);
}

export async function getLastTag(): Promise<IdeaTag> {
  const db = await getDB();
  const rec = await db.get("meta", "lastTag");
  return rec && rec.id === "lastTag" ? rec.tag : "Other";
}

// --- Idea tags ---

export async function getIdeaTags(): Promise<string[]> {
  const db = await getDB();
  const rec = await db.get("meta", "ideaTags");
  if (rec && rec.id === "ideaTags") return rec.list;
  await db.put("meta", { id: "ideaTags", list: DEFAULT_IDEA_TAGS });
  return DEFAULT_IDEA_TAGS;
}

export async function setIdeaTags(list: string[]): Promise<void> {
  const db = await getDB();
  const capped = list.slice(0, IDEA_TAG_CAP);
  await db.put("meta", { id: "ideaTags", list: capped });
}

// --- Backup / restore ---

export const BACKUP_VERSION = 1;

export interface Backup {
  app: "bobbys-life-os";
  version: number;
  exportedAt: string;
  habitList: string[];
  ideaTags: string[];
  days: DayRecord[];
  ideas: Idea[];
}

export async function exportBackup(): Promise<Backup> {
  const [habitList, ideaTags, days, ideas] = await Promise.all([
    getHabitList(),
    getIdeaTags(),
    getAllDays(),
    getAllIdeas(),
  ]);
  return {
    app: "bobbys-life-os",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habitList,
    ideaTags,
    days,
    ideas,
  };
}

export function isValidBackup(data: unknown): data is Backup {
  if (!data || typeof data !== "object") return false;
  const b = data as Record<string, unknown>;
  return (
    b.app === "bobbys-life-os" &&
    Array.isArray(b.habitList) &&
    Array.isArray(b.days) &&
    Array.isArray(b.ideas) &&
    (b.ideaTags === undefined || Array.isArray(b.ideaTags))
  );
}

export async function importBackup(data: Backup): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["days", "ideas", "meta"], "readwrite");
  await Promise.all([
    tx.objectStore("days").clear(),
    tx.objectStore("ideas").clear(),
    tx.objectStore("meta").clear(),
  ]);
  for (const day of data.days) await tx.objectStore("days").put(day);
  for (const idea of data.ideas) await tx.objectStore("ideas").put(idea);
  await tx.objectStore("meta").put({ id: "habitList", list: data.habitList.slice(0, HABIT_LIST_CAP) });
  await tx
    .objectStore("meta")
    .put({ id: "ideaTags", list: (data.ideaTags ?? DEFAULT_IDEA_TAGS).slice(0, IDEA_TAG_CAP) });
  await tx.done;
}
