/** Input for building a VEVENT iCalendar string */
export interface VEventInput {
  uid?: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

/** Parsed VEVENT fields */
export interface VEventParsed {
  uid: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

/** Escape special characters per RFC 5545 */
function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Unescape iCalendar text */
function unescapeIcalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\;/g, ";")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

/** Convert ISO 8601 datetime to iCalendar UTC format: YYYYMMDDTHHMMSSZ */
function toIcalDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${
    pad(d.getUTCDate())
  }T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Convert iCalendar UTC datetime (YYYYMMDDTHHMMSSZ) to ISO 8601 */
function fromIcalDateTime(ical: string): string {
  const m = ical.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return ical;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

/** Build a complete VCALENDAR string with a single VEVENT */
export function buildVEvent(input: VEventInput): string {
  const uid = input.uid ?? crypto.randomUUID();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//davit//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${toIcalDateTime(input.start)}`,
    `DTEND:${toIcalDateTime(input.end)}`,
    `SUMMARY:${escapeIcalText(input.summary)}`,
    "STATUS:CONFIRMED",
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcalText(input.description)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Parse a VCALENDAR string and extract the first VEVENT's fields */
export function parseVEvent(icalString: string): VEventParsed {
  const lines = icalString.split(/\r?\n/);
  const props: Record<string, string> = {};

  let inEvent = false;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      continue;
    }
    if (line === "END:VEVENT") break;
    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    props[key] = value;
  }

  return {
    uid: props["UID"] ?? "",
    summary: props["SUMMARY"] ?? "",
    start: fromIcalDateTime(props["DTSTART"] ?? ""),
    end: fromIcalDateTime(props["DTEND"] ?? ""),
    description: props["DESCRIPTION"]
      ? unescapeIcalText(props["DESCRIPTION"])
      : undefined,
  };
}
