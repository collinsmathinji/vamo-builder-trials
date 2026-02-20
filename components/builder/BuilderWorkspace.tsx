"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "./ChatPanel";
import { UIPreview } from "./UIPreview";
import { BusinessPanel } from "./BusinessPanel";
import { ListListingDialog } from "./ListListingDialog";
import { GetOfferDialog } from "./GetOfferDialog";
import { MessageSquare, BarChart3, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";

type Project = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  screenshot_url: string | null;
  status: string;
  progress_score: number;
  valuation_low: number;
  valuation_high: number;
  why_built: string | null;
};

export function BuilderWorkspace({
  project: initialProject,
  pineappleBalance: initialBalance,
  chatPineapples: initialChatPineapples = 0,
  linksPineapples: initialLinksPineapples = 0,
  tractionPineapples: initialTractionPineapples = 0,
  userAvatarUrl = null,
}: {
  project: Project;
  pineappleBalance: number;
  chatPineapples?: number;
  linksPineapples?: number;
  tractionPineapples?: number;
  userAvatarUrl?: string | null;
}) {
  const [project, setProject] = useState(initialProject);
  const [pineappleBalance, setPineappleBalance] = useState(initialBalance);
  const [chatPineapples, setChatPineapples] = useState(initialChatPineapples);
  const [linksPineapples, setLinksPineapples] = useState(initialLinksPineapples);
  const [tractionPineapples, setTractionPineapples] = useState(initialTractionPineapples);
  const [chatOpen, setChatOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerPrefill, setOfferPrefill] = useState<{ offer_low: number; offer_high: number } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(initialProject.name);
  const [savingName, setSavingName] = useState(false);
  const [businessPanelRefreshTrigger, setBusinessPanelRefreshTrigger] = useState(0);
  const [unlisting, setUnlisting] = useState(false);

  const refreshProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
  }, [project.id]);

  const refreshBalance = useCallback(async () => {
    const res = await fetch("/api/profile/balance");
    if (res.ok) {
      const data = await res.json();
      setPineappleBalance(data.pineapple_balance ?? 0);
    }
  }, []);

  const refreshPanelPineapples = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/balance`);
    if (res.ok) {
      const data = await res.json();
      setChatPineapples(data.chat_pineapples ?? 0);
      setLinksPineapples(data.links_pineapples ?? 0);
      setTractionPineapples(data.traction_pineapples ?? 0);
    }
  }, [project.id]);

  const onChatUpdate = useCallback(() => {
    setBusinessPanelRefreshTrigger((t) => t + 1);
    refreshProject();
    refreshBalance();
    refreshPanelPineapples();
  }, [refreshProject, refreshBalance, refreshPanelPineapples]);

  const onRefreshFromPanel = useCallback(() => {
    refreshProject();
    refreshBalance();
    refreshPanelPineapples();
  }, [refreshProject, refreshBalance, refreshPanelPineapples]);

  const progressScore = Number(project?.progress_score) ?? 0;
  const canList = progressScore >= 20;
  const canGetOffer = progressScore >= 10;
  const isListed = project?.status === "listed";

  const handleUnlist = useCallback(async () => {
    if (!project?.id || unlisting) return;
    setUnlisting(true);
    try {
      const res = await fetch("/api/listings/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (res.ok) {
        setProject((p) => (p ? { ...p, status: "active" } : p));
        toast.success("Removed from marketplace");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not unlist");
      }
    } finally {
      setUnlisting(false);
    }
  }, [project?.id, unlisting]);

  const saveProjectName = useCallback(async () => {
    const trimmed = editNameValue.trim().slice(0, 100);
    if (!trimmed || trimmed === project.name) {
      setEditingName(false);
      setEditNameValue(project.name);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject((p) => ({ ...p, name: data.name }));
        setEditNameValue(data.name);
      }
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }, [project.id, project.name, editNameValue]);

  return (
    <div className="h-dvh sm:h-screen flex flex-col bg-background safe-top">
      <header className="flex-shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-sm h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4 min-h-0">
        {/* Back to projects + Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/projects"
            className="flex-shrink-0 rounded-md p-1.5 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Back to projects"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          {editingName ? (
            <Input
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onBlur={saveProjectName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveProjectName();
                if (e.key === "Escape") {
                  setEditNameValue(project.name);
                  setEditingName(false);
                }
              }}
              className="h-8 max-w-[140px] sm:max-w-[240px] text-base sm:text-lg font-medium flex-1 min-w-0"
              maxLength={100}
              autoFocus
              disabled={savingName}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditNameValue(project.name);
                setEditingName(true);
              }}
              className="text-base sm:text-lg font-medium truncate text-left hover:underline focus:outline-none focus:underline py-1 min-w-0"
              title="Click to edit"
            >
              {project.name}
            </button>
          )}
        </div>
        
        <ThemeToggle />
        <UserAvatar />
        {/* Wallet total (profiles.pineapple_balance — aggregate of all projects; per-project counts are only in each project’s panels) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/wallet"
            className="text-xs sm:text-sm font-heading font-semibold flex items-center gap-1 sm:gap-1.5 rounded-full bg-accent/15 text-accent-foreground px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-accent/25 transition-colors"
            title="Wallet: total pineapples across all your projects"
          >
            <span className="hidden sm:inline text-muted-foreground/90">Wallet</span>
            🍍 {pineappleBalance}
          </Link>
        </div>

        {/* Action Buttons — only visible when progress thresholds are met; Unlist when already listed */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isListed && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg font-medium text-xs sm:text-sm h-8 sm:h-9 inline-flex text-muted-foreground"
              onClick={handleUnlist}
              disabled={unlisting}
              title="Remove from marketplace (only you can list; listing was created when you clicked List for Sale and published)"
            >
              {unlisting ? "…" : "Unlist"}
            </Button>
          )}
          {canList && !isListed && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg font-medium text-xs sm:text-sm h-8 sm:h-9 inline-flex"
              onClick={() => setListDialogOpen(true)}
              title="List project for sale"
            >
              List for Sale
            </Button>
          )}
          {canGetOffer && (
            <Button
              size="sm"
              className="rounded-lg bg-primary hover:bg-primary/90 font-medium text-xs sm:text-sm h-8 sm:h-9 inline-flex"
              onClick={() => setOfferDialogOpen(true)}
              title="Get instant Vamo offer"
            >
              Get Vamo Offer
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Desktop: 3 panels — Left: Builder Chat | Center: UI Preview | Right: Business Panel */}
        <div className="hidden xl:flex flex-1 min-w-0">
          <aside className="w-[300px] flex-shrink-0 border-r flex flex-col min-h-0 bg-background">
            <ChatPanel projectId={project.id} onUpdate={onChatUpdate} chatPineapples={chatPineapples} userAvatarUrl={userAvatarUrl} />
          </aside>
          <main className="flex-1 min-w-0 flex flex-col min-h-0 border-r">
            <UIPreview url={project.url} screenshotUrl={project.screenshot_url} projectId={project.id} />
          </main>
          <aside className="w-[360px] flex-shrink-0 flex flex-col min-h-0 overflow-auto bg-background">
            <BusinessPanel projectId={project.id} project={project} onRefresh={onRefreshFromPanel} refreshTrigger={businessPanelRefreshTrigger} businessPineapples={linksPineapples + tractionPineapples} />
          </aside>
        </div>

        {/* Tablet: sheet for chat, center + right */}
        <div className="hidden md:flex xl:hidden flex-1 min-w-0 relative">
          <div className="absolute top-2 left-2 z-10 flex gap-2">
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 shadow-sm">
                  <MessageSquare className="h-4 w-4" /> Chat
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0">
                <ChatPanel projectId={project.id} onUpdate={onChatUpdate} chatPineapples={chatPineapples} userAvatarUrl={userAvatarUrl} />
              </SheetContent>
            </Sheet>
          </div>
          <main className="flex-1 min-w-0 flex flex-col min-h-0 border-r">
            <UIPreview url={project.url} screenshotUrl={project.screenshot_url} projectId={project.id} />
          </main>
          <aside className="w-[280px] sm:w-[320px] flex-shrink-0 overflow-auto border-l border-border/60 bg-background">
            <BusinessPanel projectId={project.id} project={project} onRefresh={onRefreshFromPanel} refreshTrigger={businessPanelRefreshTrigger} businessPineapples={linksPineapples + tractionPineapples} />
          </aside>
        </div>

        {/* Mobile: tabs */}
        <div className="flex-1 flex flex-col md:hidden min-h-0 w-full overflow-hidden">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-11 sm:h-12 flex-shrink-0 bg-muted/50">
              <TabsTrigger value="chat" className="gap-1 text-xs sm:text-sm py-2 data-[state=active]:bg-background">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> Chat
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs sm:text-sm py-2 data-[state=active]:bg-background">
                Preview
              </TabsTrigger>
              <TabsTrigger value="business" className="gap-1 text-xs sm:text-sm py-2 data-[state=active]:bg-background">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> Business
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden">
              <ChatPanel projectId={project.id} onUpdate={onChatUpdate} chatPineapples={chatPineapples} userAvatarUrl={userAvatarUrl} />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden">
              <UIPreview url={project.url} screenshotUrl={project.screenshot_url} projectId={project.id} />
            </TabsContent>
            <TabsContent value="business" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
              <BusinessPanel projectId={project.id} project={project} onRefresh={onRefreshFromPanel} refreshTrigger={businessPanelRefreshTrigger} businessPineapples={linksPineapples + tractionPineapples} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ListListingDialog
        open={listDialogOpen}
        onOpenChange={(open) => {
          setListDialogOpen(open);
          if (!open) setOfferPrefill(null);
        }}
        project={project}
        onSuccess={refreshProject}
        initialOffer={offerPrefill}
      />
      <GetOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        projectId={project.id}
        onListClick={(offer) => {
          setOfferPrefill(offer);
          setOfferDialogOpen(false);
          setListDialogOpen(true);
        }}
      />
    </div>
  );
}
