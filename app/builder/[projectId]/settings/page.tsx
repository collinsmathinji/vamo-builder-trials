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
    .select("id, name, description, url, why_built, screenshot_url")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Link href={`/builder/${projectId}`} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
          ← Back to builder
        </Link>
        <h1 className="text-xl font-semibold mt-4">Edit project</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your project details.</p>
        <ProjectSettingsForm
          projectId={projectId}
          initialName={project.name}
          initialDescription={project.description}
          initialUrl={project.url}
          initialWhyBuilt={project.why_built}
          initialScreenshotUrl={project.screenshot_url}
        />
      </div>
    </div>
  );
}
