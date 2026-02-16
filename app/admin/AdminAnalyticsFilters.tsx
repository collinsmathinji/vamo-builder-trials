"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;

type Props = {
  eventNames: string[];
  totalCount: number;
  currentPage: number;
};

export function AdminAnalyticsFilters({
  eventNames,
  totalCount,
  currentPage,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const eventName = searchParams.get("event_name") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete("page"); // reset to page 1 when filters change
    startTransition(() => {
      router.push(`/admin?${next.toString()}#analytics`);
    });
  }

  function pageUrl(page: number) {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    return `/admin?${next.toString()}#analytics`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Event name</Label>
          <Select
            value={eventName || "_all"}
            onValueChange={(v) => updateParams({ event_name: v === "_all" ? "" : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All events</SelectItem>
              {eventNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">From date</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">To date</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="w-[160px]"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => router.push("/admin#analytics")}
        >
          Clear filters
        </Button>
      </div>
      {totalCount > PAGE_SIZE && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={currentPage > 1 ? pageUrl(currentPage - 1) : "#"}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <PaginationItem key={p}>
                  <PaginationLink href={pageUrl(p)} isActive={currentPage === p}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href={currentPage < totalPages ? pageUrl(currentPage + 1) : "#"}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <p className="text-sm text-muted-foreground">
        Showing page {currentPage} of {totalPages} ({totalCount} events)
      </p>
    </div>
  );
}
