import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { awardPineapples } from "@/lib/rewards";

function validateLinkUrl(linkType: "linkedin" | "github" | "website", url: string): { ok: true } | { ok: false; error: string } {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, error: "URL is required" };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid URL (e.g. https://...)" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must start with https:// or http://" };
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (linkType === "linkedin") {
    if (host !== "linkedin.com") {
      return { ok: false, error: "LinkedIn slot only accepts linkedin.com URLs (e.g. https://linkedin.com/in/yourprofile)" };
    }
    return { ok: true };
  }
  if (linkType === "github") {
    if (host !== "github.com") {
      return { ok: false, error: "GitHub slot only accepts github.com URLs (e.g. https://github.com/yourusername)" };
    }
    return { ok: true };
  }
  if (linkType === "website") {
    // Any valid http(s) URL
    return { ok: true };
  }
  return { ok: false, error: "Invalid link type" };
}

export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, linkType, url } = body as { projectId: string; linkType: string; url: string };
  if (!projectId || !linkType || !url) {
    return NextResponse.json({ error: "projectId, linkType, url required" }, { status: 400 });
  }
  const eventType =
    linkType === "linkedin" ? "link_linkedin" : linkType === "github" ? "link_github" : "link_website";
  if (!["link_linkedin", "link_github", "link_website"].includes(eventType)) {
    return NextResponse.json({ error: "Invalid linkType" }, { status: 400 });
  }
  const validation = validateLinkUrl(
    linkType as "linkedin" | "github" | "website",
    url
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const normalizedUrl = url.trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const idempotencyKey = `${projectId}-${eventType}-${normalizedUrl.slice(0, 50)}`;
  await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: eventType,
    description: `Linked ${linkType}: ${normalizedUrl}`,
    metadata: { url: normalizedUrl },
  });

  const result = await awardPineapples(supabase, user.id, projectId, eventType, idempotencyKey);
  return NextResponse.json({ amount: result.amount });
}
