import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, MessageSquare, BarChart3, TrendingUp, LayoutDashboard, Wallet, FolderKanban, Linkedin, MessageCircle, Repeat2, Heart, Eye, Send, Bookmark, Share2, MoreHorizontal, ThumbsUp } from "lucide-react";

/* Real profile photos for social proof cards (human faces) */
const SOCIAL_AVATARS = {
  jordan: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
  morgan: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  casey: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
} as const;

const SOCIAL_CARDS = [
  { platform: "x", name: "Jordan Kim", handle: "@jordanbuilds", date: "Jun 5", text: "Finally shipped my side project using @vamo — the progress logging + pineapples actually kept me accountable.", avatar: SOCIAL_AVATARS.jordan },
  { platform: "linkedin", name: "Morgan Lee", title: "Builder", date: "Jun 1", text: "Stopped planning, started shipping. Vamo’s builder and wallet made it simple to track progress and redeem rewards.", avatar: SOCIAL_AVATARS.morgan },
  { platform: "instagram", name: "casey.drew", handle: "Solo founder", date: "May 28", text: "Built the MVP in a week. Best thing for solo founders who want to ship and get rewarded for real progress. 🍍", avatar: SOCIAL_AVATARS.casey },
] as const;
import { VamoLogo } from "@/components/VamoLogo";
import { FounderAtDesk } from "@/components/FounderAtDesk";
import { ThemeToggle } from "@/components/ThemeToggle";

