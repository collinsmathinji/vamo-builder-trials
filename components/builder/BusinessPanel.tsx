"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link2,
  Github,
  Globe,
  TrendingUp,
  Target,
  Activity,
  Loader2,
  Check,
  RefreshCw,
  MessageSquare,
  Zap,
  DollarSign,
  List,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  prompt: <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />,
  link_linkedin: <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />,
  link_github: <Github className="h-3 w-3 shrink-0 text-muted-foreground" />,
  link_website: <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />,
  feature_shipped: <Zap className="h-3 w-3 shrink-0 text-muted-foreground" />,
  customer_added: <Target className="h-3 w-3 shrink-0 text-muted-foreground" />,
  revenue_logged: <DollarSign className="h-3 w-3 shrink-0 text-muted-foreground" />,
  listing_created: <List className="h-3 w-3 shrink-0 text-muted-foreground" />,
  offer_received: <ShoppingBag className="h-3 w-3 shrink-0 text-muted-foreground" />,
  reward_earned: <span className="shrink-0 text-base leading-none" aria-hidden>🍍</span>,
  reward_redeemed: <span className="shrink-0 text-base leading-none" aria-hidden>🍍</span>,
  project_created: <Zap className="h-3 w-3 shrink-0 text-muted-foreground" />,
  update: <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />,
};

type LinkedAssets = {
  linkedin: string | null;
  github: string | null;
  website: string | null;
};

type Project = {
  id: string;
  valuation_low: number;
  valuation_high: number;
  why_built: string | null;
  progress_score: number;
};

type TractionEvent = {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string;
};

type ActivityEvent = {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string;
};

const STAGE_LABELS: Record<string, string> = {
  "0-25": "Early Stage",
  "26-50": "Building",
  "51-75": "Traction",
  "76-100": "Growth",
};

function getStage(score: number): string {
  if (score <= 25) return STAGE_LABELS["0-25"];
  if (score <= 50) return STAGE_LABELS["26-50"];
  if (score <= 75) return STAGE_LABELS["51-75"];
  return STAGE_LABELS["76-100"];
}

function getProgressColor(score: number): string {
  if (score <= 25) return "bg-red-500";
  if (score <= 50) return "bg-yellow-500";
  if (score <= 75) return "bg-green-500";
  return "bg-blue-500";
}

