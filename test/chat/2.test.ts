import { tool } from "ai"
import { convertArrayToReadableStream, MockLanguageModelV1 } from "ai/test"

import { z } from "zod"
import { buildComponentTree } from "../utils/debugger.js"
import { queryComponentTree } from "../utils/query.js"
import { waitNextRender } from "../utils/render.js"
import { setupTestEnvironment } from "./util.js"

test("chat interaction with a successful tool call (e.g., file edit)", async () => {
  // 1. Setup: Mock model for tool request, mock MCP tool, then mock final response
  const mockEditFileTool = vi
    .fn()
    .mockResolvedValue({ success: true, message: "File edited successfully." })
  const tools = {
    edit_file: tool({
      execute: mockEditFileTool,
      description: "Edits a file",
      parameters: z.object({
        path: z.string(),
        content: z.string(),
      }),
    }),
  }

  const mockModel = new MockLanguageModelV1({})
  const doStreamMock = vi.fn()
  mockModel.doStream = doStreamMock

  // First call: Request the tool
  doStreamMock.mockImplementationOnce(async () => ({
    stream: convertArrayToReadableStream([
      {
        type: "tool-call",
        toolCallId: "tool_123",
        toolName: "edit_file",
        args: JSON.stringify({ path: "test.txt", content: "new content" }),
      },
      {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 10, completionTokens: 5 },
      },
    ]),
    rawCall: { rawPrompt: null, rawSettings: {} },
    type: "finish",
    finishReason: "tool-calls",
    usage: { promptTokens: 10, completionTokens: 5 },
  }))

  // Second call: Respond after successful tool execution
  doStreamMock.mockImplementationOnce(async ({ prompt }) => {
    // Basic check: Verify the tool result is in the prompt
    const promptMessages = prompt
    const lastMessage = promptMessages[promptMessages.length - 1]
    expect(lastMessage.role).toBe("tool")
    expect(lastMessage.content).toEqual(
      JSON.stringify({ success: true, message: "File edited successfully." }),
    )
    expect(lastMessage.toolCallId).toBe("tool_123")

    return {
      stream: convertArrayToReadableStream([
        { type: "text-delta", textDelta: "OK, " },
        { type: "text-delta", textDelta: "I've edited the file." },
        { type: "finish", finishReason: "stop", usage: { promptTokens: 25, completionTokens: 8 } },
      ]),
      rawCall: { rawPrompt: JSON.stringify(prompt), rawSettings: {} },
      type: "finish",
      finishReason: "stop",
      usage: { promptTokens: 25, completionTokens: 8 },
    }
  })

  const { instance, stdin, stdout, fiber, queryClient, store, config } = await setupTestEnvironment(
    {
      model: mockModel,
      customTools: tools,
    },
  )

  expect(stdout.get()).toMatchSnapshot("mcp tool - initial")
  assert(stdin)

  // 2. Simulate user input
  stdin.emit("input", "Please edit test.txt")
  await waitNextRender()
  stdin.emit("input", "\r")
  await waitNextRender()

  // 3. Wait for MCP UI & Verify
  // Use waitFor as the UI update might take a moment after the stream finishes
  await vi.waitFor(
    () => {
      expect(stdout.get()).toContain("Custom tool: edit_file")
      expect(stdout.get()).toContain("File edited successfully")
    },
    { timeout: 500 },
  )
  expect(stdout.get()).toMatchSnapshot("mcp tool - confirmation prompt")

  // 4. Simulate user approval (assuming 'y' or Enter confirms)
  stdin.emit("input", "\r")
  await waitNextRender()
  await waitNextRender()
  await waitNextRender()

  // 5. Wait for final response rendering
  await vi.waitFor(
    () => {
      const tree = buildComponentTree(fiber!.current.child)
      if (queryComponentTree(tree, "Spinner")) {
        throw new Error("Spinner/Loading indicator still present")
      }
    },
    { timeout: 1000 },
  )

  // 6. Verify tool was called
  expect(mockEditFileTool).toHaveBeenCalledTimes(1)
  expect(mockEditFileTool.mock.calls[0][0]).toEqual({ path: "test.txt", content: "new content" })

  // 7. Verify model received tool result (checked inside mock implementation)
  expect(doStreamMock).toHaveBeenCalledTimes(2)

  // 8. Final state check
  expect(stdout.get()).toMatchSnapshot("mcp tool - final state")

  instance.unmount()
})
