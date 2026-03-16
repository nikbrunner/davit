import { Command } from "@cliffy/command";
import { calendarCommand } from "./calendar.ts";
import { eventCommand } from "./event.ts";
import { runMCP } from "../mcp/server.ts";

const serveCommand = new Command()
  .description("Start MCP stdio server")
  .action(async () => {
    await runMCP();
  });

export async function runCLI(args: string[]): Promise<void> {
  const program = new Command()
    .name("davit")
    .description("CalDAV CLI tool & MCP server")
    .version("0.1.0")
    .action(function () {
      this.showHelp();
    })
    .command("calendar", calendarCommand)
    .command("event", eventCommand)
    .command("serve", serveCommand);

  await program.parse(args);
}
