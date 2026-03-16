import { Command } from "@cliffy/command";
import { loadConfig } from "../config.ts";
import { createClient } from "../core/client.ts";
import { listCalendars } from "../core/calendars.ts";
import { formatCalendars, type OutputFormat } from "./format.ts";

export const calendarCommand = new Command()
  .description("Calendar operations")
  .action(function () {
    this.showHelp();
  })
  .command("list")
  .description("List all calendars")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(async ({ format }: { format: string }) => {
    const config = await loadConfig();
    const client = await createClient(config);
    const calendars = await listCalendars(client);
    console.log(formatCalendars(calendars, format as OutputFormat));
  });
