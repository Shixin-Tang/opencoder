import { QueryClient } from "@tanstack/react-query"
import { onCommitFiberRoot, traverseProps, traverseState, type FiberRoot } from "bippy"
import { createStore } from "jotai"
import { assert, expect, test, vi } from "vitest"
import type { AppContextType } from "../src/app/context.js"
import { buildComponentTree } from "./utils/debugger.js"
import { waitNextRender } from "./utils/render.js"
import { createAppTestWrapper } from "./utils/wrapper"
import { simulateReadableStream } from "ai"
import { convertArrayToReadableStream, MockLanguageModelV1 } from "ai/test"
import { queryComponentTree } from "./utils/query"
import { delay } from "./utils/delay"

function createMockModel() {
  return new MockLanguageModelV1({
    doStream: async () => ({
      stream: convertArrayToReadableStream([
        { type: "text-delta", textDelta: "Hello" },
        { type: "text-delta", textDelta: ", " },
        { type: "text-delta", textDelta: `world!` },
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ]),
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
  expect(stdout.get()).toMatchSnapshot("simple chat initial")

  stdin.emit("input", "hello world")
  await waitNextRender()
  stdin.emit("input", "\r")
  const states: { next: unknown; prev: unknown }[] = []
  await waitNextRender()
  await vi.waitFor(
    () => {
      const tree = buildComponentTree(fiber!.current.child)
      if (queryComponentTree(tree, "Spinner")) {
        throw new Error("Spinner is still in the tree")
      }
    },
    { interval: 10 },
  )

  expect(stdout.get()).toMatchSnapshot("simple chat")

  instance.unmount()
})
