"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ImagePlus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { ListingActivityTimeline } from "@/components/marketplace/ListingActivityTimeline";

type Project = {
  id: string;
  name: string;
  description: string | null;
  valuation_low: number;
  valuation_high: number;
};

type TimelineEvent = { event_type?: string; description?: string | null; created_at?: string };
type Preview = {
  title: string;
  description: string;
  askingPriceLow: number;
  askingPriceHigh: number;
  timelineSnapshot: TimelineEvent[];
  metrics: { progress_score: number; prompt_count: number; traction_count: number };
};

const BUCKET = "listing-screenshots";

export function ListListingDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
  initialOffer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
  initialOffer?: { offer_low: number; offer_high: number } | null;
}) {
  const [previewLoading, setPreviewLoading] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [priceLow, setPriceLow] = useState(project.valuation_low || 0);
  const [priceHigh, setPriceHigh] = useState(project.valuation_high || 0);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [manualUrlsText, setManualUrlsText] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading">("idle");
  const [loading, setLoading] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch preview when dialog opens
  useEffect(() => {
    if (!open || !project.id) return;
    setPreviewLoading(true);
    setPreview(null);
    setUploadedUrls([]);
    setManualUrlsText("");
    fetch(`/api/listings?projectId=${encodeURIComponent(project.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load preview");
        return res.json();
      })
      .then((data: Preview) => {
        setPreview(data);
        setTitle(data.title);
        setDescription(data.description || "");
        if (initialOffer) {
          setPriceLow(initialOffer.offer_low);
          setPriceHigh(initialOffer.offer_high);
        } else {
          setPriceLow(data.askingPriceLow ?? 0);
          setPriceHigh(data.askingPriceHigh ?? 0);
        }
      })
      .catch(() => toast.error("Could not load listing preview"))
      .finally(() => setPreviewLoading(false));
  }, [open, project.id, initialOffer]);

  const allScreenshotUrls = [
    ...uploadedUrls,
    ...manualUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean),
  ];
  const hasAtLeastOneScreenshot = allScreenshotUrls.length > 0;

  /** Compress image so uploads finish quickly: max 800px, JPEG 0.72. Always compress if > 300KB. */
  async function compressImageIfNeeded(file: File): Promise<File | Blob> {
    const skipIfUnder = 280 * 1024; // under ~280KB keep as-is
    const maxWidth = 800;
    const quality = 0.72;
    if (file.size <= skipIfUnder && !file.type.includes("png")) return file;
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
        canvas.toBlob(
          (blob) => resolve(blob ?? file),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to upload images");
      return;
    }
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length !== files.length) toast.error("Skipped non-image files");
    if (!valid.length) return;

    setUploadingCount(valid.length);
    setUploadStatus("compressing");

    const basePath = `${user.id}/${project.id}`;

    // Phase 1: compress all (smaller files = much faster upload)
    const compressed = await Promise.all(
      valid.map(async (file) => {
        const body = await compressImageIfNeeded(file);
        return { file, body };
      })
    );

    setUploadStatus("uploading");

    // Phase 2: upload all in parallel
    const uploadOne = async ({
      file,
      body,
    }: {
      file: File;
      body: File | Blob;
    }): Promise<string | null> => {
      const isBlob = body instanceof Blob && !(body instanceof File);
      const ext = isBlob ? "jpg" : (file.name.replace(/^.*\./, "") || "jpg");
      const path = `${basePath}/${crypto.randomUUID()}.${ext}`;
      const contentType = isBlob ? "image/jpeg" : file.type;
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, body, {
        upsert: false,
        contentType,
      });
      if (error) {
        toast.error(error.message || `Upload failed: ${file.name}`);
        return null;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData.publicUrl;
    };

    const results = await Promise.all(compressed.map(uploadOne));
    const added = results.filter((u): u is string => u != null);
    setUploadedUrls((prev) => [...prev, ...added]);
    setUploadingCount(0);
    setUploadStatus("idle");
  }

  function removeUploadedUrl(url: string) {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handlePublish() {
    if (!hasAtLeastOneScreenshot) {
      toast.error("Add at least one screenshot so buyers can see your project.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title,
          description,
          askingPriceLow: priceLow,
          askingPriceHigh: priceHigh,
          screenshots: allScreenshotUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create listing");
        return;
      }
      trackEvent("listing_created", { projectId: project.id, listingId: data.listingId });
      toast.success("Listing published!");
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>List for sale</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4 pr-4">
            {previewLoading ? (
              <div className="space-y-4 py-2">
                <div>
                  <Skeleton className="h-3 w-12 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-1.5" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-3 w-24 mb-1.5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-28 mb-1.5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-3 w-32 mb-1.5" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-1.5" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="AI-generated from your project and activity; edit as you like."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Asking price low ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={priceLow || ""}
                      onChange={(e) => setPriceLow(parseInt(e.target.value, 10) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Asking price high ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={priceHigh || ""}
                      onChange={(e) => setPriceHigh(parseInt(e.target.value, 10) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {preview?.metrics && (
                  <div>
                    <Label className="text-muted-foreground">Metrics (included in listing)</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary">Progress: {preview.metrics.progress_score}%</Badge>
                      <Badge variant="outline">Prompts: {preview.metrics.prompt_count}</Badge>
                      <Badge variant="outline">Traction: {preview.metrics.traction_count}</Badge>
                    </div>
                  </div>
                )}

                {preview?.timelineSnapshot && preview.timelineSnapshot.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setTimelineOpen((o) => !o)}
                      className="flex items-center gap-1 font-medium text-sm text-muted-foreground hover:text-foreground"
                    >
                      Timeline snapshot ({preview.timelineSnapshot.length} events)
                      {timelineOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {timelineOpen && (
                      <div className="mt-2 rounded-md border bg-muted/30 p-3">
                        <ListingActivityTimeline events={preview.timelineSnapshot} />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>
                    Screenshots <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Add at least one image so buyers can see your project. Upload files or paste image URLs (one per line).
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStatus !== "idle"}
                      className="gap-1.5"
                    >
                      {uploadStatus !== "idle" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Upload images
                    </Button>
                    {uploadStatus === "compressing" && (
                      <span className="text-xs text-muted-foreground">Compressing…</span>
                    )}
                    {uploadStatus === "uploading" && (
                      <span className="text-xs text-muted-foreground">Uploading…</span>
                    )}
                    {uploadedUrls.length > 0 && uploadStatus === "idle" && (
                      <span className="text-xs text-muted-foreground">
                        {uploadedUrls.length} uploaded
                      </span>
                    )}
                  </div>
                  {allScreenshotUrls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {uploadedUrls.map((url) => (
                          <div key={url} className="relative group inline-block">
                            <img
                              src={url}
                              alt="Uploaded"
                              className="h-20 w-20 rounded border object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeUploadedUrl(url)}
                              className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-90 hover:opacity-100"
                              aria-label="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Or paste image URLs (one per line)"
                        value={manualUrlsText}
                        onChange={(e) => setManualUrlsText(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                  {!hasAtLeastOneScreenshot && !previewLoading && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                      Add at least one screenshot to publish.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || previewLoading || !hasAtLeastOneScreenshot || uploadStatus !== "idle"}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
