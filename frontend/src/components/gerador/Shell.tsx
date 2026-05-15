import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface ShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function GeradorShell({ children, title, showBack }: ShellProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/gerador" className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--primary-glow)" }}>
              Alfalux
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-ink-foreground/60">
              Gerador
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 ring-1 ring-primary-glow/40 flex items-center justify-center text-sm font-medium text-primary-glow">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {showBack && (
          <Link
            to="/gerador"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
          </Link>
        )}
        {title && (
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-8" style={{ fontFamily: "var(--font-sans)" }}>
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}
