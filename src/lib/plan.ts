export type CrewKind = "retirees" | "students" | "mixed" | "licensed";

export type Task = {
  id: string;
  title: string;
  detail: string;
  trade: string;
  crew: CrewKind;
  cost: number;
  volunteerHours: number;
  weeks: number;
  critical: boolean;
  custom?: boolean;
};

export type Milestone = {
  id: string;
  number: number;
  title: string;
  short: string;
  subtitle: string;
  summary: string;
  startWeek: number;
  durationWeeks: number;
  tasks: Task[];
};

export const PROJECT_START = new Date("2026-03-02T12:00:00");
export const DEFAULT_START_ISO = "2026-03-02";
export const BUDGET_CAP = 120_000;

export const CREW = {
  retirees: {
    count: 5,
    hoursPerWeek: 20,
    window: "Mon–Fri, 8am–12pm",
    role: "Lead the weekday build — layout, structure, and quality.",
  },
  students: {
    count: 12,
    hoursPerWeek: 6,
    sessions: "Wed 4–7pm · Sat 8–11am",
    role: "Two 3-hour shifts: staging, carrying, finishes, and site care.",
  },
} as const;

export const WEEKLY_HOURS =
  CREW.retirees.count * CREW.retirees.hoursPerWeek +
  CREW.students.count * CREW.students.hoursPerWeek;

export const CREW_LABEL: Record<CrewKind, string> = {
  retirees: "Retiree crew",
  students: "Student crew",
  mixed: "Mixed crew",
  licensed: "Licensed trade",
};

// Full milestone task list lives in the Habitat Home app.
// This file is the construction-plan contract: types, caps, and helpers.
export const MILESTONES: Milestone[] = [];

export const ALL_TASKS: Task[] = MILESTONES.flatMap((m) => m.tasks);
export const STOCK_TASK_IDS = new Set(ALL_TASKS.map((t) => t.id));
export const TOTAL_BUDGET = ALL_TASKS.reduce((sum, t) => sum + t.cost, 0);
export const TOTAL_VOLUNTEER_HOURS = ALL_TASKS.reduce((sum, t) => sum + t.volunteerHours, 0);
export const TOTAL_WEEKS = 40;

export const PROJECT = {
  name: "Cedar Lot",
  address: "14 Ridge Road",
  spec: "1,200 sf · 3 bed · 2 bath · volunteer build",
  sheet: "A0.01",
} as const;

export type CustomTask = Task & { milestoneId: string };

export function isStockTask(id: string) {
  return STOCK_TASK_IDS.has(id);
}

export function mergePlan(
  extras: CustomTask[] = [],
  removedIds: string[] = [],
  edits: Record<string, Partial<Task>> = {},
): Milestone[] {
  const removed = new Set(removedIds);
  return MILESTONES.map((m) => ({
    ...m,
    tasks: [
      ...m.tasks.filter((t) => !removed.has(t.id)).map((t) => {
        const patch = edits[t.id];
        return patch ? { ...t, ...patch, id: t.id } : t;
      }),
      ...extras.filter((t) => t.milestoneId === m.id && !removed.has(t.id)).map((t) => {
        const patch = edits[t.id];
        const { milestoneId, ...task } = t;
        return { ...task, ...patch, id: t.id, custom: true };
      }),
    ],
  }));
}

export function allTasksOf(milestones: Milestone[]) {
  return milestones.flatMap((m) => m.tasks);
}
export function totalBudgetOf(milestones: Milestone[]) {
  return allTasksOf(milestones).reduce((sum, t) => sum + t.cost, 0);
}
export function totalHoursOf(milestones: Milestone[]) {
  return allTasksOf(milestones).reduce((sum, t) => sum + t.volunteerHours, 0);
}
export function milestoneCost(m: Milestone) {
  return m.tasks.reduce((sum, t) => sum + t.cost, 0);
}
export function milestoneHours(m: Milestone) {
  return m.tasks.reduce((sum, t) => sum + t.volunteerHours, 0);
}
export function isDone(id: string, completed: ReadonlySet<string>) {
  return completed.has(id);
}
export function milestoneStats(m: Milestone, completed: ReadonlySet<string>) {
  const total = m.tasks.length;
  const done = m.tasks.filter((t) => completed.has(t.id)).length;
  const spent = m.tasks.filter((t) => completed.has(t.id)).reduce((sum, t) => sum + t.cost, 0);
  const hours = milestoneHours(m);
  const hoursDone = m.tasks.filter((t) => completed.has(t.id)).reduce((sum, t) => sum + t.volunteerHours, 0);
  const cost = milestoneCost(m);
  return { total, done, spent, cost, hours, hoursDone, ratio: total === 0 ? 0 : done / total, complete: done === total && total > 0, started: done > 0 };
}
export function projectStats(completed: ReadonlySet<string>, milestones: Milestone[] = MILESTONES) {
  const tasks = allTasksOf(milestones);
  const total = tasks.length;
  const done = tasks.filter((t) => completed.has(t.id)).length;
  const spent = tasks.filter((t) => completed.has(t.id)).reduce((sum, t) => sum + t.cost, 0);
  const hoursDone = tasks.filter((t) => completed.has(t.id)).reduce((sum, t) => sum + t.volunteerHours, 0);
  const licensedSpent = tasks.filter((t) => t.crew === "licensed" && completed.has(t.id)).reduce((sum, t) => sum + t.cost, 0);
  const licensedTotal = tasks.filter((t) => t.crew === "licensed").reduce((sum, t) => sum + t.cost, 0);
  const budget = totalBudgetOf(milestones);
  const hoursTotal = totalHoursOf(milestones);
  return { total, done, spent, remaining: budget - spent, budget, capRemaining: BUDGET_CAP - spent, overCap: budget > BUDGET_CAP, ratio: total === 0 ? 0 : done / total, complete: done === total && total > 0, hoursDone, hoursTotal, licensedSpent, licensedTotal };
}
export function issueStamp(ratio: number) {
  if (ratio >= 1) return "Issued for occupancy";
  if (ratio >= 0.72) return "Under construction — finishes";
  if (ratio >= 0.45) return "Under construction — shell";
  if (ratio >= 0.22) return "Issued for construction";
  if (ratio > 0) return "Construction documents";
  return "Pre-design";
}
export function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}
export function toStartIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function parseStartDate(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return PROJECT_START;
  const next = new Date(`${iso}T12:00:00`);
  return Number.isNaN(next.getTime()) ? PROJECT_START : next;
}
export function formatWeekDate(week: number, start: Date = PROJECT_START) {
  return addWeeks(start, week).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function formatMonth(week: number, start: Date = PROJECT_START) {
  return addWeeks(start, week).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
export function formatHours(n: number) {
  return `${new Intl.NumberFormat("en-US").format(n)} hrs`;
}
