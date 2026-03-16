# davit

CalDAV CLI & MCP server. Full CRUD for calendar events with iCloud support.

> "DAV it" — just do it.

## Status

**Planning phase.** See [BASE_PLAN.md](./BASE_PLAN.md) for full research, architecture, and implementation plan.

## Quick Overview

- CLI-first tool with MCP server mode for AI assistant integration
- Built on [tsdav](https://github.com/natelindev/tsdav) (TypeScript CalDAV client)
- Deno 2 runtime, compiles to standalone binary
- iCloud as primary target

```bash
davit calendar list
davit event list --from today --to +7d
davit event create "Meeting" --start "2026-03-17T16:00" --end "2026-03-17T16:30" --desc "Notes"
davit event update <uid> --title "New Title"
davit event delete <uid>
```
