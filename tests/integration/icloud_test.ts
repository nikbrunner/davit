import { assertEquals } from "@std/assert";
import { loadConfig } from "../../src/config.ts";
import { createClient } from "../../src/core/client.ts";
import { findCalendar, listCalendars } from "../../src/core/calendars.ts";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../../src/core/events.ts";

// Skip if no credentials
const hasCredentials = !!Deno.env.get("CALDAV_BASE_URL") &&
  !!Deno.env.get("CALDAV_USERNAME") &&
  !!Deno.env.get("CALDAV_PASSWORD");

Deno.test({
  name: "integration: full CRUD cycle against iCloud",
  ignore: !hasCredentials,
  async fn() {
    const config = await loadConfig();
    const client = await createClient(config);

    // 1. List calendars
    const calendars = await listCalendars(client);
    assertEquals(
      calendars.length > 0,
      true,
      "Should have at least one calendar",
    );

    // 2. Find iCloud calendar
    const cal = await findCalendar(client, "iCloud");
    if (!cal) {
      throw new Error(
        "iCloud calendar not found — adjust test for your setup",
      );
    }

    // 3. Create event (far future to avoid polluting real calendar)
    const created = await createEvent(client, cal, {
      title: "davit Integration Test",
      start: "2026-12-31T10:00:00Z",
      end: "2026-12-31T10:30:00Z",
      description: "Automated test — safe to delete",
      calendarUrl: cal.url,
    });
    assertEquals(created.title, "davit Integration Test");
    assertEquals(created.uid.length > 0, true);

    try {
      // 4. Show event
      const found = await getEvent(client, cal, created.uid);
      assertEquals(found?.title, "davit Integration Test");
      assertEquals(found?.description, "Automated test — safe to delete");

      // 5. Update event
      const updated = await updateEvent(client, found!, {
        uid: found!.uid,
        title: "davit Integration Test UPDATED",
        description: "Updated description",
      });
      assertEquals(updated.title, "davit Integration Test UPDATED");

      // 6. List events in range — should include our event
      const events = await listEvents(client, cal, {
        start: "2026-12-31T00:00:00Z",
        end: "2026-12-31T23:59:59Z",
      });
      const inList = events.find((e) => e.uid === created.uid);
      assertEquals(
        inList !== undefined,
        true,
        "Created event should appear in list",
      );

      // 7. Delete event
      const toDelete = await getEvent(client, cal, created.uid);
      await deleteEvent(client, toDelete!);

      // 8. Verify deleted
      const afterDelete = await getEvent(client, cal, created.uid);
      assertEquals(
        afterDelete,
        undefined,
        "Event should be gone after delete",
      );
    } catch (err) {
      // Cleanup on failure — try to delete the test event
      try {
        const cleanup = await getEvent(client, cal, created.uid);
        if (cleanup) await deleteEvent(client, cleanup);
      } catch {
        // ignore cleanup errors
      }
      throw err;
    }
  },
});
