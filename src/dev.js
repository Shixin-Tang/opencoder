#!/usr/bin/env node
import { createServer, loadConfigFromFile, version as viteVersion } from "vite"
import { ViteNodeRunner } from "vite-node/client"
import { ViteNodeServer } from "vite-node/server"
import { installSourcemapsSupport } from "vite-node/source-map"
import path from "path"
import assert from "assert"
import { fileURLToPath } from "url"

process.env.NODE_ENV = "development"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config = await loadConfigFromFile(
  { command: "serve" },
  path.resolve(__dirname, "..", "vite.config.ts"),
)
assert(config, "Vite config not found")

const server = await createServer(config.config)

// create vite-node server
const node = new ViteNodeServer(server)

// fixes stacktraces in Errors
installSourcemapsSupport({
  getSourceMap: (source) => node.getSourceMap(source),
})

// create vite-node runner
const runner = new ViteNodeRunner({
  root: server.config.root,
  base: server.config.base,
  fetchModule(id) {
    return node.fetchModule(id)
  },
  resolveId(id, importer) {
    return node.resolveId(id, importer)
  },
})

await runner.executeFile(path.resolve(__dirname, "index.ts"))

await server.close()
