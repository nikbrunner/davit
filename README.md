# davit

CalDAV CLI tool. Full CRUD for calendar events with iCloud support.

> "DAV it" — just do it.

## Setup

### Prerequisites

- [Deno 2](https://deno.land/) installed
- iCloud CalDAV credentials (app-specific password from
  [appleid.apple.com](https://appleid.apple.com))

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
davit event create "Meeting" \
  --start "2026-03-17T16:00:00Z" --end "2026-03-17T16:30:00Z" \
  --desc "Notes" --location "Room 42" --url "https://meet.google.com/abc"
davit event update <uid> --title "New Title" --desc "Updated notes"
davit event delete <uid>
```

All commands support `--format json|table` (default: table).
`show`, `update`, `delete` accept `--calendar <name>` to narrow the search.

## AI Integration

davit is designed to be called by AI assistants via CLI. For Claude Code, a
skill is available that describes all commands and usage patterns.

## Development

```bash
deno task dev          # Run in dev mode
deno task test         # Run unit tests
deno task checks       # fmt + lint + check + test
deno task fmt          # Format code
deno task lint         # Lint code
deno task compile      # Build standalone binary
```

Pre-commit hook enforces: `fmt --check` → `lint` → `check` → `test`.

Activate hooks after cloning:

```bash
deno task setup-git-hooks
```
