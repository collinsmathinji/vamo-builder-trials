"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

export function ToasterWithTheme() {
  const { resolvedDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedDark ? "dark" : "light"}
    />
  );
}
