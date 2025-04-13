import { EventEmitter } from "node:events"
import { spy, stub } from "sinon"

export const createStdin = () => {
  const stdin = new EventEmitter() as unknown as NodeJS.ReadStream
  stdin.isTTY = true
  stdin.setRawMode = spy(() => stdin)
  stdin.setEncoding = () => stdin
  stdin.read = stub()
  stdin.unref = () => stdin
  stdin.ref = () => stdin
  return stdin
}

export const emitReadable = (stdin: NodeJS.ReadStream, chunk: string) => {
  const read = stdin.read as ReturnType<typeof stub>
  read.onCall(0).returns(chunk)
  read.onCall(1).returns(null)
  stdin.emit("readable")
  read.reset()
}
