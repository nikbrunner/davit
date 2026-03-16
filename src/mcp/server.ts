import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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

export async function runMCP(): Promise<void> {
  const server = new McpServer({
    name: "davit",
    version: "0.1.0",
  });

  // Lazy-init client (created on first tool call)
  let _client: Awaited<ReturnType<typeof createClient>> | null = null;
  async function getClient() {
    if (!_client) {
      const config = await loadConfig();
      _client = await createClient(config);
    }
    return _client;
  }

  server.tool(
    "list_calendars",
    "List all available calendars",
    {},
    async () => {
      const client = await getClient();
      const calendars = await listCalendars(client);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(calendars, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "list_events",
    "List events in a time range",
    {
      from: z.string().describe("Start of range (ISO 8601)"),
      to: z.string().describe("End of range (ISO 8601)"),
      calendar: z.string().optional().describe("Calendar name"),
    },
    async (args) => {
      const client = await getClient();
      const cal = args.calendar
        ? await findCalendar(client, args.calendar)
        : (await listCalendars(client))[0];
      if (!cal) {
        return {
          content: [{ type: "text" as const, text: "Calendar not found." }],
          isError: true,
        };
      }
      const events = await listEvents(client, cal, {
        start: args.from,
        end: args.to,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(events, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "show_event",
    "Show full event details including description",
    {
      uid: z.string().describe("Event UID"),
      calendar: z.string().optional().describe("Calendar name to search in"),
    },
    async (args) => {
      const client = await getClient();
      const calendars = args.calendar
        ? [await findCalendar(client, args.calendar)].filter(Boolean)
        : await listCalendars(client);

      for (const cal of calendars) {
        if (!cal) continue;
        const event = await getEvent(client, cal, args.uid);
        if (event) {
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(event, null, 2) },
            ],
          };
        }
      }
      return {
        content: [
          { type: "text" as const, text: `Event "${args.uid}" not found.` },
        ],
        isError: true,
      };
    },
  );

  server.tool(
    "create_event",
    "Create a new calendar event",
    {
      title: z.string().describe("Event title"),
      start: z.string().describe("Start time (ISO 8601, UTC)"),
      end: z.string().describe("End time (ISO 8601, UTC)"),
      description: z.string().optional().describe("Event description/notes"),
      calendar: z.string().optional().describe("Calendar name"),
    },
    async (args) => {
      const client = await getClient();
      const cal = args.calendar
        ? await findCalendar(client, args.calendar)
        : (await listCalendars(client))[0];
      if (!cal) {
        return {
          content: [{ type: "text" as const, text: "Calendar not found." }],
          isError: true,
        };
      }
      const event = await createEvent(client, cal, {
        title: args.title,
        start: args.start,
        end: args.end,
        description: args.description,
        calendarUrl: cal.url,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(event, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "update_event",
    "Update an existing calendar event",
    {
      uid: z.string().describe("Event UID"),
      title: z.string().optional().describe("New title"),
      start: z.string().optional().describe("New start time (ISO 8601)"),
      end: z.string().optional().describe("New end time (ISO 8601)"),
      description: z.string().optional().describe("New description"),
    },
    async (args) => {
      const client = await getClient();
      const calendars = await listCalendars(client);

      for (const cal of calendars) {
        const existing = await getEvent(client, cal, args.uid);
        if (existing) {
          const updated = await updateEvent(client, existing, {
            uid: args.uid,
            title: args.title,
            start: args.start,
            end: args.end,
            description: args.description,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(updated, null, 2) },
            ],
          };
        }
      }
      return {
        content: [
          { type: "text" as const, text: `Event "${args.uid}" not found.` },
        ],
        isError: true,
      };
    },
  );

  server.tool(
    "delete_event",
    "Delete a calendar event",
    {
      uid: z.string().describe("Event UID"),
    },
    async (args) => {
      const client = await getClient();
      const calendars = await listCalendars(client);

      for (const cal of calendars) {
        const event = await getEvent(client, cal, args.uid);
        if (event) {
          await deleteEvent(client, event);
          return {
            content: [
              {
                type: "text" as const,
                text: `Deleted event "${event.title}" (${event.uid})`,
              },
            ],
          };
        }
      }
      return {
        content: [
          { type: "text" as const, text: `Event "${args.uid}" not found.` },
        ],
        isError: true,
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
