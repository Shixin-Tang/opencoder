import {
  getDisplayName,
  hasMemoCache,
  isCompositeFiber,
  isHostFiber,
  isValidElement,
  MemoComponentTag,
  SimpleMemoComponentTag,
  SuspenseComponentTag,
  traverseFiber,
  type Fiber,
  type FiberRoot,
} from "bippy"
import { mapValues } from "lodash-es"

export interface InspectableElement {
  // element: HTMLElement
  depth: number
  name: string
  fiber: Fiber
}

export const getFirstStateNode = (fiber: Fiber): Element | null => {
  let current: Fiber | null = fiber
  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode
    }

    if (!current.child) {
      break
    }
    current = current.child
  }

  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode
    }

    if (!current.return) {
      break
    }
    current = current.return
  }
  return null
}

export const getParentCompositeFiber = (fiber: Fiber): readonly [Fiber, Fiber | null] | null => {
  let current: Fiber | null = fiber
  let prevHost: Fiber | null = null

  while (current) {
    if (isCompositeFiber(current)) return [current, prevHost] as const
    if (isHostFiber(current) && !prevHost) prevHost = current
    current = current.return
  }

  return null
}

export const getCompositeComponentFromElement = (associatedFiber: Fiber) => {
  const stateNode = getFirstStateNode(associatedFiber)
  if (!stateNode) return {}
  const parentCompositeFiberInfo = getParentCompositeFiber(associatedFiber)
  if (!parentCompositeFiberInfo) {
    return {}
  }
  const [parentCompositeFiber] = parentCompositeFiberInfo

  return {
    parentCompositeFiber,
  }
}

export const getInspectableElements = (fiberRoot: FiberRoot): Array<InspectableElement> => {
  const result: Array<InspectableElement> = []

  traverseFiber(fiberRoot.current, (fiber) => {
    result.push({
      depth: 0,
      name: getDisplayName(fiber.type) ?? "Unknown",
      fiber,
    })
  })

  return result
}

const fiberMap = new WeakMap<HTMLElement, Fiber>()

interface TreeNode {
  label: string
  title?: string
  // fiber: Fiber
  children?: TreeNode[]
  renderData?: {}
}

const LazyComponentTag = 24
const ProfilerTag = 12

interface WrapperBadge {
  type: "memo" | "forwardRef" | "lazy" | "suspense" | "profiler" | "strict"
  title: string
  compiler?: boolean
}

export interface ExtendedDisplayName {
  name: string | null
  wrappers: Array<string>
  wrapperTypes: Array<WrapperBadge>
}

export type ComponentTree = {
  name: string
  props: any
  state: any
  children: ComponentTree[]
}

export const buildComponentTree = (fiber: Fiber) => {
  const result: ComponentTree[] = []

  const traverse = (fiber: Fiber, parent?: ComponentTree) => {
    const displayName = getDisplayName(fiber.type) ?? "Unknown"
    const target = parent?.children ?? result
    const current = {
      name: displayName,
      props: mapValues(fiber.memoizedProps, (value) => {
        if (isValidElement(value) || typeof value === "object" || typeof value === "function") {
          return undefined
        }
        return value
      }),
      state: mapValues(fiber.memoizedState, (value) => {
        if (isValidElement(value) || typeof value === "object" || typeof value === "function") {
          return undefined
        }
        return value
      }),
      children: [],
    } as ComponentTree
    target.push(current)

    if (fiber.child) traverse(fiber.child, current)
    if (fiber.sibling) traverse(fiber.sibling, parent ?? current)
  }

  traverse(fiber)

  return result
}
