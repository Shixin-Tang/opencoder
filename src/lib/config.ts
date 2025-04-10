import type { Config } from "@/lib.js"
import { loadConfig } from "unconfig"

const { config, sources } = await loadConfig<Config>({
  sources: [
    // load from `my.config.xx`
    {
      files: "coder.config",
      // default extensions
      extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
    },
    // load `my` field in `package.json` if no above config files found
    {
      files: "package.json",
      extensions: [],
      rewrite(config: any) {
        return config?.coder
      },
    },
  ],
  merge: false,
  defaults: {},
})

export { config }
