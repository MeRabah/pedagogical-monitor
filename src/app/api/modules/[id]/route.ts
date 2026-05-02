import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { componentProgress, moduleProgress } from "@/lib/progress";
import { getSession } from "@/lib/auth";
import { canAccessModule } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await canAccessModule(session, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      professor: { select: { id: true, name: true, email: true } },
      components: { include: { progressLogs: { orderBy: { logDate: "asc" } } } },
      alerts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...mod,
    progress: moduleProgress(mod.components),
    components: mod.components.map((c) => ({ ...c, progress: componentProgress(c) })),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
