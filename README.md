# davit

CalDAV CLI & MCP server. Full CRUD for calendar events with iCloud support.

> "DAV it" — just do it.

## Why

There's no good CLI or MCP tool for CalDAV that supports full CRUD operations. `caldav-mcp` exists but only has 4 commands (list, create, delete, list-calendars) — no update, no event descriptions, buggy delete. The CalDAV library `tsdav` solves the transport layer well, but nobody has built a complete app on top of it.

davit fills that gap: a CLI-first tool with an MCP server mode, built on tsdav.

## Features (planned)

- Full CRUD: create, read, update, delete events
- Event descriptions and notes
- Dual mode: CLI for terminal use, MCP server for AI assistant integration
- iCloud CalDAV as primary target
- Config file + environment variable auth
- Deno — compiles to standalone binary

## Architecture

```
src/
  core/        # CalDAV operations via tsdav + iCal builder
  cli/         # CLI commands → calls core
  mcp/         # MCP tool definitions (zod schemas) → calls core
  index.ts     # TTY → CLI mode | Piped → MCP stdio mode
```

Core library shared between CLI and MCP. One feature = one core function + CLI command + MCP tool.

## CLI Design

```bash
# Calendars
davit calendar list

# Events
davit event list [--from today] [--to +7d]
davit event show <uid>
davit event create "Title" --start "2026-03-17T16:00" --end "2026-03-17T16:30" [--desc "Notes"]
davit event update <uid> [--title] [--start] [--end] [--desc]
davit event delete <uid>
```

## MCP Tools

| Tool | Description |
|-|-|
| `list_calendars` | List all calendars |
| `list_events` | List events in time range |
| `show_event` | Event details including description |
| `create_event` | Create event with title, time, description |
| `update_event` | Update event fields |
| `delete_event` | Delete event |

## Tech Stack

- **Runtime**: Deno 2 (standalone binary via `deno compile`)
- **CalDAV Client**: [tsdav](https://github.com/natelindev/tsdav) — mature TypeScript CalDAV library, iCloud first-class
- **MCP SDK**: `@modelcontextprotocol/sdk` + `zod`
- **iCal**: `ical-generator` or manual iCalendar string building

## iCloud CalDAV Notes

- Endpoint: `caldav.icloud.com`, discovery via `/.well-known/caldav`
- Auth: Basic Auth + app-specific password (no OAuth)
- STATUS values must be UPPERCASE (`CONFIRMED` not `Confirmed`)
- Time-range queries limited to ~1 year back
- Recurring event server-side expansion is buggy — do client-side RRULE parsing
- Descriptions fully supported via DESCRIPTION property

## Scope v1

- [x] Project plan
- [ ] iCloud as sole provider (multi-provider is v2)
- [ ] Full CRUD (create, read, update, delete)
- [ ] Event descriptions
- [ ] CLI + MCP dual mode
- [ ] Config file + env var auth
- [ ] No recurring event creation (read/display only)
- [ ] UTC timestamps in/out (client converts)

## Resources

- [tsdav](https://github.com/natelindev/tsdav) — TypeScript CalDAV client
- [tsdav LLM Docs](https://tsdav.vercel.app/llms-full.txt) — Full docs for AI context
- [aashari/boilerplate-mcp-server](https://github.com/aashari/boilerplate-mcp-server) — CLI+MCP architecture reference
- [CalDAV RFC 4791](https://datatracker.ietf.org/doc/html/rfc4791)
- [iCalendar RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545)
