# Handover — v1 Hardening Complete

> For Penny: test everything below, then delete this file.

## What Changed Since v0.1.0

### Critical Fixes

- **iCal line unfolding** — parser now handles RFC 5545 continuation lines (long
  descriptions from servers no longer get truncated)
- **DTSTAMP** — builder includes it in every VEVENT (RFC 5545 requirement)
- **Line folding** — builder folds lines at 75 octets (RFC 5545 compliance)
- **Empty etag fix** — no longer sends `If-Match: ""` (was causing potential 412
  errors)
- **getEvent optimization** — `show`, `update`, `delete` now accept `--calendar`
  flag to avoid scanning all calendars

### Architecture Change

- **MCP layer removed** — davit is CLI-only now. No more `davit serve`, no more
  TTY detection. Entry point just runs CLI.
- **Dependencies removed** — `@modelcontextprotocol/sdk` and `zod` gone from
  `deno.json`
- **Claude Code skill added** — `skill/SKILL.md` describes all CLI commands for
  AI assistant integration (replaces MCP)

### New Features

- **LOCATION support** — `--location "Room 42"` on create/update, shown in
  output, round-trips through iCal
- **URL support** — `--url "https://meet.google.com/..."` on create/update,
  shown in output
- **Event list aggregation** — `davit event list` without `--calendar` now lists
  from ALL calendars (was only showing first calendar, usually empty)

### Test Status

- **34 unit tests** — all passing
- **1 integration test** — full CRUD cycle against live iCloud, passing
- Pre-commit hook enforces: fmt → lint → check → test

## What to Test

```bash
source ~/.env

# 1. Calendar list (should show all calendars)
davit calendar list

# 2. Event list — ALL calendars (should have events now!)
davit event list --from "2026-03-17T00:00:00Z" --to "2026-03-23T23:59:59Z"

# 3. Event list — specific calendar
davit event list --from "2026-03-17T00:00:00Z" --to "2026-03-23T23:59:59Z" --calendar iCloud

# 4. Create with location + url
davit event create "Penny Test Event" \
  --start "2026-12-31T10:00:00Z" --end "2026-12-31T10:30:00Z" \
  --desc "Testing v1 hardening" \
  --location "Test Room" \
  --url "https://example.com/meet" \
  --calendar iCloud --format json
# → note the uid

# 5. Show (with --calendar for speed)
davit event show <uid> --calendar iCloud

# 6. Update location + description
davit event update <uid> --location "New Room" --desc "Updated by Penny"

# 7. Show again — verify changes
davit event show <uid> --calendar iCloud

# 8. Delete
davit event delete <uid> --calendar iCloud

# 9. Verify deleted
davit event show <uid> --calendar iCloud
# → should say "not found"
```

## Verify the Skill

Test the `penny-calendar` skill from a Claude Code session:

1. Invoke `/penny-calendar list events this week`
2. Verify it sources credentials and runs davit commands
3. Try creating/deleting a test event through the skill

## Known Limitations (v2+)

- Recurring events show original date only (no RRULE expansion)
- No VALARM/reminder support
- No ATTENDEE support
- getEvent still fetches all objects per calendar (no server-side UID filter)
- Config/password env-var fallback path untested
