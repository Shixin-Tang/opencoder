# OpenCoder: the open source version of Claude Code

Try it out:

```bash
npx opencoder@latest
```

```bash
bunx opencoder@latest
```

Or try the beta channel:
```bash
npx opencoder@next
```

## Overview

- Complete Claude Code replacement with similar UI and UX
- Built on top of the Vercel AI SDK. Fully compatible with the AI SDK model.
- Supports any LLM providers that the AI SDK supports (OpenAI, Anthropic, Google, etc.)
- Cross-platform shell: which means supports Windows, Linux, and MacOS.
- 60 FPS UI rendering, powered by React concurrent rendering

## Demo

#### Youtube clone
https://github.com/user-attachments/assets/67c52f00-7c54-404d-b1e2-244312f0094a



## Features

#### 1. Built on top of the Vercel AI SDK
OpenCoder is built on top of the Vercel AI SDK. It is fully compatible with the AI SDK model, any official or community model supported by the AI SDK will work with OpenCoder:
```typescript
import { ollama } from 'ollama-ai-provider'; // read more: https://sdk.vercel.ai/providers/community-providers/ollama
import type { Config } from 'opencoder';

export default {
  model: ollama('qwq'),
} satisfies Config
```

#### 2. MCP makes it easy (WIP)
Integrate powerful MCP capabilities into your workflow in 1 step. OpenCoder provides ready-to-use MCP tools that can be implemented with just a few lines of code:
```typescript
import { playwright } from 'opencoder/mcp';

export default {
  mcp: [playwright()],
} satisfies Config
```

#### 3. Cross-platform shell
OpenCoder has a cross-platform shell that supports Windows, Linux, and MacOS. Powered by [Deno shell](https://github.com/denoland/deno_task_shell)

## Available tools
- Read file
- Write file
- Edit file
- Memory read
- Memory write
- Think
- Planning
- Grep: powered by @vscode/ripgrep

## Roadmap

- [ ] Tool confirmation dialog
- [ ] Documentation
- [ ] Add MCP support
- [ ] Add auto-import MCP tools from `vscode/mcp.json` or `cursorrules/mcp.json`
- [ ] Add more examples
- [ ] Prebuilt MCP tools (`import { playwright } from "opencoder/mcp"`)
- [ ] Proper release process (changeset + changelog)
- [ ] Add more tests

Contributions are welcome!
