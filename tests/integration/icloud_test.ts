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
import { createCardDAVClient } from "../../src/core/client.ts";
import {
  findAddressBook,
  listAddressBooks,
} from "../../src/core/addressBooks.ts";
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "../../src/core/contacts.ts";

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

Deno.test({
  name: "integration: full CardDAV CRUD cycle against iCloud",
  ignore: !hasCredentials,
  async fn() {
    const config = await loadConfig();
    const client = await createCardDAVClient(config);

    // 1. List address books
    const addressBooks = await listAddressBooks(client);
    assertEquals(
      addressBooks.length > 0,
      true,
      "Should have at least one address book",
    );

    // 2. Find default address book (iCloud usually has "Contacts")
    const ab = await findAddressBook(client, "Contacts") ?? addressBooks[0]!;

    // 3. Create contact
    const created = await createContact(client, ab, {
      fullName: "davit Integration Test",
      firstName: "Integration",
      lastName: "Test",
      phone: "+49 000 000000",
      email: "davit-test@example.com",
      note: "Automated test — safe to delete",
      addressBookUrl: ab.url,
    });
    assertEquals(created.fullName, "davit Integration Test");
    assertEquals(created.uid.length > 0, true);

    try {
      // 4. Show contact
      const found = await getContact(client, ab, created.uid);
      assertEquals(found?.fullName, "davit Integration Test");
      assertEquals(found?.phone, "+49 000 000000");

      // 5. Update contact
      const updated = await updateContact(client, found!, {
        uid: found!.uid,
        fullName: "davit Test UPDATED",
        email: "updated@example.com",
      });
      assertEquals(updated.fullName, "davit Test UPDATED");

      // 6. List contacts — should include our contact
      const contacts = await listContacts(client, ab);
      const inList = contacts.find((c) => c.uid === created.uid);
      assertEquals(
        inList !== undefined,
        true,
        "Created contact should appear in list",
      );

      // 7. Delete contact
      const toDelete = await getContact(client, ab, created.uid);
      await deleteContact(client, toDelete!);

      // 8. Verify deleted
      const afterDelete = await getContact(client, ab, created.uid);
      assertEquals(
        afterDelete,
        undefined,
        "Contact should be gone after delete",
      );
    } catch (err) {
      // Cleanup on failure
      try {
        const cleanup = await getContact(client, ab, created.uid);
        if (cleanup) await deleteContact(client, cleanup);
      } catch {
        // ignore cleanup errors
      }
      throw err;
    }
  },
});
