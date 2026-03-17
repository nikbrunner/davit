import { Command } from "@cliffy/command";
import { calendarCommand } from "./calendar.ts";
import { eventCommand } from "./event.ts";

export async function runCLI(args: string[]): Promise<void> {
  const program = new Command()
    .name("davit")
    .description("CalDAV CLI tool for iCloud")
    .version("0.1.0")
    .action(function () {
      this.showHelp();
    })
    .command("calendar", calendarCommand)
    .command("event", eventCommand);

  await program.parse(args);
}
