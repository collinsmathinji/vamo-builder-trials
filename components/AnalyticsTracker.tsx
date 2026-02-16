"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/** Tracks page_view for analytics when the route changes (authenticated users only). */
export function AnalyticsTracker() {
  const path = usePathname();
  useEffect(() => {
    if (path) trackEvent("page_view", { path });
  }, [path]);
  return null;
}
