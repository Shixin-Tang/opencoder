import { z, React } from "opencoder"
import { webSearch } from "opencoder/mcp"

export default {
  customTools: {
    get_current_time: {
      description: "Get the current time",
      parameters: z.object({ format: z.enum(["iso", "unix"]) }),
      async *generate({ format }) {
        yield <span>Getting current time...</span>
        await new Promise((resolve) => setTimeout(resolve, 2000))
        yield <span>Current time: {new Date().toISOString()}</span>
        yield new Date().toISOString()
      },
    },
  },
  mcp: [webSearch()],
}
