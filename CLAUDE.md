# CLAUDE.md

## What is this?

davit is a CalDAV CLI tool with full CRUD for calendar events. Works with any
CalDAV-compliant server (iCloud, Google, Fastmail, Radicale, Nextcloud, etc.).
Built on tsdav. Primary tested target: iCloud.

## Architecture Rule

All logic lives in `src/core/`. CLI (`src/cli/`) is a thin wrapper that
translates I/O. Never put business logic in the wrapper.

## iCloud-Specific Caveats

These only apply when targeting iCloud:

1. `STATUS:CONFIRMED` not `STATUS:Confirmed` — iCloud returns 403 on mixed case
2. Time-range queries max ~1 year back — older queries return 403
3. Recurring event server-side expansion is buggy — parse RRULE client-side

## General CalDAV Notes

- tsdav transports raw iCalendar strings — davit builds VCALENDAR/VEVENT itself
- RFC 5545 compliance: line folding/unfolding, DTSTAMP, proper escaping

## Credentials

From environment (managed by 1Password in `~/.env`):

- `CALDAV_BASE_URL` — server URL (e.g. `https://caldav.icloud.com`)
- `CALDAV_USERNAME` — account email
- `CALDAV_PASSWORD` — password or app-specific password

## tsdav Reference

For API details, use the RefMCP for: https://tsdav.vercel.app/llms-full.txt
