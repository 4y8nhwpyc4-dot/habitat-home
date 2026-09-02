import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_START_ISO,
  TOTAL_WEEKS,
  formatWeekDate,
  parseStartDate,
} from "@/lib/plan";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StartDateField({
  className,
  showRange = true,
}: {
  className?: string;
  showRange?: boolean;
}) {
  const stored = usePlanStore((s) => s.startDate);
  const setStartDate = usePlanStore((s) => s.setStartDate);
  const iso = stored || DEFAULT_START_ISO;
  const start = parseStartDate(iso);
  const [editing, setEditing] = useState(false);
  const label = showRange
    ? `${formatWeekDate(0, start)} – ${formatWeekDate(TOTAL_WEEKS, start)}`
    : formatWeekDate(0, start);

  if (editing) {
    return (
      <Input
        type="date"
        aria-label="Project start date"
        value={iso}
        autoFocus
        onChange={(e) => {
          if (e.target.value) setStartDate(e.target.value);
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn("h-11 w-[11.5rem] text-sm", className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "inline-flex min-h-11 items-center rounded-md px-1 -mx-1 text-left hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      aria-label={`Project start date, ${label}. Click to edit`}
    >
      <span>{label}</span>
      <Pencil className="ml-1.5 size-3.5 shrink-0 opacity-50" />
    </button>
  );
}
