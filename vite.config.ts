import fs from "node:fs"
import path from "node:path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"
import babel from "vite-plugin-babel"

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.DEV": "'false'",
  },
  ssr: {
    noExternal: true,
    resolve: {
      // conditions: ["react-server"],
      // externalConditions: ["node"],
    },
  },
  resolve: {
    alias: {
      // "react/jsx-runtime": "react/jsx-runtime.js",
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      input: {
        cli: "./src/index.ts",
        lib: "./src/lib.ts",
        mcp: "./src/mcp.tsx",
      },
      external: [
        "ai",
        "@ai-sdk/google",
        "@ai-sdk/openai",
        "@ai-sdk/anthropic",
        "@vscode/ripgrep",
        "@lancedb/lancedb",
        "unconfig",
      ],
      output: {
        minifyInternalExports: false,
      },
      onwarn(warning, warn) {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          warning.code === "EVAL" ||
          warning.code === "SOURCEMAP_ERROR" ||
          warning.code === "UNUSED_EXTERNAL_IMPORT" ||
          warning.code === "INVALID_ANNOTATION" ||
          warning.code === "CIRCULAR_DEPENDENCY"
        ) {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
    dts({ tsconfigPath: path.resolve(__dirname, "tsconfig.json") }),
    // process.env.NODE_ENV === "production" &&
    babel({
      include: /\.tsx$/,
      babelConfig: {
        plugins: [[path.resolve(__dirname, "node_modules/babel-plugin-react-compiler"), {}]],
      },
    }),
    {
      name: "write-headers",
      closeBundle() {
        const cli = fs.readFileSync(path.resolve(__dirname, "dist/cli.js"), "utf-8")
        fs.writeFileSync(path.resolve(__dirname, "dist/cli.js"), `#!/usr/bin/env node\n${cli}`)
      },
    },
  ],
})
