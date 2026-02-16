"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { VamoLogo } from "@/components/VamoLogo";

const MAX_NAME = 100;
const MAX_DESC = 500;
const MAX_WHY = 1000;

function isValidUrl(s: string): boolean {
  if (!s.trim()) return true;
  return /^https?:\/\//i.test(s.trim());
}

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [whyBuilt, setWhyBuilt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const newErrors: Record<string, string> = {};
    if (!trimmedName) newErrors.name = "Project name is required.";
    if (trimmedName.length > MAX_NAME) newErrors.name = `Max ${MAX_NAME} characters.`;
    if (description.length > MAX_DESC) newErrors.description = `Max ${MAX_DESC} characters.`;
    if (whyBuilt.length > MAX_WHY) newErrors.whyBuilt = `Max ${MAX_WHY} characters.`;
    if (url && !isValidUrl(url)) newErrors.url = "Enter a valid URL (http:// or https://).";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a project.");
        router.push("/login");
        return;
      }
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          name: trimmedName,
          description: description.trim() || null,
          url: url.trim() || null,
          why_built: whyBuilt.trim() || null,
        })
        .select("id")
        .single();

      if (error) {
        toast.error(error.message || "Failed to create project.");
        return;
      }

      await supabase.from("activity_events").insert({
        project_id: project.id,
        user_id: user.id,
        event_type: "project_created",
        description: "Project created",
      });

      trackEvent("project_created", { projectId: project.id });
      toast.success("Project created!");
      router.push(`/builder/${project.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-md safe-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <VamoLogo href="/projects" />
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="min-h-9 sm:min-h-10">← Back to projects</Button>
          </Link>
        </div>
      </header>
      <main className="container max-w-lg py-6 sm:py-10 px-4 sm:px-6 safe-bottom">
        <Card className="card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
            <CardTitle className="font-heading text-xl sm:text-2xl">Create project</CardTitle>
            <CardDescription className="font-body text-sm sm:text-base">
              Add a name and optional details. You can link an external URL (e.g. Lovable/Replit) later.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project name (required)</Label>
                <Input
                  id="name"
                  placeholder="My startup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME}
                  disabled={loading}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What does this project do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  rows={3}
                  disabled={loading}
                  className={errors.description ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</p>
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">External URL (optional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-app.lovable.app"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className={errors.url ? "border-destructive" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-destructive">{errors.url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whyBuilt">Why did you build this? (optional)</Label>
                <Textarea
                  id="whyBuilt"
                  placeholder="Your founder story or motivation"
                  value={whyBuilt}
                  onChange={(e) => setWhyBuilt(e.target.value)}
                  maxLength={MAX_WHY}
                  rows={4}
                  disabled={loading}
                  className={errors.whyBuilt ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">{whyBuilt.length}/{MAX_WHY}</p>
                {errors.whyBuilt && (
                  <p className="text-sm text-destructive">{errors.whyBuilt}</p>
                )}
              </div>
              <Button type="submit" className="w-full min-h-11 rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Creating…" : "Create project"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
