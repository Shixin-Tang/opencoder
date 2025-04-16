import { Box, Text } from "ink"
import React from "react"
import { useAtomValue } from "jotai"
import { Chat } from "./app/chat.js"
import { dialogContentAtom } from "./lib/store/dialog.js"
import { Spinner } from "@inkjs/ui"
import { ToolConfirmationDialog } from "./components/tool-confirmation-dialog.js"
import { toolConfirmationStateAtom } from "./lib/store/tool-confirmation.js"

// TODO: show alert if user using @next channel
export function App() {
	const dialogContent = useAtomValue(dialogContentAtom)
	const toolConfirmation = useAtomValue(toolConfirmationStateAtom)

	return (
    <Box flexDirection="column">
      {/* <Gradient name="vice">
          <BigText text="opencoder" />
        </Gradient> */}
      {dialogContent && (
        <Box
          flexDirection="column"
          gap={2}
          width={process.stdout.columns}
          height={process.stdout.rows}
          borderStyle="round"
          borderColor="green"
        >
          {dialogContent}
        </Box>
      )}
      {!dialogContent && !toolConfirmation.isOpen && (
        <Box flexDirection="column" gap={2}>
          <Text></Text>
          {/* <Onboarding /> */}
          {/* <Spinner /> */}
          <Chat />
        </Box>
      )}
      <ToolConfirmationDialog />
    </Box>
)
}
