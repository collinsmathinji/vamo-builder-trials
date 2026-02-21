import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminActions } from "./AdminActions";
import { AdminAnalyticsFilters } from "./AdminAnalyticsFilters";
import { AdminNav } from "./AdminNav";
import { AdminOverviewCharts } from "./AdminOverviewCharts";
import { VamoLogo } from "@/components/VamoLogo";

const ANALYTICS_PAGE_SIZE = 20;
const ACTIVITY_DAYS = 14;

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildDailyCounts(
  profileDates: string[],
  projectDates: string[]
): { date: string; users: number; projects: number }[] {
  const start = new Date();
  start.setDate(start.getDate() - ACTIVITY_DAYS);
  start.setHours(0, 0, 0, 0);
  const byDate: Record<string, { users: number; projects: number }> = {};
  for (let i = 0; i < ACTIVITY_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate[key] = { users: 0, projects: 0 };
  }
  profileDates.forEach((created_at) => {
    const key = getDateKey(created_at);
    if (byDate[key] != null) byDate[key].users += 1;
  });
  projectDates.forEach((created_at) => {
    const key = getDateKey(created_at);
    if (byDate[key] != null) byDate[key].projects += 1;
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { users, projects }]) => ({ date, users, projects }));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ event_name?: string; from?: string; to?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/projects");

  const [
    { count: usersCount },
    { count: projectsCount },
    { count: promptsCount },
    { data: ledgerSum },
    { data: redemptionsSum },
    { count: listingsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("reward_ledger").select("reward_amount"),
    supabase.from("redemptions").select("amount"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const totalEarned = (ledgerSum ?? []).filter((r) => r.reward_amount > 0).reduce((a, r) => a + r.reward_amount, 0);
  const totalRedeemed = (redemptionsSum ?? []).reduce((a, r) => a + r.amount, 0);

  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - ACTIVITY_DAYS);
  activitySince.setHours(0, 0, 0, 0);
  const [{ data: recentProfiles }, { data: recentProjects }] = await Promise.all([
    supabase.from("profiles").select("created_at").gte("created_at", activitySince.toISOString()),
    supabase.from("projects").select("created_at").gte("created_at", activitySince.toISOString()),
  ]);
  const dailyCounts = buildDailyCounts(
    (recentProfiles ?? []).map((p) => p.created_at),
    (recentProjects ?? []).map((p) => p.created_at)
  );

  const { data: pendingRedemptions } = await supabase
    .from("redemptions")
    .select("id, user_id, amount, reward_type, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, pineapple_balance, created_at");
  const emailByUserId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]));
  const { data: projectCounts } = await supabase.from("projects").select("owner_id");
  const countByUser: Record<string, number> = {};
  (projectCounts ?? []).forEach((p) => {
    countByUser[p.owner_id] = (countByUser[p.owner_id] ?? 0) + 1;
  });

  const params = await searchParams;
  const eventName = params.event_name ?? null;
  const fromDate = params.from ? `${params.from}T00:00:00Z` : null;
  const toDate = params.to ? `${params.to}T23:59:59.999Z` : null;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const { data: allProjects } = await supabase
    .from("projects")
    .select("id, name, owner_id, status, progress_score, created_at")
    .order("created_at", { ascending: false });

  const { data: analyticsRows } = await supabase
    .from("analytics_events")
    .select("event_name");
  const eventNames = Array.from(new Set((analyticsRows ?? []).map((r) => r.event_name))).sort();

  let analyticsCountQuery = supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true });
  if (eventName) analyticsCountQuery = analyticsCountQuery.eq("event_name", eventName);
  if (fromDate) analyticsCountQuery = analyticsCountQuery.gte("created_at", fromDate);
  if (toDate) analyticsCountQuery = analyticsCountQuery.lte("created_at", toDate);
  const { count: analyticsTotal } = await analyticsCountQuery;

  let analyticsQuery = supabase
    .from("analytics_events")
    .select("id, user_id, project_id, event_name, properties, created_at")
    .order("created_at", { ascending: false })
    .range((page - 1) * ANALYTICS_PAGE_SIZE, page * ANALYTICS_PAGE_SIZE - 1);
  if (eventName) analyticsQuery = analyticsQuery.eq("event_name", eventName);
  if (fromDate) analyticsQuery = analyticsQuery.gte("created_at", fromDate);
  if (toDate) analyticsQuery = analyticsQuery.lte("created_at", toDate);
  const { data: analyticsEvents } = await analyticsQuery;

  const analyticsCount = analyticsTotal ?? 0;
  const totalPages = Math.max(1, Math.ceil(analyticsCount / ANALYTICS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
          <VamoLogo showName={false} size={28} />
          <span>Vamo Admin</span>
        </span>
          <Link href="/projects"><Button variant="ghost">← Back to projects</Button></Link>
        </div>
      </header>
      <main className="container py-6 sm:py-8">
        <AdminNav />

        <section id="overview">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Overview</h1>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Total users</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">{usersCount ?? 0}</span></CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Total projects</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">{projectsCount ?? 0}</span></CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Total prompts sent</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">{promptsCount ?? 0}</span></CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Pineapples earned (all time)</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">🍍 {totalEarned}</span></CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Pineapples redeemed (all time)</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">🍍 {totalRedeemed}</span></CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">Active listings</CardTitle>
              </CardHeader>
              <CardContent><span className="font-heading text-3xl font-bold">{listingsCount ?? 0}</span></CardContent>
            </Card>
          </div>
          <AdminOverviewCharts
            stats={{
              users: usersCount ?? 0,
              projects: projectsCount ?? 0,
              prompts: promptsCount ?? 0,
              earned: totalEarned,
              redeemed: totalRedeemed,
              listings: listingsCount ?? 0,
            }}
            dailyCounts={dailyCounts}
          />
        </section>

        <section id="redemptions" className="mt-12">
          <h2 className="font-heading text-xl font-semibold">Pending redemptions</h2>
          <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {(pendingRedemptions ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{emailByUserId[r.user_id] ?? r.user_id.slice(0, 8) + "…"}</TableCell>
                  <TableCell>{r.amount} 🍍</TableCell>
                  <TableCell>{r.reward_type}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AdminActions redemptionId={r.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        </section>

        <section id="users" className="mt-12">
          <h2 className="font-heading text-xl font-semibold">Users</h2>
          <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Pineapple Balance</TableHead>
                  <TableHead>Projects Count</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(profiles ?? []).map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>{p.full_name || "—"}</TableCell>
                    <TableCell>🍍 {p.pineapple_balance ?? 0}</TableCell>
                    <TableCell>{countByUser[p.id] ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${p.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section id="analytics" className="mt-12">
          <h2 className="font-heading text-xl font-semibold">Analytics</h2>
          <div className="mt-4 space-y-4">
            <Suspense fallback={<div className="h-20 animate-pulse rounded bg-muted" />}>
              <AdminAnalyticsFilters
                eventNames={eventNames}
                totalCount={analyticsCount}
                currentPage={currentPage}
              />
            </Suspense>
            <Card className="card-lift rounded-2xl border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analyticsEvents ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.event_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.user_id ? (emailByUserId[e.user_id] ?? e.user_id.slice(0, 8) + "…") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.project_id ? e.project_id.slice(0, 8) + "…" : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(e.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

        <section id="projects" className="mt-12">
          <h2 className="font-heading text-xl font-semibold">Projects</h2>
          <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress Score</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allProjects ?? []).map((proj) => (
                  <TableRow key={proj.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell className="text-sm">
                      {emailByUserId[proj.owner_id] ?? proj.owner_id.slice(0, 8) + "…"}
                    </TableCell>
                    <TableCell>{proj.status}</TableCell>
                    <TableCell>{proj.progress_score ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/projects/${proj.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>
    </div>
  );
}
