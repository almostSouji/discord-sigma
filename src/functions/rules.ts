import {
  type Client,
  type APIApplicationCommandInteraction,
  MessageFlags,
} from "@discordjs/core";
import { ruleToDiscordEmbed } from "../util/ruleformatting.js";
import type { Rule } from "omega-rules";

export async function rulesCommand(
  client: Client,
  interaction: APIApplicationCommandInteraction,
  rule: Rule,
  hide: boolean
) {
  await client.api.interactions.reply(interaction.id, interaction.token, {
    flags: hide ? MessageFlags.Ephemeral : undefined,
    embeds: [ruleToDiscordEmbed(rule)],
  });
}
