import { QueryClient } from "@tanstack/react-query"
import { onCommitFiberRoot, traverseProps, type FiberRoot } from "bippy"
import { createStore } from "jotai"
import { assert, expect, test, vi } from "vitest"
import type { AppContextType } from "../src/app/context.js"
import { buildComponentTree } from "./utils/debugger.js"
import { waitNextRender } from "./utils/render.js"
import { createAppTestWrapper } from "./utils/wrapper"
import { simulateReadableStream } from "ai"
import { MockLanguageModelV1 } from "ai/test"
import { queryComponentTree } from "./utils/query"
import { delay } from "./utils/delay"

function createMockModel() {
  return new MockLanguageModelV1({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-delta", textDelta: "Hello" },
          { type: "text-delta", textDelta: ", " },
          { type: "text-delta", textDelta: `world!` },
          {
            type: "finish",
            finishReason: "stop",
            logprobs: undefined,
            usage: { completionTokens: 10, promptTokens: 3 },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  })
}

test("simple chat", async () => {
  let fiber: FiberRoot | undefined
  onCommitFiberRoot((root) => {
    fiber = root
  })
  const store = createStore()
  const queryClient = new QueryClient()
  const config = {
    model: createMockModel(),
    mcp: [],
  } satisfies AppContextType
  const { instance, stdin, stdout } = await createAppTestWrapper({ config, store, queryClient })

  await waitNextRender()
  expect(fiber).toBeDefined()
  assert(stdin)
  const tree = buildComponentTree(fiber!.current.child)
  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ >                                                                                                │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                     alt + ⏎ for newline ·0 tokens"
  `)

  stdin.emit("input", "hello world")
  await waitNextRender()
  stdin.emit("input", "\r")
  await vi.waitFor(() => {
    return queryComponentTree(tree, "MessageChatMessage")
  })
  await waitNextRender()
  await delay(1000)

  expect(stdout.get()).toMatchInlineSnapshot(`
    "> hello world
    ▼
     ╭─────────────────────────────────────────────────────────────────────────────────────────────────╮
     │Hello, world!                                                                                    │
     ╰─────────────────────────────────────────────────────────────────────────────────────────────────╯

    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ >                                                                                                │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                    alt + ⏎ for newline ·13 tokens"
  `)

  instance.unmount()
})
