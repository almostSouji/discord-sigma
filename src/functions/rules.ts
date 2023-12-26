import {
  type Client,
  type APIApplicationCommandInteraction,
  MessageFlags,
} from "@discordjs/core";
import type { DiscordRule } from "../types.js";
import { ruleToDiscordEmbed } from "../util/ruleformatting.js";

export async function rulesCommand(
  client: Client,
  interaction: APIApplicationCommandInteraction,
  rule: DiscordRule
) {
  await client.api.interactions.reply(interaction.id, interaction.token, {
    flags: MessageFlags.Ephemeral,
    embeds: [ruleToDiscordEmbed(rule)],
  });
}
