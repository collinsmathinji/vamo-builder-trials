import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: events } = await supabase
    .from("activity_events")
    .select("event_type, metadata")
    .eq("project_id", projectId)
    .in("event_type", ["link_linkedin", "link_github", "link_website"])
    .order("created_at", { ascending: false });

  const links: { linkedin: string | null; github: string | null; website: string | null } = {
    linkedin: null,
    github: null,
    website: null,
  };
  const seen = new Set<string>();
  for (const e of events ?? []) {
    if (seen.has(e.event_type)) continue;
    seen.add(e.event_type);
    const url = (e.metadata as { url?: string } | null)?.url ?? null;
    if (e.event_type === "link_linkedin") links.linkedin = url;
    if (e.event_type === "link_github") links.github = url;
    if (e.event_type === "link_website") links.website = url;
  }

  return NextResponse.json(links);
}
