import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_START_ISO,
  MILESTONES,
  PROJECT,
  mergePlan,
  parseStartDate,
  toStartIso,
  type CrewKind,
  type CustomTask,
  type Task,
} from "@/lib/plan";
import type { DrawingMeta } from "@/lib/drawing";

export type TaskDraft = {
  title: string;
  detail: string;
  trade: string;
  crew: CrewKind;
  cost: number;
  volunteerHours: number;
  weeks: number;
  critical: boolean;
};

type PlanState = {
  completed: string[];
  notes: Record<string, string>;
  selectedId: string;
  view: "drawings" | "plan" | "schedule" | "budget";
  customTasks: CustomTask[];
  removedIds: string[];
  edits: Record<string, Partial<Task>>;
  address: string;
  drawing: DrawingMeta | null;
  startDate: string;
  toggle: (id: string) => void;
  setNote: (id: string, note: string) => void;
  select: (id: string) => void;
  setView: (view: PlanState["view"]) => void;
  completeMilestone: (milestoneId: string) => void;
  resetMilestone: (milestoneId: string) => void;
  resetProgress: () => void;
  addTask: (milestoneId: string, draft: TaskDraft) => string;
  updateTask: (id: string, draft: TaskDraft) => void;
  removeTask: (id: string) => void;
  restoreStock: () => void;
  setAddress: (address: string) => void;
  setDrawing: (drawing: DrawingMeta | null) => void;
  setStartDate: (iso: string) => void;
};

function livePlan(state: Pick<PlanState, "customTasks" | "removedIds" | "edits">) {
  return mergePlan(state.customTasks, state.removedIds, state.edits);
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      completed: [],
      notes: {},
      selectedId: MILESTONES[0].id,
      view: "plan",
      customTasks: [],
      removedIds: [],
      edits: {},
      address: PROJECT.address,
      drawing: null,
      startDate: DEFAULT_START_ISO,
      toggle: (id) => {
        const current = get().completed;
        set({
          completed: current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id],
        });
      },
      setNote: (id, note) => {
        const notes = { ...get().notes };
        if (note.trim()) notes[id] = note;
        else delete notes[id];
        set({ notes });
      },
      select: (id) => set({ selectedId: id, view: "plan" }),
      setView: (view) => set({ view }),
      completeMilestone: (milestoneId) => {
        const milestone = livePlan(get()).find((m) => m.id === milestoneId);
        if (!milestone) return;
        const ids = new Set(get().completed);
        for (const task of milestone.tasks) ids.add(task.id);
        set({ completed: [...ids] });
      },
      resetMilestone: (milestoneId) => {
        const milestone = livePlan(get()).find((m) => m.id === milestoneId);
        if (!milestone) return;
        const remove = new Set(milestone.tasks.map((t) => t.id));
        set({ completed: get().completed.filter((id) => !remove.has(id)) });
      },
      resetProgress: () =>
        set({
          completed: [],
          notes: {},
          selectedId: MILESTONES[0].id,
          view: "plan",
        }),
      addTask: (milestoneId, draft) => {
        const id = `custom-${milestoneId}-${Date.now().toString(36)}`;
        const task: CustomTask = { id, milestoneId, custom: true, ...draft };
        set({ customTasks: [...get().customTasks, task] });
        return id;
      },
      updateTask: (id, draft) => {
        const extras = get().customTasks;
        if (extras.some((t) => t.id === id)) {
          set({
            customTasks: extras.map((t) =>
              t.id === id ? { ...t, ...draft } : t,
            ),
          });
          return;
        }
        set({ edits: { ...get().edits, [id]: draft } });
      },
      removeTask: (id) => {
        const extras = get().customTasks.filter((t) => t.id !== id);
        const edits = { ...get().edits };
        delete edits[id];
        const notes = { ...get().notes };
        delete notes[id];
        set({
          customTasks: extras,
          edits,
          notes,
          removedIds: get().removedIds.includes(id)
            ? get().removedIds
            : [...get().removedIds, id],
          completed: get().completed.filter((x) => x !== id),
        });
      },
      restoreStock: () =>
        set({
          customTasks: [],
          removedIds: [],
          edits: {},
        }),
      setAddress: (address) => {
        const next = address.replace(/\s+/g, " ").trim();
        set({ address: next || PROJECT.address });
      },
      setDrawing: (drawing) => set({ drawing }),
      setStartDate: (iso) => set({ startDate: toStartIso(parseStartDate(iso)) }),
    }),
    { name: "cedar-lot-plan-v3", skipHydration: true },
  ),
);

export function useMilestones() {
  const extras = usePlanStore((s) => s.customTasks);
  const removed = usePlanStore((s) => s.removedIds);
  const edits = usePlanStore((s) => s.edits);
  return useMemo(
    () => mergePlan(extras, removed, edits),
    [extras, removed, edits],
  );
}

export function useProjectStart() {
  const iso = usePlanStore((s) => s.startDate);
  return useMemo(() => parseStartDate(iso), [iso]);
}
