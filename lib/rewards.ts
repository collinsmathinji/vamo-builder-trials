import { SupabaseClient } from "@supabase/supabase-js";
import { REWARD_AMOUNTS, PROMPT_REWARD_CAP_PER_HOUR } from "./types";

export async function awardPineapples(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  eventType: string,
  idempotencyKey: string,
  options?: { tag?: string }
): Promise<{ amount: number; newBalance: number }> {
  const { data: existing } = await supabase
    .from("reward_ledger")
    .select("reward_amount, balance_after")
    .eq("idempotency_key", idempotencyKey)
    .single();
  if (existing) {
    return { amount: existing.reward_amount, newBalance: existing.balance_after };
  }

  let amount = REWARD_AMOUNTS[eventType] ?? 0;
  if (eventType === "prompt") {
    const { count } = await supabase
      .from("reward_ledger")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("event_type", "prompt")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= PROMPT_REWARD_CAP_PER_HOUR) amount = 0;
    if (options?.tag && ["feature", "customer", "revenue"].includes(options.tag)) amount += 1;
  }

  if (amount <= 0) return { amount: 0, newBalance: 0 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", userId)
    .single();
  const currentBalance = profile?.pineapple_balance ?? 0;
  const balanceAfter = currentBalance + amount;

  const { error: ledgerErr } = await supabase.from("reward_ledger").insert({
    user_id: userId,
    project_id: projectId || null,
    event_type: eventType,
    reward_amount: amount,
    balance_after: balanceAfter,
    idempotency_key: idempotencyKey,
  });
  if (ledgerErr) {
    if (ledgerErr.code === "23505") {
      const { data: existing2 } = await supabase
        .from("reward_ledger")
        .select("reward_amount, balance_after")
        .eq("idempotency_key", idempotencyKey)
        .single();
      return {
        amount: existing2?.reward_amount ?? amount,
        newBalance: existing2?.balance_after ?? balanceAfter,
      };
    }
    throw ledgerErr;
  }

  await supabase.from("profiles").update({ pineapple_balance: balanceAfter }).eq("id", userId);
  await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: userId,
    event_type: "reward_earned",
    description: `Earned ${amount} pineapples`,
    metadata: { eventType, amount },
  });

  return { amount, newBalance: balanceAfter };
}
