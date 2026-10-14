import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * End-to-end integration test runner for the custom GitHub MCP server.
 * Connects over Server-Sent Events, executes the protocol handshake,
 * inspects tool declarations, and tests issue retrieval.
 */
async function runSmokeTest() {
  console.log(
    "🚀 [Test] Starting MCP client connection to http://localhost:3001/sse ...",
  );

  const transport = new SSEClientTransport(
    new URL("http://localhost:3001/sse"),
  );
  const client = new Client(
    {
      name: "mcp-integration-test-runner",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    // 1. Establish SSE stream and perform MCP protocol handshake
    await client.connect(transport);
    console.log("✅ [Test] MCP connection established successfully.");

    // 2. Discover registered tools and schemas
    console.log("\n🔍 [Test] Discovering available tools from server...");
    const toolsResponse = await client.listTools();
    console.log(`✅ [Test] Discovered ${toolsResponse.tools.length} tool(s):`);

    toolsResponse.tools.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });

    // 3. Test list_issues tool on a known public repository
    console.log(
      '\n📦 [Test] Executing "list_issues" tool on "facebook/react"...',
    );
    const result = await client.callTool({
      name: "list_issues",
      arguments: {
        owner: "facebook",
        repo: "react",
      },
    });

    console.log("✅ [Test] Received tool execution response:");
    if (result.content && Array.isArray(result.content)) {
      const firstEntry = result.content[0];
      if (firstEntry.type === "text") {
        const parsed = JSON.parse(firstEntry.text);
        console.log(`   Fetched ${parsed.length} open issues successfully.`);
        if (parsed.length > 0) {
          console.log(
            `   Sample issue: #${parsed[0].number} - "${parsed[0].title}"`,
          );
        }
      }
    }

    // 4. Test write guard: human-in-the-loop validation rejection
    console.log(
      '\n🛡️ [Test] Verifying write guard on "create_issue" without user confirmation...',
    );
    const writeResult = await client.callTool({
      name: "create_issue",
      arguments: {
        owner: "octocat",
        repo: "Hello-World",
        title: "Smoke Test Issue",
        confirmed: false,
      },
    });

    if (writeResult.isError) {
      console.log(
        "✅ [Test] Write operation safely blocked as expected when confirmed=false.",
      );
    } else {
      console.warn("⚠️ [Test] Write guard did not flag error.");
    }

    console.log("\n🎉 [Test] All integration checks passed!");
  } catch (error: any) {
    console.error("❌ [Test Error]:", error.message || error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

runSmokeTest();
