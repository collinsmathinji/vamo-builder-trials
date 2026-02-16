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
      <h3 className="font-heading text-sm font-semibold mb-2">Activity timeline</h3>
      <ul className="space-y-2">
        {events.slice(0, 15).map((e, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {ACTIVITY_ICONS[e.event_type ?? ""] ?? (
              <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{e.description || e.event_type || "—"}</span>
            {e.created_at && (
              <span className="text-muted-foreground shrink-0">
                {formatRelativeTime(e.created_at)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
