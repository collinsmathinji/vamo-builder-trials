"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SettingsClient() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
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
    <Card className="card-lift rounded-2xl border-2 overflow-hidden">
      <CardHeader>
        <CardTitle className="font-heading">Account</CardTitle>
        <CardDescription className="font-body">
          Sign out of your account on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="gap-2 border-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {loggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </CardContent>
    </Card>
  );
}
