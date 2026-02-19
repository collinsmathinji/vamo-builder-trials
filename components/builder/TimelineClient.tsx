"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

type Event = {
  id: string;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  prompt: <MessageSquare className="h-4 w-4" />,
  link_linkedin: <Link2 className="h-4 w-4" />,
  link_github: <Github className="h-4 w-4" />,
  link_website: <Globe className="h-4 w-4" />,
  feature_shipped: <Zap className="h-4 w-4" />,
  customer_added: <Target className="h-4 w-4" />,
  revenue_logged: <DollarSign className="h-4 w-4" />,
  listing_created: <List className="h-4 w-4" />,
  offer_received: <ShoppingBag className="h-4 w-4" />,
  reward_earned: <span className="shrink-0 text-lg leading-none" aria-hidden>🍍</span>,
  reward_redeemed: <span className="shrink-0 text-lg leading-none" aria-hidden>🍍</span>,
  project_created: <Zap className="h-4 w-4" />,
  update: <MessageSquare className="h-4 w-4" />,
};

const EVENT_TYPES = [
  "project_created", "prompt", "update", "link_linkedin", "link_github", "link_website",
  "feature_shipped", "customer_added", "revenue_logged", "listing_created", "offer_received",
  "reward_earned", "reward_redeemed",
];

export function TimelineClient({
  projectId,
  initialEvents,
}: {
  projectId: string;
  initialEvents: Event[];
}) {
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = initialEvents;
    if (eventTypeFilter !== "all") {
      list = list.filter((e) => e.event_type === eventTypeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.description || "").toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialEvents, eventTypeFilter, search]);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ul className="space-y-2">
        {filtered.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3 rounded-lg border p-3 text-sm"
          >
            <span className="text-muted-foreground shrink-0 mt-0.5">
              {EVENT_ICONS[e.event_type] ?? <Zap className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p>{e.description || e.event_type}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {e.event_type} · {formatRelativeTime(e.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
