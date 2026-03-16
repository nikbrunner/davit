import type { DavitCalendar } from "./types.ts";
import type { DavitClient } from "./client.ts";

// deno-lint-ignore no-explicit-any
type DAVCalendarLike = Record<string, any>;

/** Map raw DAV calendar objects to DavitCalendar */
export function mapCalendars(raw: DAVCalendarLike[]): DavitCalendar[] {
  return raw.map((cal) => ({
    url: cal.url ?? "",
    displayName: cal.displayName ?? "Untitled",
    description: cal.description || undefined,
    ctag: cal.ctag || undefined,
  }));
}

/** Fetch all calendars from the server */
export async function listCalendars(
  client: DavitClient,
): Promise<DavitCalendar[]> {
  const calendars = await client.fetchCalendars();
  return mapCalendars(calendars);
}

/** Find a calendar by display name (case-insensitive) */
export async function findCalendar(
  client: DavitClient,
  name: string,
): Promise<DavitCalendar | undefined> {
  const calendars = await listCalendars(client);
  return calendars.find(
    (c) => c.displayName.toLowerCase() === name.toLowerCase(),
  );
}
