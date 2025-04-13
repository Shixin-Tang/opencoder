import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import dts from "vite-plugin-dts"
import babel from "vite-plugin-babel"
import path from "node:path"

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    "process.env.DEV": JSON.stringify("true"),
  },
  test: {
    include: ["test/*.spec.tsx", "test/utils/*.spec.ts"],
    setupFiles: "./test/setup.ts",
    isolate: false,
    pool: "forks",
    poolOptions: {
      forks: {
        // To generate a single profile
        singleFork: true,
      },
    },
  },
  plugins: [
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
    babel({
      include: /\.tsx$/,
      babelConfig: {
        plugins: [
          [path.resolve(__dirname, "node_modules/babel-plugin-react-compiler"), {}],
          process.env.NODE_ENV === "development" && [
            "@locator/babel-jsx/dist",
            {
              env: "development",
            },
          ],
          process.env.NODE_ENV === "development" && ["@hh.ru/babel-plugin-react-displayname"],
        ].filter((v) => !!v),
      },
    }),
  ],
})
