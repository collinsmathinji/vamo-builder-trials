"use client";

import { formatRelativeTime } from "@/lib/utils";
import {
  MessageSquare,
  Link2,
  Github,
  Globe,
  Zap,
  Target,
  DollarSign,
  List,
  ShoppingBag,
  Activity,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  prompt: <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />,
  link_linkedin: <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />,
  link_github: <Github className="h-4 w-4 shrink-0 text-muted-foreground" />,
  link_website: <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />,
  feature_shipped: <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />,
  customer_added: <Target className="h-4 w-4 shrink-0 text-muted-foreground" />,
  revenue_logged: <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />,
  listing_created: <List className="h-4 w-4 shrink-0 text-muted-foreground" />,
  offer_received: <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />,
  reward_earned: <span className="shrink-0 text-lg leading-none" aria-hidden>🍍</span>,
  reward_redeemed: <span className="shrink-0 text-lg leading-none" aria-hidden>🍍</span>,
  project_created: <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />,
  update: <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />,
};

type TimelineEvent = {
  event_type?: string;
  description?: string | null;
  created_at?: string;
};

export function ListingActivityTimeline({
  events,
}: {
  events: TimelineEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
        Activity timeline
      </h2>
      <ul className="space-y-1">
        {events.slice(0, 20).map((e, i) => (
          <li
            key={i}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/80 border border-border/60">
              {ACTIVITY_ICONS[e.event_type ?? ""] ?? (
                <Activity className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <span className="flex-1 min-w-0 text-foreground">
              {e.description || e.event_type || "—"}
            </span>
            {e.created_at && (
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {formatRelativeTime(e.created_at)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
