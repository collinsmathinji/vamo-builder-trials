import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { REWARD_AMOUNTS, PROMPT_REWARD_CAP_PER_HOUR } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, projectId, eventType, idempotencyKey, tag } = body as {
    userId: string;
    projectId: string;
    eventType: string;
    idempotencyKey: string;
    tag?: string;
  };
  if (!userId || !eventType || !idempotencyKey) {
    return NextResponse.json({ error: "userId, eventType, idempotencyKey required" }, { status: 400 });
  }
  if (eventType === "prompt" && !projectId) {
    return NextResponse.json({ error: "projectId required for prompt rewards" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("reward_ledger")
    .select("id, reward_amount, balance_after")
    .eq("idempotency_key", idempotencyKey)
    .single();
  if (existing) {
    return NextResponse.json({
      rewarded: true,
      amount: existing.reward_amount,
      newBalance: existing.balance_after,
    });
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
    if (tag && (tag === "feature" || tag === "customer" || tag === "revenue")) amount += 1;
  }

  if (amount <= 0) {
    return NextResponse.json({ rewarded: false, amount: 0 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", user.id)
    .single();
  const currentBalance = profile?.pineapple_balance ?? 0;
  const balanceAfter = currentBalance + amount;

  const { error: ledgerErr } = await supabase.from("reward_ledger").insert({
    user_id: user.id,
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
      return NextResponse.json({
        rewarded: true,
        amount: existing2?.reward_amount ?? amount,
        newBalance: existing2?.balance_after ?? balanceAfter,
      });
    }
    return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ pineapple_balance: balanceAfter })
    .eq("id", user.id);

  await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: "reward_earned",
    description: `Earned ${amount} pineapples`,
    metadata: { eventType, amount },
  });

  return NextResponse.json({
    rewarded: true,
    amount,
    newBalance: balanceAfter,
  });
}
