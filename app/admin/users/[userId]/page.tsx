import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VamoLogo } from "@/components/VamoLogo";

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!adminProfile?.is_admin) redirect("/projects");

  const { data: profile } = await supabase.from("profiles").select("id, email, full_name, pineapple_balance, created_at").eq("id", userId).single();
  if (!profile) notFound();

  const { data: userProjects } = await supabase.from("projects").select("id, name, status, progress_score, created_at").eq("owner_id", userId).order("created_at", { ascending: false });

  const { data: activityEvents } = await supabase.from("activity_events").select("id, project_id, event_type, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);

  const projectNames: Record<string, string> = {};
  (userProjects ?? []).forEach((p) => { projectNames[p.id] = p.name; });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
            <VamoLogo showName={false} size={28} />
            <span>Vamo Admin</span>
          </span>
          <Link href="/admin"><Button variant="ghost">Back to admin</Button></Link>
        </div>
      </header>
      <main className="container py-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">User: {profile.email}</h1>
        <p className="text-muted-foreground mt-1">{profile.full_name || "—"} · Joined {new Date(profile.created_at).toLocaleDateString()}</p>

        <Card className="card-lift rounded-2xl border-2 mt-6 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Pineapple balance: {profile.pineapple_balance ?? 0}</p>
          </CardContent>
        </Card>

        <h2 className="font-heading text-xl font-semibold">Projects</h2>
        <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(userProjects ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.progress_score ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/admin/projects/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(userProjects ?? []).length === 0 && <p className="p-4 text-sm text-muted-foreground">No projects.</p>}
        </Card>

        <h2 className="font-heading text-xl font-semibold mt-12">Recent activity</h2>
        <Card className="mt-4 card-lift rounded-2xl border-2 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activityEvents ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.project_id ? (projectNames[e.project_id] ?? e.project_id.slice(0, 8)) : "—"}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(e.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(activityEvents ?? []).length === 0 && <p className="p-4 text-sm text-muted-foreground">No activity.</p>}
        </Card>
      </main>
    </div>
  );
}
