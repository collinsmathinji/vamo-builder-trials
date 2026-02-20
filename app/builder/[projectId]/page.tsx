import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { BuilderWorkspace } from "@/components/builder/BuilderWorkspace";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (!project) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance, avatar_url")
    .eq("id", user.id)
    .single();
  const pineappleBalance = profile?.pineapple_balance ?? 0;
  const userAvatarUrl = profile?.avatar_url ?? null;

  const { data: ledgerRows } = await supabase
    .from("reward_ledger")
    .select("reward_amount, event_type")
    .eq("user_id", user.id)
    .eq("project_id", projectId);
  let chatPineapples = 0;
  let linksPineapples = 0;
  let tractionPineapples = 0;
  for (const r of ledgerRows ?? []) {
    const amt = r.reward_amount ?? 0;
    const type = r.event_type ?? "";
    if (type === "prompt") chatPineapples += amt;
    else if (["link_linkedin", "link_github", "link_website"].includes(type)) linksPineapples += amt;
    else if (["feature_shipped", "customer_added", "revenue_logged"].includes(type)) tractionPineapples += amt;
  }

  return (
    <BuilderWorkspace
      project={project}
      pineappleBalance={pineappleBalance}
      chatPineapples={chatPineapples}
      linksPineapples={linksPineapples}
      tractionPineapples={tractionPineapples}
      userAvatarUrl={userAvatarUrl}
    />
  );
}
