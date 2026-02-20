import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, Wallet, Plus } from "lucide-react";
import { VamoLogo } from "@/components/VamoLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";

export function AppShell({
  children,
  title,
  subtitle,
  nav = "default",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  nav?: "default" | "auth";
}) {
  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-md safe-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 px-4 sm:px-6">
          <VamoLogo href={nav === "auth" ? "/projects" : "/"} />
          {nav === "auth" ? (
            <nav className="flex items-center gap-1 sm:gap-2 ml-auto">
              <ThemeToggle />
              <Link href="/wallet">
                <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 min-h-9 sm:min-h-10 px-2 sm:px-3">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Wallet</span>
                </Button>
              </Link>
              <Link href="/projects/new">
                <Button size="sm" className="gap-1.5 sm:gap-2 min-h-9 sm:min-h-10 px-3 sm:px-4 bg-primary hover:bg-primary/90 shadow-sm">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">New project</span>
                </Button>
              </Link>
              <UserAvatar />
            </nav>
          ) : (
            <nav className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Link href="/marketplace">
                <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 min-h-9 sm:min-h-10 px-2 sm:px-3">
                  <Store className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Marketplace</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="min-h-9 sm:min-h-10 px-3">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="min-h-9 sm:min-h-10 px-3 sm:px-4 bg-primary hover:bg-primary/90">Sign up</Button>
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main className="container py-6 sm:py-8 px-4 sm:px-6 safe-bottom">
        {(title || subtitle) && (
          <div className="mb-6 sm:mb-8">
            {title && <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm sm:text-base text-muted-foreground font-body">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
