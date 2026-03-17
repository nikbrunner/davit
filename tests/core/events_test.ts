import { assertEquals, assertStringIncludes } from "@std/assert";
import type { DavitEvent } from "../../src/core/types.ts";
import {
  buildCreatePayload,
  buildUpdatePayload,
  mapEvent,
  mapEvents,
} from "../../src/core/events.ts";

const sampleIcal = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:evt-001",
  "SUMMARY:Standup",
  "DTSTART:20260317T090000Z",
  "DTEND:20260317T091500Z",
  "DESCRIPTION:Daily standup",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

Deno.test("mapEvent: converts DAVCalendarObject to DavitEvent", () => {
  const raw = {
    url: "https://caldav.example.com/cal/evt-001.ics",
    data: sampleIcal,
    etag: '"etag123"',
  };

  const event = mapEvent(raw, "https://caldav.example.com/cal/");
  assertEquals(event.uid, "evt-001");
  assertEquals(event.title, "Standup");
  assertEquals(event.start, "2026-03-17T09:00:00Z");
  assertEquals(event.end, "2026-03-17T09:15:00Z");
  assertEquals(event.description, "Daily standup");
  assertEquals(event.url, raw.url);
  assertEquals(event.etag, '"etag123"');
});

Deno.test("mapEvents: maps array and sorts by start time", () => {
  const earlyIcal = sampleIcal;
  const lateIcal = sampleIcal
    .replace("UID:evt-001", "UID:evt-002")
    .replace("SUMMARY:Standup", "SUMMARY:Lunch")
    .replace("DTSTART:20260317T090000Z", "DTSTART:20260317T120000Z")
    .replace("DTEND:20260317T091500Z", "DTEND:20260317T130000Z");

  const rawObjects = [
    { url: "/cal/evt-002.ics", data: lateIcal, etag: '"e2"' },
    { url: "/cal/evt-001.ics", data: earlyIcal, etag: '"e1"' },
  ];

  const events = mapEvents(rawObjects, "/cal/");
  assertEquals(events.length, 2);
  assertEquals(events[0]?.title, "Standup");
  assertEquals(events[1]?.title, "Lunch");
});

Deno.test("buildCreatePayload: produces filename and iCalString", () => {
  const payload = buildCreatePayload({
    title: "New Meeting",
    start: "2026-03-18T14:00:00Z",
    end: "2026-03-18T15:00:00Z",
    description: "Agenda items",
    calendarUrl: "https://example.com/cal/",
  });

  assertEquals(payload.filename.endsWith(".ics"), true);
  assertStringIncludes(payload.iCalString, "SUMMARY:New Meeting");
  assertStringIncludes(payload.iCalString, "DESCRIPTION:Agenda items");
});

Deno.test("mapEvent: extracts location and url", () => {
  const ical = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:loc-map",
    "SUMMARY:Meeting",
    "DTSTART:20260317T150000Z",
    "DTEND:20260317T160000Z",
    "LOCATION:Room 42",
    "URL:https://zoom.us/j/999",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const event = mapEvent(
    { url: "/cal/loc.ics", data: ical, etag: '"e1"' },
    "/cal/",
  );
  assertEquals(event.location, "Room 42");
  assertEquals(event.eventUrl, "https://zoom.us/j/999");
});

Deno.test("buildUpdatePayload: merges existing event with updates", () => {
  const existing: DavitEvent = {
    uid: "existing-123",
    title: "Old Title",
    start: "2026-03-17T10:00:00Z",
    end: "2026-03-17T11:00:00Z",
    description: "Old notes",
    calendarUrl: "/cal/",
    url: "/cal/existing-123.ics",
    etag: '"etag1"',
  };

  const payload = buildUpdatePayload(existing, {
    uid: "existing-123",
    title: "New Title",
  });
  assertStringIncludes(payload.iCalString, "SUMMARY:New Title");
  assertStringIncludes(payload.iCalString, "UID:existing-123");
  assertStringIncludes(payload.iCalString, "DESCRIPTION:Old notes");
});
