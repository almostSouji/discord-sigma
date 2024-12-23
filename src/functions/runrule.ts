import {
  InteractionResponseType,
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  GatewayOpcodes,
  GatewayDispatchEvents,
  type APIGuildMember,
  type GatewayGuildMembersChunkDispatchData,
  MessageFlags,
  type ToEventProps,
} from "@discordjs/core";
import type Client from "../client.js";
import { container } from "tsyringe";
import { kOmega } from "../tokens.js";
import type { DiscordRule, RuleCaches } from "../types.js";
import { evaluateOmega, type Rule } from "omega-rules";
import { ruleToDiscordEmbed } from "../util/ruleformatting.js";
import { colorBasedOnDifference } from "../util/ansicolors.js";
import { timestampFromSnowflake } from "../util/snowflakes.js";
import { ms } from "@naval-base/ms";
import kleur from "kleur";
import { truncate } from "@yuudachi/framework";

kleur.enabled = true;

function ruleLabel(rule: Rule) {
  const parts = [rule.title];
  if (rule.description) {
    parts.push(rule.description.replaceAll("\n", " "));
  }
  return truncate(parts.join(": "), 100);
}

export enum RuleAutocompleteType {
  User,
  Message,
}

export async function runruleAutocomplete(
  client: Client,
  interaction: APIApplicationCommandAutocompleteInteraction,
  query: string,
  type: RuleAutocompleteType
) {
  const rules = container.resolve<RuleCaches>(kOmega);

  const exactMatches = [];
  const includesMatches = [];
  const descriptionMatches = [];
  const rest: [string, Rule][] = [];

  const lowerQuery = query.toLowerCase();

  const cache = type === RuleAutocompleteType.User ? rules.user : rules.message;

  for (const [key, rule] of cache) {
    const lowerRuleTitle = rule.title.toLowerCase();
    const lowerKey = key.toLowerCase();
    if (lowerRuleTitle === lowerQuery || lowerKey === lowerQuery) {
      exactMatches.push([key, rule]);
      continue;
    }
    if (lowerRuleTitle.includes(lowerQuery) || lowerKey.includes(lowerQuery)) {
      includesMatches.push([key, rule]);
      continue;
    }

    if (rule.description?.toLowerCase().includes(lowerQuery)) {
      descriptionMatches.push([key, rule]);
      continue;
    }

    rest.push([key, rule]);
  }

  const result = [
    ...exactMatches,
    ...includesMatches,
    ...descriptionMatches,
    ...rest,
  ].slice(0, 25) as [string, Rule][];

  await client.rest.post(
    `/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      body: {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
          choices: result.map(([key, rule]) => ({
            value: key,
            name: ruleLabel(rule),
          })),
        },
      },
    }
  );
}

function evaluateSweep(map: Map<string, APIGuildMember>) {
  const formatted: string[] = [];
  const now = Date.now();

  let creationLower = Number.POSITIVE_INFINITY;
  let creationUpper = Number.NEGATIVE_INFINITY;
  let joinLower = Number.POSITIVE_INFINITY;
  let joinUpper = Number.NEGATIVE_INFINITY;
  let lineNumber = 0;

  const members = [...map.values()];
  members.sort((one, other) => {
    const joinedOne = new Date(one.joined_at);
    const joinedOther = new Date(other.joined_at);
    return joinedOther.getTime() - joinedOne.getTime();
  });

  for (const member of members) {
    lineNumber += 1;
    if (!member.user) {
      continue;
    }

    const joined = new Date(member.joined_at);
    const created = new Date(timestampFromSnowflake(member.user.id));
    const delta = joined.getTime() - created.getTime();

    creationLower = Math.min(created.getTime(), creationLower);
    creationUpper = Math.max(created.getTime(), creationUpper);
    joinUpper = Math.max(joined.getTime(), joinUpper);
    joinLower = Math.min(joined.getTime(), joinLower);

    formatted.push(
      `${kleur.grey(
        ` ${String(lineNumber)}`.padStart(String(map.size).length + 1, " ")
      )}  ${member.user.id.padEnd(20, " ")} c: ${colorBasedOnDifference(
        now - created.getTime(),
        created.toLocaleString("en-GB")
      )} j: ${joined.toLocaleString("en-GB")}  ${colorBasedOnDifference(
        delta,
        `Δ: ${ms(delta).padEnd(5, " ")}`
      )} u: ${member.user.username} g: ${member.user.global_name ?? "-"}`
    );
  }

  return {
    formatted,
    creationRange: [creationLower, creationUpper] as [number, number],
    joinRange: [joinLower, joinUpper] as [number, number],
  };
}

export async function runRuleCommand(
  client: Client,
  interaction: APIApplicationCommandInteraction,
  rule: DiscordRule,
  hide: boolean
) {
  if (!interaction.guild_id) {
    return;
  }

  await client.api.interactions.defer(interaction.id, interaction.token, {
    flags: hide ? MessageFlags.Ephemeral : undefined,
  });

  const matches = new Map<string, APIGuildMember>();
  let processed = 0;

  const processChunks = async ({
    data,
  }: ToEventProps<GatewayGuildMembersChunkDispatchData>) => {
    if (data.guild_id !== interaction.guild_id) {
      return;
    }

    for (const member of data.members) {
      processed += 1;
      if (!member.user) {
        continue;
      }

      const result = evaluateOmega(member.user, rule);
      if (!result.matches) {
        continue;
      }

      matches.set(member.user.id, member);
    }

    if (data.chunk_index >= data.chunk_count - 1) {
      client.off(GatewayDispatchEvents.GuildMembersChunk, processChunks);

      const { formatted, creationRange, joinRange } = evaluateSweep(matches);

      const resultSummaryParts = [
        `* Rule matches **${matches.size}** out of ${processed} guild members`,
      ];

      if (formatted.length > 1) {
        const creationRangeString = ms(
          creationRange[1] - creationRange[0],
          true
        );
        const joinRangeString = ms(joinRange[1] - creationRange[0], true);

        resultSummaryParts.push(
          `* Matching members **created** within **${creationRangeString}**`,
          `* Matching members **joined** within **${joinRangeString}**`
        );
      }

      const embed = ruleToDiscordEmbed(rule);
      const summary = {
        name: "Sweep result",
        value: resultSummaryParts.join("\n"),
      };

      if (embed.fields) {
        embed.fields.push(summary);
      } else {
        embed.fields = [summary];
      }

      await client.api.interactions.editReply(
        interaction.application_id,
        interaction.token,
        {
          embeds: [embed],
          files: matches.size
            ? [
                {
                  name: `rulesweep-${new Date().toLocaleString("en-GB")}-${
                    rule.id ?? rule.title
                  }-${interaction.guild_id}.ansi`,
                  data: Buffer.from(formatted.join("\r\n")),
                },
              ]
            : undefined,
        }
      );
    }
  };

  client.on(GatewayDispatchEvents.GuildMembersChunk, processChunks);
  client.ws.send(0, {
    op: GatewayOpcodes.RequestGuildMembers,
    d: {
      guild_id: interaction.guild_id,
      query: "",
      limit: 0,
    },
  });
}
