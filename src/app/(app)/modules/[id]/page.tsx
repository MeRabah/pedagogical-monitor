import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { componentProgress, moduleProgress } from "@/lib/progress";
import { UpdateProgressForm } from "@/components/UpdateProgressForm";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ModuleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      professor: { select: { id: true, name: true, email: true } },
      components: { include: { progressLogs: { orderBy: { logDate: "asc" } } } },
      alerts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mod) notFound();

  const p = moduleProgress(mod.components);
  const canEdit =
    session?.role === "admin" ||
    (session?.role === "professor" && mod.professor?.id === session.sub);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">{mod.academicYear}</div>
        <h1 className="text-2xl font-semibold">{mod.name}</h1>
        <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          {mod.professor?.name ?? "Unassigned"} · {p}% overall
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mod.components.map((c) => {
          const cp = componentProgress(c);
          return (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{c.type}</CardTitle>
                  <Badge
                    variant={
                      c.status === "delayed"
                        ? "critical"
                        : c.status === "completed"
                        ? "success"
                        : c.status === "in_progress"
                        ? "default"
                        : "muted"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold tabular-nums">{cp}%</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {c.completedHours} / {c.plannedHours}h
                </div>
                <div className="h-2 rounded bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${cp}%` }} />
                </div>
                {c.endDate && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Ends: {new Date(c.endDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {canEdit ? (
        <Card>
          <CardHeader><CardTitle>Log progress</CardTitle></CardHeader>
          <CardContent>
            <UpdateProgressForm
              components={mod.components.map((c) => ({
                id: c.id,
                type: c.type,
                completedHours: c.completedHours,
                plannedHours: c.plannedHours,
              }))}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4 text-sm text-[hsl(var(--muted-foreground))]">
            Only the assigned professor or an admin can log progress on this module.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
        <CardContent>
          {mod.alerts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No alerts.</p>
          ) : (
            <ul className="space-y-2">
              {mod.alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.message}</span>
                  <Badge variant={a.severity === "critical" ? "critical" : "warning"}>
                    {a.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
