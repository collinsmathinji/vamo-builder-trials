import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name, pineapple_balance, created_at")
    .eq("id", user.id)
    .single();

  return (
    <AppShell title="Settings" nav="auth">
      <div className="max-w-lg space-y-6">
        <SettingsClient
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          joinedAt={profile?.created_at ?? null}
          pineappleBalance={profile?.pineapple_balance ?? 0}
        />
      </div>
    </AppShell>
  );
}
