import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ChatWidget } from "@/components/chat-widget";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Experience", "/experience"],
  ["Projects", "/projects"],
  ["Skills", "/skills"],
  ["Articles", "/articles"],
  ["Resume", "/resume"],
  ["Contact", "/contact"],
] as const;

export function PortfolioLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const next = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="section-container flex h-16 items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary" aria-label="Sateesh Kumar Singh home">SKS</Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map(([label, to]) => (
              <Link key={to} to={to} className={cn("rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-foreground", location.pathname === to ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground")}>{label}</Link>
            ))}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>{dark ? <Sun /> : <Moon />}</Button>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>{dark ? <Sun /> : <Moon />}</Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {open && <nav className="border-t border-border bg-background px-4 py-3 md:hidden" aria-label="Mobile navigation">{links.map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{label}</Link>)}</nav>}
      </header>
      <main id="content" className="pt-16">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="section-container mb-8"><NewsletterSignup /></div>
        <div className="section-container flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Sateesh Kumar Singh. Built for meaningful technology outcomes.</p>
          <div className="flex gap-4"><a href="mailto:sateesh.singh76@gmail.com" className="hover:text-primary">Email</a><a href="https://www.linkedin.com/in/sateesh-singh-2224b666/" target="_blank" rel="noreferrer" className="hover:text-primary">LinkedIn</a><a href="https://github.com/sateesh1976/" target="_blank" rel="noreferrer" className="hover:text-primary">GitHub</a></div>
        </div>
      </footer>
      <FeedbackDialog />
      <ChatWidget />

    </div>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="mb-12 max-w-3xl"><p className="mb-3 text-xs font-bold uppercase text-primary">{eyebrow}</p><h1 className="text-4xl font-bold sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{children}</p></header>;
}