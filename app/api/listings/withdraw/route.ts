import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Withdraw (unlist) a project from the marketplace.
 * Only the owner can withdraw. Sets listing status to 'withdrawn' and project status to 'active'.
 * Projects are only listed when you explicitly click "List for Sale" and publish — there is no auto-listing.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { projectId } = body;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!listing) {
    return NextResponse.json({ error: "No active listing found for this project" }, { status: 404 });
  }

  await supabase
    .from("listings")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", listing.id)
    .eq("user_id", user.id);

  await supabase
    .from("projects")
    .update({ status: "active" })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  return NextResponse.json({ ok: true });
}
