import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: p } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", user.id).single();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: events } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at")
    .eq("project_id", projectId)
    .in("event_type", ["feature_shipped", "customer_added", "revenue_logged"])
    .order("created_at", { ascending: false });
  return NextResponse.json({ events: events ?? [] });
}
