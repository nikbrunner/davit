import type {
  DavitAddressBook,
  DavitCalendar,
  DavitContact,
  DavitEvent,
} from "../core/types.ts";

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
  if (event.location) lines.push(`Location:    ${event.location}`);
  if (event.eventUrl) lines.push(`URL:         ${event.eventUrl}`);
  lines.push(`Calendar:    ${event.calendarUrl}`);
  return lines.join("\n");
}

export function formatAddressBooks(
  addressBooks: DavitAddressBook[],
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(addressBooks, null, 2);

  if (addressBooks.length === 0) return "No address books found.";

  const lines = addressBooks.map(
    (ab) =>
      `  ${ab.displayName}${ab.description ? ` — ${ab.description}` : ""}`,
  );
  return `Address Books:\n${lines.join("\n")}`;
}

export function formatContacts(
  contacts: DavitContact[],
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(contacts, null, 2);

  if (contacts.length === 0) return "No contacts found.";

  const lines = contacts.map((c) => {
    const details = [c.phone, c.email].filter(Boolean).join("  ");
    return `  ${c.fullName}${details ? `  ${details}` : ""}  [${
      c.uid.substring(0, 8)
    }]`;
  });
  return `Contacts:\n${lines.join("\n")}`;
}

export function formatContact(
  contact: DavitContact,
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(contact, null, 2);

  const lines = [
    `Name:         ${contact.fullName}`,
    `UID:          ${contact.uid}`,
  ];
  if (contact.phone) lines.push(`Phone:        ${contact.phone}`);
  if (contact.email) lines.push(`Email:        ${contact.email}`);
  if (contact.organization) lines.push(`Organization: ${contact.organization}`);
  if (contact.address) lines.push(`Address:      ${contact.address}`);
  if (contact.note) lines.push(`Note:         ${contact.note}`);
  lines.push(`Address Book: ${contact.addressBookUrl}`);
  return lines.join("\n");
}
