# davit — Base Plan

> Temporary file. Contains all research, architecture decisions, caveats, and implementation guidance. Delete after v1 is shipped.

## Problem

No good CalDAV CLI or MCP tool exists with full CRUD support:

- **caldav-mcp** (51 stars) — only 4 commands: list-calendars, list-events, create-event, delete-event. No update, no event descriptions, delete fails on imported events (412 error). Built with raw HTTP instead of using tsdav.
- **khal** (Python) — good CLI UX but no MCP, different ecosystem
- **caldavctl** (Python) — clean command structure but no MCP
- **davcli** (Rust) — good Unix philosophy but minimal features
- **tsdav** (336 stars, TypeScript) — excellent CalDAV library, iCloud first-class, full CRUD — but it's a library, not an app

The gap: tsdav solves transport. Nobody built a complete CLI + MCP on top.

## Architecture

### Layered Design

```
src/
  core/           # Business logic — CalDAV operations via tsdav
    client.ts     # tsdav client setup, auth, connection
    calendars.ts  # listCalendars()
    events.ts     # listEvents(), showEvent(), createEvent(), updateEvent(), deleteEvent()
    ical.ts       # iCalendar string builder (VEVENT construction)
  cli/            # CLI layer — parses args, calls core, formats output
    index.ts      # CLI entry point (commander/yargs)
    calendar.ts   # `davit calendar list`
    event.ts      # `davit event <verb>`
  mcp/            # MCP layer — tool definitions, calls core
    server.ts     # McpServer setup
    tools.ts      # Tool registrations with zod schemas
  config.ts       # Config file + env var resolution
  index.ts        # Entry: TTY detection → CLI or MCP mode
```

### Principle

Core is pure business logic. CLI and MCP are thin wrappers. One feature = one core function + one CLI command + one MCP tool. Never put logic in the wrappers.

### Entry Point Detection

```typescript
// index.ts
if (Deno.stdin.isTerminal()) {
  // Interactive terminal → CLI mode
  await runCLI(Deno.args);
} else {
  // Piped/non-TTY → MCP stdio mode
  await runMCP();
}
```

Alternative: explicit `davit serve` subcommand for MCP mode.

### Reference Implementation

