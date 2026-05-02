import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const moduleFilter =
    session.role === "professor"
      ? { modules: { some: { module: { professorId: session.sub } } } }
      : {};

  const reports = await prisma.report.findMany({
    where: moduleFilter,
    include: { modules: { include: { module: { select: { id: true, name: true } } } } },
    orderBy: { meetingDate: "desc" },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "professor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, meetingDate, moduleIds } = body as {
    title: string;
    content: string;
    meetingDate: string;
    moduleIds?: string[];
  };
  const report = await prisma.report.create({
    data: {
      title,
      content,
      meetingDate: new Date(meetingDate),
      modules: moduleIds?.length
        ? { create: moduleIds.map((moduleId) => ({ moduleId })) }
        : undefined,
    },
  });
  return NextResponse.json(report, { status: 201 });
}
