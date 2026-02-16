import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { ListingActivityTimeline } from "@/components/marketplace/ListingActivityTimeline";
import { ArrowLeft } from "lucide-react";

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
  const screenshots = Array.isArray(listing.screenshots) ? listing.screenshots as string[] : [];
  const timelineSnapshot = Array.isArray(listing.timeline_snapshot)
    ? (listing.timeline_snapshot as { description?: string; event_type?: string; created_at?: string }[])
    : [];

  return (
    <AppShell nav="default">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Marketplace
        </Link>
        <Card className="card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-6">
            <CardTitle className="font-heading text-xl sm:text-2xl">{listing.title}</CardTitle>
            <CardDescription className="font-body text-sm sm:text-base whitespace-pre-wrap">
              {listing.description || "No description."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {(listing.asking_price_low != null || listing.asking_price_high != null) && (
                <Badge variant="secondary" className="text-base">
                  ${listing.asking_price_low ?? 0} – ${listing.asking_price_high ?? 0}
                </Badge>
              )}
              {metrics.progress_score != null && (
                <Badge variant="outline">Progress: {String(metrics.progress_score)}%</Badge>
              )}
            </div>
            {screenshots.length > 0 && (
              <div>
                <h3 className="font-heading text-sm font-semibold mb-2">Screenshots</h3>
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Screenshot ${i + 1}`}
                      className="rounded-md border max-h-48 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            {timelineSnapshot.length > 0 && (
              <ListingActivityTimeline events={timelineSnapshot} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
