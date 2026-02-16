import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, message, tag } = body as { projectId: string; message: string; tag?: string };
    if (!projectId || !message) {
      return NextResponse.json({ error: "projectId and message required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: project } = await supabase
      .from("projects")
      .select("name, description, why_built, progress_score, valuation_low, valuation_high")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);
    const reversed = (recentMessages ?? []).reverse();

    const { data: userMsg, error: insertUserErr } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: "user",
        content: message,
        tag: tag || null,
      })
      .select("id")
      .single();
    if (insertUserErr) return NextResponse.json({ error: insertUserErr.message }, { status: 500 });

    let reply = "I couldn't process that right now. Your update has been saved.";
    let intent: string = "general";
    let businessUpdate: {
      progress_delta: number;
      traction_signal: string | null;
      valuation_adjustment: string;
      valuation_low?: number;
      valuation_high?: number;
    } = {
      progress_delta: 0,
      traction_signal: null,
      valuation_adjustment: "none",
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey });
        const sys = `You are Vamo, an AI co-pilot for startup founders. The user is building a project called "${project.name}".

Your job:
1. Respond helpfully to their update or question (keep it concise, 2-3 sentences max).
2. Extract the intent of their message. Classify as one of: feature, customer, revenue, ask, general.
3. If the update implies progress (shipped something, talked to users, made revenue), generate an updated business analysis.
4. Return your response as JSON only, no markdown:
{
  "reply": "Your response text",
  "intent": "feature|customer|revenue|ask|general",
  "business_update": {
    "progress_delta": 0,
    "traction_signal": "string or null",
    "valuation_adjustment": "up|down|none",
    "valuation_low": number or omit,
    "valuation_high": number or omit
  }
}

Constraints (enforced):
- Progress delta must be between 0 and 5 (max 5 per prompt). If you cannot infer clear progress from the message, use 0.
- If insufficient data to assess progress or valuation, say so explicitly in your reply and use progress_delta 0; omit valuation_low/valuation_high.
- Valuation must be based only on logged traction signals (shipped features, customers, revenue) mentioned in this conversation—do not invent or inflate. Only include valuation_low and valuation_high when the user has described concrete progress that justifies a range (e.g. early stage 5000–15000 USD). Omit if no range is appropriate.`;
        const userContent = [
          ...reversed.map((m) => `${m.role}: ${m.content}`),
          `user: ${message}`,
        ].join("\n");
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
        });
        const text = completion.choices[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text) as {
            reply?: string;
            intent?: string;
            business_update?: {
              progress_delta?: number;
              traction_signal?: string | null;
              valuation_adjustment?: string;
              valuation_low?: number;
              valuation_high?: number;
            };
          };
          reply = parsed.reply ?? reply;
          intent = parsed.intent ?? "general";
          const bu = parsed.business_update;
          businessUpdate = {
            progress_delta: Math.min(5, Math.max(0, bu?.progress_delta ?? 0)),
            traction_signal: bu?.traction_signal ?? null,
            valuation_adjustment: bu?.valuation_adjustment ?? "none",
            valuation_low: bu?.valuation_low,
            valuation_high: bu?.valuation_high,
          };
        }
      } catch (_) {
        // OpenAI failed: use fallback reply; we still insert assistant, log activity, and award pineapple below
      }
    }

    const progressDelta = businessUpdate.progress_delta ?? 0;
    let pineapplesEarned = 0;

    const { data: assistantMsg, error: insertAssistantErr } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: "assistant",
        content: reply,
        extracted_intent: intent,
        tag: intent,
      })
      .select("id, content, tag, created_at")
      .single();
    if (insertAssistantErr) return NextResponse.json({ error: insertAssistantErr.message }, { status: 500 });

    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "prompt",
      description: message.slice(0, 200),
    });

    try {
      const { awardPineapples } = await import("@/lib/rewards");
      const result = await awardPineapples(supabase, user.id, projectId, "prompt", `${userMsg.id}-prompt`, { tag });
      pineapplesEarned = result.amount;
    } catch {
      pineapplesEarned = 0;
    }

    if (pineapplesEarned > 0) {
      await supabase.from("messages").update({ pineapples_earned: pineapplesEarned }).eq("id", assistantMsg.id);
    }

    if (progressDelta > 0) {
      const newScore = Math.min(100, (project.progress_score ?? 0) + progressDelta);
      await supabase.from("projects").update({ progress_score: newScore }).eq("id", projectId).eq("owner_id", user.id);
      if (businessUpdate.traction_signal) {
        const eventType =
          intent === "feature" ? "feature_shipped" : intent === "customer" ? "customer_added" : intent === "revenue" ? "revenue_logged" : "update";
        await supabase.from("activity_events").insert({
          project_id: projectId,
          user_id: user.id,
          event_type: eventType,
          description: businessUpdate.traction_signal,
        });
      }
    }

    const currentLow = Number(project?.valuation_low) ?? 0;
    const currentHigh = Number(project?.valuation_high) ?? 0;
    const hasExplicitRange =
      typeof businessUpdate.valuation_low === "number" &&
      typeof businessUpdate.valuation_high === "number" &&
      businessUpdate.valuation_low >= 0 &&
      businessUpdate.valuation_high >= businessUpdate.valuation_low;
    if (hasExplicitRange) {
      await supabase
        .from("projects")
        .update({
          valuation_low: Math.round(businessUpdate.valuation_low!),
          valuation_high: Math.round(businessUpdate.valuation_high!),
        })
        .eq("id", projectId)
        .eq("owner_id", user.id);
    } else if (
      (businessUpdate.valuation_adjustment === "up" || businessUpdate.valuation_adjustment === "down") &&
      (currentLow > 0 || currentHigh > 0)
    ) {
      const factor = businessUpdate.valuation_adjustment === "up" ? 1.1 : 0.9;
      const newLow = Math.max(0, Math.round(currentLow * factor));
      const newHigh = Math.max(newLow, Math.round(currentHigh * factor));
      await supabase
        .from("projects")
        .update({ valuation_low: newLow, valuation_high: newHigh })
        .eq("id", projectId)
        .eq("owner_id", user.id);
    }

    return NextResponse.json({
      userMessage: { id: userMsg.id },
      assistantMessage: assistantMsg,
      pineapplesEarned,
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
