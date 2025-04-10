import React, { useState, useEffect } from "react"
import { render, Box, Text } from "ink2"
import Static from "./components/static.js"
import { render as renderInk } from "../test/testutil"

const Example = () => {
  const [tests, setTests] = useState([])

  useEffect(() => {
    let completedTests = 0
    let timer

    const run = () => {
      // Fake 10 completed tests
      if (completedTests++ < 10) {
        setTests((previousTests) => [
          ...previousTests,
          {
            id: previousTests.length,
            title: `Test #${previousTests.length + 1}`,
          },
        ])

console.log(renderInk(<Text color="green">✔Hello</Text>).lastFrame())

        timer = setTimeout(run, 100)
      }
    }

    run()

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <Box flexDirection="column" gap={1} position="relative">
      {/* This part will be rendered once to the terminal */}
      <Static items={tests}>
        {(test) => (
          <Box key={test.id}>
            <Text color="green">✔ {test.title}</Text>
          </Box>
        )}
      </Static>

      {/* This part keeps updating as state changes */}
      <Box marginTop={1}>
        <Text dimColor>Completed tests: {tests.length}</Text>
      </Box>
    </Box>
  )
}

render(<Example />)
