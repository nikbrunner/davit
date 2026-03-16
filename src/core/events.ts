import type {
  CreateEventInput,
  DavitEvent,
  UpdateEventInput,
} from "./types.ts";
import type { DavitClient } from "./client.ts";
import { buildVEvent, parseVEvent } from "./ical.ts";

// deno-lint-ignore no-explicit-any
type DAVCalendarObjectLike = Record<string, any>;

/** Map a single DAV calendar object to a DavitEvent */
export function mapEvent(
  raw: DAVCalendarObjectLike,
  calendarUrl: string,
): DavitEvent {
  const parsed = parseVEvent(raw.data ?? "");
  return {
    uid: parsed.uid,
    title: parsed.summary,
    start: parsed.start,
    end: parsed.end,
    description: parsed.description,
    calendarUrl,
    url: raw.url ?? "",
    etag: raw.etag,
  };
}

/** Map and sort an array of DAV calendar objects */
export function mapEvents(
  rawObjects: DAVCalendarObjectLike[],
  calendarUrl: string,
): DavitEvent[] {
  return rawObjects
    .filter((obj) => obj.data)
    .map((obj) => mapEvent(obj, calendarUrl))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** List events in a time range from a specific calendar */
export async function listEvents(
  client: DavitClient,
  calendar: { url: string },
  timeRange: { start: string; end: string },
): Promise<DavitEvent[]> {
  const objects = await client.fetchCalendarObjects({
    calendar: calendar as Parameters<
      DavitClient["fetchCalendarObjects"]
    >[0]["calendar"],
    timeRange: {
      start: timeRange.start,
      end: timeRange.end,
    },
  });
  return mapEvents(objects, calendar.url);
}

/** Get a single event by UID — searches across calendar objects */
export async function getEvent(
  client: DavitClient,
  calendar: { url: string },
  uid: string,
): Promise<DavitEvent | undefined> {
  const objects = await client.fetchCalendarObjects({
    calendar: calendar as Parameters<
      DavitClient["fetchCalendarObjects"]
    >[0]["calendar"],
  });
  const events = mapEvents(objects, calendar.url);
  return events.find((e) => e.uid === uid);
}

/** Build the payload for creating a new event (without calling tsdav) */
export function buildCreatePayload(input: CreateEventInput): {
  filename: string;
  iCalString: string;
  uid: string;
} {
  const uid = crypto.randomUUID();
  const iCalString = buildVEvent({
    uid,
    summary: input.title,
    start: input.start,
    end: input.end,
    description: input.description,
  });
  return { filename: `${uid}.ics`, iCalString, uid };
}

/** Build the payload for updating an event — merges existing with changes */
export function buildUpdatePayload(
  existing: DavitEvent,
  updates: UpdateEventInput,
): { iCalString: string } {
  const iCalString = buildVEvent({
    uid: existing.uid,
    summary: updates.title ?? existing.title,
    start: updates.start ?? existing.start,
    end: updates.end ?? existing.end,
    description: updates.description ?? existing.description,
  });
  return { iCalString };
}

/** Create a new event on the server */
export async function createEvent(
  client: DavitClient,
  calendar: { url: string },
  input: CreateEventInput,
): Promise<DavitEvent> {
  const { filename, iCalString, uid } = buildCreatePayload(input);

  await client.createCalendarObject({
    calendar: calendar as Parameters<
      DavitClient["createCalendarObject"]
    >[0]["calendar"],
    filename,
    iCalString,
  });

  return {
    uid,
    title: input.title,
    start: input.start,
    end: input.end,
    description: input.description,
    calendarUrl: calendar.url,
    url: `${calendar.url}${filename}`,
    etag: undefined,
  };
}

/** Update an existing event on the server */
export async function updateEvent(
  client: DavitClient,
  existing: DavitEvent,
  updates: UpdateEventInput,
): Promise<DavitEvent> {
  const { iCalString } = buildUpdatePayload(existing, updates);

  await client.updateCalendarObject({
    calendarObject: {
      url: existing.url,
      data: iCalString,
      etag: existing.etag ?? "",
    },
  });

  return {
    ...existing,
    title: updates.title ?? existing.title,
    start: updates.start ?? existing.start,
    end: updates.end ?? existing.end,
    description: updates.description ?? existing.description,
  };
}

/** Delete an event from the server */
export async function deleteEvent(
  client: DavitClient,
  event: DavitEvent,
): Promise<void> {
  await client.deleteCalendarObject({
    calendarObject: {
      url: event.url,
      etag: event.etag ?? "",
    },
  });
}
