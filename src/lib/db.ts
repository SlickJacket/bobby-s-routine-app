import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DEFAULT_PROJECTS, type DayRecord, type Idea } from "./types";

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

export const DEFAULT_IDEA_TYPES = [
  "Standup",
  "Sketch",
  "Short Story",
  "Short Film",
  "Feature",
  "Pickupline Episode",
  "Clowning",
  "Other",
];

export const HABIT_LIST_CAP = 12;
export const PROJECT_LIST_CAP = 16;
export const TYPE_LIST_CAP = 16;

type MetaRecord =
  | { id: "habitList"; list: string[] }
  | { id: "projects"; list: string[] }
  | { id: "types"; list: string[] }
  | { id: "bestStreak"; value: number };

interface AppDB extends DBSchema {
  days: { key: string; value: DayRecord };
  ideas: { key: string; value: Idea; indexes: { createdAt: string } };
  meta: { key: string; value: MetaRecord };
}

/** Shape of an idea record as stored under DB schema v1 (pre-Green Room). */
interface IdeaV1 {
  id: string;
  createdAt: string;
  title?: string;
  text: string;
  tag: string;
}

function isIdeaV1(rec: unknown): rec is IdeaV1 {
  return !!rec && typeof rec === "object" && "text" in rec && "tag" in rec && !("stage" in rec);
}

