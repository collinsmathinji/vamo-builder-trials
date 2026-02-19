"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export function GetOfferDialog({
  open,
  onOpenChange,
  projectId,
  onListClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onListClick: (offer: { offer_low: number; offer_high: number }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<{
    offer_low: number;
    offer_high: number;
    reasoning: string;
    signals_used?: string[];
  } | null>(null);

  useEffect(() => {
    if (!open) setOffer(null);
  }, [open]);

  async function fetchOffer() {
    setLoading(true);
    setOffer(null);
    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get offer");
      }
      trackEvent("offer_requested", { projectId, offerId: data.offerId });
      setOffer({
        offer_low: data.offer_low,
        offer_high: data.offer_high,
        reasoning: data.reasoning || "",
        signals_used: data.signals_used,
      });
    } catch (e) {
      setOffer({
        offer_low: 0,
        offer_high: 0,
        reasoning: e instanceof Error ? e.message : "Could not generate offer.",
        signals_used: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !offer && !loading) fetchOffer();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vamo Offer</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[75%]" />
            </div>
          </div>
        ) : offer ? (
          <div className="space-y-4">
            <p className="text-2xl font-semibold">
              {formatCurrency(offer.offer_low, offer.offer_high)}
            </p>
            <p className="text-sm text-muted-foreground">{offer.reasoning}</p>
            {offer.signals_used?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Signals used</p>
                <ul className="text-sm list-disc list-inside">
                  {offer.signals_used.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              This is a non-binding estimate based on your logged activity.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
              <Button onClick={() => onListClick({ offer_low: offer.offer_low, offer_high: offer.offer_high })}>List for Sale</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
