import { render } from "ink"
import createStdout from "./create-stdout.js"
import delay from "delay"
import { createStdin } from "./create-stdin.js"
import { setImmediate } from "node:timers/promises"

export async function waitNextRender() {
  await setImmediate()
  await delay(10)
}

export const spawnOpenCoder = async (node: React.ReactElement, options?: { columns?: number }) => {
  const stdout = createStdout(options?.columns ?? 100)
  const stdin = createStdin()

  const instance = render(node, {
    stdout,
    debug: true,
    exitOnCtrlC: false,
    patchConsole: false,
    stdin,
  })

  return { instance, stdout, stdin }
}
