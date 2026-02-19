"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const WORK_READY_PHRASES = [
  "ready to ship",
  "let's build something",
  "focused and ready",
  "users are signing up",
  "time to build",
  "just shipped the new feature",
];

const LATE_NIGHT_PHRASES = [
  "just shipped the new feature",
  "2am but almost done...",
  "one more commit then sleep",
  "users are signing up",
];

const TYPING_SPEED = 60; // ms per character
const PAUSE_AT_END = 1200;
const PAUSE_AT_START = 400;

export function FounderTyping({ variant = "standalone" }: { variant?: "standalone" | "bubble" }) {
  const { resolvedDark } = useTheme();
  const phrases = resolvedDark ? LATE_NIGHT_PHRASES : WORK_READY_PHRASES;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep index in bounds when theme switches; reset typing state when theme changes
  const safeIndex = phraseIndex % phrases.length;
  const currentPhrase = phrases[safeIndex];

  useEffect(() => {
    setDisplayed("");
    setIsDeleting(false);
    setPhraseIndex(0);
  }, [resolvedDark]);

  useEffect(() => {
    const current = currentPhrase;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayed.length < current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length + 1));
      }, TYPING_SPEED);
    } else if (!isDeleting && displayed.length === current.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, PAUSE_AT_END);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length - 1));
      }, TYPING_SPEED * 0.7);
    } else if (isDeleting && displayed.length === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, PAUSE_AT_START);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIndex, currentPhrase, phrases.length]);

  const isBubble = variant === "bubble";

  return (
    <div
      className={
        isBubble
          ? "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg backdrop-blur-sm text-card-foreground"
          : "inline-flex items-center justify-center rounded-full bg-secondary/60 px-4 py-2 text-xs sm:text-sm font-body text-muted-foreground mb-5 sm:mb-6 border border-border/60 shadow-sm backdrop-blur"
      }
    >
      {!isBubble && (
        <span className="mr-2 inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold">
          •
        </span>
      )}
      <span
        className={
          isBubble
            ? "whitespace-pre text-sm font-medium"
            : "whitespace-pre text-[0.8rem] sm:text-sm md:text-base"
        }
      >
        {displayed}
        <span className="ml-0.5 inline-block h-[1.1em] w-[1px] bg-current opacity-70 animate-pulse align-middle" />
      </span>
    </div>
  );
}

export type FounderTypingVariant = "standalone" | "bubble";

