import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
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
import { VamoLogo } from "@/components/VamoLogo";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!adminProfile?.is_admin) redirect("/projects");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, owner_id, status, progress_score, valuation_low, valuation_high, created_at, updated_at")
    .eq("id", projectId)
    .single();
  if (!project) notFound();

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", project.owner_id)
    .single();

  const { data: activityEvents } = await supabase
    .from("activity_events")
    .select("id, user_id, event_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
            <VamoLogo showName={false} size={28} />
            <span>Vamo Admin</span>
          </span>
          <Link href="/admin">
            <Button variant="ghost">← Back to admin</Button>
          </Link>
        </div>
      </header>
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Project: {project.name}</h1>
          <p className="text-muted-foreground mt-1">
            Owner: {owner?.email ?? project.owner_id}
            {owner?.full_name && ` (${owner.full_name})`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="card-lift rounded-2xl border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-lg font-bold">{project.status}</span>
            </CardContent>
          </Card>
          <Card className="card-lift rounded-2xl border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">Progress Score</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-heading text-lg font-bold">{project.progress_score ?? 0}</span>
            </CardContent>
          </Card>
          <Card className="card-lift rounded-2xl border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              {(Number(project.valuation_low) ?? 0) === 0 && (Number(project.valuation_high) ?? 0) === 0 ? (
                <span className="text-sm text-muted-foreground">Not yet estimated</span>
              ) : (
                <span className="font-heading text-lg font-bold">
                  ${Number(project.valuation_low).toLocaleString()} – ${Number(project.valuation_high).toLocaleString()}
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="card-lift rounded-2xl border-2 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="font-medium">Created:</span> {new Date(project.created_at).toLocaleString()}</p>
            <p><span className="font-medium">Updated:</span> {new Date(project.updated_at).toLocaleString()}</p>
            {project.description && (
              <p><span className="font-medium">Description:</span> {project.description}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-4">
          <Link href={`/admin/users/${project.owner_id}`}>
            <Button variant="outline" size="sm">View owner profile</Button>
          </Link>
        </div>

        <h2 className="font-heading text-xl font-semibold mt-8">Recent activity</h2>
        <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activityEvents ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_type}</TableCell>
                  <TableCell className="text-sm max-w-md truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(e.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(activityEvents ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No activity yet.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
