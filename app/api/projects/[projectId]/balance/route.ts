import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Returns pineapples earned for this project only (sum of reward_ledger for project_id).
 * Total balance across all projects is in the wallet (profiles.pineapple_balance).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

  const { data: rows } = await supabase
    .from("reward_ledger")
    .select("reward_amount, event_type")
    .eq("user_id", user.id)
    .eq("project_id", projectId);

  let projectPineapples = 0;
  let chatPineapples = 0;
  let linksPineapples = 0;
  let tractionPineapples = 0;

  for (const r of rows ?? []) {
    const amt = r.reward_amount ?? 0;
    projectPineapples += amt;
    const type = r.event_type ?? "";
    if (type === "prompt") chatPineapples += amt;
    else if (["link_linkedin", "link_github", "link_website"].includes(type)) linksPineapples += amt;
    else if (["feature_shipped", "customer_added", "revenue_logged"].includes(type)) tractionPineapples += amt;
  }

  return NextResponse.json({
    project_pineapples: Math.max(0, projectPineapples),
    chat_pineapples: Math.max(0, chatPineapples),
    links_pineapples: Math.max(0, linksPineapples),
    traction_pineapples: Math.max(0, tractionPineapples),
  });
}
