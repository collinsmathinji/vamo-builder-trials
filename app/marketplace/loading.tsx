import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/AppShell";

export default function MarketplaceLoading() {
  return (
    <AppShell title="Marketplace" subtitle="Projects listed for sale by founders." nav="default">
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-full rounded-2xl border-2 overflow-hidden">
            <Skeleton className="w-full aspect-video rounded-none" />
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-56 mt-1" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
