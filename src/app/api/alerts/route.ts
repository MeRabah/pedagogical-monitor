import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const resolved = req.nextUrl.searchParams.get("resolved");
  const alerts = await prisma.alert.findMany({
    where: resolved === null ? {} : { resolved: resolved === "true" },
    include: { module: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function PATCH(req: NextRequest) {
  const { id, resolved } = await req.json();
  const updated = await prisma.alert.update({ where: { id }, data: { resolved: !!resolved } });
  return NextResponse.json(updated);
}
