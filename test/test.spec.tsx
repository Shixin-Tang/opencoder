import { Text } from "ink"
import { render } from "./testutil.js"
import React from "react"
import { describe, expect, it } from "vitest"
import { App } from "../src/counter.js"

describe("test", () => {
  it("should be true", async () => {
    const { lastFrame, rerender } = render(<App />)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(lastFrame()).toMatchInlineSnapshot(`
      "Hello
      6 tests passed
      Hello1

      This is markdown printed in the terminal
      import React, { startTransition, Suspense, use, useEffect, useMemo, useState } from "react"
      import { render, Text } from "ink"
      import { applyMarkdown } from "./lib/markdown.js"
      import dedent from "dedent"
      const x = 1"
    `)
  })
})
