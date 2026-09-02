import {
  TOTAL_WEEKS,
  formatMonth,
  milestoneStats,
  type Milestone,
} from "@/lib/plan";
import { useProjectStart } from "@/lib/store";
import { StartDateField } from "@/components/start-date-field";
import { cn } from "@/lib/utils";

type Props = {
  completed: ReadonlySet<string>;
  selectedId: string;
  onSelect: (id: string) => void;
  milestones: Milestone[];
};

const MONTH_MARKS = [0, 9, 18, 27, 36];

export function ScheduleView({
  completed,
  selectedId,
  onSelect,
  milestones,
}: Props) {
  const start = useProjectStart();
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Schedule
          </h2>
          <p className="text-sm text-muted-foreground">
            {TOTAL_WEEKS} weeks. Change the start date and every bar shifts.
            Retirees weekdays; students Wednesday evening and Saturday morning.
          </p>
        </div>
        <StartDateField className="font-mono text-xs text-muted-foreground" />
      </header>

      <div className="mb-2 hidden grid-cols-[8.5rem_1fr] gap-3 sm:grid">
        <div />
        <div className="relative h-5">
          {MONTH_MARKS.map((week) => (
            <span
              key={week}
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase first:translate-x-0"
              style={{ left: `${(week / TOTAL_WEEKS) * 100}%` }}
            >
              {formatMonth(week, start)}
            </span>
          ))}
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {milestones.map((m) => {
          const stats = milestoneStats(m, completed);
          const left = (m.startWeek / TOTAL_WEEKS) * 100;
          const width = (m.durationWeeks / TOTAL_WEEKS) * 100;
          const selected = m.id === selectedId;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className={cn(
                  "grid w-full grid-cols-1 items-center gap-1.5 rounded-lg px-2 py-2 text-left sm:grid-cols-[8.5rem_1fr] sm:gap-3",
                  selected ? "bg-accent/70" : "hover:bg-muted/60",
                )}
              >
                <span className="flex items-baseline justify-between gap-2 sm:block">
                  <span className="text-sm font-medium">
                    <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
                      {String(m.number).padStart(2, "0")}
                    </span>{" "}
                    {m.short}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Wk {m.startWeek + 1}–{m.startWeek + m.durationWeeks}
                  </span>
                </span>
                <span className="relative block h-8 rounded-md bg-muted">
                  <span
                    className="absolute inset-y-1 rounded-sm bg-secondary"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <span
                    className="absolute inset-y-1 rounded-sm bg-primary transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width * stats.ratio, stats.ratio > 0 ? 0.6 : 0)}%`,
                    }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
