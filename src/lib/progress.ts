import { ComponentStatus, ModuleComponent } from "@prisma/client";

export function componentProgress(c: Pick<ModuleComponent, "completedHours" | "plannedHours">) {
  if (!c.plannedHours) return 0;
  return Math.min(100, Math.round((c.completedHours / c.plannedHours) * 100));
}

export function moduleProgress(components: Array<Pick<ModuleComponent, "completedHours" | "plannedHours">>) {
  if (!components.length) return 0;
  const sum = components.reduce((acc, c) => acc + componentProgress(c), 0);
  return Math.round(sum / components.length);
}

export function isDelayed(c: Pick<ModuleComponent, "completedHours" | "plannedHours" | "endDate">) {
  if (!c.endDate) return false;
  return new Date() > new Date(c.endDate) && c.completedHours < c.plannedHours;
}

export function deriveStatus(
  c: Pick<ModuleComponent, "completedHours" | "plannedHours" | "endDate">
): ComponentStatus {
  if (c.completedHours >= c.plannedHours && c.plannedHours > 0) return "completed";
  if (isDelayed(c)) return "delayed";
  if (c.completedHours > 0) return "in_progress";
  return "not_started";
}
