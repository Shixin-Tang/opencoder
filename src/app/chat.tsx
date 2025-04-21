import { ChatMessage } from "@/app/chat-message.js"
import { useAppContext } from "@/app/context.js"
import { getSystemPrompt } from "@/lib/prompts.js"
import { messageStorage } from "@/lib/storage.js"
import { tools, type ToolModule } from "@/tools/tools.js"
import type { Message } from "@ai-sdk/react"
import { useChat } from "@ai-sdk/react"
import type { LanguageModelUsage, ToolExecutionOptions, ToolSet } from "ai"
import {
  appendResponseMessages,
  createDataStreamResponse,
  createIdGenerator,
  simulateStreamingMiddleware,
  streamText,
  wrapLanguageModel,
} from "ai"
import { createStreamableUI } from "ai/rsc"
import { Box, Text } from "ink"
import React, { isValidElement, useEffect, useMemo, useRef, useState } from "react"
import { AIInput } from "../components/ai-input.js"
import { staticRender } from "@/lib/static-renderer.js"
import { inspect } from "node:util"
import { anthropic } from "@ai-sdk/anthropic"
import { useToolConfirmationWrapper } from "../lib/tool-confirmation-wrapper.js"
import type { Config } from "@/lib.js"



export function Chat() {
  const [error, setError] = useState<Error | null>(null)
  const config = useAppContext()
  const { model, mcp: mcpTools, customTools, experimental } = config
  const streamingToolUIRef = useRef<Record<string, React.ReactNode | null>>({})
  const { wrapToolExecution } = useToolConfirmationWrapper()
  const [usage, setUsage] = useState<LanguageModelUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  })

  const finalTools = useMemo(() => {
    const finalTools = {
      ...tools,
      // todo make it better
      ...mcpTools.reduce(
        (acc, tool) => ({
          ...acc,
          ...Object.fromEntries(
            Object.entries(tool).map(([key, value]) => [
              key,
              {
                tool: {
                  ...value,
                  renderTitle: () => `MCP: ${key}`,
                  render: !value.generate
                    ? (tool) =>
                        tool.state === "result" ? (
                          <Text color="green">
                            {inspect(tool.result, {
                              showHidden: false,
                              depth: 1,
                              colors: true,
                              maxArrayLength: 1,
                              maxStringLength: 50,
                            })}
                          </Text>
                        ) : null
                    : undefined,
                },
                metadata: { needsPermissions: () => true },
                renderRejectedMessage: () => <Text color="red">Error</Text>,
              } satisfies ToolModule,
            ]),
          ),
        }),
        {} as Record<string, ToolModule>,
      ),
      ...Object.fromEntries(
        Object.entries(customTools || {}).map(([key, value]) => [
          key,
          {
            tool: {
              ...value,
              renderTitle: () => `Custom tool: ${key}`,
              render: !value.generate
                ? (tool) =>
                    tool.state === "result" ? (
                      <Text color="green">
                        {inspect(tool.result, {
                          showHidden: false,
                          depth: 1,
                          colors: true,
                          maxArrayLength: 1,
                          maxStringLength: 50,
                        })}
                      </Text>
                    ) : null
                : undefined,
            },
            metadata: { needsPermissions: () => true },
            renderRejectedMessage: () => <Text color="red">Error</Text>,
          } satisfies ToolModule,
        ]),
      ),
    } as Record<string, ToolModule>
    return Object.fromEntries(
      Object.entries(finalTools).map(([key, tool]) => {
        const generate = tool.tool.generate
        const execute = tool.tool.execute
        if (typeof generate !== "undefined") {
          const newTool = {
            ...tool,
            tool: {
              ...tool.tool,
              execute: async (args: any, toolExecution: ToolExecutionOptions) => {
                const ui = createStreamableUI()
                try {
                  const result = await wrapToolExecution(key, args, toolExecution, async () => {
                    const result = generate(args, {
                      ...toolExecution,
                      model,
                    })
                    streamingToolUIRef.current[toolExecution.toolCallId] = ui.value

                    let lastValue
                    for await (const part of result) {
                      if (isValidElement(part)) {
                        ui.update(part)
                      } else {
                        lastValue = part
                      }
                    }

                    // await messageStorage.setItem(
                    //   `/tools/${toolExecution.toolCallId}`,
                    //   render(<>{ui.value}</>).lastFrame()!,
                    // )

                    ui.done()

                    return lastValue
                  })
                  return result
                } catch (error: any) {
                  if (error instanceof Error) {
                    setError(error)
                  }
                  ui.error(error)
                  return `Error: ${error.toString()}`
                }
              },
            },
          } as ToolModule
          return [key, newTool]
        }
        if (typeof execute !== "undefined") {
          const newTool = {
            ...tool,
            tool: {
              ...tool.tool,
              execute: async (args: any, toolExecution: ToolExecutionOptions) => {
                return await wrapToolExecution(key, args, toolExecution, async () => {
                  const result = await execute(args, {
                    ...toolExecution,
                  })
                  return result
                })
              },
            },
          } as ToolModule
          return [key, newTool]
        }

        return [key, tool]
      }),
    )
  }, [])

  const { messages, input, handleInputChange, handleSubmit, status, stop } = useChat({
    // initialMessages: use(inStorageMessage),
    initialMessages: [],
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    onError: () => {},
    fetch: (async (_, options) => {
      const body = JSON.parse(options?.body as string) as {
        messages: Message[]
      }
      setError(null)
      return createDataStreamResponse({
        execute: async (dataStream) => {
          // TODO make a wrapper for all tools to intercept the tool streaming results (to render to the UI)
          setTimeout(() => {
            if (import.meta.env.DEV) {
              // workaround for a bug in development mode
              // console.clear()
            }
          }, 50)

          const stream = streamText({
            tools: Object.fromEntries(
              Object.entries(finalTools).map(([key, value]) => [key, value.tool]),
            ) as ToolSet,
            maxSteps: 50,
            model: wrapLanguageModel({
              model: model || anthropic("claude-3-5-sonnet-20241022"),
              middleware: simulateStreamingMiddleware(),
            }),
            temperature: 1,
            // maxTokens: 10e3,
            providerOptions: {
              anthropic: {
                // thinking: { type: "enabled", budgetTokens: 12000 },
              },
            },
            abortSignal: options!.signal!,
            system: await getSystemPrompt(
              config,
              body.messages.at(-1)?.content || "",
              experimental?.codeBaseIndex?.enabled || false,
              experimental?.codeBaseIndex?.model,
            ),
            messages: [...body.messages],
            toolCallStreaming: true,
            onFinish: async ({ response, usage, finishReason }) => {
              await messageStorage.setItem<Message[]>(
                "/messages",
                appendResponseMessages({
                  messages: body.messages,
                  responseMessages: response.messages,
                }),
              )
              setUsage(usage)
            },
            onStepFinish: ({ usage }) => {
              setUsage((old) => ({
                promptTokens: old.promptTokens + (usage.promptTokens || 0),
                completionTokens: old.completionTokens + (usage.completionTokens || 0),
                totalTokens: old.totalTokens + (usage.totalTokens || 0),
              }))
            },
            onError: ({ error }) => {
              if (import.meta.env.DEV) {
                // workaround for a bug in development mode
                // console.clear()
              }
              if (process.env.DEBUG === "true") console.log(error)
              setError(error as Error)
            },
          })
          stream.consumeStream({
            onError: (error) => {
              setError(error as Error)
            },
          })
          stream.mergeIntoDataStream(dataStream)
          // if (import.meta.env.DEV) {
          //   // workaround for a bug in development mode
          //   for await (const _text of stream.textStream) {
          //     // console.clear()
          //     break
          //   }
          // }
        },
      })
    }) as typeof fetch,
  })

  // useEffect(() => {
  //   console.log(Date.now() - globalThis.start)
  // }, [])

  const loggedMessageIds = useRef<string[]>([])
  const activeMessages = useMemo(() => messages.slice(-5), [messages])

  useEffect(() => {
    messages.slice(0, -5).forEach((message) => {
      if (!loggedMessageIds.current.includes(message.id)) {
        loggedMessageIds.current = [...loggedMessageIds.current, message.id]
        const instance = staticRender(
          <ChatMessage
            message={message}
            streamingToolUIRef={streamingToolUIRef}
            tools={finalTools}
          />,
        )
        setTimeout(() => {
          if (import.meta.env.MODE !== "test") {
            console.log(instance.lastFrame()!)
          }
          instance.unmount()
        }, 10)
      }
    })
  }, [messages])


  return (
    <Box flexDirection="column" gap={0}>
      {activeMessages.length > 0 &&
        activeMessages.map((message) => {
          return (
            <ChatMessage
              key={message.id}
              message={message}
              streamingToolUIRef={streamingToolUIRef}
              tools={finalTools}
            />
          )
        })}
      {/* <Box borderStyle="round" borderColor="gray">
        <TextArea
          setValue={(value) =>
            handleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)
          }
          value={input}
          focus
        />
      </Box> */}
      {(status === "error" || error) && (
        <Box
          borderStyle="round"
          borderColor="red"
          flexDirection="column"
          gap={1}
          paddingX={1}
          marginY={1}
        >
          <Text color="red">An error occurred while processing your request:</Text>
          {error ? (
            <Text color="white">{error.message}</Text>
          ) : (
            <Text color="gray">(No specific error details available)</Text>
          )}
          {error?.message.match(/using the 'apiKey'/) && (
            <Text color="white">
              <Text color="blue">Tips: </Text>
              you can set the API key to .env file
            </Text>
          )}
        </Box>
      )}
      <AIInput
        input={input}
        onInputChange={(input) =>
          handleInputChange({
            target: {
              value: input,
            },
          } as React.ChangeEvent<HTMLInputElement>)
        }
        usage={usage}
        // TODO: add commands: /checkpoint, /revert, /commit, /mcp, /cost
        commands={[
          // {
          //   type: "prompt",
          //   name: "test",
          //   description: "test",
          //   userFacingName: () => "test",
          // },
          {
            name: "sync",
            description: "Sync codebase to the codebase index, stored in .coder/embeddings",
            userFacingName: () => "sync",
          },
        ]}
        isDisabled={false}
        isLoading={status === "streaming" || status === "submitted"}
        messages={messages}
        onSubmit={() => {
          handleSubmit()
        }}
        onStop={() => {
          stop()
        }}
      />
    </Box>
  )
}
