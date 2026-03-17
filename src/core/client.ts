import { createDAVClient } from "tsdav";
import type { DavitConfig } from "./types.ts";
import { resolvePassword } from "../config.ts";

export type DavitClient = Awaited<ReturnType<typeof createDAVClient>>;

/** Create an authenticated tsdav client from davit config */
export async function createClient(config: DavitConfig): Promise<DavitClient> {
  const serverName = config.defaultServer;
  const server = config.servers[serverName];
  if (!server) {
    throw new Error(`Server "${serverName}" not found in config.`);
  }

  const password = resolvePassword(serverName, server.password);

  const client = await createDAVClient({
    serverUrl: server.url,
    credentials: {
      username: server.username,
      password,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  return client;
}

/** Create an authenticated tsdav client for CardDAV (contacts) */
export async function createCardDAVClient(
  config: DavitConfig,
): Promise<DavitClient> {
  const serverName = config.defaultServer;
  const server = config.servers[serverName];
  if (!server) {
    throw new Error(`Server "${serverName}" not found in config.`);
  }

  const password = resolvePassword(serverName, server.password);

  const client = await createDAVClient({
    serverUrl: server.url,
    credentials: {
      username: server.username,
      password,
    },
    authMethod: "Basic",
    defaultAccountType: "carddav",
  });

  return client;
}
