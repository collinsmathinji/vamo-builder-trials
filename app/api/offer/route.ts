import { createClient } from "@/lib/supabase/server";
import { checkContentRateLimit } from "@/lib/rate-limit";
import { offerResponseSchema } from "@/lib/openai-schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { projectId } = body;
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = checkContentRateLimit(user.id);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429, headers: rate.retryAfter ? { "Retry-After": String(rate.retryAfter) } : undefined }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: events } = await supabase
    .from("activity_events")
    .select("event_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);
  const { count: msgCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { count: tractionCount } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("event_type", ["feature_shipped", "customer_added", "revenue_logged"]);
  const { count: linksCount } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("event_type", ["link_linkedin", "link_github", "link_website"]);

  await supabase.from("offers").update({ status: "expired" }).eq("project_id", projectId).eq("user_id", user.id);

  let offerLow = 0;
  let offerHigh = 0;
  let reasoning = "Insufficient data to generate an offer.";
  let signalsUsed: string[] = [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const payload = {
        project: {
          name: project.name,
          description: project.description,
          progress_score: project.progress_score,
          why_built: project.why_built,
          valuation_low: project.valuation_low ?? null,
          valuation_high: project.valuation_high ?? null,
        },
        messageCount: msgCount ?? 0,
        tractionSignalCount: tractionCount ?? 0,
        linksCount: linksCount ?? 0,
        activitySummary: (events ?? []).slice(0, 30).map((e) => ({ type: e.event_type, description: e.description })),
      };
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a startup valuation engine. You receive project data and an activitySummary: a list of events (type + description).\n\n" +
              "Use ALL of this to infer valuation:\n" +
              "- Structured traction: event types feature_shipped, customer_added, revenue_logged.\n" +
              "- Narrative in activity: 'prompt' events often describe progress (e.g. '50 users signed up', 'we launched X', 'revenue from Y'). Treat those descriptions as real signals and use them to justify a valuation range when appropriate.\n" +
              "- Project.valuation_low / valuation_high: if the founder's co-pilot already set a range from chat updates, you may use or refine it.\n" +
              "- Progress score, why_built, description, and linked profiles (linksCount) add context.\n\n" +
              "Return only valid JSON: offer_low (number), offer_high (number), reasoning (string), signals_used (array of strings).\n" +
              "When the founder has described concrete traction (sign-ups, features, revenue) in their activity—even in prompt messages—derive a plausible early-stage range (e.g. $5,000–$15,000). Only set offer_low and offer_high to 0 with 'Insufficient data' when there is truly no usable signal (no narrative progress, no valuation, no traction events). Do not invent numbers; base the range on what was actually described or logged.",
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 600,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        const parsed = offerResponseSchema.parse(JSON.parse(text));
        offerLow = Math.max(0, parsed.offer_low ?? 0);
        offerHigh = Math.max(offerLow, parsed.offer_high ?? 0);
        reasoning = parsed.reasoning ?? reasoning;
        signalsUsed = Array.isArray(parsed.signals_used) ? parsed.signals_used : [];
      }
    } catch {
      // use defaults
    }
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      project_id: projectId,
      user_id: user.id,
      offer_low: offerLow,
      offer_high: offerHigh,
      reasoning,
      signals: { signals_used: signalsUsed },
      status: "active",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: "offer_received",
    description: `Offer: $${offerLow} – $${offerHigh}`,
  });

  return NextResponse.json({
    offerId: offer.id,
    offer_low: offerLow,
    offer_high: offerHigh,
    reasoning,
    signals_used: signalsUsed,
  });
}
