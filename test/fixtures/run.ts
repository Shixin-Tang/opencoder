import {
  instrument,
  isHostFiber,
  traverseRenderedFibers,
  isCompositeFiber,
  getDisplayName,
  traverseProps,
  traverseContexts,
  traverseState,
  secure,
  onCommitFiberRoot,
  getRDTHook,
  traverseFiber,
  getTimings,
  type Fiber,
  getLatestFiber,
} from "bippy"
import { buildComponentTree } from "../utils/debugger"
function safeStringify(value: unknown): string {
  const seen = new WeakSet()

  return JSON.stringify(value, (_key, value) => {
    if (typeof value === "function") {
      return "[Function]"
    }
    if (value instanceof Error) {
      return `[Error: ${value.message}]`
    }
    if (value instanceof RegExp) {
      return value.toString()
    }
    if (value instanceof Map) {
      return `Map(${value.size})`
    }
    if (value instanceof Set) {
      return `Set(${value.size})`
    }
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]"
      }
      seen.add(value)
    }
    return value
  })
}

onCommitFiberRoot((root) => {
  setTimeout(() => {
    const tree = buildComponentTree(root.current.child)
    console.log(safeStringify(tree))
    console.log("ok")
  }, 1000)
})

import("../../src")
