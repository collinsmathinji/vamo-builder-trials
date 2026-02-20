"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  role: string;
  content: string;
  tag: string | null;
  pineapples_earned: number;
  created_at: string;
};

const TAG_OPTIONS = [
  { value: "none", label: "No tag" },
  { value: "feature", label: "Feature" },
  { value: "customer", label: "Customer" },
  { value: "revenue", label: "Revenue" },
  { value: "ask", label: "Ask" },
];

function tagVariant(tag: string | null): "feature" | "customer" | "revenue" | "ask" | "general" {
  if (!tag || tag === "none") return "general";
  if (tag === "feature") return "feature";
  if (tag === "customer") return "customer";
  if (tag === "revenue") return "revenue";
  if (tag === "ask") return "ask";
  return "general";
}

const VAMO_LOGO = "/vamo-logo.png";

export function ChatPanel({
  projectId,
  onUpdate,
  chatPineapples = 0,
  userAvatarUrl = null,
}: {
  projectId: string;
  onUpdate: () => void;
  /** Pineapples earned from chats (prompts) in this project */
  chatPineapples?: number;
  /** User profile image URL (e.g. from Google/Supabase) for chat avatar */
  userAvatarUrl?: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tag, setTag] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/chat/messages?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
      setInitialLoad(false);
    }
    load();
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const toSend = (text ?? input.trim()).trim();
    if (!toSend || loading) return;

    const savedInput = input;
    if (!text) setInput("");
    setLoading(true);
    let earned = 0;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: toSend,
          tag: tag && tag !== "none" ? tag : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send message.");
        if (!text) setInput(savedInput);
        setLoading(false);
        return;
      }

      if (data.assistantMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.userMessage.id,
            role: "user",
            content: toSend,
            tag: tag && tag !== "none" ? tag : null,
            pineapples_earned: 0,
            created_at: new Date().toISOString(),
          },
          {
            id: data.assistantMessage.id,
            role: "assistant",
            content: data.assistantMessage.content,
            tag: data.assistantMessage.tag ?? null,
            pineapples_earned: data.pineapplesEarned ?? 0,
            created_at: data.assistantMessage.created_at,
          },
        ]);
        earned = data.pineapplesEarned ?? 0;
        trackEvent("prompt_sent", { projectId, messageId: data.assistantMessage.id });
        if (earned > 0) {
          trackEvent("reward_earned", { projectId, amount: earned, eventType: "prompt" });
        }
      }
      onUpdate();
      if (earned > 0) {
        toast.success(`+${earned} 🍍`);
        // Pineapple indicator is also shown inline in the message below
      }
    } catch {
      toast.error("Something went wrong.");
      if (!text) setInput(savedInput);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-sm">Builder Chat</h2>
          <span className="text-sm flex items-center gap-1" title="Pineapples earned from chats">
            <span aria-hidden>🍍</span>
            <span className="font-medium">{chatPineapples}</span>
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {initialLoad ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="flex-1 h-16 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">
            Share an update or ask a question. Vamo will respond, extract intent, and update the business panel.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  {m.role === "user" ? (
                    <>
                      {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt="You" />}
                      <AvatarFallback className="text-xs bg-muted">U</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={VAMO_LOGO} alt="Vamo" />
                      <AvatarFallback className="text-xs bg-muted">V</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.tag && m.tag !== "general" && (
                      <Badge variant={tagVariant(m.tag)} className="text-xs">
                        {m.tag}
                      </Badge>
                    )}
                    {m.pineapples_earned > 0 && (
                      <span className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                        <span>🍍</span>
                        <span>+{m.pineapples_earned}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{m.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(m.created_at)}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={VAMO_LOGO} alt="Vamo" />
                  <AvatarFallback className="text-xs bg-muted">V</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </span>
                    <span>Vamo is typing…</span>
                  </div>
                  <Skeleton className="h-12 w-full max-w-[280px] rounded-lg" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border/60 flex-shrink-0 space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Share an update or ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            className="min-h-[60px] max-h-[120px] resize-y flex-1 text-sm"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
