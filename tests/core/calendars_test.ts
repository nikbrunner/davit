import { assertEquals } from "@std/assert";
import { mapCalendars } from "../../src/core/calendars.ts";

Deno.test("mapCalendars: maps DAVCalendar array to DavitCalendar array", () => {
  const davCalendars = [
    {
      url: "https://caldav.icloud.com/123/calendars/home/",
      displayName: "Home",
      description: "Personal calendar",
      ctag: "abc123",
    },
    {
      url: "https://caldav.icloud.com/123/calendars/work/",
      displayName: "Work",
    },
  ];

  const result = mapCalendars(davCalendars);
  assertEquals(result.length, 2);
  assertEquals(result[0]?.displayName, "Home");
  assertEquals(result[0]?.description, "Personal calendar");
  assertEquals(result[1]?.displayName, "Work");
  assertEquals(result[1]?.description, undefined);
});

Deno.test("mapCalendars: handles empty array", () => {
  assertEquals(mapCalendars([]).length, 0);
});
