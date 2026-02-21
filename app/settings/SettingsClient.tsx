"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, Wallet, LogOut, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function formatJoined(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(fullName: string | null): string {
  if (!fullName?.trim()) return "U";
  return fullName
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SettingsClient({
  email,
  fullName,
  avatarUrl,
  joinedAt,
  pineappleBalance,
}: {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  pineappleBalance: number;
}) {
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
    <div className="space-y-6">
      {/* Account card */}
      <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-full border border-border/60 shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName ?? "User"} />
              ) : null}
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-bold text-foreground truncate">
                {fullName || "Account"}
              </h2>
              <p className="flex items-center gap-2 mt-1 text-sm text-muted-foreground truncate">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{email || "—"}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Joined
              </p>
              <p className="mt-1 font-heading text-sm font-semibold text-foreground">
                {formatJoined(joinedAt)}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                <span className="text-primary" aria-hidden>🍍</span>
                Pineapple Balance
              </p>
              <p className="mt-1 font-heading text-sm font-semibold text-primary">
                {pineappleBalance} {pineappleBalance === 1 ? "pineapple" : "pineapples"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet card */}
      <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 shrink-0 text-primary" />
                <h3 className="font-heading text-lg font-bold text-foreground">Wallet</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground font-body">
                View your pineapple rewards, transactions, and redemption history
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 border-2" asChild>
              <Link href="/wallet">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign out button */}
      <Button
        variant="outline"
        className="w-full rounded-2xl h-12 border-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-heading font-semibold gap-2"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {loggingOut ? "Signing out…" : "Sign Out"}
      </Button>
    </div>
  );
}
