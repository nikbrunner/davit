import * as chrono from "chrono-node";

export interface ParseDateOptions {
  /** Reference time for relative parsing (default: now) */
  now?: Date;
  /** IANA timezone (e.g. "Europe/Berlin"). Default: system timezone */
  timezone?: string;
}

/**
 * Parse a natural language or ISO 8601 date string to UTC ISO 8601.
 *
 * Tries chrono-node first, falls back to new Date() for ISO passthrough.
 * Throws if neither can parse the input.
 */
export function parseDate(
  input: string,
  options: ParseDateOptions = {},
): string {
  const now = options.now ?? new Date();
  const timezone = options.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Try chrono-node with timezone-aware reference
  const result = chrono.parseDate(input, {
    instant: now,
    timezone,
  });

  if (result) {
    return result.toISOString();
  }

  // Fallback: try as ISO 8601
  const iso = new Date(input);
  if (!isNaN(iso.getTime())) {
    return iso.toISOString();
  }

  throw new Error(
    `Cannot parse date: "${input}"\n` +
      `  Use natural language (e.g. "tomorrow", "next friday", "in 2 hours")\n` +
      `  or ISO 8601 (e.g. "2026-03-17T15:00:00Z")`,
  );
}
