import { SUBJECTS, WEEKS } from "./types";

// Shape: { [branch]: { [student]: { [subject]: { [week]: boolean[] | null } } } }
export type WeekAnswers = boolean[] | null;
export type StudentRecord = Record<string, Record<string, WeekAnswers>>;
export type BranchStore = Record<string, StudentRecord>;
export type AppStore = Record<string, BranchStore>;

const KEY = "reportStore_v1";

function load(): AppStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function save(store: AppStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getBranchStore(branch: string): BranchStore {
  return load()[branch] || {};
}

export function getStudentList(branch: string): string[] {
  return Object.keys(getBranchStore(branch)).sort();
}

export function addStudent(branch: string, name: string): void {
  const store = load();
  if (!store[branch]) store[branch] = {};
  if (!store[branch][name]) {
    // Init all subjects × weeks as null
    store[branch][name] = {};
    for (const subj of SUBJECTS) {
      store[branch][name][subj] = {};
      for (const w of WEEKS) {
        store[branch][name][subj][w] = null;
      }
    }
  }
  save(store);
}

export function removeStudent(branch: string, name: string): void {
  const store = load();
  if (store[branch]) {
    delete store[branch][name];
    save(store);
  }
}

export function getAnswers(branch: string, name: string, subject: string, week: string): boolean[] | null {
  return getBranchStore(branch)?.[name]?.[subject]?.[week] ?? null;
}

export function saveAnswers(branch: string, name: string, subject: string, week: string, answers: boolean[]): void {
  const store = load();
  if (!store[branch]) store[branch] = {};
  if (!store[branch][name]) store[branch][name] = {};
  if (!store[branch][name][subject]) store[branch][name][subject] = {};
  store[branch][name][subject][week] = answers;
  save(store);
}

export function getStudentProgress(branch: string, name: string): Record<string, Record<string, boolean>> {
  const rec = getBranchStore(branch)?.[name] || {};
  const result: Record<string, Record<string, boolean>> = {};
  for (const subj of SUBJECTS) {
    result[subj] = {};
    for (const w of WEEKS) {
      result[subj][w] = rec[subj]?.[w] !== null && rec[subj]?.[w] !== undefined;
    }
  }
  return result;
}

export function isStudentComplete(branch: string, name: string): boolean {
  const prog = getStudentProgress(branch, name);
  return SUBJECTS.every(s => WEEKS.every(w => prog[s]?.[w]));
}
