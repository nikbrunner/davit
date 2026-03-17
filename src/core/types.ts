/** A calendar as returned by davit (simplified from tsdav DAVCalendar) */
export interface DavitCalendar {
  /** Server-side URL */
  url: string;
  /** Display name */
  displayName: string;
  /** Calendar description */
  description?: string;
  /** ctag (change tag) for sync detection */
  ctag?: string;
}

/** An event as returned by davit */
export interface DavitEvent {
  /** Unique event identifier (from VEVENT UID) */
  uid: string;
  /** Event title (SUMMARY) */
  title: string;
  /** Start time ISO 8601 */
  start: string;
  /** End time ISO 8601 */
  end: string;
  /** Event description/notes */
  description?: string;
  /** Event location */
  location?: string;
  /** Event URL (meeting link, etc.) */
  eventUrl?: string;
  /** Calendar URL this event belongs to */
  calendarUrl: string;
  /** Server URL for this event (needed for update/delete) */
  url: string;
  /** ETag for optimistic locking */
  etag?: string;
}

/** Input for creating a new event */
export interface CreateEventInput {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  eventUrl?: string;
  calendarUrl: string;
}

/** Input for updating an event — all fields optional except uid */
export interface UpdateEventInput {
  uid: string;
  title?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
  eventUrl?: string;
}

/** An address book as returned by davit */
export interface DavitAddressBook {
  /** Server-side URL */
  url: string;
  /** Display name */
  displayName: string;
  /** Description */
  description?: string;
  /** ctag for sync detection */
  ctag?: string;
}

/** A contact as returned by davit */
export interface DavitContact {
  /** Unique contact identifier (from VCARD UID) */
  uid: string;
  /** Full name (FN) */
  fullName: string;
  /** Last name (from N property) */
  lastName?: string;
  /** First name (from N property) */
  firstName?: string;
  /** Phone number (TEL) */
  phone?: string;
  /** Email address (EMAIL) */
  email?: string;
  /** Physical address (ADR, formatted) */
  address?: string;
  /** Organization (ORG) */
  organization?: string;
  /** Notes (NOTE) */
  note?: string;
  /** Address book URL this contact belongs to */
  addressBookUrl: string;
  /** Server URL for this contact (needed for update/delete) */
  url: string;
  /** ETag for optimistic locking */
  etag?: string;
}

/** Input for creating a new contact */
export interface CreateContactInput {
  fullName: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  email?: string;
  address?: string;
  organization?: string;
  note?: string;
  addressBookUrl: string;
}

/** Input for updating a contact — all fields optional except uid */
export interface UpdateContactInput {
  uid: string;
  fullName?: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  email?: string;
  address?: string;
  organization?: string;
  note?: string;
}

/** davit configuration */
export interface DavitConfig {
  defaultServer: string;
  defaultCalendar?: string;
  defaultAddressBook?: string;
  /** IANA timezone (e.g. "Europe/Berlin"). Falls back to system timezone. */
  timezone?: string;
  servers: Record<string, ServerConfig>;
}

export interface ServerConfig {
  url: string;
  username: string;
  password?: string;
}
