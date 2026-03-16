import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  formatCalendars,
  formatEvent,
  formatEvents,
} from "../../src/cli/format.ts";
import type { DavitCalendar, DavitEvent } from "../../src/core/types.ts";

const sampleCalendar: DavitCalendar = {
  url: "https://example.com/cal/home/",
  displayName: "Home",
  description: "Personal",
};

const sampleEvent: DavitEvent = {
  uid: "abcdef12-3456-7890-abcd-ef1234567890",
  title: "Standup",
  start: "2026-03-17T09:00:00Z",
  end: "2026-03-17T09:15:00Z",
  description: "Daily standup notes",
  calendarUrl: "https://example.com/cal/home/",
  url: "https://example.com/cal/home/abcdef12.ics",
  etag: '"e1"',
};

Deno.test("formatCalendars: json format returns valid JSON", () => {
  const result = formatCalendars([sampleCalendar], "json");
  const parsed = JSON.parse(result);
  assertEquals(parsed[0].displayName, "Home");
});

Deno.test("formatCalendars: table format shows display names", () => {
  const result = formatCalendars([sampleCalendar], "table");
  assertStringIncludes(result, "Home");
  assertStringIncludes(result, "Personal");
});

Deno.test("formatCalendars: empty array shows message", () => {
  const result = formatCalendars([], "table");
  assertEquals(result, "No calendars found.");
});

Deno.test("formatEvents: json format returns valid JSON array", () => {
  const result = formatEvents([sampleEvent], "json");
  const parsed = JSON.parse(result);
  assertEquals(parsed[0].title, "Standup");
});

Deno.test("formatEvents: table format shows title and short UID", () => {
  const result = formatEvents([sampleEvent], "table");
  assertStringIncludes(result, "Standup");
  assertStringIncludes(result, "[abcdef12]");
});

Deno.test("formatEvents: empty array shows message", () => {
  assertEquals(formatEvents([], "table"), "No events found.");
});

Deno.test("formatEvent: json format returns valid JSON object", () => {
  const result = formatEvent(sampleEvent, "json");
  const parsed = JSON.parse(result);
  assertEquals(parsed.uid, sampleEvent.uid);
});

Deno.test("formatEvent: table format shows all fields", () => {
  const result = formatEvent(sampleEvent, "table");
  assertStringIncludes(result, "Title:       Standup");
  assertStringIncludes(result, "UID:");
  assertStringIncludes(result, "Start:");
  assertStringIncludes(result, "End:");
  assertStringIncludes(result, "Description: Daily standup notes");
});

Deno.test("formatEvent: table format omits description when absent", () => {
  const noDesc = { ...sampleEvent, description: undefined };
  const result = formatEvent(noDesc, "table");
  assertEquals(result.includes("Description:"), false);
});
