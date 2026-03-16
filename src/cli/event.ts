import { Command } from "@cliffy/command";
import { loadConfig } from "../config.ts";
import { createClient } from "../core/client.ts";
import { findCalendar, listCalendars } from "../core/calendars.ts";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../core/events.ts";
import { formatEvent, formatEvents, type OutputFormat } from "./format.ts";
import type { DavitClient } from "../core/client.ts";

/** Resolve the target calendar — by name or default */
async function resolveCalendar(
  client: DavitClient,
  calendarName?: string,
  defaultCalendar?: string,
) {
  const name = calendarName ?? defaultCalendar;
  if (name) {
    const cal = await findCalendar(client, name);
    if (!cal) {
      console.error(`Calendar "${name}" not found.`);
      Deno.exit(2);
    }
    return cal;
  }
  const calendars = await listCalendars(client);
  if (calendars.length === 0) {
    console.error("No calendars found.");
    Deno.exit(1);
  }
  return calendars[0]!;
}

/** Resolve event by UID — searches all calendars */
async function resolveEvent(client: DavitClient, uid: string) {
  const calendars = await listCalendars(client);
  for (const cal of calendars) {
    const event = await getEvent(client, cal, uid);
    if (event) return event;
  }
  console.error(`Event "${uid}" not found.`);
  Deno.exit(2);
}

const listCommand = new Command()
  .description("List events in a time range")
  .option("--from <date:string>", "Start date (ISO 8601)", {
    default: new Date().toISOString(),
  })
  .option("--to <date:string>", "End date (ISO 8601)", {
    default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })
  .option("--calendar <name:string>", "Calendar name")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async ({
      from,
      to,
      calendar,
      format,
    }: {
      from: string;
      to: string;
      calendar?: string;
      format: string;
    }) => {
      const config = await loadConfig();
      const client = await createClient(config);
      const cal = await resolveCalendar(
        client,
        calendar,
        config.defaultCalendar,
      );
      const events = await listEvents(client, cal, { start: from, end: to });
      console.log(formatEvents(events, format as OutputFormat));
    },
  );

const showCommand = new Command()
  .description("Show full event details")
  .arguments("<uid:string>")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(async ({ format }: { format: string }, uid: string) => {
    const config = await loadConfig();
    const client = await createClient(config);
    const event = await resolveEvent(client, uid);
    console.log(formatEvent(event, format as OutputFormat));
  });

const createCommand = new Command()
  .description("Create a new event")
  .arguments("<title:string>")
  .option("--start <datetime:string>", "Start time (ISO 8601)", {
    required: true,
  })
  .option("--end <datetime:string>", "End time (ISO 8601)", {
    required: true,
  })
  .option("--desc <text:string>", "Event description")
  .option("--calendar <name:string>", "Calendar name")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async (
      {
        start,
        end,
        desc,
        calendar,
        format,
      }: {
        start: string;
        end: string;
        desc?: string;
        calendar?: string;
        format: string;
      },
      title: string,
    ) => {
      const config = await loadConfig();
      const client = await createClient(config);
      const cal = await resolveCalendar(
        client,
        calendar,
        config.defaultCalendar,
      );
      const event = await createEvent(client, cal, {
        title,
        start,
        end,
        description: desc,
        calendarUrl: cal.url,
      });
      console.log(formatEvent(event, format as OutputFormat));
    },
  );

const updateCommand = new Command()
  .description("Update an existing event")
  .arguments("<uid:string>")
  .option("--title <text:string>", "New title")
  .option("--start <datetime:string>", "New start time")
  .option("--end <datetime:string>", "New end time")
  .option("--desc <text:string>", "New description")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async (
      {
        title,
        start,
        end,
        desc,
        format,
      }: {
        title?: string;
        start?: string;
        end?: string;
        desc?: string;
        format: string;
      },
      uid: string,
    ) => {
      const config = await loadConfig();
      const client = await createClient(config);
      const existing = await resolveEvent(client, uid);
      const updated = await updateEvent(client, existing, {
        uid,
        title,
        start,
        end,
        description: desc,
      });
      console.log(formatEvent(updated, format as OutputFormat));
    },
  );

const deleteCommand = new Command()
  .description("Delete an event")
  .arguments("<uid:string>")
  .action(async (_opts: void, uid: string) => {
    const config = await loadConfig();
    const client = await createClient(config);
    const event = await resolveEvent(client, uid);
    await deleteEvent(client, event);
    console.log(`Deleted event "${event.title}" (${event.uid})`);
  });

export const eventCommand = new Command()
  .description("Event operations")
  .action(function () {
    this.showHelp();
  })
  .command("list", listCommand)
  .command("show", showCommand)
  .command("create", createCommand)
  .command("update", updateCommand)
  .command("delete", deleteCommand);
