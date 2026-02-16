import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TimelineClient } from "@/components/builder/TimelineClient";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) notFound();

  const { data: events } = await supabase
    .from("activity_events")
    .select("id, event_type, description, metadata, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href={`/builder/${projectId}`} className="text-primary hover:underline">
            ← {project.name}
          </Link>
        </div>
      </header>
      <main className="container py-6">
        <h1 className="text-xl font-semibold">Activity timeline</h1>
        <TimelineClient projectId={projectId} initialEvents={events ?? []} />
      </main>
    </div>
  );
}
