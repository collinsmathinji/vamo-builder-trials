"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar() {
  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setProfile({ avatar_url: data.avatar_url ?? null, full_name: data.full_name ?? null }))
      .catch(() => {});
  }, []);

  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <Link href="/settings" className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
      <Avatar className="h-8 w-8 border border-border/60">
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "User"} />
        ) : null}
        <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
