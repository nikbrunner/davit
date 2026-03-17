import { Command } from "@cliffy/command";
import { loadConfig } from "../config.ts";
import { createCardDAVClient } from "../core/client.ts";
import { findAddressBook, listAddressBooks } from "../core/addressBooks.ts";
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "../core/contacts.ts";
import { formatContact, formatContacts, type OutputFormat } from "./format.ts";
import type { DavitClient } from "../core/client.ts";

/** Resolve the target address book — by name or default */
async function resolveAddressBook(
  client: DavitClient,
  addressBookName?: string,
  defaultAddressBook?: string,
) {
  const name = addressBookName ?? defaultAddressBook;
  if (name) {
    const ab = await findAddressBook(client, name);
    if (!ab) {
      console.error(`Address book "${name}" not found.`);
      Deno.exit(2);
    }
    return ab;
  }
  const addressBooks = await listAddressBooks(client);
  if (addressBooks.length === 0) {
    console.error("No address books found.");
    Deno.exit(1);
  }
  return addressBooks[0]!;
}

/** Resolve contact by UID — searches all address books or a specific one */
async function resolveContact(
  client: DavitClient,
  uid: string,
  addressBookName?: string,
  defaultAddressBook?: string,
) {
  const addressBooks = addressBookName || defaultAddressBook
    ? [await resolveAddressBook(client, addressBookName, defaultAddressBook)]
    : await listAddressBooks(client);

  for (const ab of addressBooks) {
    const contact = await getContact(client, ab, uid);
    if (contact) return contact;
  }
  console.error(`Contact "${uid}" not found.`);
  Deno.exit(2);
}

const listCommand = new Command()
  .description("List contacts in an address book")
  .option("--address-book <name:string>", "Address book name")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async ({
      addressBook,
      format,
    }: {
      addressBook?: string;
      format: string;
    }) => {
      const config = await loadConfig();
      const client = await createCardDAVClient(config);

      if (!addressBook && !config.defaultAddressBook) {
        // No address book specified — aggregate from all
        const addressBooks = await listAddressBooks(client);
        const allContacts: import("../core/types.ts").DavitContact[] = [];
        for (const ab of addressBooks) {
          const contacts = await listContacts(client, ab);
          allContacts.push(...contacts);
        }
        allContacts.sort((a, b) => a.fullName.localeCompare(b.fullName));
        console.log(formatContacts(allContacts, format as OutputFormat));
        return;
      }

      const ab = await resolveAddressBook(
        client,
        addressBook,
        config.defaultAddressBook,
      );
      const contacts = await listContacts(client, ab);
      console.log(formatContacts(contacts, format as OutputFormat));
    },
  );

const showCommand = new Command()
  .description("Show full contact details")
  .arguments("<uid:string>")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .option("--address-book <name:string>", "Address book to search in")
  .action(
    async (
      { format, addressBook }: { format: string; addressBook?: string },
      uid: string,
    ) => {
      const config = await loadConfig();
      const client = await createCardDAVClient(config);
      const contact = await resolveContact(
        client,
        uid,
        addressBook,
        config.defaultAddressBook,
      );
      console.log(formatContact(contact, format as OutputFormat));
    },
  );

const createCommand = new Command()
  .description("Create a new contact")
  .arguments("<name:string>")
  .option("--phone <number:string>", "Phone number")
  .option("--email <address:string>", "Email address")
  .option("--org <name:string>", "Organization")
  .option("--note <text:string>", "Note")
  .option("--address <text:string>", "Physical address")
  .option("--address-book <name:string>", "Address book name")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async (
      {
        phone,
        email,
        org,
        note,
        address,
        addressBook,
        format,
      }: {
        phone?: string;
        email?: string;
        org?: string;
        note?: string;
        address?: string;
        addressBook?: string;
        format: string;
      },
      name: string,
    ) => {
      const config = await loadConfig();
      const client = await createCardDAVClient(config);
      const ab = await resolveAddressBook(
        client,
        addressBook,
        config.defaultAddressBook,
      );

      // Derive firstName/lastName from "First Last" pattern
      const parts = name.trim().split(/\s+/);
      const firstName = parts.length > 1
        ? parts.slice(0, -1).join(" ")
        : undefined;
      const lastName = parts.length > 1 ? parts[parts.length - 1] : undefined;

      const contact = await createContact(client, ab, {
        fullName: name,
        firstName,
        lastName,
        phone,
        email,
        address,
        organization: org,
        note,
        addressBookUrl: ab.url,
      });
      console.log(formatContact(contact, format as OutputFormat));
    },
  );

const updateCommand = new Command()
  .description("Update an existing contact")
  .arguments("<uid:string>")
  .option("--name <text:string>", "New full name")
  .option("--phone <number:string>", "New phone number")
  .option("--email <address:string>", "New email address")
  .option("--org <name:string>", "New organization")
  .option("--note <text:string>", "New note")
  .option("--address <text:string>", "New physical address")
  .option("--address-book <name:string>", "Address book to search in")
  .option("--format <format:string>", "Output format (json|table)", {
    default: "table",
  })
  .action(
    async (
      {
        name,
        phone,
        email,
        org,
        note,
        address,
        addressBook,
        format,
      }: {
        name?: string;
        phone?: string;
        email?: string;
        org?: string;
        note?: string;
        address?: string;
        addressBook?: string;
        format: string;
      },
      uid: string,
    ) => {
      const config = await loadConfig();
      const client = await createCardDAVClient(config);
      const existing = await resolveContact(
        client,
        uid,
        addressBook,
        config.defaultAddressBook,
      );

      // Derive firstName/lastName if name is being updated
      let firstName: string | undefined;
      let lastName: string | undefined;
      if (name) {
        const parts = name.trim().split(/\s+/);
        firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : undefined;
        lastName = parts.length > 1 ? parts[parts.length - 1] : undefined;
      }

      const updated = await updateContact(client, existing, {
        uid,
        fullName: name,
        firstName,
        lastName,
        phone,
        email,
        address,
        organization: org,
        note,
      });
      console.log(formatContact(updated, format as OutputFormat));
    },
  );

const deleteCommand = new Command()
  .description("Delete a contact")
  .arguments("<uid:string>")
  .option("--address-book <name:string>", "Address book to search in")
  .action(
    async ({ addressBook }: { addressBook?: string }, uid: string) => {
      const config = await loadConfig();
      const client = await createCardDAVClient(config);
      const contact = await resolveContact(
        client,
        uid,
        addressBook,
        config.defaultAddressBook,
      );
      await deleteContact(client, contact);
      console.log(`Deleted contact "${contact.fullName}" (${contact.uid})`);
    },
  );

export const contactCommand = new Command()
  .description("Contact operations")
  .action(function () {
    this.showHelp();
  })
  .command("list", listCommand)
  .command("show", showCommand)
  .command("create", createCommand)
  .command("update", updateCommand)
  .command("delete", deleteCommand);
