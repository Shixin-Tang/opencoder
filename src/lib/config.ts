import type { Config } from "@/lib.js"
import { env } from "@/lib/env.js"
import { resolve } from "node:path"
import { createJiti } from "jiti"
// import { loadConfig } from "unconfig"

// const { config, sources } = await loadConfig<Config>({
//   sources: [
//     // load from `my.config.xx`
//     {
//       files: "coder.config",
//       // default extensions
//       extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "jsx", "tsx", "json", ""],
//     },
//     // load `my` field in `package.json` if no above config files found
//     {
//       files: "package.json",
//       extensions: [],
//       rewrite(config: any) {
//         return config?.coder
//       },
//     },
//   ],
//   merge: false,
//   defaults: {},
// })

// export { config }

const jiti = createJiti(import.meta.url, {
  interopDefault: true,
  // fsCache: false,
  // moduleCache: false,
})

const loadConfig = (path: string) => {
  return jiti
    .import<{ default: Config }>(resolve(env.cwd, path))
    .then((e) => e.default)
    .catch((e) => {
      return false
    })
}

export const config = ((await loadConfig(`${env.cwd}/coder.config.ts`)) ||
  (await loadConfig(`${env.cwd}/coder.config.js`)) ||
  (await loadConfig(`${env.cwd}/coder.config.tsx`)) ||
  {}) as Config
