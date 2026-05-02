"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Component = {
  id: string;
  type: string;
  completedHours: number;
  plannedHours: number;
};

export function UpdateProgressForm({ components }: { components: Component[] }) {
  const router = useRouter();
  const [componentId, setComponentId] = useState(components[0]?.id ?? "");
  const [hours, setHours] = useState(1);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    setErr(null);
    const hoursAdded = mode === "remove" ? -hours : hours;
    const res = await fetch("/api/progress/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId, hoursAdded }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try {
        const j = JSON.parse(text);
        detail = j.error ?? text;
      } catch {}
      setErr(`(${res.status}) ${detail || "Update failed"}`);
      return;
    }
    setMsg(`${mode === "remove" ? "Removed" : "Logged"} ${hours}h.`);
    setHours(1);
    router.refresh();
  }

  const btnBase = "px-3 py-1.5 text-xs font-medium border transition-colors";
  const active = "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]";
  const inactive = "bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]";

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Component</label>
        <select
          value={componentId}
          onChange={(e) => setComponentId(e.target.value)}
          className="px-3 py-2 rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm"
        >
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.type} — {c.completedHours}/{c.plannedHours}h
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Action</label>
        <div className="flex rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("add")}
            className={`${btnBase} rounded-l-md border-r-0 ${mode === "add" ? active : inactive}`}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setMode("remove")}
            className={`${btnBase} rounded-r-md ${mode === "remove" ? active : inactive}`}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">
          Hours to {mode === "remove" ? "remove" : "add"}
        </label>
        <input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(Math.max(1, Number(e.target.value)))}
          className="px-3 py-2 rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm w-32"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Saving…" : mode === "remove" ? "Remove hours" : "Log hours"}
      </button>
      {msg && <span className="text-xs text-emerald-500">{msg}</span>}
      {err && <span className="text-xs text-red-500">{err}</span>}
    </form>
  );
}
