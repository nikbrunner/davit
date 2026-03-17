import type { DavitAddressBook } from "./types.ts";
import type { DavitClient } from "./client.ts";

// deno-lint-ignore no-explicit-any
type DAVAddressBookLike = Record<string, any>;

/** Map raw DAV address book objects to DavitAddressBook */
export function mapAddressBooks(raw: DAVAddressBookLike[]): DavitAddressBook[] {
  return raw.map((ab) => ({
    url: ab.url ?? "",
    displayName: ab.displayName ?? "Untitled",
    description: ab.description || undefined,
    ctag: ab.ctag || undefined,
  }));
}

/** Fetch all address books from the server */
export async function listAddressBooks(
  client: DavitClient,
): Promise<DavitAddressBook[]> {
  const addressBooks = await client.fetchAddressBooks();
  return mapAddressBooks(addressBooks);
}

/** Find an address book by display name (case-insensitive) */
export async function findAddressBook(
  client: DavitClient,
  name: string,
): Promise<DavitAddressBook | undefined> {
  const addressBooks = await listAddressBooks(client);
  return addressBooks.find(
    (ab) => ab.displayName.toLowerCase() === name.toLowerCase(),
  );
}