export function BusinessPanel({
  projectId,
  project: initialProject,
  onRefresh,
  refreshTrigger,
  businessPineapples = 0,
}: {
  projectId: string;
  project: Project;
  onRefresh: () => void;
  /** Increment from parent when chat response received / link added / update logged to refetch immediately */
  refreshTrigger?: number;
  /** Pineapples earned from links + traction in this project */
  businessPineapples?: number;
}) {
  const [project, setProject] = useState(initialProject);
  const [whyBuilt, setWhyBuilt] = useState(initialProject.why_built ?? "");
  const [savingWhy, setSavingWhy] = useState(false);
  const [traction, setTraction] = useState<TractionEvent[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [links, setLinks] = useState<LinkedAssets>({ linkedin: null, github: null, website: null });
  const [loading, setLoading] = useState(true);
  const [linkDialog, setLinkDialog] = useState<"linkedin" | "github" | "website" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  useEffect(() => {
    if (linkDialog === "linkedin") setLinkUrl(links.linkedin ?? "");
    if (linkDialog === "github") setLinkUrl(links.github ?? "");
    if (linkDialog === "website") setLinkUrl(links.website ?? "");
  }, [linkDialog, links.linkedin, links.github, links.website]);
  const supabase = createClient();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const [eventsRes, activityRes, linksRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/traction`),
      fetch(`/api/projects/${projectId}/activity?limit=10`),
      fetch(`/api/projects/${projectId}/links`),
    ]);
    if (eventsRes.ok) {
      const d = await eventsRes.json();
      setTraction(d.events ?? []);
    }
    if (activityRes.ok) {
      const d = await activityRes.json();
      setActivity(d.events ?? []);
    }
    if (linksRes.ok) {
      const d = await linksRes.json();
      setLinks({
        linkedin: d.linkedin ?? null,
        github: d.github ?? null,
        website: d.website ?? null,
      });
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setProject(initialProject);
    setWhyBuilt(initialProject.why_built ?? "");
  }, [initialProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch panel data when parent signals (e.g. chat response received, link added, update logged)
  useEffect(() => {
    if (refreshTrigger == null) return;
    fetchData(false);
  }, [refreshTrigger, fetchData]);

  // Poll every 5s during active session so panel stays fresh after chat/link/updates
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchData(false);
      onRefresh();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [fetchData, onRefresh]);

  // Supabase Realtime: refetch when activity_events change for this project.
  // Enable in Dashboard: Database → Publications → supabase_realtime → toggle activity_events.
  // Or run: ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
  useEffect(() => {
    const channel = supabase
      .channel(`activity_events:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_events",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchData(false);
          onRefresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchData, onRefresh]);

  const handleSaveWhyBuilt = async () => {
    const value = whyBuilt.slice(0, 1000);
    setSavingWhy(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ why_built: value || null })
        .eq("id", projectId);
      if (error) toast.error(error.message);
      else {
        setProject((p) => ({ ...p, why_built: value || null }));
        onRefresh();
      }
    } finally {
      setSavingWhy(false);
    }
  };

  function validateLink(type: "linkedin" | "github" | "website", url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return "URL is required";
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return "Enter a valid URL (e.g. https://...)";
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "URL must start with https:// or http://";
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (type === "linkedin" && host !== "linkedin.com") {
      return "Only LinkedIn URLs allowed (e.g. https://linkedin.com/in/yourprofile)";
    }
    if (type === "github" && host !== "github.com") {
      return "Only GitHub URLs allowed (e.g. https://github.com/yourusername)";
    }
    return null;
  }

  const handleLink = async () => {
    if (!linkUrl.trim()) return;
    const type = linkDialog;
    if (!type) return;
    const err = validateLink(type, linkUrl);
    if (err) {
      toast.error(err);
      return;
    }
    setLinkSaving(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, linkType: type, url: linkUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to link");
        return;
      }
      setLinkDialog(null);
      setLinkUrl("");
      trackEvent("link_added", { projectId, linkType: type });
      fetchData();
      onRefresh();
      if (data.amount) toast.success(`+${data.amount} 🍍`);
    } finally {
      setLinkSaving(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchData(true);
    onRefresh();
  }, [fetchData, onRefresh]);

  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading font-semibold text-xs sm:text-sm text-foreground">Business Panel</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm flex items-center gap-1 font-medium" title="Pineapples earned from links & traction">
            <span aria-hidden>🍍</span>
            {businessPineapples}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh panel"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm">Valuation range</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {(Number(project.valuation_low) ?? 0) === 0 && (Number(project.valuation_high) ?? 0) === 0 ? (
            <>
              <Badge variant="secondary" className="text-muted-foreground font-normal">Not yet estimated</Badge>
              <p className="text-xs text-muted-foreground mt-1.5">
                Updated by the AI after meaningful progress events.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">
                {formatCurrency(Number(project.valuation_low) ?? 0, Number(project.valuation_high) ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Updated by the AI after meaningful progress events.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Why I built this</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={whyBuilt}
            onChange={(e) => setWhyBuilt(e.target.value)}
            onBlur={handleSaveWhyBuilt}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSaveWhyBuilt();
              }
            }}
            placeholder="Your founder story..."
            maxLength={1000}
            rows={4}
            className="resize-none"
            disabled={savingWhy}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{whyBuilt.length}/1000</span>
            {savingWhy && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progress score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Progress
              value={project.progress_score}
              className="flex-1 h-3"
              indicatorClassName={getProgressColor(project.progress_score)}
            />
            <span className="text-sm font-medium w-12">{project.progress_score}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{getStage(project.progress_score)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Traction signals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : traction.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Start logging progress in the chat to see traction signals here.
            </p>
          ) : (
            <ul className="space-y-2">
              {traction.map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-sm">
                  {e.event_type === "revenue_logged" && <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />}
                  {e.event_type === "customer_added" && <Target className="h-4 w-4 shrink-0 text-blue-500" />}
                  {e.event_type === "feature_shipped" && <Activity className="h-4 w-4 shrink-0 text-green-500" />}
                  <span>{e.description || e.event_type}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Linked assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <Skeleton className="h-5 flex-1 max-w-[180px]" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm flex items-center gap-2 min-w-0">
              <Link2 className="h-4 w-4 shrink-0" /> LinkedIn
              {links.linkedin && (
                <span className="text-muted-foreground truncate text-xs" title={links.linkedin}>
                  {links.linkedin}
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => setLinkDialog("linkedin")} className="shrink-0">
              {links.linkedin ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
              {links.linkedin ? "Linked" : "Link"}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm flex items-center gap-2 min-w-0">
              <Github className="h-4 w-4 shrink-0" /> GitHub
              {links.github && (
                <span className="text-muted-foreground truncate text-xs" title={links.github}>
                  {links.github}
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => setLinkDialog("github")} className="shrink-0">
              {links.github ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
              {links.github ? "Linked" : "Link"}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm flex items-center gap-2 min-w-0">
              <Globe className="h-4 w-4 shrink-0" /> Website
              {links.website && (
                <span className="text-muted-foreground truncate text-xs" title={links.website}>
                  {links.website}
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => setLinkDialog("website")} className="shrink-0">
              {links.website ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
              {links.website ? "Linked" : "Link"}
            </Button>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Activity timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-xs">
                  {ACTIVITY_ICONS[e.event_type] ?? <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  <span className="truncate flex-1">{e.description || e.event_type}</span>
                  <span className="text-muted-foreground shrink-0">{formatRelativeTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/builder/${projectId}/timeline`} className="text-xs text-primary mt-2 inline-block hover:underline">
            View full timeline
          </Link>
        </CardContent>
      </Card>

      <Dialog open={!!linkDialog} onOpenChange={(o) => !o && setLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {linkDialog === "linkedin" && "Link LinkedIn"}
              {linkDialog === "github" && "Link GitHub"}
              {linkDialog === "website" && "Link Website"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder={
                linkDialog === "linkedin"
                  ? "https://linkedin.com/in/yourprofile"
                  : linkDialog === "github"
                    ? "https://github.com/yourusername"
                    : "https://your-website.com"
              }
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={linkSaving}
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              {linkDialog === "linkedin" && "Only linkedin.com URLs are accepted for this slot."}
              {linkDialog === "github" && "Only github.com URLs are accepted for this slot."}
              {linkDialog === "website" && "Any valid https:// or http:// URL."}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkDialog(null)}>Cancel</Button>
            <Button onClick={handleLink} disabled={linkSaving || !linkUrl.trim()}>
              {linkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
