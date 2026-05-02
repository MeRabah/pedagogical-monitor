import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moduleProgress } from "@/lib/progress";
import { getSession } from "@/lib/auth";
import { moduleWhereForSession } from "@/lib/authorization";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const modules = await prisma.module.findMany({
    where: moduleWhereForSession(session),
    include: {
      professor: { select: { id: true, name: true, email: true } },
      components: true,
      alerts: { where: { resolved: false } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = modules.map((m) => ({
    id: m.id,
    name: m.name,
    academicYear: m.academicYear,
    professor: m.professor,
    components: m.components,
    progress: moduleProgress(m.components),
    activeAlerts: m.alerts.length,
    delayed: m.components.some((c) => c.status === "delayed"),
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const mod = await prisma.module.create({
    data: {
      name: body.name,
      academicYear: body.academicYear,
      professorId: body.professorId,
      components: {
        create: [
          { type: "C", plannedHours: body.cHours ?? 30 },
          { type: "TD", plannedHours: body.tdHours ?? 22 },
          { type: "TP", plannedHours: body.tpHours ?? 20 },
        ],
      },
    },
    include: { components: true },
  });
  return NextResponse.json(mod, { status: 201 });
}
