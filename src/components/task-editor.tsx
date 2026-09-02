import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CREW_LABEL,
  type CrewKind,
  type Milestone,
  type Task,
} from "@/lib/plan";
import { type TaskDraft } from "@/lib/store";

const CREW_OPTIONS: CrewKind[] = ["retirees", "students", "mixed", "licensed"];

const EMPTY: TaskDraft = {
  title: "",
  detail: "",
  trade: "Mixed crew",
  crew: "mixed",
  cost: 0,
  volunteerHours: 0,
  weeks: 1,
  critical: false,
};

function fromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    detail: task.detail,
    trade: task.trade,
    crew: task.crew,
    cost: task.cost,
    volunteerHours: task.volunteerHours,
    weeks: task.weeks,
    critical: task.critical,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone;
  task?: Task | null;
  onSave: (draft: TaskDraft) => void;
};

export function TaskEditor({
  open,
  onOpenChange,
  milestone,
  task,
  onSave,
}: Props) {
  const editing = Boolean(task);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => setDraft(task ? fromTask(task) : EMPTY)}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "Add a task"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Update this line in ${milestone.title}. Cost counts toward the $120,000 materials cap.`
              : `Add a product, trade, or extra step to ${milestone.title}. Form Drain and ICF foam blocks are already in Site Work & Foundation — use this for anything else the lot needs.`}
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.title.trim()) return;
            onSave({ ...draft, title: draft.title.trim() });
            onOpenChange(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Form Drain outlets to daylight"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-detail">What to do</Label>
            <textarea
              id="task-detail"
              rows={3}
              value={draft.detail}
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
              placeholder="Crew, product, and the done condition"
              className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-crew">Crew</Label>
              <select
                id="task-crew"
                value={draft.crew}
                onChange={(e) =>
                  setDraft({ ...draft, crew: e.target.value as CrewKind })
                }
                className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CREW_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {CREW_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-trade">Trade label</Label>
              <Input
                id="task-trade"
                value={draft.trade}
                onChange={(e) => setDraft({ ...draft, trade: e.target.value })}
                placeholder="Mixed crew"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-cost">Cost (USD)</Label>
              <Input
                id="task-cost"
                type="number"
                min={0}
                step={1}
                value={draft.cost}
                onChange={(e) =>
                  setDraft({ ...draft, cost: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-hours">Volunteer hrs</Label>
              <Input
                id="task-hours"
                type="number"
                min={0}
                step={1}
                value={draft.volunteerHours}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    volunteerHours: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-weeks">Weeks</Label>
              <Input
                id="task-weeks"
                type="number"
                min={1}
                step={1}
                value={draft.weeks}
                onChange={(e) =>
                  setDraft({ ...draft, weeks: Number(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <label className="flex h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.critical}
              onChange={(e) =>
                setDraft({ ...draft, critical: e.target.checked })
              }
              className="size-4 accent-primary"
            />
            Critical path
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!draft.title.trim()}>
              {editing ? "Save task" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
