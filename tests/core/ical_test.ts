import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildVEvent, parseVEvent } from "../../src/core/ical.ts";

Deno.test("buildVEvent: produces valid VCALENDAR with required fields", () => {
  const ical = buildVEvent({
    uid: "test-uid-123",
    summary: "Team Meeting",
    start: "2026-03-17T15:00:00Z",
    end: "2026-03-17T15:30:00Z",
  });

  assertStringIncludes(ical, "BEGIN:VCALENDAR");
  assertStringIncludes(ical, "VERSION:2.0");
  assertStringIncludes(ical, "PRODID:-//davit//EN");
  assertStringIncludes(ical, "BEGIN:VEVENT");
  assertStringIncludes(ical, "UID:test-uid-123");
  assertStringIncludes(ical, "SUMMARY:Team Meeting");
  assertStringIncludes(ical, "DTSTART:20260317T150000Z");
  assertStringIncludes(ical, "DTEND:20260317T153000Z");
  assertStringIncludes(ical, "STATUS:CONFIRMED");
  assertStringIncludes(ical, "END:VEVENT");
  assertStringIncludes(ical, "END:VCALENDAR");
});

Deno.test("buildVEvent: includes description when provided", () => {
  const ical = buildVEvent({
    uid: "test-uid-456",
    summary: "Lunch",
    start: "2026-03-17T12:00:00Z",
    end: "2026-03-17T13:00:00Z",
    description: "At the Italian place",
  });

  assertStringIncludes(ical, "DESCRIPTION:At the Italian place");
});

Deno.test("buildVEvent: escapes special characters in description", () => {
  const ical = buildVEvent({
    uid: "test-uid-789",
    summary: "Notes",
    start: "2026-03-17T10:00:00Z",
    end: "2026-03-17T11:00:00Z",
    description: "Line 1\nLine 2; with semicolon, and comma",
  });

  assertStringIncludes(
    ical,
    "DESCRIPTION:Line 1\\nLine 2\\; with semicolon\\, and comma",
  );
});

Deno.test("buildVEvent: generates UID when not provided", () => {
  const ical = buildVEvent({
    summary: "Auto UID",
    start: "2026-03-17T10:00:00Z",
    end: "2026-03-17T11:00:00Z",
  });

  assertStringIncludes(ical, "UID:");
  const uidMatch = ical.match(/UID:(.+)/);
  assertEquals(Array.isArray(uidMatch) && (uidMatch[1]?.length ?? 0) > 0, true);
});

Deno.test("parseVEvent: extracts fields from iCalendar string", () => {
  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "UID:parse-test-123",
    "SUMMARY:Parsed Event",
    "DTSTART:20260317T150000Z",
    "DTEND:20260317T160000Z",
    "DESCRIPTION:Some notes\\nWith newline",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const event = parseVEvent(ical);
  assertEquals(event.uid, "parse-test-123");
  assertEquals(event.summary, "Parsed Event");
  assertEquals(event.start, "2026-03-17T15:00:00Z");
  assertEquals(event.end, "2026-03-17T16:00:00Z");
  assertEquals(event.description, "Some notes\nWith newline");
});

Deno.test("parseVEvent: handles missing optional fields", () => {
  const ical = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:minimal-123",
    "SUMMARY:Minimal",
    "DTSTART:20260317T150000Z",
    "DTEND:20260317T160000Z",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const event = parseVEvent(ical);
  assertEquals(event.uid, "minimal-123");
  assertEquals(event.description, undefined);
});

Deno.test("parseVEvent: unfolds continuation lines", () => {
  const ical = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:fold-test-1",
    "SUMMARY:Folded Event",
    "DTSTART:20260317T150000Z",
    "DTEND:20260317T160000Z",
    "DESCRIPTION:This is a very long description that has been folded",
    "  across multiple lines by the server per RFC 5545 line folding rules",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const event = parseVEvent(ical);
  assertEquals(
    event.description,
    "This is a very long description that has been folded" +
      " across multiple lines by the server per RFC 5545 line folding rules",
  );
});

Deno.test("buildVEvent: includes DTSTAMP", () => {
  const ical = buildVEvent({
    uid: "dtstamp-test",
    summary: "Test",
    start: "2026-03-17T10:00:00Z",
    end: "2026-03-17T11:00:00Z",
  });

  // DTSTAMP should be present with UTC format
  const match = ical.match(/DTSTAMP:(\d{8}T\d{6}Z)/);
  assertEquals(match !== null, true);
});

Deno.test("buildVEvent: folds long lines at 75 octets", () => {
  const longDesc = "A".repeat(100);
  const ical = buildVEvent({
    uid: "fold-build-test",
    summary: "Test",
    start: "2026-03-17T10:00:00Z",
    end: "2026-03-17T11:00:00Z",
    description: longDesc,
  });

  // Check that no raw line exceeds 75 bytes
  // We need to split on \r\n to get raw lines (including continuation lines)
  const rawLines = ical.split("\r\n");
  for (const line of rawLines) {
    const byteLength = new TextEncoder().encode(line).length;
    assertEquals(
      byteLength <= 75,
      true,
      `Line too long (${byteLength} bytes): ${line.substring(0, 40)}...`,
    );
  }

  // Verify the description round-trips correctly through unfold+parse
  const parsed = parseVEvent(ical);
  assertEquals(parsed.description, longDesc);
});

Deno.test("parseVEvent: handles TZID-parameterized datetimes", () => {
  const ical = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:tzid-123",
    "SUMMARY:Local Time Event",
    "DTSTART;TZID=Europe/Berlin:20260317T090000",
    "DTEND;TZID=Europe/Berlin:20260317T100000",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const event = parseVEvent(ical);
  assertEquals(event.uid, "tzid-123");
  assertEquals(event.start, "2026-03-17T09:00:00");
  assertEquals(event.end, "2026-03-17T10:00:00");
});
