import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "@discordjs/core";

export const PolicyCommand = {
  type: ApplicationCommandType.ChatInput,
  name: "policy",
  description: "Show the link to the privacy policy",
  default_member_permissions: 8,
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "hide",
      description: "Hide the output (default: True)",
    },
  ],
} as const;
