import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    description,
    url,
    why_built: whyBuilt,
    screenshot_url: screenshotUrl,
  } = body as {
    name?: string;
    description?: string | null;
    url?: string | null;
    why_built?: string | null;
    screenshot_url?: string | null;
  };
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof name === "string") {
    const trimmed = name.trim().slice(0, 100);
    if (trimmed) updates.name = trimmed;
  }
  if (description !== undefined) {
    updates.description = typeof description === "string" ? description.trim().slice(0, 500) || null : null;
  }
  if (url !== undefined) {
    const u = typeof url === "string" ? url.trim() : "";
    updates.url = u && /^https?:\/\//i.test(u) ? u : null;
  }
  if (whyBuilt !== undefined) {
    updates.why_built = typeof whyBuilt === "string" ? whyBuilt.trim().slice(0, 1000) || null : null;
  }
  if (screenshotUrl !== undefined) {
    updates.screenshot_url = typeof screenshotUrl === "string" && screenshotUrl.trim() ? screenshotUrl.trim() : null;
  }
  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: "No updates" }, { status: 400 });

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
