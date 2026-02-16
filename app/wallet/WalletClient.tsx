"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const MIN_REDEEM = 50;

const REWARD_TYPES = [
  { value: "uber_eats", label: "Uber Eats Credit" },
] as const;

export function WalletClient({ balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(MIN_REDEEM);
  const [rewardType, setRewardType] = useState<string>(REWARD_TYPES[0].value);
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    const num = Math.min(balance, Math.max(MIN_REDEEM, amount));
    if (num < MIN_REDEEM) {
      toast.error(`Minimum redemption is ${MIN_REDEEM} 🍍`);
      return;
    }
    if (num > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num, rewardType: rewardType || "uber_eats" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Redemption failed");
        return;
      }
      trackEvent("reward_redeemed", { amount: num, rewardType: rewardType || "uber_eats" });
      toast.success("Redemption submitted! You'll receive your reward within 48 hours.");
      setOpen(false);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button disabled={balance < MIN_REDEEM} onClick={() => setOpen(true)}>
        Redeem
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem pineapples</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Current balance: 🍍 {balance}</p>
          <div className="space-y-2">
            <Label htmlFor="redeem-amount">Amount (min {MIN_REDEEM}, max {balance})</Label>
            <Input
              id="redeem-amount"
              type="number"
              min={MIN_REDEEM}
              max={balance}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reward type</Label>
            <Select value={rewardType} onValueChange={setRewardType}>
              <SelectTrigger>
                <SelectValue placeholder="Select reward type" />
              </SelectTrigger>
              <SelectContent>
                {REWARD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleRedeem} disabled={loading || amount < MIN_REDEEM || amount > balance}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
