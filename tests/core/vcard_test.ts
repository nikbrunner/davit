import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildVCard, parseVCard } from "../../src/core/vcard.ts";

Deno.test("buildVCard: produces valid VCARD with required fields", () => {
  const vcard = buildVCard({
    uid: "test-uid-123",
    fullName: "John Doe",
    lastName: "Doe",
    firstName: "John",
  });

  assertStringIncludes(vcard, "BEGIN:VCARD");
  assertStringIncludes(vcard, "VERSION:3.0");
  assertStringIncludes(vcard, "PRODID:-//davit//EN");
  assertStringIncludes(vcard, "UID:test-uid-123");
  assertStringIncludes(vcard, "FN:John Doe");
  assertStringIncludes(vcard, "N:Doe;John;;;");
  assertStringIncludes(vcard, "END:VCARD");
});

Deno.test("buildVCard: includes phone when provided", () => {
  const vcard = buildVCard({
    uid: "tel-test",
    fullName: "Jane Doe",
    phone: "+49 123 456789",
  });
  assertStringIncludes(vcard, "TEL;TYPE=CELL:+49 123 456789");
});

Deno.test("buildVCard: includes email when provided", () => {
  const vcard = buildVCard({
    uid: "email-test",
    fullName: "Jane Doe",
    email: "jane@example.com",
  });
  assertStringIncludes(vcard, "EMAIL:jane@example.com");
});

Deno.test("buildVCard: includes organization when provided", () => {
  const vcard = buildVCard({
    uid: "org-test",
    fullName: "Jane Doe",
    organization: "Acme Inc",
  });
  assertStringIncludes(vcard, "ORG:Acme Inc");
});

Deno.test("buildVCard: includes note with escaped characters", () => {
  const vcard = buildVCard({
    uid: "note-test",
    fullName: "Jane Doe",
    note: "Line 1\nLine 2, with comma",
  });
  assertStringIncludes(vcard, "NOTE:Line 1\\nLine 2\\, with comma");
});

Deno.test("buildVCard: derives N from fullName when no first/last provided", () => {
  const vcard = buildVCard({
    uid: "derive-test",
    fullName: "John Doe",
  });
  assertStringIncludes(vcard, "N:John Doe;;;;");
});

Deno.test("buildVCard: stores address in ADR street component", () => {
  const vcard = buildVCard({
    uid: "adr-test",
    fullName: "Jane Doe",
    address: "123 Main Street",
  });
  assertStringIncludes(vcard, "ADR:;;123 Main Street;;;;");
});

Deno.test("buildVCard: generates UID when not provided", () => {
  const vcard = buildVCard({ fullName: "Auto UID" });
  assertStringIncludes(vcard, "UID:");
  const uidMatch = vcard.match(/UID:(.+)/);
  assertEquals(Array.isArray(uidMatch) && (uidMatch[1]?.length ?? 0) > 0, true);
});

Deno.test("buildVCard: includes REV timestamp", () => {
  const vcard = buildVCard({ uid: "rev-test", fullName: "Test" });
  const match = vcard.match(/REV:(\d{8}T\d{6}Z)/);
  assertEquals(match !== null, true);
});

Deno.test("buildVCard: folds long lines at 75 octets", () => {
  const longNote = "A".repeat(100);
  const vcard = buildVCard({
    uid: "fold-test",
    fullName: "Test",
    note: longNote,
  });

  const rawLines = vcard.split("\r\n");
  for (const line of rawLines) {
    const byteLength = new TextEncoder().encode(line).length;
    assertEquals(
      byteLength <= 75,
      true,
      `Line too long (${byteLength} bytes): ${line.substring(0, 40)}...`,
    );
  }

  const parsed = parseVCard(vcard);
  assertEquals(parsed.note, longNote);
});

Deno.test("parseVCard: extracts all fields from vCard string", () => {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "UID:parse-test-123",
    "FN:John Doe",
    "N:Doe;John;;;",
    "TEL;TYPE=CELL:+49 123 456789",
    "EMAIL:john@example.com",
    "ORG:Acme Inc",
    "NOTE:Some notes\\nWith newline",
    "ADR:;;123 Main St;;;;",
    "END:VCARD",
  ].join("\r\n");

  const contact = parseVCard(vcard);
  assertEquals(contact.uid, "parse-test-123");
  assertEquals(contact.fullName, "John Doe");
  assertEquals(contact.lastName, "Doe");
  assertEquals(contact.firstName, "John");
  assertEquals(contact.phone, "+49 123 456789");
  assertEquals(contact.email, "john@example.com");
  assertEquals(contact.organization, "Acme Inc");
  assertEquals(contact.note, "Some notes\nWith newline");
  assertEquals(contact.address, "123 Main St");
});

Deno.test("parseVCard: handles missing optional fields", () => {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "UID:minimal-123",
    "FN:Minimal Contact",
    "N:Minimal Contact;;;;",
    "END:VCARD",
  ].join("\r\n");

  const contact = parseVCard(vcard);
  assertEquals(contact.uid, "minimal-123");
  assertEquals(contact.fullName, "Minimal Contact");
  assertEquals(contact.phone, undefined);
  assertEquals(contact.email, undefined);
  assertEquals(contact.note, undefined);
});

Deno.test("parseVCard: unfolds continuation lines", () => {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "UID:fold-parse",
    "FN:Test",
    "N:Test;;;;",
    "NOTE:This is a very long note that has been folded",
    "  across multiple lines by the server",
    "END:VCARD",
  ].join("\r\n");

  const contact = parseVCard(vcard);
  assertEquals(
    contact.note,
    "This is a very long note that has been folded" +
      " across multiple lines by the server",
  );
});

Deno.test("parseVCard: joins non-empty ADR components", () => {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "UID:adr-parse",
    "FN:Test",
    "N:Test;;;;",
    "ADR:;;123 Main St;Springfield;IL;62704;US",
    "END:VCARD",
  ].join("\r\n");

  const contact = parseVCard(vcard);
  assertEquals(contact.address, "123 Main St, Springfield, IL, 62704, US");
});
