import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { WalletClient } from "./WalletClient";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;
const MIN_REDEEM = 50;

const REWARD_TYPE_LABEL: Record<string, string> = {
  uber_eats: "Uber Eats Credit",
};

function buildWalletUrl(page: number) {
  if (page <= 1) return "/wallet";
  return `/wallet?page=${page}`;
}

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", user.id)
    .single();
  const balance = profile?.pineapple_balance ?? 0;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: ledger }, { count: totalLedger }] = await Promise.all([
    supabase
      .from("reward_ledger")
      .select("id, project_id, event_type, reward_amount, balance_after, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("reward_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const totalPages = Math.max(1, Math.ceil((totalLedger ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const projectIds = Array.from(new Set((ledger ?? []).map((r) => r.project_id).filter(Boolean))) as string[];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds.length ? projectIds : ["__none__"]);
  const projectNameById = Object.fromEntries((projects ?? []).map((p) => [p.id, p.name]));

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("id, amount, reward_type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  function redemptionStatusVariant(
    status: string
  ): "default" | "destructive" | "secondary" | "warning" | "success" {
    if (status === "fulfilled") return "success";
    if (status === "failed") return "destructive";
    return "warning"; // pending (yellow)
  }

  return (
    <AppShell title="Pineapple Wallet" subtitle="Redeem for Uber Eats credits. Min 50 🍍 to redeem." nav="auth">
      <div className="max-w-4xl space-y-8">
        {/* Balance Card */}
        <Card className="card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-4xl flex items-center gap-2">
              <span aria-hidden>🍍</span> {balance}
            </CardTitle>
            <CardDescription className="font-body">
              Total from all your projects. Redeem for Uber Eats credits (min {MIN_REDEEM} 🍍).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletClient balance={balance} />
          </CardContent>
        </Card>

        {/* Reward History */}
        <Card className="card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading">Reward history</CardTitle>
            <CardDescription className="font-body">
              All reward ledger entries (20 per page)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance after</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledger ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{r.event_type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.project_id ? projectNameById[r.project_id] ?? "—" : "—"}
                    </TableCell>
                    <TableCell>
                      {r.reward_amount >= 0 ? `+${r.reward_amount}` : r.reward_amount} 🍍
                    </TableCell>
                    <TableCell>{r.balance_after}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    {currentPage <= 1 ? (
                      <span className="inline-flex h-10 px-4 items-center gap-2 rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed opacity-50">
                        <span className="sr-only">Previous</span>
                        <span aria-hidden>Previous</span>
                      </span>
                    ) : (
                      <PaginationPrevious href={buildWalletUrl(currentPage - 1)} />
                    )}
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (totalPages > 7) {
                      if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink href={buildWalletUrl(p)} isActive={p === currentPage}>
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (p === currentPage - 3 || p === currentPage + 3) {
                        return (
                          <PaginationItem key={`ellipsis-${p}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink href={buildWalletUrl(p)} isActive={p === currentPage}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    {currentPage >= totalPages ? (
                      <span className="inline-flex h-10 px-4 items-center gap-2 rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed opacity-50">
                        <span className="sr-only">Next</span>
                        <span aria-hidden>Next</span>
                      </span>
                    ) : (
                      <PaginationNext href={buildWalletUrl(currentPage + 1)} />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

        {/* Redemption History */}
        <Card className="card-lift rounded-2xl border-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading">Redemption history</CardTitle>
            <CardDescription className="font-body">Your redemption requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reward type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(redemptions ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{r.amount} 🍍</TableCell>
                    <TableCell>{REWARD_TYPE_LABEL[r.reward_type] ?? r.reward_type}</TableCell>
                    <TableCell>
                      <Badge variant={redemptionStatusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
