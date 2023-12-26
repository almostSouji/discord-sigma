import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord-api-types/v10";

export const RulesCommand = {
  type: ApplicationCommandType.ChatInput,
  name: "rules",
  description: "Show information about a specific rule",
  default_member_permissions: 8,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      name: "query",
      description: "Browse and select rules",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "Type of rule to browse (default: User)",
      choices: [
        { name: "User", value: "user" },
        { name: "Message", value: "message" },
      ],
    },
  ],
} as const;
