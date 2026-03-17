import { Command } from "@cliffy/command";
import { loadConfig } from "../config.ts";
import { parseDate } from "./date.ts";
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
import type { DavitEvent } from "../core/types.ts";

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

/** Resolve event by UID — searches all calendars or a specific one */
async function resolveEvent(
  client: DavitClient,
  uid: string,
  calendarName?: string,
  defaultCalendar?: string,
) {
  const calendars = calendarName || defaultCalendar
    ? [await resolveCalendar(client, calendarName, defaultCalendar)]
    : await listCalendars(client);

  for (const cal of calendars) {
    const event = await getEvent(client, cal, uid);
    if (event) return event;
  }
  console.error(`Event "${uid}" not found.`);
  Deno.exit(2);
}

const listCommand = new Command()
  .description("List events in a time range")
  .option("--from <date:string>", "Start date (natural language or ISO 8601)", {
    default: new Date().toISOString(),
  })
  .option("--to <date:string>", "End date (natural language or ISO 8601)", {
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
      const parsedFrom = parseDate(from, { timezone: config.timezone });
      const parsedTo = parseDate(to, { timezone: config.timezone });
      const client = await createClient(config);

      if (!calendar && !config.defaultCalendar) {
        // No calendar specified — aggregate from all
        const calendars = await listCalendars(client);
        const allEvents: DavitEvent[] = [];
        for (const cal of calendars) {
          const events = await listEvents(client, cal, {
            start: parsedFrom,
            end: parsedTo,
          });
          allEvents.push(...events);
        }
        allEvents.sort((a, b) => a.start.localeCompare(b.start));
        console.log(formatEvents(allEvents, format as OutputFormat));
        return;
      }

      const cal = await resolveCalendar(
        client,
        calendar,
        config.defaultCalendar,
      );
      const events = await listEvents(client, cal, {
        start: parsedFrom,
        end: parsedTo,
      });
      console.log(formatEvents(events, format as OutputFormat));
    },
  );

const showCommand = new Command()
  .description("Show full event details")
  .arguments("<uid:string>")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .option("--calendar <name:string>", "Calendar to search in")
  .action(
    async (
      { format, calendar }: { format: string; calendar?: string },
      uid: string,
    ) => {
      const config = await loadConfig();
      const client = await createClient(config);
      const event = await resolveEvent(
        client,
        uid,
        calendar,
        config.defaultCalendar,
      );
      console.log(formatEvent(event, format as OutputFormat));
    },
  );

const createCommand = new Command()
  .description("Create a new event")
  .arguments("<title:string>")
  .option(
    "--start <datetime:string>",
    "Start time (natural language or ISO 8601)",
    {
      required: true,
    },
  )
  .option(
    "--end <datetime:string>",
    "End time (natural language or ISO 8601)",
    {
      required: true,
    },
  )
  .option("--desc <text:string>", "Event description")
  .option("--location <place:string>", "Event location")
  .option("--url <link:string>", "Event URL (meeting link)")
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
        location,
        url,
        calendar,
        format,
      }: {
        start: string;
        end: string;
        desc?: string;
        location?: string;
        url?: string;
        calendar?: string;
        format: string;
      },
      title: string,
    ) => {
      const config = await loadConfig();
      const parsedStart = parseDate(start, { timezone: config.timezone });
      const parsedEnd = parseDate(end, { timezone: config.timezone });
      const client = await createClient(config);
      const cal = await resolveCalendar(
        client,
        calendar,
        config.defaultCalendar,
      );
      const event = await createEvent(client, cal, {
        title,
        start: parsedStart,
        end: parsedEnd,
        description: desc,
        location,
        eventUrl: url,
        calendarUrl: cal.url,
      });
      console.log(formatEvent(event, format as OutputFormat));
    },
  );

const updateCommand = new Command()
  .description("Update an existing event")
  .arguments("<uid:string>")
  .option("--title <text:string>", "New title")
  .option(
    "--start <datetime:string>",
    "New start time (natural language or ISO 8601)",
  )
  .option(
    "--end <datetime:string>",
    "New end time (natural language or ISO 8601)",
  )
  .option("--desc <text:string>", "New description")
  .option("--location <place:string>", "Event location")
  .option("--url <link:string>", "Event URL (meeting link)")
  .option("--calendar <name:string>", "Calendar to search in")
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
        location,
        url,
        calendar,
        format,
      }: {
        title?: string;
        start?: string;
        end?: string;
        desc?: string;
        location?: string;
        url?: string;
        calendar?: string;
        format: string;
      },
      uid: string,
    ) => {
      const config = await loadConfig();
      const parsedStart = start
        ? parseDate(start, { timezone: config.timezone })
        : undefined;
      const parsedEnd = end
        ? parseDate(end, { timezone: config.timezone })
        : undefined;
      const client = await createClient(config);
      const existing = await resolveEvent(
        client,
        uid,
        calendar,
        config.defaultCalendar,
      );
      const updated = await updateEvent(client, existing, {
        uid,
        title,
        start: parsedStart,
        end: parsedEnd,
        description: desc,
        location,
        eventUrl: url,
      });
      console.log(formatEvent(updated, format as OutputFormat));
    },
  );

const deleteCommand = new Command()
  .description("Delete an event")
  .arguments("<uid:string>")
  .option("--calendar <name:string>", "Calendar to search in")
  .action(
    async ({ calendar }: { calendar?: string }, uid: string) => {
      const config = await loadConfig();
      const client = await createClient(config);
      const event = await resolveEvent(
        client,
        uid,
        calendar,
        config.defaultCalendar,
      );
      await deleteEvent(client, event);
      console.log(`Deleted event "${event.title}" (${event.uid})`);
    },
  );

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
