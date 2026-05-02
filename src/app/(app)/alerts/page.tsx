import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const moduleFilter =
    session.role === "professor" ? { module: { professorId: session.sub } } : {};

  const alerts = await prisma.alert.findMany({
    where: moduleFilter,
    include: { module: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <Card>
        <CardHeader><CardTitle>All alerts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="px-4 py-2 font-medium">Module</th>
                <th className="px-4 py-2 font-medium">Message</th>
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-[hsl(var(--border))] last:border-0">
                  <td className="px-4 py-3">{a.module.name}</td>
                  <td className="px-4 py-3">{a.message}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.severity === "critical" ? "critical" : "warning"}>
                      {a.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.resolved ? <Badge variant="success">Resolved</Badge> : <Badge>Open</Badge>}
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
