"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@univ.edu");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Sign in</CardTitle>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Pedagogical Monitor
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm"
              />
            </div>
            {error && <div className="text-xs text-red-500">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 pt-2 border-t border-[hsl(var(--border))]">
              <p className="font-medium text-center">
                Demo accounts (password: password123)
              </p>
              <ul className="space-y-0.5">
                <li>admin@univ.edu — admin (edits any module)</li>
                <li>committee@univ.edu — read-only</li>
                <li>
                  Professors: one per module, email is a slug of the module
                  name. Examples:
                  <ul className="pl-3 mt-0.5">
                    <li>compilation@univ.edu</li>
                    <li>machine_learning@univ.edu</li>
                    <li>deep_learning@univ.edu</li>
                  </ul>
                </li>
              </ul>
              <p className="text-center pt-1">
                Full list printed by <code>docker compose logs app</code> after
                seeding.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
