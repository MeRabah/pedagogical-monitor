import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { moduleProgress } from "@/lib/progress";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { moduleWhereForSession } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const modules = await prisma.module.findMany({
    where: moduleWhereForSession(session),
    include: {
      professor: { select: { name: true } },
      components: true,
      alerts: { where: { resolved: false } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Modules</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => {
          const p = moduleProgress(m.components);
          const delayed = m.components.some((c) => c.status === "delayed");
          return (
            <Link key={m.id} href={`/modules/${m.id}`}>
              <Card className="hover:border-blue-500/40 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    {delayed && <Badge variant="critical">Delayed</Badge>}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {m.academicYear} · {m.professor?.name ?? "Unassigned"}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded bg-[hsl(var(--muted))] overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-sm tabular-nums">{p}%</span>
                  </div>
                  <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {m.components.map((c) => (
                      <span key={c.id}>
                        {c.type}: {c.completedHours}/{c.plannedHours}h
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
