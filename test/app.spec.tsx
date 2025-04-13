import { QueryClient } from "@tanstack/react-query"
import ansiEscapes from "ansi-escapes"
import { onCommitFiberRoot, type FiberRoot } from "bippy"
import { useStdin } from "ink"
import { createStore } from "jotai"
import { EventEmitter } from "node:events"
import { setImmediate } from "node:timers/promises"
import React from "react"
import { assert, expect, test, vi } from "vitest"
import type { AppContextType } from "../src/app/context.js"
import { buildComponentTree } from "./utils/debugger.js"
import { delay } from "./utils/delay.js"
import { spawnOpenCoder } from "./utils/render.js"
import { AppTestWrapper, createAppTestWrapper } from "./utils/wrapper.js"

async function waitNextRender() {
  await setImmediate()
  await delay(10)
}

test("basic", async () => {
  let fiber: FiberRoot | undefined
  onCommitFiberRoot((root) => {
    fiber = root
  })
  const store = createStore()
  const queryClient = new QueryClient()
  const config = {
    mcp: [],
  } satisfies AppContextType
  const { instance, stdin, stdout } = await createAppTestWrapper({ config, store, queryClient })

  await vi.waitUntil(
    () => {
      if (!fiber) return false
      const tree = buildComponentTree(fiber!.current.child)
      return JSON.stringify(tree).includes("AutoUpdater")
    },
    { interval: 10 },
  )

  expect(fiber).toBeDefined()
  assert(stdin)
  const tree = buildComponentTree(fiber!.current.child)
  expect(JSON.stringify(tree)).toMatchInlineSnapshot(`"[{"name":"InternalApp","props":{"exitOnCtrlC":false},"state":{"isFocusEnabled":true},"children":[{"name":"InternalAppContext","props":{},"state":{},"children":[{"name":"InternalStdinContext","props":{},"state":{},"children":[{"name":"InternalStdoutContext","props":{},"state":{},"children":[{"name":"InternalStderrContext","props":{},"state":{},"children":[{"name":"InternalFocusContext","props":{},"state":{},"children":[{"name":"App2","props":{},"state":{},"children":[{"name":"AppTestWrapper","props":{},"state":{},"children":[{"name":"Provider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"QueryClientProvider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"AppProvider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"App","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","gap":2,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{},"state":{},"children":[]},{"name":"Chat","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","gap":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Unknown","props":{"input":"","isDisabled":false,"isLoading":false},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"alignItems":"flex-start","justifyContent":"flex-start","borderColor":"#888","borderDimColor":true,"borderStyle":"round","marginTop":1,"width":"100%","flexDirection":"row","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"alignItems":"center","alignSelf":"flex-start","flexWrap":"nowrap","justifyContent":"center","width":3,"flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{"children":">"},"state":{},"children":[{"name":"ink-text","props":{"children":">"},"state":{},"children":[{"name":"Unknown","props":{"0":">"},"state":{},"children":[]}]}]}]}]},{"name":"Box","props":{"paddingRight":1,"flexWrap":"nowrap","flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"TextInput","props":{"multiline":true,"value":"","placeholder":"","columns":74,"isDimmed":false,"disableCursorMovementForUpDownKeys":false,"cursorOffset":0},"state":{},"children":[{"name":"Text","props":{"wrap":"truncate-end","dimColor":false,"children":" "},"state":{},"children":[{"name":"ink-text","props":{"children":" "},"state":{},"children":[{"name":"Unknown","props":{"0":" "},"state":{},"children":[]}]}]}]}]}]}]}]},{"name":"Box","props":{"flexDirection":"row","justifyContent":"space-between","paddingX":2,"paddingY":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"justifyContent":"flex-start","gap":1,"flexDirection":"row","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"Text","props":{"dimColor":true,"children":"/ for commands"},"state":{},"children":[{"name":"ink-text","props":{"children":"/ for commands"},"state":{},"children":[{"name":"Unknown","props":{"0":"/","1":" ","2":"f","3":"o","4":"r","5":" ","6":"c","7":"o","8":"m","9":"m","10":"a","11":"n","12":"d","13":"s"},"state":{},"children":[]}]}]}]}]}]},{"name":"Box","props":{"justifyContent":"flex-end","gap":1,"flexDirection":"row","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{"dimColor":true,"children":"alt + ⏎ for newline"},"state":{},"children":[{"name":"ink-text","props":{"children":"alt + ⏎ for newline"},"state":{},"children":[{"name":"Unknown","props":{"0":"a","1":"l","2":"t","3":" ","4":"+","5":" ","6":"⏎","7":" ","8":"f","9":"o","10":"r","11":" ","12":"n","13":"e","14":"w","15":"l","16":"i","17":"n","18":"e"},"state":{},"children":[]}]}]},{"name":"Text","props":{"dimColor":true},"state":{},"children":[{"name":"ink-text","props":{},"state":{},"children":[{"name":"Unknown","props":{"0":"·"},"state":{},"children":[]},{"name":"Unknown","props":{"0":"0","1":" ","2":"t","3":"o","4":"k","5":"e","6":"n","7":"s"},"state":{},"children":[]}]}]}]}]}]}]},{"name":"Unknown","props":{},"state":{},"children":[{"name":"Unknown","props":{"mode":"visible"},"state":{},"children":[{"name":"AutoUpdater","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"row","paddingX":2,"paddingY":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]"`)
  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ >                                                                                                │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                     alt + ⏎ for newline ·0 tokens"
  `)

  stdin.emit("input", "hello world")
  await waitNextRender()

  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ > hello world                                                                                    │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                     alt + ⏎ for newline ·0 tokens"
  `)

  stdin.emit("input", ansiEscapes.cursorBackward(2))
  await waitNextRender()

  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ > hello world                                                                                    │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                     alt + ⏎ for newline ·0 tokens"
  `)

  instance.unmount()
})

test("commands", async () => {
  let fiber: FiberRoot | undefined
  onCommitFiberRoot((root) => {
    fiber = root
  })
  const store = createStore()
  const queryClient = new QueryClient()
  const config = {
    mcp: [],
  } satisfies AppContextType
  const { instance, stdin, stdout } = await createAppTestWrapper({ config, store, queryClient })

  await vi.waitUntil(
    () => {
      if (!fiber) return false
      const tree = buildComponentTree(fiber!.current.child)
      return JSON.stringify(tree).includes("AutoUpdater")
    },
    { interval: 10 },
  )

  expect(fiber).toBeDefined()
  assert(stdin)
  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ >                                                                                                │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      / for commands                                                     alt + ⏎ for newline ·0 tokens"
  `)

  stdin.emit("input", "/")
  await waitNextRender()
  const tree = buildComponentTree(fiber!.current.child)
  expect(JSON.stringify(tree)).toMatchInlineSnapshot(`"[{"name":"InternalApp","props":{"exitOnCtrlC":false},"state":{"isFocusEnabled":true},"children":[{"name":"InternalAppContext","props":{},"state":{},"children":[{"name":"InternalStdinContext","props":{},"state":{},"children":[{"name":"InternalStdoutContext","props":{},"state":{},"children":[{"name":"InternalStderrContext","props":{},"state":{},"children":[{"name":"InternalFocusContext","props":{},"state":{},"children":[{"name":"App2","props":{},"state":{},"children":[{"name":"AppTestWrapper","props":{},"state":{},"children":[{"name":"Provider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"QueryClientProvider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"AppProvider","props":{},"state":{},"children":[{"name":"Unknown","props":{},"state":{},"children":[{"name":"App","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","gap":2,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{},"state":{},"children":[]},{"name":"Chat","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","gap":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Unknown","props":{"input":"/","isDisabled":false,"isLoading":false},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"alignItems":"flex-start","justifyContent":"flex-start","borderColor":"#888","borderDimColor":true,"borderStyle":"round","marginTop":1,"width":"100%","flexDirection":"row","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"alignItems":"center","alignSelf":"flex-start","flexWrap":"nowrap","justifyContent":"center","width":3,"flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{"children":">"},"state":{},"children":[{"name":"ink-text","props":{"children":">"},"state":{},"children":[{"name":"Unknown","props":{"0":">"},"state":{},"children":[]}]}]}]}]},{"name":"Box","props":{"paddingRight":1,"flexWrap":"nowrap","flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"TextInput","props":{"multiline":true,"value":"/","placeholder":"","columns":74,"isDimmed":false,"disableCursorMovementForUpDownKeys":true,"cursorOffset":1},"state":{},"children":[{"name":"Text","props":{"wrap":"truncate-end","dimColor":false,"children":"/ "},"state":{},"children":[{"name":"ink-text","props":{"children":"/ "},"state":{},"children":[{"name":"Unknown","props":{"0":"/","1":" "},"state":{},"children":[]}]}]}]}]}]}]}]},{"name":"Box","props":{"flexDirection":"row","justifyContent":"space-between","paddingX":2,"paddingY":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"column","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"row","flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Box","props":{"width":9,"flexWrap":"nowrap","flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{"color":"#b1b9f9","dimColor":false},"state":{},"children":[{"name":"ink-text","props":{},"state":{},"children":[{"name":"Unknown","props":{"0":"/"},"state":{},"children":[]},{"name":"Unknown","props":{"0":"s","1":"y","2":"n","3":"c"},"state":{},"children":[]}]}]}]}]},{"name":"Box","props":{"width":67,"paddingLeft":0,"flexWrap":"nowrap","flexDirection":"row","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[{"name":"Text","props":{"color":"#b1b9f9","dimColor":false,"wrap":"wrap"},"state":{},"children":[{"name":"ink-text","props":{},"state":{},"children":[{"name":"Text","props":{"dimColor":false},"state":{},"children":[{"name":"ink-text","props":{},"state":{},"children":[{"name":"Unknown","props":{"0":"S","1":"y","2":"n","3":"c","4":" ","5":"c","6":"o","7":"d","8":"e","9":"b","10":"a","11":"s","12":"e","13":" ","14":"t","15":"o","16":" ","17":"t","18":"h","19":"e","20":" ","21":"c","22":"o","23":"d","24":"e","25":"b","26":"a","27":"s","28":"e","29":" ","30":"i","31":"n","32":"d","33":"e","34":"x","35":",","36":" ","37":"s","38":"t","39":"o","40":"r","41":"e","42":"d","43":" ","44":"i","45":"n","46":" ","47":".","48":"c","49":"o","50":"d","51":"e","52":"r","53":"/","54":"e","55":"m","56":"b","57":"e","58":"d","59":"d","60":"i","61":"n","62":"g","63":"s"},"state":{},"children":[]}]}]}]}]}]}]}]}]}]}]}]}]},{"name":"Unknown","props":{},"state":{},"children":[{"name":"Unknown","props":{"mode":"visible"},"state":{},"children":[{"name":"AutoUpdater","props":{},"state":{},"children":[{"name":"Box","props":{"flexDirection":"row","paddingX":2,"paddingY":0,"flexWrap":"nowrap","flexGrow":0,"flexShrink":1},"state":{},"children":[{"name":"ink-box","props":{},"state":{},"children":[]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]"`)

  expect(stdout.get()).toMatchInlineSnapshot(`
    "
    ╭──────────────────────────────────────────────────────────────────────────────────────────────────╮
    │ > /                                                                                              │
    ╰──────────────────────────────────────────────────────────────────────────────────────────────────╯
      /sync    Sync codebase to the codebase index, stored in .coder/embeddings"
  `)

  instance.unmount()
})
