"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "redemptions", label: "Pending Redemptions" },
  { id: "analytics", label: "Analytics" },
  { id: "projects", label: "Projects" },
] as const;

export function AdminNav() {
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("id");
          if (id) setActiveId(id);
          break;
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      setActiveId(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="sticky top-16 z-10 -mx-4 mb-8 flex border-b border-border/60 bg-background/95 px-4 pb-0 backdrop-blur-sm sm:-mx-6 sm:px-6"
      role="tablist"
      aria-label="Admin sections"
    >
      <div className="flex gap-1 overflow-x-auto">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeId === id}
            onClick={() => scrollTo(id)}
            className={cn(
              "relative shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeId === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
