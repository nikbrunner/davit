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

/** davit configuration */
export interface DavitConfig {
  defaultServer: string;
  defaultCalendar?: string;
  servers: Record<string, ServerConfig>;
}

export interface ServerConfig {
  url: string;
  username: string;
  password?: string;
}
