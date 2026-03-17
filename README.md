# davit

CalDAV CLI tool. Full CRUD for calendar events. Works with any CalDAV server —
tested primarily against iCloud.

> "DAV it" — just do it.

## Install

### Prerequisites

- [Deno 2](https://deno.land/)
- CalDAV server credentials (for iCloud: app-specific password from
  [appleid.apple.com](https://appleid.apple.com))

### Global Install

```bash
deno task install    # → ~/.deno/bin/davit
```

## Configuration

Config file at `~/.config/davit/config.toml`. Safe to track in dotfiles —
passwords are resolved from environment variables, never stored in the file.

```toml
default_server = "icloud"
default_calendar = "iCloud"

[servers.icloud]
url = "https://caldav.icloud.com"
username = "your@apple-id.com"
# Password resolved from DAVIT_ICLOUD_PASSWORD env var
```

### Password Resolution

Passwords are resolved per server in this order:

1. `DAVIT_{SERVER_NAME}_PASSWORD` env var (e.g. `DAVIT_ICLOUD_PASSWORD`)
2. `password` field in config (not recommended — use env vars)
3. Error

Set the env var in your shell profile or `~/.env`:

```bash
export DAVIT_ICLOUD_PASSWORD="your-app-specific-password"
```

### Multiple Servers

```toml
default_server = "icloud"

[servers.icloud]
url = "https://caldav.icloud.com"
username = "your@apple-id.com"

[servers.fastmail]
url = "https://caldav.fastmail.com/dav/calendars"
username = "your@fastmail.com"
```

### Fallback (No Config File)

If no config file exists, davit falls back to these env vars:

```bash
export CALDAV_BASE_URL="https://caldav.icloud.com"
export CALDAV_USERNAME="your@apple-id.com"
export CALDAV_PASSWORD="your-app-specific-password"
```

## Usage

```bash
# Calendars
davit calendar list

# List events
davit event list --from "2026-03-17T00:00:00Z" --to "2026-03-23T23:59:59Z"
davit event list --calendar iCloud --format json

# Show event details
davit event show <uid> --calendar iCloud

# Create
davit event create "Meeting" \
  --start "2026-03-17T16:00:00Z" --end "2026-03-17T16:30:00Z" \
  --desc "Notes" --location "Room 42" --url "https://meet.google.com/abc" \
  --calendar iCloud

# Update
davit event update <uid> --title "New Title" --desc "Updated" --location "New Room"

# Delete
davit event delete <uid> --calendar iCloud
```

All commands support `--format json|table` (default: table). `show`, `update`,
`delete` accept `--calendar <name>` to narrow the search.

## Development

```bash
deno task dev              # Run in dev mode
deno task test             # Unit tests
deno task test:integration # Integration tests (requires credentials)
deno task checks           # fmt + lint + check + test
deno task compile          # Build standalone binary → dist/davit
deno task install          # Install globally → ~/.deno/bin/davit
```

Pre-commit hook enforces: `fmt --check` → `lint` → `check` → `test`.

```bash
deno task setup-git-hooks  # Activate hooks after cloning
```
