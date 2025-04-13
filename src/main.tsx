import { QueryClientProvider } from "@tanstack/react-query"
import { render, Text } from "ink"
import type { Instance } from "ink"
import { join } from "node:path"
import { config } from "@/lib/config.js"
import { env } from "@/lib/env.js"
import { ensureGitIgnore, initConfig } from "@/lib/init.js"
import { queryClient } from "@/lib/query.js"
import { anthropic } from "@ai-sdk/anthropic"
import boxen from "boxen"
import chalk from "chalk"
import dotenv from "dotenv"
import { createStore, Provider } from "jotai"
import pkg from "../package.json" with { type: "json" }
import { App } from "./app.js"
import { AppProvider } from "./app/context.js"
import "source-map-support/register"
import React from "react"

dotenv.config()


/* class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  // eslint-disable-next-line node/handle-callback-err
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return <Text>Bad request...</Text>
    }
    return this.props.children
  }
} */

// FIXME
// if (import.meta.hot) {
//   import.meta.hot.accept(["./app.js"], () => {
//     setTimeout(() => {
//       console.clear()
//     }, 0)
//   })
// }

ensureGitIgnore()

if (process.argv.includes("init")) {
  await initConfig()

  process.exit(0)
}

if (import.meta.env.PROD) {
  console.log(
    boxen(
      `Welcome to OpenCoder@${pkg.version}
  Model: ${chalk.green(config.model?.modelId || "claude-3-5-sonnet-20241022")}
  Working directory: ${chalk.green(env.cwd)}`,
      {
        padding: 1,
        borderColor: "green",
        borderStyle: "round",
      },
    ),
  )
}
const store = createStore()
const app = render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AppProvider
        {...config}
        mcp={await Promise.all(config.mcp || [])}
        customTools={config.customTools || {}}
      >
        <App />
      </AppProvider>
    </QueryClientProvider>
  </Provider>,
  { exitOnCtrlC: false },
)

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var app: Instance
}

globalThis.app = app
