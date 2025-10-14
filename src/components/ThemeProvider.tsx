"use client"

import * as React from "react"
// --- THE FIX: Import ThemeProviderProps directly from "next-themes" ---
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}