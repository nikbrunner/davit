/** Input for building a vCard 3.0 string */
export interface VCardInput {
  uid?: string;
  fullName: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  email?: string;
  address?: string;
  organization?: string;
  note?: string;
}

/** Parsed vCard fields */
export interface VCardParsed {
  uid: string;
  fullName: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  email?: string;
  address?: string;
  organization?: string;
  note?: string;
}

/** Escape special characters per vCard 3.0 (RFC 2426) for text properties */
function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,");
}

/** Unescape vCard text */
function unescapeVCardText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

/** Format a UTC timestamp for vCard REV property: YYYYMMDDTHHMMSSZ */
function toVCardTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${
    pad(date.getUTCDate())
  }T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${
    pad(date.getUTCSeconds())
  }Z`;
}

/** Fold a single vCard line at 75 octets per RFC 6350 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const result: string[] = [];
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const maxBytes = isFirst ? 75 : 74;
    let charCount = 0;
    let byteCount = 0;
    for (const char of remaining) {
      const charBytes = encoder.encode(char).length;
      if (byteCount + charBytes > maxBytes) break;
      byteCount += charBytes;
      charCount++;
    }
    if (charCount === 0) charCount = 1;

    const chunk = remaining.substring(0, charCount);
    result.push(isFirst ? chunk : ` ${chunk}`);
    remaining = remaining.substring(charCount);
    isFirst = false;
  }

  return result.join("\r\n");
}

/** Build a vCard 3.0 string */
export function buildVCard(input: VCardInput): string {
  const uid = input.uid ?? crypto.randomUUID();

  // Derive N property: if firstName/lastName given, use them; otherwise put fullName in lastName
  const lastName = input.lastName ?? (input.firstName ? "" : input.fullName);
  const firstName = input.firstName ?? "";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//davit//EN",
    `UID:${uid}`,
    `FN:${escapeVCardText(input.fullName)}`,
    `N:${escapeVCardText(lastName)};${escapeVCardText(firstName)};;;`,
  ];

  if (input.phone) {
    lines.push(`TEL;TYPE=CELL:${input.phone}`);
  }
  if (input.email) {
    lines.push(`EMAIL:${input.email}`);
  }
  if (input.organization) {
    lines.push(`ORG:${escapeVCardText(input.organization)}`);
  }
  if (input.note) {
    lines.push(`NOTE:${escapeVCardText(input.note)}`);
  }
  if (input.address) {
    lines.push(`ADR:;;${escapeVCardText(input.address)};;;;`);
  }

  lines.push(`REV:${toVCardTimestamp(new Date())}`);
  lines.push("END:VCARD");

  return lines.map(foldLine).join("\r\n");
}

/** Parse a vCard string and extract fields */
export function parseVCard(vcardString: string): VCardParsed {
  // Unfold continuation lines
  const unfolded = vcardString.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const props: Record<string, string> = {};

  let inCard = false;
  for (const line of lines) {
    if (line === "BEGIN:VCARD") {
      inCard = true;
      continue;
    }
    if (line === "END:VCARD") break;
    if (!inCard) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const rawKey = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    // Strip property parameters (e.g. "TEL;TYPE=CELL" → "TEL")
    const key = rawKey.split(";")[0]!;
    // Store first occurrence only (for single-value v1)
    if (!(key in props)) {
      props[key] = value;
    }
  }

  // Parse N property: N:LastName;FirstName;MiddleName;Prefix;Suffix
  let lastName: string | undefined;
  let firstName: string | undefined;
  if (props["N"]) {
    const parts = props["N"].split(";");
    const rawLast = parts[0] ?? "";
    const rawFirst = parts[1] ?? "";
    if (rawLast) lastName = unescapeVCardText(rawLast);
    if (rawFirst) firstName = unescapeVCardText(rawFirst);
  }

  // Parse ADR: ADR:PO;Extended;Street;City;State;PostalCode;Country
  let address: string | undefined;
  if (props["ADR"]) {
    const parts = props["ADR"].split(";");
    const nonEmpty = parts.filter((p) => p.trim() !== "");
    if (nonEmpty.length > 0) {
      address = nonEmpty.map((p) => unescapeVCardText(p)).join(", ");
    }
  }

  return {
    uid: props["UID"] ?? "",
    fullName: props["FN"] ? unescapeVCardText(props["FN"]) : "",
    lastName,
    firstName,
    phone: props["TEL"],
    email: props["EMAIL"],
    address,
    organization: props["ORG"] ? unescapeVCardText(props["ORG"]) : undefined,
    note: props["NOTE"] ? unescapeVCardText(props["NOTE"]) : undefined,
  };
}
