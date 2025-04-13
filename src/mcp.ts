import { experimental_createMCPClient } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import { DuckDuckGoClient } from "@agentic/duck-duck-go"
import { createAISDKTools } from "@agentic/ai-sdk"


export async function playwright({
  executablePath,
  runner,
}: { executablePath?: string; runner?: "npx" | "bunx" } = {}) {
  const getChromeExecutablePath = () => {
    if (process.platform === "win32") {
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    }
    if (process.platform === "darwin") {
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
    return "/usr/bin/google-chrome"
  }

  const transport = new Experimental_StdioMCPTransport({
    command: runner === "npx" ? "npx" : "bunx",
    args: [
      "@playwright/mcp@latest",
      "--executable-path",
      executablePath || getChromeExecutablePath(),
    ],
  })
  const client = await experimental_createMCPClient({
    name: "playwright",
    transport,
  })
  return await client.tools()
}

export async function webSearch({
  provider,
}: {
  provider?: "duckduckgo"
} = {}) {
  if (provider === "duckduckgo" || !provider) {
    const client = new DuckDuckGoClient()
    return createAISDKTools(client)
  }
  throw new Error(`Unsupported provider: ${provider}`)
}

export async function createMcp({
  name,
  command,
  args,
}: { name: string; command: string; args: string[] }) {
  const transport = new Experimental_StdioMCPTransport({
    command,
    args,
  })
  const client = await experimental_createMCPClient({
    name,
    transport,
  })
  return await client.tools()
}
