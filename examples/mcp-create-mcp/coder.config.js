import { createMcp } from "opencoder"
export default {
  mcp: [createMcp({ name: "playwright", command: "npx", args: ["@playwright/mcp@latest"] })],
}