[aashari/boilerplate-mcp-server](https://github.com/aashari/boilerplate-mcp-server) — 6 layers: CLI, Tools, Resources, Controllers, Services, Utils. Both CLI and MCP call identical controller methods. Best dual CLI/MCP template available.

## Tech Stack

| Component | Choice | Why |
|-|-|-|
| Runtime | Deno 2 | `deno compile` → standalone binary, TypeScript native, npm compat |
| CalDAV Client | [tsdav](https://github.com/natelindev/tsdav) v2.1.8 | 336 stars, 5+ years, iCloud first-class, full CRUD, used by Cal.com |
| MCP SDK | `@modelcontextprotocol/sdk` v1.27 | Official SDK, `zod` v4 for schemas |
| iCal Building | Manual or `ical-generator` | tsdav transports raw iCalendar strings — we need to build them |
| CLI Framework | `commander` or `yargs` (via npm:) | Proven, works with Deno npm compat |
| Config | TOML (`@std/toml`) or JSON | TOML is more human-friendly for config |

### tsdav Key API Surface

```typescript
import { createDAVClient } from 'tsdav';

// Connect
const client = await createDAVClient({
  serverUrl: 'https://caldav.icloud.com',
  credentials: { username, password },
  authMethod: 'Basic',
  defaultAccountType: 'caldav',
});

// List calendars
const calendars = await client.fetchCalendars();

// List events (time range)
const events = await client.fetchCalendarObjects({
  calendar: calendars[0],
  timeRange: { start: '2026-03-01T00:00:00Z', end: '2026-03-31T23:59:59Z' },
});

// Create event
await client.createCalendarObject({
  calendar: calendars[0],
  filename: `${uid}.ics`,
  iCalString: buildVEvent({ summary, start, end, description }),
});

// Update event (PUT with same URL, must include ETag)
await client.updateCalendarObject({
  calendarObject: existingEvent,
  iCalString: buildVEvent({ summary, start, end, description }),
});

// Delete event
await client.deleteCalendarObject({ calendarObject: existingEvent });
```

**Important**: tsdav does NOT parse iCalendar. You supply raw iCalendar strings. You need to build VCALENDAR/VEVENT yourself or use a library.

### tsdav Documentation

- **Full LLM docs** (load this for implementation): https://tsdav.vercel.app/llms-full.txt
- **Human docs**: https://tsdav.vercel.app
- **GitHub**: https://github.com/natelindev/tsdav

## iCloud CalDAV — Implementation Notes

### Endpoint & Discovery

- Base URL: `https://caldav.icloud.com`
- Discovery: `/.well-known/caldav` → redirects to principal URL
- Principal URL pattern: `https://pXX-caldav.icloud.com/{dsid}/principal/`
- The `pXX` prefix varies per user — discovered via redirect
- tsdav handles all of this automatically via `createDAVClient`

### Authentication

- HTTP Basic Auth over HTTPS
- Username: Apple ID email
- Password: **App-specific password** (NOT Apple ID password)
- Generated at: appleid.apple.com → Sign-In and Security → App-Specific Passwords
- Requires 2FA enabled on Apple account
- No OAuth available for CalDAV

### Known Quirks (CRITICAL)

1. **STATUS must be UPPERCASE**: `STATUS:CONFIRMED` works, `STATUS:Confirmed` returns 403. Apply to all iCalendar property values.

2. **Time-range queries limited to ~1 year**: Queries older than ~1 year return 403 "Time-range value too far in the past".

3. **Recurring event expansion unreliable**: `calendar-multiget` with `<c:expand>` sometimes returns expanded instances, sometimes only the master event. **Do client-side RRULE parsing instead.**

4. **No official Apple support**: CalDAV is not officially supported by Apple for third-party apps. No docs, only protocol conformance. Works stably in practice.

5. **Rate limiting**: No documented limits, but aggressive use can trigger temporary blocks.

6. **Principal URL discovery can break**: Some users report 400 errors on `current-user-principal` PROPFIND. tsdav handles retries.

### What Works Well

- CRUD operations (PUT for create/update, DELETE for delete)
- Event descriptions via `DESCRIPTION` property
- Time-range queries within the last year
- Calendar listing and metadata
- ETags for optimistic locking on updates

## CLI Design

### Command Structure

Inspired by `caldavctl` (resource-verb pattern) and `davcli` (Unix stdout/stderr separation).

```bash
# Calendar operations
davit calendar list                    # List all calendars (name, URL, color)

# Event operations
davit event list [--from today] [--to +7d] [--calendar <name>]
davit event show <uid>                 # Full event details including description
davit event create "Title" \
  --start "2026-03-17T16:00" \
  --end "2026-03-17T16:30" \
  [--desc "Meeting notes"] \
  [--calendar <name>]
davit event update <uid> \
  [--title "New Title"] \
  [--start "..."] \
  [--end "..."] \
  [--desc "Updated notes"]
davit event delete <uid>

# MCP mode (explicit)
davit serve                            # Start MCP stdio server
```

### Output

- stdout: data (JSON by default, `--format table` for human-readable)
- stderr: logs, warnings, errors
- Exit codes: 0 success, 1 error, 2 not found

### Config File

Location: `~/.config/davit/config.toml`

```toml
default_server = "icloud"
default_calendar = "home"

[servers.icloud]
url = "https://caldav.icloud.com"
username = "user@example.com"
# Password resolution order:
# 1. DAVIT_ICLOUD_PASSWORD env var
# 2. password field in config (not recommended)
# 3. Interactive prompt
```

Env var pattern: `DAVIT_{SERVER_NAME}_PASSWORD`

## MCP Server

### Tool Definitions

```typescript
server.registerTool("list_calendars", {
  title: "List Calendars",
  description: "List all available calendars",
  inputSchema: z.object({}),
}, async () => { /* calls core.listCalendars() */ });

server.registerTool("list_events", {
  title: "List Events",
  description: "List events in a time range",
  inputSchema: z.object({
    from: z.string().datetime().describe("Start of range (ISO 8601)"),
    to: z.string().datetime().describe("End of range (ISO 8601)"),
    calendar: z.string().optional().describe("Calendar name"),
  }),
}, async (args) => { /* calls core.listEvents(args) */ });

server.registerTool("show_event", {
  title: "Show Event",
  description: "Show full event details including description",
  inputSchema: z.object({
    uid: z.string().describe("Event UID"),
  }),
}, async (args) => { /* calls core.showEvent(args.uid) */ });

server.registerTool("create_event", {
  title: "Create Event",
  description: "Create a new calendar event",
  inputSchema: z.object({
    title: z.string().describe("Event title"),
    start: z.string().datetime().describe("Start time (ISO 8601, UTC)"),
    end: z.string().datetime().describe("End time (ISO 8601, UTC)"),
    description: z.string().optional().describe("Event description/notes"),
    calendar: z.string().optional().describe("Calendar name"),
  }),
}, async (args) => { /* calls core.createEvent(args) */ });

server.registerTool("update_event", {
  title: "Update Event",
  description: "Update an existing calendar event",
  inputSchema: z.object({
    uid: z.string().describe("Event UID"),
    title: z.string().optional().describe("New title"),
    start: z.string().datetime().optional().describe("New start time"),
    end: z.string().datetime().optional().describe("New end time"),
    description: z.string().optional().describe("New description"),
  }),
}, async (args) => { /* calls core.updateEvent(args) */ });

server.registerTool("delete_event", {
  title: "Delete Event",
  description: "Delete a calendar event",
  inputSchema: z.object({
    uid: z.string().describe("Event UID"),
  }),
}, async (args) => { /* calls core.deleteEvent(args.uid) */ });
```

## iCalendar String Building

tsdav transports raw iCalendar strings. We need to construct valid VCALENDAR/VEVENT:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//davit//EN
BEGIN:VEVENT
UID:550e8400-e29b-41d4-a716-446655440000
DTSTART:20260317T150000Z
DTEND:20260317T153000Z
SUMMARY:ImFusion — Gehaltsgespräch
DESCRIPTION:Talking points:\n- Salary target 88-90k\n- Remote days\n- Workation policy
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

### Rules

- UID: Generate UUID v4 for new events, preserve existing for updates
- DTSTART/DTEND: UTC format (`YYYYMMDDTHHMMSSZ`)
- STATUS: Always UPPERCASE (iCloud requirement)
- DESCRIPTION: Escape newlines as `\n`, commas as `\,`, semicolons as `\;`
- PRODID: `-//davit//EN`
- Always include VERSION:2.0

## Scope v1

### In Scope

- [ ] Core: tsdav client setup with iCloud auth
- [ ] Core: list calendars
- [ ] Core: list events (time range)
- [ ] Core: show event (full details with description)
- [ ] Core: create event (with description)
- [ ] Core: update event (any field)
- [ ] Core: delete event
- [ ] Core: iCalendar string builder
- [ ] CLI: all commands from design above
- [ ] MCP: all 6 tools
- [ ] Config: TOML file + env var fallback
- [ ] Entry: TTY detection for CLI vs MCP mode
- [ ] Build: `deno compile` to standalone binary

### Out of Scope (v2+)

- Multi-provider support (Google, Fastmail, Radicale)
- Recurring event creation (RRULE building)
- Timezone conversion (UTC in/out for v1)
- CardDAV / contacts
- Calendar create/delete/modify
- Sync / offline cache
- Interactive TUI mode

## Implementation Order

Suggested order for building this incrementally:

1. **Project setup**: deno.json, deps, directory structure
2. **Config**: TOML parser, env var resolution, config types
3. **Core client**: tsdav connection, auth, `listCalendars()`
4. **Core events read**: `listEvents()`, `showEvent()`, iCal parsing
5. **Core events write**: `createEvent()`, `updateEvent()`, `deleteEvent()`, iCal builder
6. **CLI**: Wire all core functions to CLI commands
7. **MCP**: Wire all core functions to MCP tools
8. **Entry point**: TTY detection, dual mode
9. **Build**: `deno compile`, test binary
10. **Replace caldav-mcp**: Update `claude-mcp.sh` to use davit

## Resources

### Primary

- [tsdav GitHub](https://github.com/natelindev/tsdav) — Source code and issues
- [tsdav LLM Docs](https://tsdav.vercel.app/llms-full.txt) — **Load this for implementation context**
- [tsdav Human Docs](https://tsdav.vercel.app) — Browsable documentation

### Architecture References

- [aashari/boilerplate-mcp-server](https://github.com/aashari/boilerplate-mcp-server) — Best dual CLI/MCP template
- [caldav-mcp](https://github.com/dominik1001/caldav-mcp) — What we're replacing (study limitations)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP TypeScript SDK

### CLI Design References

- [caldavctl](https://gitlab.com/davical-project/caldavctl) — Best command structure (resource-verb)
- [davcli](https://github.com/example/davcli) — Unix philosophy (stdout/stderr separation)
- [khal](https://github.com/pimutils/khal) — Best date parsing UX

### Standards

- [CalDAV RFC 4791](https://datatracker.ietf.org/doc/html/rfc4791)
- [iCalendar RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545)
- [WebDAV RFC 4918](https://datatracker.ietf.org/doc/html/rfc4918)
