import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BUDGET_CAP,
  milestoneCost,
  milestoneStats,
  totalBudgetOf,
  type Milestone,
} from "@/lib/plan";
import { formatUsd, formatUsdCompact } from "@/lib/utils";

type Props = {
  completed: ReadonlySet<string>;
  milestones: Milestone[];
};

export function BudgetView({ completed, milestones }: Props) {
  const rows = milestones.map((m) => {
    const stats = milestoneStats(m, completed);
    return {
      name: `${String(m.number).padStart(2, "0")}  ${m.short}`,
      spent: stats.spent,
      remaining: stats.cost - stats.spent,
      cost: stats.cost,
    };
  });

  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const budget = totalBudgetOf(milestones);
  const over = budget > BUDGET_CAP;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <header className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Budget
          </h2>
          <p className="text-sm text-muted-foreground">
            Materials, rentals, permits, and licensed trades only. Volunteer
            labor is not billed. Cap {formatUsd(BUDGET_CAP)}. Add a task on the
            Plan tab if you switch products.
          </p>
        </div>
        <p
          className={`font-mono text-sm tabular-nums ${over ? "text-warn" : "text-muted-foreground"}`}
        >
          {formatUsd(budget)} plan · {formatUsd(spent)} spent
        </p>
      </header>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => formatUsdCompact(Number(v))}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={92}
              tick={{ fill: "var(--color-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                formatUsd(Number(value ?? 0)),
                name === "spent" ? "Spent" : "Remaining",
              ]}
            />
            <Bar dataKey="spent" stackId="a" fill="var(--color-primary)" />
            <Bar
              dataKey="remaining"
              stackId="a"
              fill="var(--color-secondary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {milestones.map((m) => {
          const stats = milestoneStats(m, completed);
          return (
            <li
              key={m.id}
              className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
            >
              <span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {String(m.number).padStart(2, "0")}
                </span>{" "}
                {m.title}
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {formatUsd(stats.spent)}
                <span className="text-rule"> / </span>
                {formatUsd(milestoneCost(m))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
