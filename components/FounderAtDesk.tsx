"use client";

import dynamic from "next/dynamic";
import { FounderTyping } from "./FounderTyping";
import { useTheme } from "@/components/ThemeProvider";

const VoxelFounderScene = dynamic(
  () => import("./VoxelFounderScene").then((m) => ({ default: m.VoxelFounderScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full min-h-[320px] items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading scene...</span>
        </div>
      </div>
    ),
  }
);

export function FounderAtDesk() {
  const { resolvedDark } = useTheme();
  return (
    <div className="relative w-full aspect-[4/3] overflow-visible">
      {/* 3D scene: theme-aware walls/lighting — light in light mode, dark in dark mode */}
      <VoxelFounderScene isLightMode={!resolvedDark} />
      {/* Typing bubble — part of the page, attached above the scene */}
      <div className="pointer-events-none absolute left-1/2 top-[12%] z-10 -translate-x-1/2">
        <FounderTyping variant="bubble" />
      </div>
    </div>
  );
}
