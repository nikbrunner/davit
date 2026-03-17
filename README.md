# davit

CalDAV CLI & MCP server. Full CRUD for calendar events with iCloud support.

> "DAV it" — just do it.

## Setup

### Prerequisites

- [Deno 2](https://deno.land/) installed
- iCloud CalDAV credentials (app-specific password from [appleid.apple.com](https://appleid.apple.com))

### Environment Variables

Set these in your shell (or `~/.env`):

```bash
export CALDAV_BASE_URL="https://caldav.icloud.com"
export CALDAV_USERNAME="your@apple-id.com"
export CALDAV_PASSWORD="your-app-specific-password"
```

Or create `~/.config/davit/config.toml`:

```toml
default_server = "icloud"

[servers.icloud]
url = "https://caldav.icloud.com"
username = "your@apple-id.com"
# Password resolved from DAVIT_ICLOUD_PASSWORD env var
```

### Build

```bash
deno task compile    # → dist/davit
```

## CLI Usage

```bash
# Calendars
davit calendar list

# Events
davit event list --from "2026-03-17T00:00:00Z" --to "2026-03-23T23:59:59Z"
davit event list --calendar iCloud --format json
davit event show <uid>
davit event create "Meeting" --start "2026-03-17T16:00:00Z" --end "2026-03-17T16:30:00Z" --desc "Notes"
davit event update <uid> --title "New Title" --desc "Updated notes"
davit event delete <uid>
```

All commands support `--format json|table` (default: table).

## MCP Server (for Penny)

davit runs as an MCP stdio server when piped (no args, no TTY), or explicitly via:

```bash
davit serve
```

### Claude Code Configuration

Add to your MCP settings (e.g. `~/.claude/claude_desktop_config.json` or `claude-mcp.sh`):

```json
{
  "mcpServers": {
    "davit": {
      "command": "/path/to/dist/davit",
      "args": ["serve"],
      "env": {
        "CALDAV_BASE_URL": "https://caldav.icloud.com",
        "CALDAV_USERNAME": "your@apple-id.com",
        "CALDAV_PASSWORD": "your-app-specific-password"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|-|-|
| `list_calendars` | List all calendars |
| `list_events` | List events in a time range (`from`, `to`, optional `calendar`) |
| `show_event` | Show full event details by UID |
| `create_event` | Create event (`title`, `start`, `end`, optional `description`, `calendar`) |
| `update_event` | Update event fields by UID |
| `delete_event` | Delete event by UID |

All datetime parameters use ISO 8601 UTC format (e.g. `2026-03-17T15:00:00Z`).

## Development

```bash
deno task dev          # Run in dev mode
deno task test         # Run unit tests (26 tests)
deno task fmt          # Format code
deno task lint         # Lint code
```

Pre-commit hook enforces: `fmt --check` → `lint` → `check` → `test`.

Activate hooks after cloning:

```bash
bash scripts/setup-hooks.sh
```
