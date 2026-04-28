import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reports = await prisma.report.findMany({
    include: { modules: { include: { module: { select: { id: true, name: true } } } } },
    orderBy: { meetingDate: "desc" },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
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
