import { EmbedType, type APIEmbed, type APIEmbedField } from "@discordjs/core";
import type { Rule, RuleLevel } from "omega-rules";
import { Colors } from "./constants.js";
import { stringify } from "yaml";
import { truncate, truncateEmbed } from "./truncate.js";

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

export function resolveRuleEmoji(level: RuleLevel = "informational") {
  switch (level) {
    case "low":
      return "🟢";
    case "medium":
      return "🟡";
    case "high":
      return "🟠";
    case "critical":
      return "🔴";
    case "informational":
    default:
      return "🔵";
  }
}

export function resolveRuleSeverityNumber(level: RuleLevel = "informational") {
  return ["informational", "low", "medium", "high", "critical"].indexOf(level);
}

export function ruleToDiscordEmbed(rule: Rule): APIEmbed {
  const embed = {
    type: EmbedType.Rich,
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
      : `\`\`\`yml\n${truncate(detectionYaml, 1012, "\n")}\n\`\`\``,
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
