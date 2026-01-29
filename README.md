<div align="center">

# ⚡ VibeCoder

### AI-Powered Code Generation Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Build applications with AI-powered code generation. Describe what you want, and VibeCoder writes the code.**

[Demo](https://vibecoder-ii-53fa8255.vercel.app/) · [Report Bug](https://github.com/beeweed/vibecoder/issues) · [Request Feature](https://github.com/beeweed/vibecoder/issues)

</div>

---

## 📖 Overview

VibeCoder is an open-source AI coding agent that transforms natural language descriptions into production-ready code. Similar to platforms like Bolt.new, Lovable, and v0.dev, VibeCoder provides a complete in-browser development environment where you can:

- 💬 **Chat with AI** to describe what you want to build
- 📁 **Generate complete file structures** automatically
- ✏️ **Edit code** with a Monaco-powered editor
- 🔄 **Iterate quickly** with AI-assisted modifications
- 📦 **Export projects** as ZIP files

---

## ✨ Features

### 🤖 Intelligent AI Agent
- **Two-Phase Processing**: Thinking phase for understanding, then coding phase for execution
- **Agentic Loop**: Separate LLM calls for each tool execution (read, create, update, delete)
- **Context-Aware**: AI understands your entire project structure
- **Tool Execution**: AI can read existing files before modifying them

### 🎨 Modern Code Editor
- **Monaco Editor**: VS Code-like editing experience
- **Syntax Highlighting**: Support for 20+ languages
- **Multi-Tab Support**: Work on multiple files simultaneously
- **Real-Time Updates**: See AI changes as they happen

### 📂 Virtual File System
- **In-Browser Storage**: No server needed for file management
- **Folder Structure**: Organize files in directories
- **File Operations**: Create, read, update operations (delete by AI only)
- **Export to ZIP**: Download your entire project

### 🔌 Multi-Provider Support
Connect to 12+ AI providers with your own API keys:

| Provider | Models |
|----------|--------|
| **OpenRouter** | Access to 100+ models |
| **OpenAI** | GPT-4, GPT-4o, GPT-3.5 |
| **Anthropic** | Claude 3.5, Claude 3 |
| **Google** | Gemini Pro, Gemini Flash |
| **Groq** | Llama 3, Mixtral (fast inference) |
| **Mistral** | Mistral Large, Medium, Small |
| **DeepSeek** | DeepSeek Coder, Chat |
| **Cohere** | Command R+, Command R |
| **Fireworks** | Various open models |
| **Cerebras** | Fast inference models |
| **Hugging Face** | Open source models |
| **Together AI** | Open source models |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VIBECODER ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   AI Panel   │    │   Explorer   │    │    Code Editor       │   │
│  │              │    │              │    │    (Monaco)          │   │
│  │  - Chat UI   │    │  - File Tree │    │                      │   │
│  │  - Thinking  │    │  - Folders   │    │  - Syntax Highlight  │   │
│  │  - Status    │    │  - Files     │    │  - Multi-tab         │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘   │
│         │                   │                       │               │
│         └───────────────────┼───────────────────────┘               │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │   Zustand Store │                              │
│                    │                 │                              │
│                    │  - chatStore    │                              │
│                    │  - fileSystem   │                              │
│                    │  - editorStore  │                              │
│                    │  - agentStore   │                              │
│                    │  - settings     │                              │
│                    └────────┬────────┘                              │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         │                   │                   │                   │
│  ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐            │
│  │  /api/think │    │  /api/agent   │   │  /api/chat  │            │
│  │             │    │               │   │             │            │
│  │  Reasoning  │    │  Agent Loop   │   │  Streaming  │            │
│  │  Phase      │    │  + Tools      │   │  Response   │            │
│  └─────────────┘    └───────────────┘   └─────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Loop Flow

```
User Message
     │
     ▼
┌─────────────┐
│ LLM Call #1 │ ──► Contains tool calls?
└─────────────┘
     │
     ├── NO  ──► Done (final response)
     │
     ├── YES ──► Execute tools (read_file, create, update, delete)
     │              │
     │              ▼
     │         Tool Results
     │              │
     │              ▼
     │  ┌─────────────┐
     └► │ LLM Call #2 │ ──► More tool calls? (loop continues)
        └─────────────┘
             │
             └── Until no more tool calls (max 10 iterations)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- API key from any supported provider

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/beeweed/vibecoder.git
   cd vibecoder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

5. **Add your API key**
   - Click the ⚙️ settings icon
   - Select your preferred provider
   - Enter your API key
   - Start coding!

---

## 📁 Project Structure

```
vibecoder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── agent/          # Agentic loop endpoint
│   │   │   ├── chat/           # Streaming chat endpoint
│   │   │   ├── think/          # Reasoning phase endpoint
│   │   │   ├── models/         # Provider-specific endpoints
│   │   │   └── tools/          # Tool execution endpoints
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ai-panel/           # Chat interface
│   │   │   ├── AIPanel.tsx
│   │   │   └── ToolCallIndicator.tsx
│   │   ├── editor/             # Monaco code editor
│   │   │   └── EditorPanel.tsx
│   │   ├── file-explorer/      # File tree
│   │   │   └── FileExplorer.tsx
│   │   ├── layout/             # Header, navigation
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── ModelSelector.tsx
│   │   ├── modals/             # Settings modal
│   │   │   └── SettingsModal.tsx
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── stores/                 # Zustand state management
│   │   ├── agentStore.ts       # Agent status, activity log
│   │   ├── chatStore.ts        # Messages, generation state
│   │   ├── editorStore.ts      # Tabs, cursor position
│   │   ├── fileSystemStore.ts  # Virtual file system
│   │   └── settingsStore.ts    # API keys, preferences
│   │
│   ├── lib/
│   │   ├── fileIcons.ts        # File type icons
│   │   ├── parser.ts           # AI response parser
│   │   ├── systemPrompt.ts     # AI system prompts
│   │   └── utils.ts            # Utility functions
│   │
│   └── types/
│       ├── agent.ts            # Agent types
│       ├── chat.ts             # Chat types
│       ├── files.ts            # File system types
│       ├── openrouter.ts       # API types
│       └── tools.ts            # Tool types
│
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | TailwindCSS 3.4 |
| **UI Components** | Radix UI (shadcn/ui) |
| **State Management** | Zustand |
| **Code Editor** | Monaco Editor |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Linting** | Biome |

---

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env.local` file for default settings:

```env
# App URL (for OpenRouter referrer)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supported File Types

VibeCoder supports syntax highlighting for:

- **Web**: `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.scss`
- **Data**: `.json`, `.yaml`, `.yml`, `.xml`, `.toml`
- **Docs**: `.md`, `.mdx`, `.txt`
- **Backend**: `.py`, `.go`, `.rs`, `.java`, `.rb`, `.php`
- **Database**: `.sql`, `.prisma`, `.graphql`
- **Config**: `.env`, `.gitignore`, `Dockerfile`
- And many more...

---

## 📝 AI Response Format

VibeCoder uses special markers to parse AI responses:

### File Operations

```
<<<FILE_CREATE: src/components/Button.tsx>>>
// Your code here
<<<FILE_END>>>

<<<FILE_UPDATE: src/components/Button.tsx>>>
// Updated code here
<<<FILE_END>>>

<<<FILE_DELETE: src/old-file.tsx>>>
```

### Tool Calls

```
<<<TOOL_CALL: read_file>>>
{"path": "src/components/Button.tsx"}
<<<TOOL_END>>>
```

---

## 🗺️ Roadmap

- [ ] **E2B Sandbox** - Live code preview in sandboxed environment
- [ ] **Web Search** - AI can search the web for documentation
- [ ] **Git Integration** - Push/pull from GitHub repositories
- [ ] **Deploy** - One-click deploy to Vercel/Netlify
- [ ] **File Upload** - Upload images and files with prompts
- [ ] **Project Templates** - Start with Next.js, Python, etc.
- [ ] **Sub-Agents** - Specialized agents for different tasks
- [ ] **Collaboration** - Real-time multiplayer editing

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [ii-agent](https://github.com/anthropics/anthropic-cookbook) assistance
- Inspired by [Bolt.new](https://bolt.new), [v0.dev](https://v0.dev), and [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by [beeweed](https://github.com/beeweed)

</div>
