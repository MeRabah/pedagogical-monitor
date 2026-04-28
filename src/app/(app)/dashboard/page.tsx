import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { moduleProgress } from "@/lib/progress";
import {
  ProgressBarChart,
  StatusPieChart,
  ProgressLineChart,
} from "@/components/charts/DashboardCharts";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SEMESTER_ORDER = ["S5", "S6", "S7", "S8", "S9"];

function semesterOf(academicYear: string) {
  const m = academicYear.match(/S\d+/);
  return m ? m[0] : "—";
}

export default async function DashboardPage() {
  const [modules, alerts, allComponents, logs] = await Promise.all([
    prisma.module.findMany({
      include: {
        professor: { select: { name: true } },
        components: true,
        alerts: { where: { resolved: false } },
      },
      orderBy: [{ academicYear: "asc" }, { name: "asc" }],
    }),
    prisma.alert.findMany({ where: { resolved: false } }),
    prisma.moduleComponent.findMany(),
    prisma.progressLog.findMany({ orderBy: { logDate: "asc" } }),
  ]);

  const total = modules.length;
  const delayed = modules.filter((m) => m.components.some((c) => c.status === "delayed")).length;
  const avgProgress =
    total === 0
      ? 0
      : Math.round(modules.reduce((s, m) => s + moduleProgress(m.components), 0) / total);

  // Group by semester for readable bar chart.
  const bySemester = new Map<string, { sum: number; count: number }>();
  for (const m of modules) {
    const sem = semesterOf(m.academicYear);
    const cur = bySemester.get(sem) ?? { sum: 0, count: 0 };
    cur.sum += moduleProgress(m.components);
    cur.count += 1;
    bySemester.set(sem, cur);
  }
  const semesterBarData = SEMESTER_ORDER.filter((s) => bySemester.has(s)).map((s) => {
    const v = bySemester.get(s)!;
    return { name: s, progress: Math.round(v.sum / v.count) };
  });

  const statusCounts = allComponents.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const byDate: Record<string, number> = {};
  for (const log of logs) {
    const key = log.logDate.toISOString().slice(0, 10);
    byDate[key] = (byDate[key] ?? 0) + log.hoursAdded;
  }
  const lineData = Object.entries(byDate).map(([date, hours]) => ({ date, hours }));

  // Group module list by semester for the table sections.
  const groupedModules = new Map<string, typeof modules>();
  for (const m of modules) {
    const sem = semesterOf(m.academicYear);
    const list = groupedModules.get(sem) ?? [];
    list.push(m);
    groupedModules.set(sem, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Overview of pedagogical progress across {total} modules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Total modules" value={total} />
        <Kpi label="Modules delayed" value={delayed} accent={delayed > 0 ? "critical" : "muted"} />
        <Kpi label="Avg. progress" value={`${avgProgress}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Avg. progress per semester</CardTitle></CardHeader>
          <CardContent><ProgressBarChart data={semesterBarData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
          <CardContent><StatusPieChart data={pieData} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Hours logged over time</CardTitle></CardHeader>
        <CardContent><ProgressLineChart data={lineData} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All modules ({total})</CardTitle>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {alerts.length} active alert{alerts.length === 1 ? "" : "s"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {SEMESTER_ORDER.filter((s) => groupedModules.has(s)).map((sem) => {
            const list = groupedModules.get(sem)!;
            return (
              <div key={sem} className="border-b border-[hsl(var(--border))] last:border-0">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {sem} — {list.length} module{list.length > 1 ? "s" : ""}
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-[hsl(var(--muted-foreground))]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Module</th>
                      <th className="px-4 py-2 font-medium">Professor</th>
                      <th className="px-4 py-2 font-medium">Progress</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => {
                      const p = moduleProgress(m.components);
                      const isDelayed = m.components.some((c) => c.status === "delayed");
                      return (
                        <tr key={m.id} className="border-t border-[hsl(var(--border))]">
                          <td className="px-4 py-2">
                            <Link href={`/modules/${m.id}`} className="hover:underline font-medium">
                              {m.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-[hsl(var(--muted-foreground))]">
                            {m.professor?.name ?? "—"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-2 rounded bg-[hsl(var(--muted))] overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${p}%` }} />
                              </div>
                              <span className="tabular-nums text-xs">{p}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {isDelayed ? (
                              <Badge variant="critical">Delayed</Badge>
                            ) : p === 100 ? (
                              <Badge variant="success">Completed</Badge>
                            ) : p > 0 ? (
                              <Badge>In progress</Badge>
                            ) : (
                              <Badge variant="muted">Not started</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {m.alerts.length > 0 ? (
                              <Badge variant="warning">{m.alerts.length}</Badge>
                            ) : (
                              <span className="text-[hsl(var(--muted-foreground))]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string | number;
  accent?: "default" | "critical" | "muted";
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          {label}
        </div>
        <div
          className={
            "mt-2 text-3xl font-semibold " + (accent === "critical" ? "text-red-500" : "")
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
