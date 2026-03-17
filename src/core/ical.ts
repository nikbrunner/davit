/** Input for building a VEVENT iCalendar string */
export interface VEventInput {
  uid?: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  url?: string;
}

/** Parsed VEVENT fields */
export interface VEventParsed {
  uid: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  url?: string;
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

/** Convert iCalendar datetime to ISO 8601. Handles both UTC (Z suffix) and local time formats. */
function fromIcalDateTime(ical: string): string {
  // UTC format: YYYYMMDDTHHMMSSZ
  const utc = ical.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (utc) {
    return `${utc[1]}-${utc[2]}-${utc[3]}T${utc[4]}:${utc[5]}:${utc[6]}Z`;
  }
  // Local/TZID format: YYYYMMDDTHHMMSS (no Z)
  const local = ical.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (local) {
    return `${local[1]}-${local[2]}-${local[3]}T${local[4]}:${local[5]}:${
      local[6]
    }`;
  }
  // Date-only: YYYYMMDD
  const dateOnly = ical.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
  return ical;
}

/** Fold a single iCal line at 75 octets per RFC 5545 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const result: string[] = [];
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const maxBytes = isFirst ? 75 : 74; // continuation lines have leading space
    // Find how many chars fit in maxBytes
    let charCount = 0;
    let byteCount = 0;
    for (const char of remaining) {
      const charBytes = encoder.encode(char).length;
      if (byteCount + charBytes > maxBytes) break;
      byteCount += charBytes;
      charCount++;
    }
    if (charCount === 0) charCount = 1; // at least one char to avoid infinite loop

    const chunk = remaining.substring(0, charCount);
    result.push(isFirst ? chunk : ` ${chunk}`);
    remaining = remaining.substring(charCount);
    isFirst = false;
  }

  return result.join("\r\n");
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
    `DTSTAMP:${toIcalDateTime(new Date().toISOString())}`,
    `DTSTART:${toIcalDateTime(input.start)}`,
    `DTEND:${toIcalDateTime(input.end)}`,
    `SUMMARY:${escapeIcalText(input.summary)}`,
    "STATUS:CONFIRMED",
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcalText(input.description)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

/** Parse a VCALENDAR string and extract the first VEVENT's fields */
export function parseVEvent(icalString: string): VEventParsed {
  // RFC 5545: unfold continuation lines (lines starting with space/tab)
  const unfolded = icalString.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
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
    const rawKey = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    // Strip property parameters (e.g. "DTSTART;TZID=Europe/Berlin" → "DTSTART")
    const key = rawKey.split(";")[0]!;
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
