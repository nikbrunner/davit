import { runCLI } from "./cli/index.ts";
import { runMCP } from "./mcp/server.ts";

if (Deno.stdin.isTerminal()) {
  await runCLI(Deno.args);
} else {
  await runMCP();
}
