import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { ListingActivityTimeline } from "@/components/marketplace/ListingActivityTimeline";
import { ArrowLeft, DollarSign } from "lucide-react";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !listing) notFound();

  const metrics = (listing.metrics as Record<string, unknown>) ?? {};
  const progressScore = metrics.progress_score != null ? Number(metrics.progress_score) : null;
  const screenshots = Array.isArray(listing.screenshots) ? listing.screenshots as string[] : [];
  const timelineSnapshot = Array.isArray(listing.timeline_snapshot)
    ? (listing.timeline_snapshot as { description?: string; event_type?: string; created_at?: string }[])
    : [];

  const hasPrice =
    listing.asking_price_low != null || listing.asking_price_high != null;
  const priceLow = listing.asking_price_low ?? 0;
  const priceHigh = listing.asking_price_high ?? 0;

  return (
    <AppShell nav="default">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <Card className="rounded-2xl border-2 overflow-hidden shadow-sm">
          {/* Hero: title + description */}
          <CardHeader className="space-y-3 px-6 sm:px-8 pt-8 pb-6">
            <CardTitle className="font-heading text-2xl sm:text-3xl tracking-tight">
              {listing.title}
            </CardTitle>
            <CardDescription className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-2xl">
              {listing.description || "No description."}
            </CardDescription>
          </CardHeader>

          {/* Details strip: budget + progress */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-xl bg-muted/40 border border-border/60">
              {hasPrice && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-heading font-semibold text-lg sm:text-xl text-foreground">
                    ${priceLow.toLocaleString()} – ${priceHigh.toLocaleString()}
                  </span>
                </div>
              )}
              {progressScore != null && (
                <div className="min-w-0 flex-1 sm:max-w-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Progress
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{progressScore}%</span>
                  </div>
                  <div
                    className="h-2.5 w-full rounded-full bg-background/80 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progressScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progressScore))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <CardContent className="space-y-8 px-6 sm:px-8 pb-8">
            {/* Screenshots */}
            {screenshots.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wide">
                  Screenshots
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {screenshots.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-video sm:aspect-[4/3] rounded-xl border border-border/60 bg-muted/30 overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Activity timeline */}
            {timelineSnapshot.length > 0 && (
              <section className="space-y-4">
                <ListingActivityTimeline events={timelineSnapshot} />
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
