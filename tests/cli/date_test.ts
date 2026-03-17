import { assertEquals, assertThrows } from "@std/assert";
import { parseDate } from "../../src/cli/date.ts";

// Freeze "now" for deterministic tests
const NOW = new Date("2026-03-17T12:00:00Z");

Deno.test("parseDate: ISO 8601 passthrough", () => {
  const result = parseDate("2026-03-17T15:00:00Z", { now: NOW });
  assertEquals(result, "2026-03-17T15:00:00.000Z");
});

Deno.test("parseDate: date-only ISO passthrough", () => {
  const result = parseDate("2026-03-17", { now: NOW });
  assertEquals(new Date(result).toISOString().startsWith("2026-03-17"), true);
});

Deno.test("parseDate: 'today' resolves to today", () => {
  const result = parseDate("today", { now: NOW });
  assertEquals(result.startsWith("2026-03-17"), true);
});

Deno.test("parseDate: 'tomorrow' resolves to next day", () => {
  const result = parseDate("tomorrow", { now: NOW });
  assertEquals(result.startsWith("2026-03-18"), true);
});

Deno.test("parseDate: 'tomorrow at 3pm' includes time", () => {
  const result = parseDate("tomorrow at 3pm", {
    now: NOW,
    timezone: "UTC",
  });
  assertEquals(result, "2026-03-18T15:00:00.000Z");
});

Deno.test("parseDate: 'in 2 hours' adds to now", () => {
  const result = parseDate("in 2 hours", { now: NOW });
  assertEquals(result, "2026-03-17T14:00:00.000Z");
});

Deno.test("parseDate: timezone affects UTC output", () => {
  // "tomorrow at 3pm" in Berlin (UTC+1) should be 14:00 UTC
  const berlin = parseDate("tomorrow at 3pm", {
    now: NOW,
    timezone: "Europe/Berlin",
  });
  assertEquals(berlin, "2026-03-18T14:00:00.000Z");

  // Same input in UTC should be 15:00 UTC
  const utc = parseDate("tomorrow at 3pm", {
    now: NOW,
    timezone: "UTC",
  });
  assertEquals(utc, "2026-03-18T15:00:00.000Z");
});

Deno.test("parseDate: invalid input throws helpful error", () => {
  assertThrows(
    () => parseDate("gibberish", { now: NOW }),
    Error,
    "Cannot parse date",
  );
});
