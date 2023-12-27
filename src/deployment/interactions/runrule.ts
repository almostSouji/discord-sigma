import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord-api-types/v10";

export const RunRuleCommand = {
  type: ApplicationCommandType.ChatInput,
  name: "runrule",
  description: "Run a specific rule on all members of the server",
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
      type: ApplicationCommandOptionType.Boolean,
      name: "hide",
      description: "Hide the output (default: True)",
    },
  ],
} as const;