const DASHBOARD_SCREENSHOTS = [
  { src: "/screenshots/dashboard-projects.png", label: "Your projects", tagline: "Command center", caption: "Your command center — where every idea lands, progress shows, and nothing slips through the cracks.", icon: FolderKanban, variant: "primary" as const },
  { src: "/screenshots/dashboard-wallet.png", label: "Pineapple Wallet", tagline: "Earn & redeem", caption: "Your rewards, clear as day. Earn for shipping, redeem when it counts — no fine print, just real value.", icon: Wallet, variant: "accent" as const },
  { src: "/screenshots/dashboard-preview.png", label: "Builder & preview", tagline: "The workshop", caption: "The workshop. Build it, tweak it, see it live — then watch your vision become something people actually use.", icon: LayoutDashboard, variant: "muted" as const },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featuredListings } = await supabase
    .from("listings")
    .select("id, title, description, asking_price_low, asking_price_high, metrics, screenshots")
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
              <p className="font-heading text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground/90 dark:text-foreground/80 mb-3 pl-4 border-l-2 border-primary/60">
                Are you really a cracked founder?
              </p>
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
        <section className="border-t border-border/60 relative overflow-hidden">
          {/* Background: gradient + soft orbs */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background via-40% to-accent/10 dark:from-primary/20 dark:to-accent/15" aria-hidden />
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/20 dark:bg-primary/30 blur-3xl animate-step-glow pointer-events-none" aria-hidden />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent/15 dark:bg-accent/20 blur-3xl animate-step-glow animate-step-glow-delay-1 pointer-events-none" aria-hidden />
          <div className="container relative px-4 sm:px-6 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
              <span className="inline-block text-primary font-semibold text-sm tracking-wide uppercase mb-3">The flow</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
                How it works
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Three steps to ship and get rewarded for real progress.
              </p>
            </div>
            <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
              {/* Connector line (desktop) */}
              <div className="hidden sm:block absolute top-[4.5rem] left-[16.666%] right-[16.666%] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden />
              {[
                { step: "01", label: "Describe", desc: "Describe your app in a few sentences. We turn it into a working version you can open and use.", icon: MessageSquare, accent: "primary" as const },
                { step: "02", label: "Log progress", desc: "Log what you ship—features, signups, revenue. Each update earns pineapples.", icon: BarChart3, accent: "accent" as const },
                { step: "03", label: "Redeem", desc: "Spend pineapples on rewards you’ll use: gift cards, credits, and perks.", emoji: true, accent: "primary" as const },
              ].map((item) => {
                const Icon = "icon" in item ? item.icon : null;
                return (
                  <div key={item.step} className="relative group">
                    <div className="h-full rounded-2xl border-2 border-border/80 bg-card/90 dark:bg-card/95 backdrop-blur-sm p-6 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/25 hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-5 mt-1 font-bold text-lg shadow-lg ${
                        item.accent === "accent"
                          ? "bg-accent/20 text-accent-foreground dark:bg-accent/25 animate-step-glow-delay-2"
                          : "bg-primary/20 text-primary dark:bg-primary/25 dark:text-primary-foreground"
                      }`}>
                        {item.step}
                      </div>
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-5 ${
                        item.accent === "accent" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                      } group-hover:scale-110 transition-transform duration-300`}>
                        {Icon ? <Icon className="h-8 w-8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" /> : <span className="text-4xl" aria-hidden>🍍</span>}
                      </div>
                      <h3 className="text-foreground font-bold text-xl mb-2">{item.label}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-border/60 py-12 md:py-16 overflow-hidden bg-gradient-to-b from-background to-muted/10" aria-label="What founders say">
          <div className="container px-4 sm:px-6 mb-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">What founders say</h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">Real feedback from solo founders and indie makers.</p>
          </div>
          <div className="flex w-full overflow-hidden">
            <div className="flex animate-marquee gap-6 shrink-0 pr-6">
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
                  className="flex shrink-0 flex-col rounded-2xl border-2 border-border/80 bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-6 w-[300px] sm:w-[340px] hover:border-primary/20 hover:shadow-xl transition-all"
                >
                  <p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
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
                  className="flex shrink-0 flex-col rounded-2xl border-2 border-border/80 bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-6 w-[300px] sm:w-[340px] hover:border-primary/20 hover:shadow-xl transition-all"
                >
                  <p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof: X, LinkedIn, Instagram — real platform-style cards */}
          <div className="container px-4 sm:px-6 mt-12 md:mt-16">
            <p className="text-center text-sm font-medium text-muted-foreground mb-6">
              What founders share on X, LinkedIn & Instagram
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto items-stretch">
              {/* X (Twitter) — real post layout: avatar left, name/handle row, then body, then engagement bar */}
              <article
                className="rounded-2xl border border-[#2f3336] bg-[#16181c] shadow-md overflow-hidden hover:shadow-lg transition-shadow dark:border-[#2f3336] flex flex-col min-h-[280px] relative"
                style={{ colorScheme: "dark" }}
              >
                <button type="button" className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-[#71767b] hover:text-[#e7e9ea] transition-colors z-10" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex gap-3">
                    <img
                      src={SOCIAL_AVATARS.jordan}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="font-bold text-[15px] text-[#e7e9ea]">Jordan Kim</span>
                        <span className="text-[15px] text-[#71767b]">@jordanbuilds</span>
                        <span className="text-[#71767b]">·</span>
                        <span className="text-[#71767b] text-[15px]">Jun 5</span>
                      </div>
                      <p className="mt-1.5 text-[15px] text-[#e7e9ea] leading-snug break-words">
                        Finally shipped my side project using @vamo — the progress logging + pineapples actually kept me accountable.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 flex flex-wrap items-center gap-6 text-[#71767b]">
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors rounded p-0.5 -m-0.5" aria-label="12 replies">
                      <MessageCircle className="h-[18px] w-[18px]" strokeWidth="1.75" />
                      <span className="text-[13px]">12</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#00ba7c] transition-colors rounded p-0.5 -m-0.5" aria-label="5 reposts">
                      <Repeat2 className="h-[18px] w-[18px]" strokeWidth="1.75" />
                      <span className="text-[13px]">5</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#f91880] transition-colors rounded p-0.5 -m-0.5" aria-label="89 likes">
                      <Heart className="h-[18px] w-[18px]" strokeWidth="1.75" />
                      <span className="text-[13px]">89</span>
                    </button>
                    <span className="text-[13px]">1.2K views</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" className="p-1 rounded hover:bg-white/10 hover:text-[#1d9bf0] transition-colors" aria-label="Share">
                        <Share2 className="h-[18px] w-[18px]" strokeWidth="1.75" />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-white/10 hover:text-[#1d9bf0] transition-colors" aria-label="Bookmark">
                        <Bookmark className="h-[18px] w-[18px]" strokeWidth="1.75" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              {/* LinkedIn — real post layout: avatar left, name + title + date, then body, then engagement */}
              <article
                className="rounded-2xl border border-[#38434f] bg-[#1a1f26] shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[280px] relative"
                style={{ colorScheme: "dark" }}
              >
                <button type="button" className="absolute top-3 right-3 p-1.5 rounded hover:bg-white/10 text-[#a0a4a8] hover:text-[#e7e9ea] transition-colors z-10" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex gap-3">
                    <img
                      src={SOCIAL_AVATARS.morgan}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="font-semibold text-[15px] text-[#e7e9ea]">Morgan Lee</p>
                      <p className="text-[12px] text-[#a0a4a8]">Builder · Jun 1</p>
                      <p className="mt-2.5 text-[14px] text-[#e7e9ea] leading-snug break-words">
                        Stopped planning, started shipping. Vamo&apos;s builder and wallet made it simple to track progress and redeem rewards.
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-[#38434f] flex flex-wrap items-center gap-4 sm:gap-6 text-[#a0a4a8]">
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#0a66c2] transition-colors rounded p-0.5 -m-0.5" aria-label="24 likes">
                      <ThumbsUp className="h-4 w-4" strokeWidth="1.75" />
                      <span className="text-[13px] font-medium">24</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#0a66c2] transition-colors rounded p-0.5 -m-0.5" aria-label="3 comments">
                      <MessageSquare className="h-4 w-4" strokeWidth="1.75" />
                      <span className="text-[13px] font-medium">3</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#0a66c2] transition-colors rounded p-0.5 -m-0.5" aria-label="Repost">
                      <Repeat2 className="h-4 w-4" strokeWidth="1.75" />
                      <span className="text-[13px] font-medium">Repost</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 hover:text-[#0a66c2] transition-colors rounded p-0.5 -m-0.5" aria-label="Send">
                      <Send className="h-4 w-4" strokeWidth="1.75" />
                      <span className="text-[13px] font-medium">Send</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Instagram — real post layout: avatar left, username only, caption, then icons + "Liked by" */}
              <article
                className="rounded-2xl border border-[#262626] bg-[#1a1a1a] shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[280px] relative"
                style={{ colorScheme: "dark" }}
              >
                <button type="button" className="absolute top-3 right-3 p-1.5 rounded hover:bg-white/10 text-[#a8a8a8] hover:text-[#f5f5f5] transition-colors z-10" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex gap-3">
                    <img
                      src={SOCIAL_AVATARS.casey}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover shrink-0 ring-2 ring-[#363636] ring-offset-2 ring-offset-[#1a1a1a]"
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <span className="font-semibold text-[14px] text-[#f5f5f5]">casey.drew</span>
                      <p className="mt-2 text-[14px] text-[#f5f5f5] leading-snug break-words">
                        Built the MVP in a week. Best thing for solo founders who want to ship and get rewarded for real progress. 🥕
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-4">
                    <button type="button" className="text-[#f5f5f5] rounded p-0.5 -m-0.5 hover:opacity-80 transition-opacity" aria-label="Like">
                      <Heart className="h-6 w-6" strokeWidth="1.5" fill="currentColor" />
                    </button>
                    <button type="button" className="text-[#f5f5f5] rounded p-0.5 -m-0.5 hover:opacity-80 transition-opacity" aria-label="Comment">
                      <MessageCircle className="h-6 w-6" strokeWidth="1.75" />
                    </button>
                    <button type="button" className="text-[#f5f5f5] rounded p-0.5 -m-0.5 hover:opacity-80 transition-opacity" aria-label="Share">
                      <Send className="h-5 w-5 -rotate-45" strokeWidth="1.75" />
                    </button>
                    <button type="button" className="text-[#f5f5f5] rounded p-0.5 -m-0.5 hover:opacity-80 transition-opacity ml-auto" aria-label="Save">
                      <Bookmark className="h-6 w-6" strokeWidth="1.75" />
                    </button>
                  </div>
                  <p className="mt-2 text-[14px] text-[#a8a8a8]">
                    Liked by <span className="text-[#f5f5f5] font-medium">jamie.ships</span> and <span className="text-[#f5f5f5] font-semibold">42 others</span>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* See inside Vamo — dashboard screenshots */}
        <section className="border-t border-border/60 bg-muted/10 py-14 md:py-20" aria-label="See inside Vamo">
          <div className="container px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                See inside Vamo
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                One place to run your projects, grow your rewards, and build what’s next. Peek inside.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {DASHBOARD_SCREENSHOTS.map(({ src, label, tagline, caption, icon: Icon, variant }) => {
                const variantStyles = {
                  primary: "hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/15",
                  accent: "hover:border-accent/40 hover:shadow-2xl hover:shadow-amber-500/10 dark:hover:shadow-amber-400/10",
                  muted: "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
                };
                const glowStyles = {
                  primary: "from-primary/15",
                  accent: "from-accent/15",
                  muted: "from-muted-foreground/10",
                };
                const iconBg = variant === "primary" ? "bg-primary/15 text-primary" : variant === "accent" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground";
                return (
                  <div
                    key={label}
                    className={`group relative rounded-[1.25rem] border border-border/80 bg-card/80 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 hover:-translate-y-1 transition-all duration-300 ${variantStyles[variant]}`}
                  >
                    {/* Soft top glow per card on hover */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b ${glowStyles[variant]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 rounded-b-full`} aria-hidden />
                    <div className="p-3 sm:p-4 pb-0">
                      <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted/30 shadow-inner aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={label}
                          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white/95 text-sm leading-snug font-medium drop-shadow-sm">{caption}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex items-start gap-4 border-t border-border/50 bg-card/50">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ring-2 ring-border/50`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h3 className="font-heading font-semibold text-foreground">{label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{tagline}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Transition strip: shifts from “See inside” to “Marketplace” */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
        <div className="border-t border-border bg-muted/40 dark:bg-muted/50 py-1" aria-hidden />

        {/* Marketplace */}
        <section className="border-t border-border/80 relative overflow-hidden">
          {/* Same background as How it works: gradient + soft orbs */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background via-40% to-accent/10 dark:from-primary/20 dark:to-accent/15" aria-hidden />
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/20 dark:bg-primary/30 blur-3xl animate-step-glow pointer-events-none" aria-hidden />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent/15 dark:bg-accent/20 blur-3xl animate-step-glow animate-step-glow-delay-1 pointer-events-none" aria-hidden />
          <div className="container relative px-4 sm:px-6 py-12 md:py-14">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {featuredListings.map((l) => {
                  const screenshots = Array.isArray(l.screenshots) ? (l.screenshots as string[]) : [];
                  const thumbUrl = screenshots[0] ?? null;
                  const metrics = (l.metrics as Record<string, unknown>) ?? {};
                  const progressScore = metrics.progress_score != null ? Number(metrics.progress_score) : null;
                  return (
                    <Link
                      key={l.id}
                      href={`/marketplace/${l.id}`}
                      className="group block rounded-2xl border-2 border-border bg-background overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all active:scale-[0.99] flex flex-col"
                    >
                      {/* Screenshot thumbnail */}
                      <div className="relative w-full aspect-video bg-muted/50 shrink-0 overflow-hidden">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt={l.title}
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/40">
                            <Store className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {/* Progress badge overlay */}
                        {progressScore != null && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-background/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm border border-border/50">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              {progressScore}%
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Card content */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors mb-1.5">
                          {l.title}
                        </h3>
                        {l.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                            {l.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                          {(l.asking_price_low != null || l.asking_price_high != null) && (
                            <span className="font-heading font-semibold text-primary text-sm sm:text-base">
                              ${l.asking_price_low ?? 0} – ${l.asking_price_high ?? 0}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Projects from the community will appear here. List yours from the builder when you hit 20% progress.</p>
            )}
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
