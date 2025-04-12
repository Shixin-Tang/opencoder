import globalCacheDir from "global-cache-dir"
import type { LanguageModel, Tool, EmbeddingModel } from "ai"
import { createStorage } from "unstorage"
import path from "node:path"
import fsLiteDriver from "unstorage/drivers/fs-lite"

export { anthropic, createAnthropic } from "@ai-sdk/anthropic"
export { createGoogleGenerativeAI, google } from "@ai-sdk/google"
export { createOpenAI, openai } from "@ai-sdk/openai"
export { z } from "zod"

const cacheDir = await globalCacheDir("OpenCoder")
export const storage = createStorage({
  driver: (fsLiteDriver as any)({ base: path.join(cacheDir, "general-cache") }),
})

export type Config = {
  model?: LanguageModel
  mcp?: Promise<Record<string, Tool>>[]
  customTools?: Record<string, Tool<any, any>>
  experimental?: {
    codeBaseIndex?: {
      enabled?: boolean
      model?: EmbeddingModel<any>
    }
    /**
     * glob pattern to auto load files to prompt, eg: ['src\/**\/*.ts', 'src\/**\/*.tsx']
     * @default true
     */
    autoLoad?: true | string[]
    // auto import mcp tools from .vscode/mcp.json or .cursorrules/mcp.json
    autoMCP?: boolean
    telemetry?: boolean
  }
}
