import { createDAVClient } from "tsdav";
import type { DavitConfig } from "./types.ts";
import { resolvePassword } from "../config.ts";

export type DavitClient = Awaited<ReturnType<typeof createDAVClient>>;

/** Create an authenticated tsdav client with the given account type */
async function createDavClient(
  config: DavitConfig,
  accountType: "caldav" | "carddav",
): Promise<DavitClient> {
  const serverName = config.defaultServer;
  const server = config.servers[serverName];
  if (!server) {
    throw new Error(`Server "${serverName}" not found in config.`);
  }

  const password = resolvePassword(serverName, server.password);

  return await createDAVClient({
    serverUrl: server.url,
    credentials: {
      username: server.username,
      password,
    },
    authMethod: "Basic",
    defaultAccountType: accountType,
  });
}

/** Create an authenticated tsdav client for CalDAV (calendars/events) */
export function createClient(config: DavitConfig): Promise<DavitClient> {
  return createDavClient(config, "caldav");
}

/** Create an authenticated tsdav client for CardDAV (contacts) */
export function createCardDAVClient(config: DavitConfig): Promise<DavitClient> {
  return createDavClient(config, "carddav");
}
