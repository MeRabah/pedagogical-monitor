import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { componentProgress, moduleProgress } from "@/lib/progress";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { id } = await params;
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
