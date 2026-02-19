import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectSettingsForm } from "@/components/builder/ProjectSettingsForm";

export default async function BuilderSettingsPage({
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
    .select("id, name, url")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Link href={`/builder/${projectId}`} className="text-primary text-sm hover:underline">
          ← Back to builder
        </Link>
        <h1 className="text-xl font-semibold mt-4">Project settings</h1>
        <ProjectSettingsForm projectId={projectId} initialUrl={project.url} />
      </div>
    </div>
  );
}
