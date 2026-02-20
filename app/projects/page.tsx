import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { Plus, ArrowRight, TrendingUp, LayoutDashboard } from "lucide-react";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, status, progress_score, screenshot_url, created_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);
  const pineapplesByProject: Record<string, number> = {};
  if (projectIds.length > 0) {
    const { data: ledgerRows } = await supabase
      .from("reward_ledger")
      .select("project_id, reward_amount")
      .eq("user_id", user.id)
      .in("project_id", projectIds);
    for (const r of ledgerRows ?? []) {
      const pid = r.project_id ?? "";
      if (pid) pineapplesByProject[pid] = (pineapplesByProject[pid] ?? 0) + (r.reward_amount ?? 0);
    }
  }

  return (
    <AppShell title="Your projects" subtitle="Open a project to use the builder, or create a new one." nav="auth">
      {!projects?.length ? (
        <Card className="w-full max-w-lg card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
            <div className="text-3xl sm:text-4xl mb-2" aria-hidden>🚀</div>
            <CardTitle className="font-heading text-lg sm:text-xl">No projects yet</CardTitle>
            <CardDescription className="font-body text-sm sm:text-base">Create your first project to start building and tracking progress.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <Link href="/projects/new" className="block">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 min-h-11 rounded-xl font-heading font-semibold">
                <Plus className="h-4 w-4 shrink-0" />
                Create project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/builder/${p.id}`} className="block min-w-0">
              <Card className="h-full card-lift rounded-2xl border-2 transition-all hover:shadow-lg hover:border-primary/30 active:scale-[0.99] overflow-hidden group flex flex-col">
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-muted/50 shrink-0 overflow-hidden">
                  {p.screenshot_url ? (
                    <img
                      src={p.screenshot_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
                      <LayoutDashboard className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 flex-1 min-w-0">
                  <CardTitle className="font-heading text-base sm:text-lg group-hover:text-primary transition-colors flex items-center justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  {p.description && (
                    <CardDescription className="font-body text-sm line-clamp-2">{p.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground min-w-0">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span>{p.progress_score ?? 0}% progress</span>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80 shrink-0">{p.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground" title="Pineapples earned in this project only">
                    <span aria-hidden>🍍</span> {pineapplesByProject[p.id] ?? 0} in this project
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
