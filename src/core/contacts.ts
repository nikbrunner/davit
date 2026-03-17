import type {
  CreateContactInput,
  DavitContact,
  UpdateContactInput,
} from "./types.ts";
import type { DavitClient } from "./client.ts";
import { buildVCard, parseVCard } from "./vcard.ts";

// deno-lint-ignore no-explicit-any
type DAVVCardObjectLike = Record<string, any>;

/** Map a single DAV vCard object to a DavitContact */
export function mapContact(
  raw: DAVVCardObjectLike,
  addressBookUrl: string,
): DavitContact {
  const parsed = parseVCard(raw.data ?? "");
  return {
    uid: parsed.uid,
    fullName: parsed.fullName,
    lastName: parsed.lastName,
    firstName: parsed.firstName,
    phone: parsed.phone,
    email: parsed.email,
    address: parsed.address,
    organization: parsed.organization,
    note: parsed.note,
    addressBookUrl,
    url: raw.url ?? "",
    etag: raw.etag,
  };
}

/** Map and sort an array of DAV vCard objects */
export function mapContacts(
  rawObjects: DAVVCardObjectLike[],
  addressBookUrl: string,
): DavitContact[] {
  return rawObjects
    .filter((obj) => obj.data)
    .map((obj) => mapContact(obj, addressBookUrl))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** List all contacts in an address book */
export async function listContacts(
  client: DavitClient,
  addressBook: { url: string },
): Promise<DavitContact[]> {
  const objects = await client.fetchVCards({
    addressBook: addressBook as Parameters<
      DavitClient["fetchVCards"]
    >[0]["addressBook"],
  });
  return mapContacts(objects, addressBook.url);
}

/** Get a single contact by UID */
export async function getContact(
  client: DavitClient,
  addressBook: { url: string },
  uid: string,
): Promise<DavitContact | undefined> {
  const objects = await client.fetchVCards({
    addressBook: addressBook as Parameters<
      DavitClient["fetchVCards"]
    >[0]["addressBook"],
  });
  const contacts = mapContacts(objects, addressBook.url);
  return contacts.find((c) => c.uid === uid);
}

/** Build the payload for creating a new contact (without calling tsdav) */
export function buildCreatePayload(input: CreateContactInput): {
  filename: string;
  vCardString: string;
  uid: string;
} {
  const uid = crypto.randomUUID();
  const vCardString = buildVCard({
    uid,
    fullName: input.fullName,
    lastName: input.lastName,
    firstName: input.firstName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    organization: input.organization,
    note: input.note,
  });
  return { filename: `${uid}.vcf`, vCardString, uid };
}

/** Build the payload for updating a contact — merges existing with changes */
export function buildUpdatePayload(
  existing: DavitContact,
  updates: UpdateContactInput,
): { vCardString: string } {
  const vCardString = buildVCard({
    uid: existing.uid,
    fullName: updates.fullName ?? existing.fullName,
    lastName: updates.lastName ?? existing.lastName,
    firstName: updates.firstName ?? existing.firstName,
    phone: updates.phone ?? existing.phone,
    email: updates.email ?? existing.email,
    address: updates.address ?? existing.address,
    organization: updates.organization ?? existing.organization,
    note: updates.note ?? existing.note,
  });
  return { vCardString };
}

/** Create a new contact on the server */
export async function createContact(
  client: DavitClient,
  addressBook: { url: string },
  input: CreateContactInput,
): Promise<DavitContact> {
  const { filename, vCardString, uid } = buildCreatePayload(input);

  await client.createVCard({
    addressBook: addressBook as Parameters<
      DavitClient["createVCard"]
    >[0]["addressBook"],
    filename,
    vCardString,
  });

  return {
    uid,
    fullName: input.fullName,
    lastName: input.lastName,
    firstName: input.firstName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    organization: input.organization,
    note: input.note,
    addressBookUrl: addressBook.url,
    url: `${addressBook.url}${filename}`,
    etag: undefined,
  };
}

/** Update an existing contact on the server */
export async function updateContact(
  client: DavitClient,
  existing: DavitContact,
  updates: UpdateContactInput,
): Promise<DavitContact> {
  const { vCardString } = buildUpdatePayload(existing, updates);

  await client.updateVCard({
    vCard: {
      url: existing.url,
      data: vCardString,
      etag: existing.etag,
    },
  });

  return {
    ...existing,
    fullName: updates.fullName ?? existing.fullName,
    lastName: updates.lastName ?? existing.lastName,
    firstName: updates.firstName ?? existing.firstName,
    phone: updates.phone ?? existing.phone,
    email: updates.email ?? existing.email,
    address: updates.address ?? existing.address,
    organization: updates.organization ?? existing.organization,
    note: updates.note ?? existing.note,
  };
}

/** Delete a contact from the server */
export async function deleteContact(
  client: DavitClient,
  contact: DavitContact,
): Promise<void> {
  await client.deleteVCard({
    vCard: {
      url: contact.url,
      etag: contact.etag,
    },
  });
}
