"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const OVERVIEW_LABELS: Record<string, string> = {
  users: "Users",
  projects: "Projects",
  prompts: "Prompts",
  earned: "Earned",
  redeemed: "Redeemed",
  listings: "Listings",
};

const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 142 76% 36%))",
  "hsl(var(--chart-3, 262 83% 58%))",
  "hsl(var(--chart-4, 38 92% 50%))",
  "hsl(var(--chart-5, 0 72% 51%))",
  "hsl(var(--chart-1, 199 89% 48%))",
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 142 76% 36%))"];

export type OverviewStats = {
  users: number;
  projects: number;
  prompts: number;
  earned: number;
  redeemed: number;
  listings: number;
};

export type DailyCount = {
  date: string;
  users: number;
  projects: number;
};

type AdminOverviewChartsProps = {
  stats: OverviewStats;
  dailyCounts: DailyCount[];
};

function overviewToBarData(stats: OverviewStats) {
  return [
    { name: "Users", value: stats.users, key: "users" },
    { name: "Projects", value: stats.projects, key: "projects" },
    { name: "Prompts", value: stats.prompts, key: "prompts" },
    { name: "Earned 🍍", value: stats.earned, key: "earned" },
    { name: "Redeemed 🍍", value: stats.redeemed, key: "redeemed" },
    { name: "Listings", value: stats.listings, key: "listings" },
  ];
}

export function AdminOverviewCharts({ stats, dailyCounts }: AdminOverviewChartsProps) {
  const barData = overviewToBarData(stats);
  const pieData = [
    { name: "Pineapples earned", value: stats.earned, color: PIE_COLORS[0] },
    { name: "Pineapples redeemed", value: stats.redeemed, color: PIE_COLORS[1] },
  ].filter((d) => d.value > 0);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {/* Bar chart: overview metrics */}
      <div className="rounded-2xl border-2 bg-card p-4 shadow-sm">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Overview metrics
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="name"
                width={75}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(value: number | undefined) => [value ?? "", ""]}
                labelFormatter={(label) => OVERVIEW_LABELS[label] ?? label}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut: earned vs redeemed */}
      <div className="rounded-2xl border-2 bg-card p-4 shadow-sm">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Pineapples: earned vs redeemed
        </h3>
        <div className="h-[280px] w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                  formatter={(value: number | undefined) => [`🍍 ${value ?? 0}`, ""]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No pineapple activity yet</p>
          )}
        </div>
      </div>

      {/* Area chart: activity over time (new users & projects) */}
      {dailyCounts.length > 0 && (
        <div className="rounded-2xl border-2 bg-card p-4 shadow-sm lg:col-span-2">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
            Activity (last 14 days): new users & projects
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyCounts}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2, 142 76% 36%))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2, 142 76% 36%))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New users"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="projects"
                  name="New projects"
                  stroke="hsl(var(--chart-2, 142 76% 36%))"
                  fillOpacity={1}
                  fill="url(#colorProjects)"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
