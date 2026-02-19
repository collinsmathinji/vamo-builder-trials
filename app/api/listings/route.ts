import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET /api/listings?projectId= — preview for listing dialog: title, AI description, valuation, timeline snapshot, metrics */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, why_built, valuation_low, valuation_high, progress_score")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [
    { data: events },
    { count: promptCount },
    { count: tractionCount },
  ] = await Promise.all([
    supabase
      .from("activity_events")
      .select("id, event_type, description, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase
      .from("activity_events")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("event_type", ["feature_shipped", "customer_added", "revenue_logged"]),
  ]);

  const timelineSnapshot = (events ?? []).map((e) => ({
    event_type: e.event_type,
    description: e.description,
    created_at: e.created_at,
  }));
  const metrics = {
    progress_score: project.progress_score ?? 0,
    prompt_count: promptCount ?? 0,
    traction_count: tractionCount ?? 0,
  };

  let descriptionSuggestion = project.description?.trim() || "";
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && (project.why_built || project.description || (events?.length ?? 0) > 0)) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const payload = {
        name: project.name,
        description: project.description,
        why_built: project.why_built,
        activitySummary: (events ?? []).slice(0, 40).map((e) => ({ type: e.event_type, description: e.description })),
      };
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are writing a short, compelling marketplace listing description for a project built by a founder. " +
              "Use the project name, description, why_built, and activitySummary (recent events with type and description). " +
              "Output 2–4 concise sentences: what it is, why it matters, and key progress. No fluff. Return only the paragraph text, no JSON.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) descriptionSuggestion = text;
    } catch {
      // keep project description
    }
  }

  return NextResponse.json({
    title: project.name,
    description: descriptionSuggestion,
    askingPriceLow: project.valuation_low ?? 0,
    askingPriceHigh: project.valuation_high ?? 0,
    timelineSnapshot,
    metrics,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, title, description, askingPriceLow, askingPriceHigh, screenshots: screenshotUrls } = body;
  if (!projectId || !title) {
    return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
  }
  const screenshots = Array.isArray(screenshotUrls)
    ? screenshotUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: events } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const { data: proj } = await supabase.from("projects").select("progress_score").eq("id", projectId).single();
  const { count: promptCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { count: tractionCount } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("event_type", ["feature_shipped", "customer_added", "revenue_logged"]);
  const metrics = {
    progress_score: proj?.progress_score ?? 0,
    prompt_count: promptCount ?? 0,
    traction_count: tractionCount ?? 0,
  };

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      project_id: projectId,
      user_id: user.id,
      title,
      description: description || null,
      asking_price_low: askingPriceLow ?? null,
      asking_price_high: askingPriceHigh ?? null,
      timeline_snapshot: events ?? [],
      screenshots: screenshots.length ? screenshots : [],
      metrics,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("projects").update({ status: "listed" }).eq("id", projectId).eq("owner_id", user.id);
  await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: "listing_created",
    description: "Listing created",
  });

  return NextResponse.json({ listingId: listing.id });
}
