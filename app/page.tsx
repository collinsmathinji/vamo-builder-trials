import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { VamoLogo } from "@/components/VamoLogo";
import { FounderAtDesk } from "@/components/FounderAtDesk";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featuredListings } = await supabase
    .from("listings")
    .select("id, title, asking_price_low, asking_price_high, metrics")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <VamoLogo href="/" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 text-sm">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
                Sign up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative container px-4 sm:px-6 py-12 md:py-16 lg:py-20 overflow-hidden bg-warm-mesh">
          {/* Background context: isometric cityscape (corner clipped to hide watermark) */}
          <div className="pointer-events-none absolute inset-0 z-0 [clip-path:polygon(0_0,100%_0,100%_92%,92%_100%,0_100%)]">
            <Image
              src="/hero-cityscape.png"
              alt=""
              fill
              className="object-cover object-center opacity-[0.24] dark:opacity-[0.18]"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-background/60 dark:bg-background/70 [clip-path:polygon(0_0,100%_0,100%_92%,92%_100%,0_100%)]" aria-hidden />
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: minimal copy */}
            <div className="order-2 lg:order-1">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                Build, log, <span className="text-primary">ship.</span>
              </h1>
              <p className="text-foreground/80 text-base sm:text-lg mb-6 max-w-md dark:text-muted-foreground">
                For solo founders. Describe your app, track progress, earn rewards.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 text-sm font-semibold">
                    Start building
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-foreground/20 bg-background/80 text-foreground hover:bg-muted/60 hover:border-foreground/30 h-10 px-5 text-sm font-medium dark:border-border dark:bg-muted/50 dark:text-foreground dark:hover:bg-muted dark:hover:border-border"
                  >
                    See marketplace
                  </Button>
                </Link>
              </div>
            </div>
            {/* Right: 3D Scene */}
            <div className="order-1 lg:order-2">
              <FounderAtDesk />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-muted/20">
          <div className="container px-4 sm:px-6 py-12 md:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-2">
              How it works
            </h2>
            <p className="text-muted-foreground text-sm mb-10 max-w-lg">
              Three steps to ship and get rewarded for real progress.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-10">
              <div className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-primary text-xs font-semibold tracking-wide">01</span>
                <h3 className="text-foreground font-semibold mt-1 mb-2">Describe</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Tell us what you’re building. We help you get a version up.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-primary text-xs font-semibold tracking-wide">02</span>
                <h3 className="text-foreground font-semibold mt-1 mb-2">Log progress</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Track features, users, revenue. Earn pineapples.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 text-xl">
                  🍍
                </div>
                <span className="text-primary text-xs font-semibold tracking-wide">03</span>
                <h3 className="text-foreground font-semibold mt-1 mb-2">Redeem</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Turn pineapples into rewards you actually use.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials — one card per person + quote */}
        <section className="border-t border-border/60 py-10 md:py-14 overflow-hidden" aria-label="What founders say">
          <div className="container px-4 sm:px-6 mb-6">
            <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground">What founders say</h2>
            <p className="text-muted-foreground text-sm mt-1">Real feedback from solo founders and indie makers.</p>
          </div>
          <div className="flex w-full overflow-hidden">
            <div className="flex animate-marquee gap-5 shrink-0 pr-5">
              {[
                { name: "Riley Park", role: "Indie maker", text: "Pineapples for real progress — actually works." },
                { name: "Alex Chen", role: "Solo founder", text: "Stopped planning, started shipping." },
                { name: "Sam Rivera", role: "Indie maker", text: "Best thing for solo founders." },
                { name: "Jordan Kim", role: "Solo founder", text: "Finally shipped my side project." },
                { name: "Morgan Lee", role: "Builder", text: "The logging + rewards kept me accountable." },
                { name: "Casey Drew", role: "Solo founder", text: "Built the MVP in a week." },
              ].flatMap((t) => [
                <div
                  key={`${t.name}-a`}
                  className="flex shrink-0 flex-col rounded-2xl border border-border bg-card shadow-sm p-5 w-[300px] sm:w-[320px]"
                >
                  <p className="text-sm text-foreground/90 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>,
              ])}
              {[
                { name: "Riley Park", role: "Indie maker", text: "Pineapples for real progress — actually works." },
                { name: "Alex Chen", role: "Solo founder", text: "Stopped planning, started shipping." },
                { name: "Sam Rivera", role: "Indie maker", text: "Best thing for solo founders." },
                { name: "Jordan Kim", role: "Solo founder", text: "Finally shipped my side project." },
                { name: "Morgan Lee", role: "Builder", text: "The logging + rewards kept me accountable." },
                { name: "Casey Drew", role: "Solo founder", text: "Built the MVP in a week." },
              ].map((t, i) => (
                <div
                  key={`${t.name}-b-${i}`}
                  className="flex shrink-0 flex-col rounded-2xl border border-border bg-card shadow-sm p-5 w-[300px] sm:w-[320px]"
                >
                  <p className="text-sm text-foreground/90 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section className="border-t border-border/60 bg-muted/20">
          <div className="container px-4 sm:px-6 py-12 md:py-14">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground">Marketplace</h2>
                <p className="text-muted-foreground text-sm mt-1">Projects built on Vamo — buy or get inspired.</p>
              </div>
              <Link href="/marketplace">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-10 px-5 gap-2">
                  Browse all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {featuredListings && featuredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredListings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/marketplace/${l.id}`}
                    className="rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <h3 className="font-heading font-medium text-foreground truncate group-hover:text-primary transition-colors">{l.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {(l.asking_price_low != null || l.asking_price_high != null) && (
                        <span className="font-semibold text-primary">
                          ${l.asking_price_low ?? 0} – ${l.asking_price_high ?? 0}
                        </span>
                      )}
                      {l.metrics?.progress_score != null && (
                        <span className="text-muted-foreground">· {l.metrics.progress_score}% progress</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Projects from the community will appear here. List yours from the builder when you hit 20% progress.</p>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60">
          <div className="container px-4 sm:px-6 py-16 md:py-20 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ship it.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-md mx-auto">
              No credit card. Start building in minutes and earn rewards for real progress.
            </p>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 text-base font-semibold shadow-lg">
                Get started free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="container px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Vamo</span>
            <div className="flex gap-5">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
