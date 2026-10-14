import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchOpenIssues, createNewIssue } from "./github.js";

export function setupMcpServer(): McpServer {
  const server = new McpServer({
    name: "github-mcp-server",
    version: "1.0.0",
  });

  server.tool(
    "list_issues",
    "List open issues from a specified GitHub repository",
    {
      owner: z.string().describe("Repository owner or organization name"),
      repo: z.string().describe("Repository name"),
    },
    async ({ owner, repo }) => {
      try {
        const issues = await fetchOpenIssues(owner, repo);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to fetch issues: ${error.message}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "create_issue",
    "Create a new issue in a GitHub repository",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      title: z.string().min(3).describe("Title of the issue"),
      body: z.string().optional().describe("Markdown body text of the issue"),
      confirmed: z
        .boolean()
        .describe("Explicit user confirmation to create the issue"),
    },
    async ({ owner, repo, title, body, confirmed }) => {
      if (!confirmed) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Operation halted: Human confirmation required before creating an issue.",
            },
          ],
        };
      }

      try {
        const created = await createNewIssue(owner, repo, title, body);
        return {
          content: [
            {
              type: "text",
              text: `Issue #${created.number} created: ${created.url}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to create issue: ${error.message}`,
            },
          ],
        };
      }
    },
  );

  return server;
}
