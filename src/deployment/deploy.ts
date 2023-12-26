import "reflect-metadata";
import process from "node:process";
import { REST } from "@discordjs/rest";
import { RunRuleCommand } from "./interactions/runrule.js";

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!);

try {
  await rest.put(`/applications/${process.env.DISCORD_CLIENT_ID}/commands`, {
    body: [RunRuleCommand],
  });

  console.log(`Successfully reloaded interaction commands`);
} catch (error) {
  console.error(error);
}
