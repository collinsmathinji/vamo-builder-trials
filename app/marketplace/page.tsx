import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { Store, ArrowRight } from "lucide-react";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      description,
      asking_price_low,
      asking_price_high,
      status,
      metrics,
      screenshots
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Marketplace" subtitle="Projects listed for sale by founders." nav="default">
      {!listings?.length ? (
        <Card className="w-full max-w-lg card-lift rounded-2xl border-2">
          <CardContent className="pt-8 pb-8 px-4 sm:px-6 text-center">
            <Store className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/60 mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground font-body">No listings yet. List your project from the builder when progress ≥ 20%.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const screenshots = Array.isArray(l.screenshots) ? (l.screenshots as string[]) : [];
            const thumbUrl = screenshots[0] ?? null;
            const metrics = (l.metrics as Record<string, unknown>) ?? {};
            const progressScore = metrics.progress_score != null ? Number(metrics.progress_score) : null;
            return (
              <Link key={l.id} href={`/marketplace/${l.id}`} className="block min-w-0">
                <Card className="h-full card-lift rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 active:scale-[0.99] group flex flex-col">
                  {/* Screenshot thumbnail */}
                  <div className="relative w-full aspect-video bg-muted/50 shrink-0 overflow-hidden">
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 flex-1 min-w-0">
                    <CardTitle className="font-heading text-base sm:text-lg flex items-center justify-between gap-2 group-hover:text-primary transition-colors">
                      <span className="truncate">{l.title}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <CardDescription className="font-body text-sm line-clamp-2">{l.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 items-center px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                    {(l.asking_price_low != null || l.asking_price_high != null) && (
                      <span className="font-heading font-semibold text-primary text-sm sm:text-base">
                        ${l.asking_price_low ?? 0} – ${l.asking_price_high ?? 0}
                      </span>
                    )}
                    {progressScore != null && (
                      <Badge variant="secondary" className="rounded-lg text-xs">Progress: {progressScore}%</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
