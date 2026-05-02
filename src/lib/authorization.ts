import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/** Returns a Prisma `where` clause that restricts module queries to what the session user can see. */
export function moduleWhereForSession(session: JwtPayload): Prisma.ModuleWhereInput {
  if (session.role === "professor") {
    return { professorId: session.sub };
  }
  return {};
}

/** Returns true if the session user is allowed to read a specific module. */
export async function canAccessModule(session: JwtPayload, moduleId: string): Promise<boolean> {
  if (session.role !== "professor") return true;
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { professorId: true },
  });
  return mod?.professorId === session.sub;
}
