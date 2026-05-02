"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  FileText,
  LogOut,
  Moon,
  Sun,
  Database,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const isAdmin = me?.role === "admin";

  return (
    <aside className="w-60 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
      <div className="p-5 border-b border-[hsl(var(--border))]">
        <div className="font-semibold">Pedagogical Monitor</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">SaaS</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                active
                  ? "bg-[hsl(var(--muted))] font-medium"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Database
            </div>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                pathname.startsWith("/admin")
                  ? "bg-[hsl(var(--muted))] font-medium"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              <Database className="h-4 w-4" />
              Database admin
            </Link>
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Adminer
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="http://localhost:5555"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Prisma Studio
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </>
        )}
      </nav>
      <div className="p-3 border-t border-[hsl(var(--border))] space-y-1">
        {me && (
          <div className="px-3 pb-2 text-xs">
            <div className="truncate font-medium">{me.email}</div>
            <div className="text-[hsl(var(--muted-foreground))]">{me.role}</div>
          </div>
        )}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
