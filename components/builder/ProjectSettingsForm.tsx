"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";

const MAX_NAME = 100;
const MAX_DESC = 500;
const MAX_WHY = 1000;
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

export function ProjectSettingsForm({
  projectId,
  initialName,
  initialDescription,
  initialUrl,
  initialWhyBuilt,
  initialScreenshotUrl,
}: {
  projectId: string;
  initialName: string;
  initialDescription: string | null;
  initialUrl: string | null;
  initialWhyBuilt: string | null;
  initialScreenshotUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [whyBuilt, setWhyBuilt] = useState(initialWhyBuilt ?? "");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [clearScreenshot, setClearScreenshot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) newErrors.name = "Project name is required.";
    if (trimmedName.length > MAX_NAME) newErrors.name = `Max ${MAX_NAME} characters.`;
    if (description.length > MAX_DESC) newErrors.description = `Max ${MAX_DESC} characters.`;
    if (whyBuilt.length > MAX_WHY) newErrors.whyBuilt = `Max ${MAX_WHY} characters.`;
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) newErrors.url = "URL must start with http:// or https://";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: {
        name?: string;
        description?: string | null;
        url?: string | null;
        why_built?: string | null;
        screenshot_url?: string | null;
      } = {
        name: name.trim().slice(0, MAX_NAME),
        description: description.trim().slice(0, MAX_DESC) || null,
        url: url.trim() ? (url.trim().match(/^https?:\/\/.+/i) ? url.trim() : null) : null,
        why_built: whyBuilt.trim().slice(0, MAX_WHY) || null,
      };

      if (clearScreenshot && !screenshotFile) {
        payload.screenshot_url = null;
      } else if (screenshotFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to update the screenshot.");
          setLoading(false);
          return;
        }
        const body = await compressImageForUpload(screenshotFile);
        const ext = body instanceof Blob && !(body instanceof File) ? "jpg" : (screenshotFile.name.replace(/^.*\./, "") || "jpg");
        const path = `${user.id}/${projectId}/screenshot.${ext}`;
        const contentType = body instanceof Blob && !(body instanceof File) ? "image/jpeg" : screenshotFile.type;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(SCREENSHOT_BUCKET)
          .upload(path, body, { upsert: true, contentType });
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(uploadData.path);
          payload.screenshot_url = urlData.publicUrl;
        }
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to save.");
        setLoading(false);
        return;
      }
      toast.success("Saved");
      router.push(`/builder/${projectId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const currentScreenshotUrl = clearScreenshot ? null : (screenshotPreview || initialScreenshotUrl);

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Project name (required)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME}
          disabled={loading}
          className={errors.name ? "border-destructive" : ""}
          placeholder="My startup"
        />
        <p className="text-xs text-muted-foreground">{name.length}/{MAX_NAME}</p>
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_DESC}
          rows={3}
          disabled={loading}
          className={errors.description ? "border-destructive" : ""}
          placeholder="What does this project do?"
        />
        <p className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</p>
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
        {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whyBuilt">Why did you build this? (optional)</Label>
        <Textarea
          id="whyBuilt"
          value={whyBuilt}
          onChange={(e) => setWhyBuilt(e.target.value)}
          maxLength={MAX_WHY}
          rows={4}
          disabled={loading}
          className={errors.whyBuilt ? "border-destructive" : ""}
          placeholder="Your founder story or motivation"
        />
        <p className="text-xs text-muted-foreground">{whyBuilt.length}/{MAX_WHY}</p>
        {errors.whyBuilt && <p className="text-sm text-destructive">{errors.whyBuilt}</p>}
      </div>

      <div className="space-y-2">
        <Label>Screenshot (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Fallback when your website URL can&apos;t be embedded in the preview.
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
              setClearScreenshot(false);
              const reader = new FileReader();
              reader.onload = () => setScreenshotPreview(reader.result as string);
              reader.readAsDataURL(file);
            }
            e.target.value = "";
          }}
        />
        {!screenshotFile && !currentScreenshotUrl ? (
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
              {currentScreenshotUrl && (
                <img
                  src={currentScreenshotUrl}
                  alt="Screenshot"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {screenshotFile ? screenshotFile.name : "Current screenshot"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {screenshotFile ? "New image will replace current" : "Upload a new image to replace"}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  disabled={loading}
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                    setClearScreenshot(true);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
