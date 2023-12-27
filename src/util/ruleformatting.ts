import type { APIEmbed, APIEmbedField } from "@discordjs/core";
import type { DiscordRule } from "../types.js";
import { truncateEmbed } from "@yuudachi/framework";
import type { RuleLevel } from "omega-rules";
import { Colors } from "./constants.js";
import { stringify } from "yaml";

function resolveRuleColor(level: RuleLevel = "informational") {
  switch (level) {
    case "low":
      return Colors.DiscordSuccess;
    case "medium":
      return Colors.Yellow;
    case "high":
      return Colors.Omega;
    case "critical":
      return Colors.DiscordDanger;
    case "informational":
    default:
      return Colors.DiscordBlurple;
  }
}

export function ruleToDiscordEmbed(rule: DiscordRule): APIEmbed {
  const embed = {
    title: rule.title,
    color: resolveRuleColor(rule.level),
  } as APIEmbed;

  const fields: APIEmbedField[] = [];

  if (rule.description) {
    embed.description = rule.description;
  }

  const detectionYaml = stringify(rule.detection);
  const tlpRed = rule.tags?.some((tag) => /^tlp[:\.]red$/i.exec(tag));

  fields.push({
    name: "Detection",
    value: tlpRed
      ? "*Detection Logic redacted: [`tlp.red`](<https://www.first.org/tlp/>)*"
      : `\`\`\`yml\n${detectionYaml}\n\`\`\``,
  });

  if (rule.level) {
    fields.push({
      name: "Impact",
      value: `\`${rule.level}\``,
    });
  }

  if (rule.falsepositives) {
    fields.push({
      name: "False positives",
      value: rule.falsepositives.map((entry) => `* ${entry}`).join("/n"),
    });
  }

  if (fields.length) {
    embed.fields = fields;
  }

  if (rule.id) {
    embed.footer = {
      text: rule.id,
    };
  }

  return truncateEmbed(embed);
}
