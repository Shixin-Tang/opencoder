import React, { createContext, useContext, useMemo, type ReactNode } from "react"
import type { LanguageModelV1, Tool } from "ai"
import assert from "node:assert"

type AppContextType = {
  model: LanguageModelV1
  mcp: Record<string, Tool>[]
}

const AppContext = createContext<AppContextType>(null!)

export function AppProvider({
  children,
  model,
  mcp,
}: { children: React.ReactNode; model: LanguageModelV1; mcp: Record<string, Tool>[] }) {
  return (
    <AppContext.Provider value={useMemo(() => ({ model, mcp }), [model, mcp])}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  assert(ctx, "AppContext not found")
  return ctx
}
