"use client";

import { useState, useRef } from "react";
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
import { Loader2, ImagePlus, X } from "lucide-react";
import { VamoLogo } from "@/components/VamoLogo";

const SCREENSHOT_BUCKET = "project-screenshots";

function compressImageForUpload(file: File): Promise<File | Blob> {
  const skipIfUnder = 280 * 1024;
  const maxWidth = 1200;
  const quality = 0.78;
  if (file.size <= skipIfUnder && !file.type.includes("png")) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, maxWidth / w, maxWidth / h);
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (screenshotFile && project.id) {
        const body = await compressImageForUpload(screenshotFile);
        const ext = body instanceof Blob && !(body instanceof File) ? "jpg" : (screenshotFile.name.replace(/^.*\./, "") || "jpg");
        const path = `${user.id}/${project.id}/screenshot.${ext}`;
        const contentType = body instanceof Blob && !(body instanceof File) ? "image/jpeg" : screenshotFile.type;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(SCREENSHOT_BUCKET)
          .upload(path, body, { upsert: true, contentType });
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(uploadData.path);
          await fetch(`/api/projects/${project.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmedName, screenshot_url: urlData.publicUrl }),
          });
        }
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
                <Label>Screenshot (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Fallback when your website URL can&apos;t be embedded in the preview (e.g. blocks iframes).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      setScreenshotFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setScreenshotPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                />
                {!screenshotFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload screenshot
                  </Button>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                      {screenshotPreview && (
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{screenshotFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Used as fallback if the URL can&apos;t be embedded
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 gap-1.5 text-muted-foreground"
                        disabled={loading}
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
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
