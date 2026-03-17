import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
  generateDefaultConfig,
  getConfigPath,
  resolveConfig,
  resolvePassword,
} from "../../src/config.ts";

Deno.test("resolvePassword: env var takes priority", () => {
  Deno.env.set("DAVIT_ICLOUD_PASSWORD", "env-pass");
  const result = resolvePassword("icloud", "config-pass");
  assertEquals(result, "env-pass");
  Deno.env.delete("DAVIT_ICLOUD_PASSWORD");
});

Deno.test("resolvePassword: falls back to config value", () => {
  Deno.env.delete("DAVIT_MYSERVER_PASSWORD");
  const result = resolvePassword("myserver", "config-pass");
  assertEquals(result, "config-pass");
});

Deno.test("resolvePassword: throws when no password available", () => {
  Deno.env.delete("DAVIT_NOPASS_PASSWORD");
  assertThrows(
    () => resolvePassword("nopass", undefined),
    Error,
    "No password found",
  );
});

Deno.test("resolveConfig: parses TOML string", () => {
  const toml = `
default_server = "icloud"
default_calendar = "home"

[servers.icloud]
url = "https://caldav.icloud.com"
username = "user@example.com"
`;
  const config = resolveConfig(toml);
  assertEquals(config.defaultServer, "icloud");
  assertEquals(config.defaultCalendar, "home");
  const icloud = config.servers["icloud"];
  assertEquals(icloud?.url, "https://caldav.icloud.com");
  assertEquals(icloud?.username, "user@example.com");
});

Deno.test("generateDefaultConfig: produces valid TOML with iCloud defaults", () => {
  const toml = generateDefaultConfig();
  assertStringIncludes(toml, 'default_server = "icloud"');
  assertStringIncludes(toml, "[servers.icloud]");
  assertStringIncludes(toml, 'url = "https://caldav.icloud.com"');
  assertStringIncludes(toml, "DAVIT_ICLOUD_PASSWORD");

  // Should round-trip through resolveConfig
  const config = resolveConfig(toml);
  assertEquals(config.defaultServer, "icloud");
  assertEquals(config.servers["icloud"]?.url, "https://caldav.icloud.com");
});

Deno.test("getConfigPath: returns ~/.config/davit/config.toml", () => {
  const home = Deno.env.get("HOME") ?? "";
  const expected = `${home}/.config/davit/config.toml`;
  assertEquals(getConfigPath(), expected);
});
