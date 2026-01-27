# VibeCoder 🚀

An open-source AI-powered code generation platform with an **agent-based multi-call architecture**. Describe what you want to build, and the AI agent will think, plan, and execute step-by-step until your application is complete.

Built with ❤️ by [beeweed](https://github.com/beeweed) and [ii-agent](https://github.com/anthropics/ii-agent)

![VibeCoder Screenshot](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🤖 Agent-Based Multi-Call Architecture

Unlike traditional single-call LLM applications, VibeCoder uses a sophisticated **LLM-in-the-loop** architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│  THINKING   │ ──▶ │  PLANNING   │ ──▶ │  STEP EXECUTION     │ ──▶ │ COMPLETION  │
│  (LLM #1)   │     │  (LLM #2)   │     │  (LLM #3, #4, ...)  │     │  (Final)    │
└─────────────┘     └─────────────┘     └─────────────────────┘     └─────────────┘
                                               ▲       │
                                               └───────┘
                                            Loop until done
```

1. **Thinking Phase** - Agent analyzes your request and understands the requirements
2. **Planning Phase** - Agent creates a detailed execution plan with actionable steps
3. **Step Execution** - Each step gets its own LLM call for focused, quality code generation
4. **Completion** - Agent summarizes what was built

### 🎯 Key Capabilities

- **13 LLM Providers Supported** - OpenRouter, Anthropic, OpenAI, Gemini, Groq, DeepSeek, Mistral, Cohere, Fireworks, Cerebras, Hugging Face, Z.ai, and Chutes
- **Virtual File System** - All files managed in-browser with full CRUD operations
- **Monaco Editor** - Professional code editing with syntax highlighting and IntelliSense
- **Real-time Streaming** - Watch the AI think, plan, and code in real-time
- **Tool System** - AI can read existing files before modifying them
- **Export to ZIP** - Download your generated project as a ZIP file
- **Mobile Responsive** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- An API key from any supported provider

### Installation

```bash
# Clone the repository
git clone https://github.com/beeweed/vibecoder.git
cd vibecoder

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

1. Click the ⚙️ settings icon in the top-right corner
2. Select your preferred LLM provider
3. Enter your API key
4. (Optional) Adjust temperature and max tokens
5. Start building!

## 🏗️ Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── agent/               # Agent-based API routes
│   │   │   ├── plan/            # Planning phase endpoint
│   │   │   ├── execute-step/    # Step execution endpoint
│   │   │   └── complete/        # Completion summary endpoint
│   │   ├── chat/                # Legacy chat endpoint
│   │   ├── think/               # Thinking phase endpoint
│   │   ├── models/              # Model listing per provider
│   │   └── tools/               # Tool execution (read_file)
│   ├── page.tsx                 # Main 3-panel layout
│   └── layout.tsx               # Root layout
├── components/
│   ├── ai-panel/
│   │   ├── AIPanel.tsx          # Main chat interface + agent loop
│   │   ├── AgentPlanDisplay.tsx # Plan visualization component
│   │   └── ToolCallIndicator.tsx
│   ├── editor/                  # Monaco editor integration
│   ├── file-explorer/           # Virtual file tree
│   ├── layout/                  # Header, navigation
│   └── ui/                      # shadcn/ui components
├── stores/                      # Zustand state management
│   ├── agentLoopStore.ts        # Agent phase state
│   ├── chatStore.ts             # Messages + plan steps
│   ├── editorStore.ts           # Editor tabs
│   ├── fileSystemStore.ts       # Virtual file system
│   └── settingsStore.ts         # API keys (persisted)
├── lib/
│   ├── systemPrompt.ts          # All agent phase prompts
│   ├── parser.ts                # Streaming response parser
│   └── utils.ts                 # Utility functions
└── types/
    ├── agentLoop.ts             # Agent phase types
    ├── chat.ts                  # Message types
    └── files.ts                 # File system types
```

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui, Radix UI |
| State Management | Zustand |
| Code Editor | Monaco Editor |
| Animations | Framer Motion |
| Icons | Lucide React |
| Linting | Biome |
| Package Manager | Bun / npm |

## 🌐 Supported LLM Providers

| Provider | Default Model | API Endpoint |
|----------|---------------|--------------|
| OpenRouter | claude-sonnet-4 | openrouter.ai |
| Anthropic | claude-sonnet-4 | api.anthropic.com |
| OpenAI | gpt-4o | api.openai.com |
| Google Gemini | gemini-2.5-flash | generativelanguage.googleapis.com |
| Groq | llama-3.3-70b | api.groq.com |
| DeepSeek | deepseek-chat | api.deepseek.com |
| Mistral | mistral-large-latest | api.mistral.ai |
| Cohere | command-a-03-2025 | api.cohere.com |
| Fireworks | llama-v3p1-70b | api.fireworks.ai |
| Cerebras | llama-3.3-70b | api.cerebras.ai |
| Hugging Face | Qwen3-Coder-480B | router.huggingface.co |
| Z.ai | glm-4.7 | api.z.ai |
| Chutes | Mistral-Small-3.1 | api.chutes.ai |

## 📖 How the Agent Works

### Phase 1: Thinking
```
User: "Build me a todo app with React"

Agent Thinking: "The user wants to create a React todo application 
with add, complete, and delete functionality."
```

### Phase 2: Planning
```json
{
  "goal": "Build a React todo application",
  "steps": [
    { "title": "Create type definitions", "description": "Define Todo interface..." },
    { "title": "Build TodoItem component", "description": "Create individual todo..." },
    { "title": "Build TodoList component", "description": "Create the list container..." },
    { "title": "Implement main page", "description": "Integrate all components..." }
  ]
}
```

### Phase 3: Step Execution
Each step gets its own dedicated LLM call:
- Step 1 → LLM creates `src/types/todo.ts`
- Step 2 → LLM creates `src/components/TodoItem.tsx`
- Step 3 → LLM creates `src/components/TodoList.tsx`
- Step 4 → LLM creates `src/app/page.tsx`

### Phase 4: Completion
```
"I've built a complete todo application with add, complete, and delete 
functionality. The app uses React state management with a clean, modern 
design. You can start adding todos right away!"
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Build
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

## 🗺️ Roadmap

- [x] Agent-based multi-call architecture
- [x] Planning before application creation
- [x] Step-by-step execution with individual LLM calls
- [ ] E2B sandbox for live code preview
- [ ] Web search integration
- [ ] Git operations (push, clone)
- [ ] Deploy to Vercel/Netlify
- [ ] Sub-agents architecture
- [ ] File upload with prompts
- [ ] Default file-system templates (Next.js, Python, etc.)
- [ ] Image file content fetching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⭐ Star History

If you find VibeCoder useful, please consider giving it a star! ⭐

---

<p align="center">
  Made with ❤️ by the VibeCoder community
</p> 
