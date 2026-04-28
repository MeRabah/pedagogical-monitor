import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus, isDelayed } from "@/lib/progress";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  componentId: z.string().uuid(),
  hoursAdded: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { componentId, hoursAdded } = parsed.data;

  const component = await prisma.moduleComponent.findUnique({
    where: { id: componentId },
    include: { module: { select: { professorId: true, name: true } } },
  });
  if (!component) return NextResponse.json({ error: "Component not found" }, { status: 404 });

  const isAdmin = session.role === "admin";
  const isOwner = session.role === "professor" && component.module.professorId === session.sub;
  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You can only update progress on modules you teach." },
      { status: 403 }
    );
  }

  const newCompleted = Math.min(component.plannedHours, component.completedHours + hoursAdded);
  const status = deriveStatus({ ...component, completedHours: newCompleted });

  const updated = await prisma.moduleComponent.update({
    where: { id: componentId },
    data: { completedHours: newCompleted, status },
  });

  await prisma.progressLog.create({ data: { componentId, hoursAdded } });

  if (isDelayed(updated)) {
    const existing = await prisma.alert.findFirst({
      where: { moduleId: updated.moduleId, resolved: false, severity: "critical" },
    });
    if (!existing) {
      await prisma.alert.create({
        data: {
          moduleId: updated.moduleId,
          message: `Component ${updated.type} is behind schedule.`,
          severity: "critical",
        },
      });
    }
  }

  return NextResponse.json(updated);
}