function migrateIdeaV1(old: IdeaV1): Idea {
  return {
    id: old.id,
    title: old.title || old.text.slice(0, 60),
    oneLiner: old.text,
    createdAt: old.createdAt,
    updatedAt: old.createdAt,
    type: old.tag,
    project: "Unassigned",
    priority: "Normal",
    stage: "Inbox",
    genre: "N/A",
    pages: [],
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>("bobby-life-os", 3, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
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

        if (oldVersion < 2) {
          const store = transaction.objectStore("ideas");
          let cursor = await store.openCursor();
          while (cursor) {
            if (isIdeaV1(cursor.value)) {
              await cursor.update(migrateIdeaV1(cursor.value));
            }
            cursor = await cursor.continue();
          }
        }

        if (oldVersion < 3) {
          const store = transaction.objectStore("ideas");
          let cursor = await store.openCursor();
          while (cursor) {
            const rec = cursor.value as Idea & { genre?: string };
            if (rec.genre === undefined) {
              await cursor.update({ ...rec, genre: "N/A" });
            }
            cursor = await cursor.continue();
          }
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
}

export async function updateIdea(idea: Idea): Promise<void> {
  const db = await getDB();
  await db.put("ideas", idea);
}

export async function deleteIdea(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("ideas", id);
}

export async function getIdea(id: string): Promise<Idea | undefined> {
  const db = await getDB();
  return db.get("ideas", id);
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

// --- Projects ---

export async function getProjects(): Promise<string[]> {
  const db = await getDB();
  const rec = await db.get("meta", "projects");
  if (rec && rec.id === "projects") return rec.list;
  await db.put("meta", { id: "projects", list: DEFAULT_PROJECTS });
  return DEFAULT_PROJECTS;
}

export async function setProjects(list: string[]): Promise<void> {
  const db = await getDB();
  const capped = list.slice(0, PROJECT_LIST_CAP);
  await db.put("meta", { id: "projects", list: capped });
}

export async function addProject(name: string): Promise<string[]> {
  const list = await getProjects();
  const trimmed = name.trim();
  if (trimmed && !list.includes(trimmed) && list.length < PROJECT_LIST_CAP) {
    list.push(trimmed);
    await setProjects(list);
  }
  return list;
}

// --- Types ---

export async function getTypes(): Promise<string[]> {
  const db = await getDB();
  const rec = await db.get("meta", "types");
  if (rec && rec.id === "types") return rec.list;
  await db.put("meta", { id: "types", list: DEFAULT_IDEA_TYPES });
  return DEFAULT_IDEA_TYPES;
}

export async function setTypes(list: string[]): Promise<void> {
  const db = await getDB();
  const capped = list.slice(0, TYPE_LIST_CAP);
  await db.put("meta", { id: "types", list: capped });
}

export async function addType(name: string): Promise<string[]> {
  const list = await getTypes();
  const trimmed = name.trim();
  if (trimmed && !list.includes(trimmed) && list.length < TYPE_LIST_CAP) {
    list.push(trimmed);
    await setTypes(list);
  }
  return list;
}

// --- Cascading rename/delete for Type & Project (both are exact-match filter/sort
// dimensions Bobby reads by value, so unlike the habit-list/old-tag pattern, a rename
// here must update every idea using the old value rather than leaving it stale). ---

async function reassignIdeaField(field: "type" | "project", from: string, to: string): Promise<void> {
  if (from === to) return;
  const db = await getDB();
  const tx = db.transaction("ideas", "readwrite");
  const store = tx.objectStore("ideas");
  let cursor = await store.openCursor();
  while (cursor) {
    if (cursor.value[field] === from) {
      await cursor.update({ ...cursor.value, [field]: to, updatedAt: new Date().toISOString() });
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function renameType(from: string, to: string): Promise<void> {
  await reassignIdeaField("type", from, to);
}

/** No-op if `name` is the fallback itself — a fallback can't delete into itself. */
export async function deleteType(name: string): Promise<void> {
  if (name === "Other") return;
  await reassignIdeaField("type", name, "Other");
}

export async function renameProject(from: string, to: string): Promise<void> {
  await reassignIdeaField("project", from, to);
}

/** No-op if `name` is the fallback itself — a fallback can't delete into itself. */
export async function deleteProject(name: string): Promise<void> {
  if (name === "Unassigned") return;
  await reassignIdeaField("project", name, "Unassigned");
}

// --- Best streak (all-time high, for the celebratory spark) ---

export async function getBestStreak(): Promise<number> {
  const db = await getDB();
  const rec = await db.get("meta", "bestStreak");
  return rec && rec.id === "bestStreak" ? rec.value : 0;
}

/** Returns true if `current` beats the stored best (and persists the new high). */
export async function checkNewBestStreak(current: number): Promise<boolean> {
  if (current <= 0) return false;
  const best = await getBestStreak();
  if (current <= best) return false;
  const db = await getDB();
  await db.put("meta", { id: "bestStreak", value: current });
  return true;
}

// --- Backup / restore ---

export const BACKUP_VERSION = 3;

export interface Backup {
  app: "bobbys-life-os";
  version: number;
  exportedAt: string;
  habitList: string[];
  projects: string[];
  types: string[];
  days: DayRecord[];
  ideas: Idea[];
}

export async function exportBackup(): Promise<Backup> {
  const [habitList, projects, types, days, ideas] = await Promise.all([
    getHabitList(),
    getProjects(),
    getTypes(),
    getAllDays(),
    getAllIdeas(),
  ]);
  return {
    app: "bobbys-life-os",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habitList,
    projects,
    types,
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
    Array.isArray(b.ideas)
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
  for (const rawIdea of data.ideas) {
    const idea = isIdeaV1(rawIdea) ? migrateIdeaV1(rawIdea) : { ...rawIdea, genre: rawIdea.genre ?? "N/A" };
    await tx.objectStore("ideas").put(idea);
  }
  await tx.objectStore("meta").put({ id: "habitList", list: data.habitList.slice(0, HABIT_LIST_CAP) });
  await tx
    .objectStore("meta")
    .put({ id: "projects", list: (data.projects ?? DEFAULT_PROJECTS).slice(0, PROJECT_LIST_CAP) });
  await tx
    .objectStore("meta")
    .put({ id: "types", list: (data.types ?? DEFAULT_IDEA_TYPES).slice(0, TYPE_LIST_CAP) });
  await tx.done;
}
