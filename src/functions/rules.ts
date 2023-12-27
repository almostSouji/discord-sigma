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
  rule: DiscordRule,
  hide: boolean
) {
  await client.api.interactions.reply(interaction.id, interaction.token, {
    flags: hide ? MessageFlags.Ephemeral : undefined,
    embeds: [ruleToDiscordEmbed(rule)],
  });
}
