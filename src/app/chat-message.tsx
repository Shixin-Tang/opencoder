import { applyMarkdown } from "@/lib/markdown.js"
import type { CoderTool } from "@/tools/ai.js"
import type { ToolModule } from "@/tools/tools.js"
import type { Tool, UIMessage } from "ai"
import figures from "figures"
import { Box, Text } from "ink"
import React from "react"
import { match } from "ts-pattern"

export const ChatMessage = React.memo(function ({
  message,
  streamingToolUIRef,
  tools,
}: {
  message: UIMessage
  streamingToolUIRef: React.RefObject<Record<string, React.ReactNode>>
  tools: Record<string, ToolModule>
}) {
  if (message.role === "user") {
    return (
      <Text key={message.id}>
        {">"} {message.content}
      </Text>
    )
  }
  if (message.role === "assistant") {
    return message.parts.map((part, partIndex) => {
      if (part.type === "tool-invocation") {
        const tool = tools[part.toolInvocation.toolName]
        if (tool) {
          const streaming = streamingToolUIRef.current[part.toolInvocation.toolCallId]
          const ui =
            part.toolInvocation.state === "partial-call"
              ? // prefer render over streaming during partial call
                (tool.tool.render?.(part.toolInvocation) ?? streaming)
              : // prefer streaming over render during result
                (streaming ?? tool.tool.render?.(part.toolInvocation))
          const title = tool.tool.renderTitle?.(part.toolInvocation)
          const icon = match(part.toolInvocation.toolName)
            .with("bash", () => <Text>$</Text>)
            .otherwise(() => <Text>{figures.triangleDown}</Text>)
          return (
            <Box key={`${message.id}-${partIndex}`} flexDirection="column" gap={0}>
              <Box flexDirection="row" gap={1}>
                {icon}
                <Text> {title}</Text>
              </Box>
              <Box marginLeft={1} borderStyle="round" flexDirection="column" gap={0}>
                {/* {part.toolInvocation.toolName === "write-file" ? <TestDiff /> : ui} */}
                {ui}
                {!streaming &&
                  !tool.tool.render &&
                  part.toolInvocation.state === "result" &&
                  typeof part.toolInvocation.result === "string" && (
                    <Box borderStyle="round" borderColor="gray">
                      <Text>
                        {typeof part.toolInvocation.result === "object"
                          ? JSON.stringify(part.toolInvocation.result)
                          : part.toolInvocation.result}
                      </Text>
                    </Box>
                  )}
              </Box>
            </Box>
          )
        }
      }
      if (part.type === "text" && part.text.trim() !== "") {
        return (
          <Box key={`${message.id}-${partIndex}`} flexDirection="column">
            <Text>{figures.triangleDown}</Text>
            <Box key={`${message.id}-${partIndex}`} marginLeft={1} borderStyle="round">
              <Text key={`${message.id}-${partIndex}`}>{applyMarkdown(part.text)}</Text>
            </Box>
          </Box>
        )
      }
      return null
    })
  }
  return null
})
