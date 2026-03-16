import { assertEquals, assertThrows } from "@std/assert";
import { resolveConfig, resolvePassword } from "../../src/config.ts";

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
