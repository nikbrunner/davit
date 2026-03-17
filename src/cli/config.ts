import { Command } from "@cliffy/command";
import { generateDefaultConfig, getConfigPath } from "../config.ts";

export const configCommand = new Command()
  .description("Configuration management")
  .action(function () {
    this.showHelp();
  })
  .command("init")
  .description("Create default config file at ~/.config/davit/config.toml")
  .option("--force", "Overwrite existing config file")
  .action(async ({ force }: { force?: boolean }) => {
    const configPath = getConfigPath();

    // Check if file already exists
    if (!force) {
      try {
        await Deno.stat(configPath);
        console.error(`Config already exists at ${configPath}`);
        console.error("Use --force to overwrite.");
        Deno.exit(1);
      } catch {
        // File doesn't exist — good
      }
    }

    // Ensure directory exists
    const dir = configPath.substring(0, configPath.lastIndexOf("/"));
    await Deno.mkdir(dir, { recursive: true });

    // Write config
    const content = generateDefaultConfig();
    await Deno.writeTextFile(configPath, content);
    console.log(`Config created at ${configPath}`);
    console.log(
      "Edit the file to set your username, then set DAVIT_ICLOUD_PASSWORD in your environment.",
    );
  })
  .command("show")
  .description("Show current config file path and contents")
  .action(async () => {
    const configPath = getConfigPath();
    console.log(`Config path: ${configPath}\n`);
    try {
      const content = await Deno.readTextFile(configPath);
      console.log(content);
    } catch {
      console.error(
        "No config file found. Run `davit config init` to create one.",
      );
    }
  });
