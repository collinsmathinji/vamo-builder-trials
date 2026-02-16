import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell title="Settings" subtitle="Account and app preferences." nav="auth">
      <div className="max-w-lg space-y-6">
        <SettingsClient />
      </div>
    </AppShell>
  );
}
