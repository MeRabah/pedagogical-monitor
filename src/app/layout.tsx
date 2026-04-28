import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedagogical Monitor",
  description: "Monitor pedagogical progress of university modules",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark'); } catch (e) {}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
