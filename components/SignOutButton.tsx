"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function SignOutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 sm:gap-2 min-h-9 sm:min-h-10 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
      onClick={handleSignOut}
      disabled={loggingOut}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Sign out"}</span>
    </Button>
  );
}
