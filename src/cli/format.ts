import type { DavitCalendar, DavitEvent } from "../core/types.ts";

export type OutputFormat = "json" | "table";

export function formatCalendars(
  calendars: DavitCalendar[],
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(calendars, null, 2);

  if (calendars.length === 0) return "No calendars found.";

  const lines = calendars.map(
    (c) => `  ${c.displayName}${c.description ? ` — ${c.description}` : ""}`,
  );
  return `Calendars:\n${lines.join("\n")}`;
}

export function formatEvents(
  events: DavitEvent[],
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(events, null, 2);

  if (events.length === 0) return "No events found.";

  const lines = events.map((e) => {
    const start = new Date(e.start);
    const time = start.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `  ${time}  ${e.title}  [${e.uid.substring(0, 8)}]`;
  });
  return `Events:\n${lines.join("\n")}`;
}

export function formatEvent(
  event: DavitEvent,
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(event, null, 2);

  const lines = [
    `Title:       ${event.title}`,
    `UID:         ${event.uid}`,
    `Start:       ${event.start}`,
    `End:         ${event.end}`,
  ];
  if (event.description) lines.push(`Description: ${event.description}`);
  lines.push(`Calendar:    ${event.calendarUrl}`);
  return lines.join("\n");
}
