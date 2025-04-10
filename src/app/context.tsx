import React, { createContext, useContext, useMemo, type ReactNode } from "react"
import type { LanguageModelV1 } from "ai"
import assert from "node:assert"

type AppContextType = {
  model: LanguageModelV1
}

const AppContext = createContext<AppContextType>(null!)

export function AppProvider({
  children,
  model,
}: { children: React.ReactNode; model: LanguageModelV1 }) {
  return (
    <AppContext.Provider value={useMemo(() => ({ model }), [model])}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  assert(ctx, "AppContext not found")
  return ctx
}
