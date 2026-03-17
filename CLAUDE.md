# CLAUDE.md

## What is this?

davit is a CalDAV CLI tool and MCP server with full CRUD for calendar events, targeting iCloud via tsdav.

## Architecture Rule

All logic lives in `src/core/`. CLI (`src/cli/`) and MCP (`src/mcp/`) are thin wrappers that translate I/O. Never put business logic in the wrappers.

## iCloud Caveats

1. `STATUS:CONFIRMED` not `STATUS:Confirmed` — iCloud returns 403 on mixed case
2. Time-range queries max ~1 year back — older queries return 403
3. Recurring event server-side expansion is buggy — parse RRULE client-side
4. tsdav transports raw iCalendar strings — you build VCALENDAR/VEVENT yourself

## Credentials

From environment (managed by 1Password in `~/.env`):

- `CALDAV_BASE_URL` — https://caldav.icloud.com
- `CALDAV_USERNAME` — Apple ID email
- `CALDAV_PASSWORD` — App-specific password

## tsdav Reference

For API details, fetch: https://tsdav.vercel.app/llms-full.txt
