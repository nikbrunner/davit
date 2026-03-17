import { Command } from "@cliffy/command";
import { calendarCommand } from "./calendar.ts";
import { configCommand } from "./config.ts";
import { eventCommand } from "./event.ts";

export async function runCLI(args: string[]): Promise<void> {
  const program = new Command()
    .name("davit")
    .description(
      "CalDAV CLI tool. Full CRUD for calendar events. Dates accept natural language (e.g. 'tomorrow at 3pm', 'next friday') or ISO 8601.",
    )
    .version("1.0.0")
    .action(function () {
      this.showHelp();
    })
    .command("calendar", calendarCommand)
    .command("config", configCommand)
    .command("event", eventCommand);

  await program.parse(args);
}
