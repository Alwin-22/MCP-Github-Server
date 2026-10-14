# GitHub Model Context Protocol (MCP) Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES_Modules-green.svg?logo=node.js)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Protocol-purple.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, type-safe **Model Context Protocol (MCP)** server built with **TypeScript**, **Node.js**, and **Express**. It securely connects autonomous AI agents (such as Claude Desktop and Cursor) to private or public GitHub repositories over **Server-Sent Events (SSE)**.

---

## 📌 Architectural Overview

Modern frontier LLMs lack direct, authenticated access to external developer infrastructure. This server bridges that gap using the Model Context Protocol over HTTP/SSE:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     Host AI Client              │                 │      MCP Server (Express)       │
│  (Claude Desktop / Cursor)      │                 │    (TypeScript + Octokit + Zod) │
└────────────────┬────────────────┘                 └────────────────┬────────────────┘
                 │                                                   │
                 │   1. GET /sse (Initiate Stream)                   │
                 ├──────────────────────────────────────────────────►│ Creates SSEServerTransport
                 │◄──────────────────────────────────────────────────┤ Generates sessionId & endpoint
                 │                                                   │
                 │   2. POST /messages?sessionId=<id>                │
                 ├──────────────────────────────────────────────────►│ Deserializes JSON-RPC Call
                 │      (tools/call: list_issues / create_issue)     │ Validates arguments via Zod
                 │                                                   │ Queries GitHub REST API
                 │◄──────────────────────────────────────────────────┤ Immediate 202 Accepted
                 │                                                   │
                 │   3. SSE Event: JSON-RPC Result                   │
                 │◄──────────────────────────────────────────────────┤ Streams response to Client
```

### Key Engineering Decisions

1. **Split-Channel SSE Transport:** Uses persistent Server-Sent Events (`GET /sse`) for server-to-client streaming paired with REST endpoints (`POST /messages`) for inbound JSON-RPC RPC dispatch.
2. **Runtime Type Invariants with Zod:** Every tool schema defines explicit type validation, bounds (`.min(3)`), and contextual documentation that LLMs use for parameter generation.
3. **Human-in-the-Loop Write Guards:** Destructive actions like `create_issue` require an explicit boolean approval parameter (`confirmed: true`). Unconfirmed calls immediately halt execution without modifying remote resources.
4. **Context Window Optimization:** GitHub API responses are sanitized using selective object mapping before reaching the LLM context, reducing token overhead by over 80%.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules, target: ES2022)
- **Language:** TypeScript 5.7 (Strict type mode)
- **MCP Core:** `@modelcontextprotocol/sdk`
- **Web Transport:** Express, CORS, Server-Sent Events
- **Schema Validation:** Zod
- **API Client:** `@octokit/rest` (GitHub REST API)
- **Dev Runner:** `tsx` (Hot-reloading runtime)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- Git
- A GitHub Personal Access Token (classic) with `repo` permissions

### 1. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/<your-username>/mcp-github-server.git
cd mcp-github-server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
touch .env
```

Add your personal access token:

```env
PORT=3001
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_yourActualGitHubTokenHere
```

> **Note:** `.env` is excluded in `.gitignore` to protect API credentials.

### 3. Running the Server

#### Development Mode (with hot-reloading):

```bash
npm run dev
```

The server will start listening at `http://localhost:3001/sse`.

#### Production Build:

```bash
npm run build
npm start
```

---

## 🧪 Integration Testing

A standalone test client is included to verify the protocol handshake, tool discovery, and API querying without requiring third-party AI clients.

Run the test suite in a separate terminal while the server is active:

```bash
npx tsx src/test-client.ts
```

---

## 🔌 Connecting to AI Clients

### Cursor / Claude Desktop Integration

Add the following entry to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "github-server": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

---

## 🧰 Available Tools

| Tool           | Type      | Parameters                                                                                           | Description                                                |
| :------------- | :-------- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| `list_issues`  | **Read**  | `owner` (string), `repo` (string)                                                                    | Lists open issues with numbers, titles, authors, and URLs. |
| `create_issue` | **Write** | `owner` (string), `repo` (string), `title` (string), `body` (optional string), `confirmed` (boolean) | Creates a GitHub issue; aborts if `confirmed` is `false`.  |

---

## 📁 Project Structure

```text
mcp-github-server/
├── src/
│   ├── github.ts       # GitHub Octokit API integration layer
│   ├── server.ts       # MCP server definition & Zod tool schemas
│   ├── index.ts        # Express server & SSE transport routing
│   └── test-client.ts  # End-to-end integration test runner
├── .env.example        # Example environment template
├── .gitignore          # Git tracking exclusion list
├── package.json        # Dependencies & automation scripts
├── tsconfig.json       # TypeScript compiler configuration
└── README.md           # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
