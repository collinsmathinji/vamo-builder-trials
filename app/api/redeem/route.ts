import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { amount, rewardType = "uber_eats" } = body;
  const num = parseInt(amount, 10);
  if (!Number.isFinite(num) || num < 50) {
    return NextResponse.json({ error: "Amount must be at least 50" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Atomic redemption: balance check, deduct, ledger + redemptions + activity in one transaction (20.6)
  const { data: redemptionId, error } = await supabase.rpc("redeem_pineapples", {
    p_user_id: user.id,
    p_amount: num,
    p_reward_type: rewardType ?? "uber_eats",
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("Insufficient balance")) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    if (msg.includes("Unauthorized")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.includes("Amount must be")) return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ redemptionId });
}
