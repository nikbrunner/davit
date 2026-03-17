# davit

CalDAV CLI tool. Full CRUD for calendar events with iCloud support.

> "DAV it" — just do it.

## Install

### Prerequisites

- [Deno 2](https://deno.land/)
- iCloud CalDAV credentials (app-specific password from [appleid.apple.com](https://appleid.apple.com))

### Global Install

```bash
deno task install    # → ~/.deno/bin/davit
```

### Environment Variables

Set in your shell or `~/.env`:

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

All commands support `--format json|table` (default: table).
`show`, `update`, `delete` accept `--calendar <name>` to narrow the search.

## Development

```bash
deno task dev              # Run in dev mode
deno task test             # Unit tests
deno task test:integration # Integration tests (requires iCloud credentials)
deno task checks           # fmt + lint + check + test
deno task compile          # Build standalone binary → dist/davit
deno task install          # Install globally → ~/.deno/bin/davit
```

Pre-commit hook enforces: `fmt --check` → `lint` → `check` → `test`.

```bash
deno task setup-git-hooks  # Activate hooks after cloning
```
