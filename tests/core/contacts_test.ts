import { assertEquals, assertStringIncludes } from "@std/assert";
import type { DavitContact } from "../../src/core/types.ts";
import {
  buildCreatePayload,
  buildUpdatePayload,
  mapContact,
  mapContacts,
} from "../../src/core/contacts.ts";

const sampleVcard = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "UID:contact-001",
  "FN:John Doe",
  "N:Doe;John;;;",
  "TEL;TYPE=CELL:+49 123 456789",
  "EMAIL:john@example.com",
  "ORG:Acme Inc",
  "END:VCARD",
].join("\r\n");

Deno.test("mapContact: converts DAV vCard object to DavitContact", () => {
  const raw = {
    url: "https://contacts.example.com/ab/contact-001.vcf",
    data: sampleVcard,
    etag: '"etag123"',
  };

  const contact = mapContact(raw, "https://contacts.example.com/ab/");
  assertEquals(contact.uid, "contact-001");
  assertEquals(contact.fullName, "John Doe");
  assertEquals(contact.lastName, "Doe");
  assertEquals(contact.firstName, "John");
  assertEquals(contact.phone, "+49 123 456789");
  assertEquals(contact.email, "john@example.com");
  assertEquals(contact.organization, "Acme Inc");
  assertEquals(contact.url, raw.url);
  assertEquals(contact.etag, '"etag123"');
});

Deno.test("mapContacts: maps array and sorts by fullName", () => {
  const vcardB = sampleVcard
    .replace("UID:contact-001", "UID:contact-002")
    .replace("FN:John Doe", "FN:Zelda Smith")
    .replace("N:Doe;John;;;", "N:Smith;Zelda;;;");

  const rawObjects = [
    { url: "/ab/contact-002.vcf", data: vcardB, etag: '"e2"' },
    { url: "/ab/contact-001.vcf", data: sampleVcard, etag: '"e1"' },
  ];

  const contacts = mapContacts(rawObjects, "/ab/");
  assertEquals(contacts.length, 2);
  assertEquals(contacts[0]?.fullName, "John Doe");
  assertEquals(contacts[1]?.fullName, "Zelda Smith");
});

Deno.test("buildCreatePayload: produces filename and vCardString", () => {
  const payload = buildCreatePayload({
    fullName: "New Contact",
    phone: "+49 999 888777",
    email: "new@example.com",
    addressBookUrl: "https://example.com/ab/",
  });

  assertEquals(payload.filename.endsWith(".vcf"), true);
  assertStringIncludes(payload.vCardString, "FN:New Contact");
  assertStringIncludes(payload.vCardString, "TEL;TYPE=CELL:+49 999 888777");
  assertStringIncludes(payload.vCardString, "EMAIL:new@example.com");
});

Deno.test("buildUpdatePayload: merges existing contact with updates", () => {
  const existing: DavitContact = {
    uid: "existing-123",
    fullName: "Old Name",
    phone: "+49 111 222333",
    addressBookUrl: "/ab/",
    url: "/ab/existing-123.vcf",
    etag: '"etag1"',
  };

  const payload = buildUpdatePayload(existing, {
    uid: "existing-123",
    fullName: "New Name",
  });
  assertStringIncludes(payload.vCardString, "FN:New Name");
  assertStringIncludes(payload.vCardString, "UID:existing-123");
  assertStringIncludes(payload.vCardString, "TEL;TYPE=CELL:+49 111 222333");
});

Deno.test("buildUpdatePayload: empty string clears a field", () => {
  const existing: DavitContact = {
    uid: "clear-123",
    fullName: "Jane Doe",
    phone: "+49 111 222333",
    email: "jane@example.com",
    addressBookUrl: "/ab/",
    url: "/ab/clear-123.vcf",
    etag: '"etag1"',
  };

  const payload = buildUpdatePayload(existing, {
    uid: "clear-123",
    phone: "",
  });
  // Phone should be cleared (not present in vCard)
  assertEquals(payload.vCardString.includes("TEL"), false);
  // Email should be preserved
  assertStringIncludes(payload.vCardString, "EMAIL:jane@example.com");
});

Deno.test("mapContact: handles missing optional fields", () => {
  const minimalVcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "UID:minimal-001",
    "FN:Minimal Contact",
    "N:Minimal Contact;;;;",
    "END:VCARD",
  ].join("\r\n");

  const contact = mapContact(
    { url: "/ab/minimal.vcf", data: minimalVcard, etag: '"e1"' },
    "/ab/",
  );
  assertEquals(contact.uid, "minimal-001");
  assertEquals(contact.fullName, "Minimal Contact");
  assertEquals(contact.phone, undefined);
  assertEquals(contact.email, undefined);
});
