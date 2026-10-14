import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { setupMcpServer } from "./server.js";

const app = express();
app.use(cors());

const mcpServer = setupMcpServer();
const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  const sessionId = transport.sessionId;

  transports.set(sessionId, transport);

  req.on("close", () => {
    transports.delete(sessionId);
  });

  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);

  if (!transport) {
    res.status(404).json({ error: "Session not found or expired" });
    return;
  }

  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}/sse`);
});
