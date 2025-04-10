import { enableCompileCache, flushCompileCache } from "node:module"
import globalCacheDir from "global-cache-dir"
import path from "node:path"
import "source-map-support/register"

const cacheDir = await globalCacheDir("OpenCoder")
enableCompileCache(path.join(cacheDir, "v8-cache"))

if (process.argv.includes("--empty-cache")) {
  flushCompileCache()
}

globalThis.window = {} as any
globalThis.stop = () => {}
if (import.meta.env.DEV) {
  import("./lib/devtools/devtool.js").then(() => {
    import("./main.js")
  })
} else {
  import("./main.js")
}
