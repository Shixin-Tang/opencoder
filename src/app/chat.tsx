import { ChatMessage } from "@/app/chat-message.js"
import { useAppContext } from "@/app/context.js"
import { getSystemPrompt } from "@/lib/prompts.js"
import { messageStorage } from "@/lib/storage.js"
import { tools } from "@/tools/tools.js"
import type { Message } from "@ai-sdk/react"
import { useChat } from "@ai-sdk/react"
import type { LanguageModelUsage, ToolExecutionOptions, ToolSet } from "ai"
import {
  appendResponseMessages,
  createDataStreamResponse,
  createIdGenerator,
  smoothStream,
  streamText,
} from "ai"
import { createStreamableUI } from "ai/rsc"
import { Box, Text, useInput } from "ink"
import { useSetAtom } from "jotai"
import React, { isValidElement, use, useEffect, useMemo, useRef, useState } from "react"
import { AIInput } from "../components/ai-input.js"
import { Onboarding } from "../components/onboarding.js"
import { dialogContentAtom, useDialog } from "../lib/store/dialog.js"
import { staticRender } from "@/lib/static-renderer.js"

function MyDialog() {
  const setDialogContent = useSetAtom(dialogContentAtom)
  const [counter, setCounter] = useState(0)

  useInput((_, key) => {
    const clearScreenAndResolve = () => {
      process.stdout.write("\x1B[2J\x1B[3J\x1B[H", () => {
        setDialogContent(undefined)
      })
    }
    if (key.escape) {
      clearScreenAndResolve()
    }
    if (key.return) {
      clearScreenAndResolve()
    }
  })
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((counter) => counter + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <Box flexDirection="column">
      <Text color="white" backgroundColor="gray">
        Example Dialog
      </Text>
      <Box padding={2} paddingTop={1} flexDirection="column" gap={1}>
        <Text>
          Hello
          {counter}
        </Text>
        <Onboarding />
      </Box>
    </Box>
  )
}

const inStorageMessage = messageStorage.get<Message[]>("/messages").then((value) => value || [])

const toolsOutput = messageStorage.getItem("/tools")
export function Chat() {
  const showDialog = useDialog()
  const [error, setError] = useState<Error | null>(null)
  const { model } = useAppContext()
  const streamingToolUIRef = useRef<Record<string, React.ReactNode | null>>({})
  const inStoreTools = use(toolsOutput)
  const [usage, setUsage] = useState<LanguageModelUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  })
  const { messages, input, handleInputChange, handleSubmit, status, stop } = useChat({
    // initialMessages: use(inStorageMessage),
    initialMessages: [],
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    fetch: (async (_, options) => {
      const body = JSON.parse(options?.body as string) as {
        messages: Message[]
      }
      return createDataStreamResponse({
        execute: async (dataStream) => {
          // TODO make a wrapper for all tools to intercept the tool streaming results (to render to the UI)
          setTimeout(() => {
            if (import.meta.env.DEV) {
              // workaround for a bug in development mode
              // console.clear()
            }
          }, 50)
          const defaultTools = {
            // eslint-disable-next-line no-useless-spread
            ...Object.fromEntries(
              Object.entries(tools).map(([key, tool]) => {
                const generate = tool.tool.generate
                if (typeof generate !== "undefined") {
                  const newTool = {
                    ...tool.tool,
                    execute: async (args: any, toolExecution: ToolExecutionOptions) => {
                      const ui = createStreamableUI()
                      try {
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
                      } catch (error: any) {
                        ui.error(error)
                        return `Error: ${error.toString()}`
                      }
                    },
                  }
                  return [key, newTool]
                }

                return [key, tool.tool]
              }),
            ),
          } as ToolSet
          const stream = streamText({
            tools: defaultTools,
            maxSteps: 50,
            model,
            temperature: 1,
            maxTokens: 10e3,
            providerOptions: {
              anthropic: {
                thinking: { type: "enabled", budgetTokens: 12000 },
              },
            },
            abortSignal: options!.signal!,
            system: await getSystemPrompt(),
            messages: [...body.messages],
            experimental_toolCallStreaming: true,
            toolCallStreaming: true,
            onFinish: async ({ response, usage }) => {
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
              setError(error as Error)
            },
          })
          stream.consumeStream()
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
  const last5Messages = useMemo(() => messages.slice(-5), [messages])

  useEffect(() => {
    messages.slice(0, -5).forEach((message) => {
      if (!loggedMessageIds.current.includes(message.id)) {
        loggedMessageIds.current = [...loggedMessageIds.current, message.id]
        const instance = staticRender(
          <ChatMessage message={message} streamingToolUIRef={streamingToolUIRef} />,
        )
        setTimeout(() => {
          console.log(instance.lastFrame())
          instance.unmount()
        }, 10)
      }
    })
  }, [messages])

  return (
    <Box flexDirection="column" gap={0}>
      {last5Messages.length > 0 &&
        last5Messages.map((message, index) => {
          return (
            <ChatMessage
              key={message.id}
              message={message}
              streamingToolUIRef={streamingToolUIRef}
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
      {error && (
        <Box borderStyle="round" borderColor="red" flexDirection="column" gap={1}>
          <Text color="red">An error occurred while processing your request:</Text>
          <Text color="white">{error.message}</Text>
          {error.message.match(/using the 'apiKey'/) && (
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
        commands={
          [
            // {
            //   type: "prompt",
            //   name: "test",
            //   description: "test",
            //   userFacingName: () => "test",
            // },
            // {
            //   type: "bash",
            //   name: "command 2",
            //   description: "command 2 description",
            //   userFacingName: () => "command 2",
            // },
          ]
        }
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
