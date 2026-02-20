"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone } from "lucide-react";
import Link from "next/link";

type Viewport = "desktop" | "tablet" | "mobile";

const WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

/** Iframe or fallback must appear within 3 seconds. */
const LOAD_TIMEOUT_MS = 3000;

export function UIPreview({
  url,
  screenshotUrl,
  projectId,
}: {
  url: string | null;
  screenshotUrl: string | null;
  projectId: string;
}) {
  const [loading, setLoading] = useState(!!url);
  const [failed, setFailed] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const loadFiredRef = useRef(false);

  const handleLoad = useCallback(() => {
    loadFiredRef.current = true;
    setLoading(false);
    setFailed(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setFailed(true);
  }, []);

  const refresh = useCallback(() => {
    loadFiredRef.current = false;
    setFailed(false);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  // Within 3s: either iframe loads (onLoad) or we show fallback so UI appears quickly.
  useEffect(() => {
    if (!url || !loading) return;
    const id = setTimeout(() => {
      if (!loadFiredRef.current) {
        setLoading(false);
        setFailed(true);
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [url, loading, refreshKey]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar: title, device toggle, refresh, open in new tab */}
      <div className="flex items-center justify-between p-3 border-b border-border/60 gap-2 flex-shrink-0 bg-background">
        <span className="text-sm font-heading font-semibold text-foreground">UI Preview</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Viewport</span>
          <Button
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setViewport("desktop")}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setViewport("tablet")}
            title="Tablet (768px)"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setViewport("mobile")}
            title="Mobile (375px)"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          {url && (
            <>
              <div className="w-px h-5 bg-border mx-0.5" aria-hidden />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={refresh}
                title="Refresh preview"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-auto min-h-0">
        {!url ? (
          /* Empty state: no project URL */
          <Card className="max-w-sm w-full border-2 shadow-sm">
            <CardContent className="pt-6 pb-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Link a project URL to see a live preview
              </p>
              <Link href={`/builder/${projectId}/settings`}>
                <Button className="w-full">Open project settings</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div
            className="flex flex-col items-center w-full h-full min-h-0"
            style={{ maxWidth: WIDTHS[viewport] }}
          >
            {loading && (
              <Skeleton className="w-full flex-1 min-h-[320px] sm:min-h-[400px] rounded-lg shrink-0" />
            )}
            {!loading && failed ? (
              /* Fallback: iframe failed (e.g. X-Frame-Options) or did not load within 3s */
              <Card className="w-full flex-1 flex flex-col min-h-0 border-2 shadow-sm overflow-hidden">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {screenshotUrl ? (
                    <>
                      <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-2">
                        <img
                          src={screenshotUrl}
                          alt="Project screenshot"
                          className="max-w-full max-h-full w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center py-2 px-3 border-t bg-muted/30 shrink-0">
                        Live preview unavailable in frame
                      </p>
                      <div className="p-3 border-t bg-background shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="outline" className="w-full gap-2">
                            Open in new tab
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Preview unavailable in frame (e.g. site blocks embedding).
                      </p>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                          Open in new tab
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
            {/* Iframe always mounted when url is set so onLoad can fire; hidden until loaded or when fallback shown */}
            {url && (
              <iframe
                key={`${url}-${viewport}-${refreshKey}`}
                src={url}
                className="w-full flex-1 min-h-[320px] sm:min-h-[500px] border-0 rounded-lg bg-card shadow-sm"
                style={{ display: loading || failed ? "none" : "block" }}
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={handleLoad}
                onError={handleError}
                title="Project preview"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
