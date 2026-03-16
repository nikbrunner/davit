import { parse as parseToml } from "@std/toml";
import type { DavitConfig, ServerConfig } from "./core/types.ts";

/**
 * Resolve password for a server. Priority:
 * 1. DAVIT_{SERVER_NAME}_PASSWORD env var
 * 2. password field from config
 * 3. Throw
 */
export function resolvePassword(
  serverName: string,
  configPassword: string | undefined,
): string {
  const envKey = `DAVIT_${serverName.toUpperCase()}_PASSWORD`;
  const envPass = Deno.env.get(envKey);
  if (envPass) return envPass;
  if (configPassword) return configPassword;
  throw new Error(
    `No password found for server "${serverName}". Set ${envKey} or add password to config.`,
  );
}

interface TomlServerConfig {
  url: string;
  username: string;
  password?: string;
}

interface TomlConfig {
  default_server: string;
  default_calendar?: string;
  servers: Record<string, TomlServerConfig>;
}

/** Parse a TOML config string into DavitConfig */
export function resolveConfig(tomlString: string): DavitConfig {
  const raw = parseToml(tomlString) as unknown as TomlConfig;
  const servers: Record<string, ServerConfig> = {};
  for (const [name, srv] of Object.entries(raw.servers ?? {})) {
    servers[name] = {
      url: srv.url,
      username: srv.username,
      password: srv.password,
    };
  }
  return {
    defaultServer: raw.default_server,
    defaultCalendar: raw.default_calendar,
    servers,
  };
}

/** Load config from ~/.config/davit/config.toml, or return defaults from env */
export async function loadConfig(): Promise<DavitConfig> {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  const configPath = `${home}/.config/davit/config.toml`;

  try {
    const text = await Deno.readTextFile(configPath);
    return resolveConfig(text);
  } catch {
    // No config file — build from env vars (for MCP/simple usage)
    const url = Deno.env.get("CALDAV_BASE_URL");
    const username = Deno.env.get("CALDAV_USERNAME");
    const password = Deno.env.get("CALDAV_PASSWORD");
    if (!url || !username || !password) {
      throw new Error(
        `No config file at ${configPath} and CALDAV_BASE_URL/CALDAV_USERNAME/CALDAV_PASSWORD env vars not set.`,
      );
    }
    return {
      defaultServer: "default",
      servers: {
        default: { url, username, password },
      },
    };
  }
}
