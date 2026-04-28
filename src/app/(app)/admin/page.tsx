import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Forbidden — admin role required.
        </p>
      </div>
    );
  }

  const [
    userCount,
    moduleCount,
    componentCount,
    progressLogCount,
    alertCount,
    reportCount,
    notifCount,
    users,
    recentLogs,
    recentAlerts,
    componentsByStatus,
    usersByRole,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.module.count(),
    prisma.moduleComponent.count(),
    prisma.progressLog.count(),
    prisma.alert.count(),
    prisma.report.count(),
    prisma.notification.count(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.progressLog.findMany({
      orderBy: { logDate: "desc" },
      take: 15,
      include: { component: { include: { module: { select: { name: true } } } } },
    }),
    prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { module: { select: { name: true } } },
    }),
    prisma.moduleComponent.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const tables = [
    { name: "users", count: userCount },
    { name: "modules", count: moduleCount },
    { name: "module_components", count: componentCount },
    { name: "progress_logs", count: progressLogCount },
    { name: "alerts", count: alertCount },
    { name: "reports", count: reportCount },
    { name: "notifications", count: notifCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Database admin</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Live view of every table. For raw editing use{" "}
          <a className="underline" href="http://localhost:8080" target="_blank" rel="noreferrer">
            Adminer
          </a>{" "}
          or{" "}
          <a className="underline" href="http://localhost:5555" target="_blank" rel="noreferrer">
            Prisma Studio
          </a>
          .
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-[hsl(var(--muted))] p-3 rounded overflow-x-auto">
{`Host:     localhost
Port:     5432
User:     postgres
Password: postgres
Database: pedagogical_db

Inside Docker network: postgresql://postgres:postgres@db:5432/pedagogical_db`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tables</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="px-4 py-2 font-medium">Table</th>
                <th className="px-4 py-2 font-medium">Rows</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.name} className="border-b border-[hsl(var(--border))] last:border-0">
                  <td className="px-4 py-2 font-mono">{t.name}</td>
                  <td className="px-4 py-2 tabular-nums">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Users by role</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {usersByRole.map((r) => (
                <li key={r.role} className="flex justify-between">
                  <span className="font-mono">{r.role}</span>
                  <span className="tabular-nums">{r._count._all}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Components by status</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {componentsByStatus.map((s) => (
                <li key={s.status} className="flex justify-between">
                  <span className="font-mono">{s.status}</span>
                  <span className="tabular-nums">{s._count._all}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[hsl(var(--border))] last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">
                    <Badge variant={u.role === "admin" ? "critical" : u.role === "committee" ? "warning" : "muted"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-[hsl(var(--muted-foreground))]">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent progress logs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Module</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">+h</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((l) => (
                  <tr key={l.id} className="border-b border-[hsl(var(--border))] last:border-0">
                    <td className="px-4 py-2 text-[hsl(var(--muted-foreground))] text-xs">
                      {new Date(l.logDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/modules/${l.component.moduleId}`} className="hover:underline">
                        {l.component.module.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-mono">{l.component.type}</td>
                    <td className="px-4 py-2 tabular-nums">+{l.hoursAdded}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent alerts</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Module</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((a) => (
                  <tr key={a.id} className="border-b border-[hsl(var(--border))] last:border-0">
                    <td className="px-4 py-2 text-[hsl(var(--muted-foreground))] text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{a.module.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={a.severity === "critical" ? "critical" : "warning"}>
                        {a.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {a.resolved ? <Badge variant="success">resolved</Badge> : <Badge>open</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
