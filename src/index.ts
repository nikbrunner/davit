import { runCLI } from "./cli/index.ts";
import { runMCP } from "./mcp/server.ts";

// CLI mode if: terminal, or args provided (e.g. piped shell calling `davit calendar list`)
// MCP mode if: no args AND not a terminal (stdin is piped for MCP stdio)
if (Deno.args.length > 0 || Deno.stdin.isTerminal()) {
  await runCLI(Deno.args);
} else {
  await runMCP();
}
