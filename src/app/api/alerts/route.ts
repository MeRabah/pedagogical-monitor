import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = req.nextUrl.searchParams.get("resolved");
  const resolvedFilter = resolved === null ? {} : { resolved: resolved === "true" };
  const moduleFilter =
    session.role === "professor" ? { module: { professorId: session.sub } } : {};

  const alerts = await prisma.alert.findMany({
    where: { ...resolvedFilter, ...moduleFilter },
    include: { module: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "committee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, resolved } = await req.json();

  if (session.role === "professor") {
    const alert = await prisma.alert.findUnique({
      where: { id },
      select: { module: { select: { professorId: true } } },
    });
    if (!alert || alert.module.professorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.alert.update({ where: { id }, data: { resolved: !!resolved } });
  return NextResponse.json(updated);
}
