import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    include: { modules: { include: { module: { select: { name: true } } } } },
    orderBy: { meetingDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meeting reports</h1>
      <div className="space-y-4">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{r.title}</CardTitle>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(r.meetingDate).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{r.content}</p>
              <div className="flex flex-wrap gap-1">
                {r.modules.map((rm) => (
                  <Badge key={rm.module.name} variant="muted">
                    {rm.module.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No reports.</p>
        )}
      </div>
    </div>
  );
}
