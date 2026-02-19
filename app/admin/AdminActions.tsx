"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AdminActions({ redemptionId }: { redemptionId: string }) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "fulfilled" | "failed") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed");
        return;
      }
      toast.success(`Marked as ${status}`);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={loading} onClick={() => updateStatus("fulfilled")}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
        Mark Fulfilled
      </Button>
      <Button size="sm" variant="destructive" disabled={loading} onClick={() => updateStatus("failed")}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
        Mark Failed
      </Button>
    </div>
  );
}
