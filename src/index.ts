import "reflect-metadata";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  type APIApplicationCommandInteractionDataStringOption,
  type APIApplicationCommandInteractionDataBooleanOption,
  type APIUser,
  type APIMessage,
  MessageFlags,
} from "@discordjs/core";
import process from "process";
import { default as Client } from "./client.js";
import { evaluateOmega, loadRulesInto, type Rule } from "omega-rules";
import { RunRuleCommand } from "./deployment/interactions/runrule.js";
import { fileURLToPath } from "node:url";
import { createRulecaches, createUserFlagCaches } from "./util/providers.js";
import {
  RuleAutocompleteType,
  runRuleCommand,
  runruleAutocomplete,
} from "./functions/runrule.js";
import { RulesCommand } from "./deployment/interactions/rules.js";
import { rulesCommand } from "./functions/rules.js";
import {
  hyperlink,
  inlineCode,
  messageLink,
  unorderedList,
  userMention,
} from "@discordjs/formatters";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  process.exit(1);
}

const rules = createRulecaches();

await loadRulesInto(
  fileURLToPath(new URL("../rules/messages/", import.meta.url)),
  rules.message
);
await loadRulesInto(
  fileURLToPath(new URL("../rules/users/", import.meta.url)),
  rules.user
);

const userCache = createUserFlagCaches();

const client = new Client(
  token,
  GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent |
    GatewayIntentBits.GuildMembers
);

client.once(GatewayDispatchEvents.Ready, () => {
  console.log("Client is ready.");
  console.log(`Loaded ${rules.user.size} user rules`);
  console.log(`Loaded ${rules.message.size} message rules`);
});

function evaluateUser(user: APIUser, guildId: string): Rule[] {
  const guildHits = userCache.get(guildId);
  if (guildHits?.has(user.id)) {
    return [];
  }

  const hits = [];
  for (const rule of rules.user.values()) {
    const result = evaluateOmega(user, rule);
    if (result.matches) {
      hits.push(rule);
    }
  }

  if (hits.length) {
    if (guildHits) {
      guildHits.add(user.id);
    } else {
      userCache.set(guildId, new Set([user.id]));
    }
  }

  return hits;
}

function evaluateMessage(message: APIMessage): Rule[] {
  const hits = [];
  for (const rule of rules.message.values()) {
    const result = evaluateOmega(message, rule);
    if (result.matches) {
      hits.push(rule);
    }
  }

  return hits;
}

function webhookLogMessage(header: string, rules: Rule[], guildId: string) {
  const webhook = process.env[`DISCORD_WEBHOOK_${guildId}`];
  if (!webhook) return;
  const [id, token] = webhook.split("/");
  if (!id || !token) return;

  client.api.webhooks.execute(id, token, {
    content: [
      header,
      unorderedList(
        rules.map((rule) => {
          if (rule.id) {
            return `${inlineCode(rule.title)} (${inlineCode(rule.id)})`;
          }
          return inlineCode(rule.title);
        })
      ),
    ].join("\n"),
    flags: MessageFlags.SuppressEmbeds,
    allowed_mentions: { parse: [] },
  });
}

function logUser(user: APIUser, rules: Rule[], guildId: string, event: string) {
  webhookLogMessage(
    `User ${userMention(user.id)} triggered configured rules on ${inlineCode(
      event
    )}`,
    rules,
    guildId
  );
}

client.on(GatewayDispatchEvents.MessageCreate, ({ data: message }) => {
  if (!message.guild_id) return;

  const messageHits = evaluateMessage(message);
  const userHits = evaluateUser(message.author, message.guild_id);
  const link = messageLink(message.channel_id, message.id);

  if (messageHits.length) {
    webhookLogMessage(
      `A ${hyperlink("message", link)} by author ${userMention(
        message.author.id
      )} triggered configured rules on ${inlineCode("message_create")}:`,
      messageHits,
      message.guild_id
    );
  }

  if (userHits.length) {
    logUser(message.author, userHits, message.guild_id, "message_create");
  }
});

client.on(GatewayDispatchEvents.GuildMemberAdd, ({ data: member }) => {
  if (!member.user) return;

  const userHits = evaluateUser(member.user, member.guild_id);
  if (userHits.length) {
    logUser(member.user, userHits, member.guild_id, "guild_member_add");
  }
});

client.on(GatewayDispatchEvents.GuildMemberUpdate, ({ data: member }) => {
  if (!member.user) return;

  const userHits = evaluateUser(member.user, member.guild_id);
  if (userHits.length) {
    logUser(member.user, userHits, member.guild_id, "guild_member_update");
  }
});

client.on(
  GatewayDispatchEvents.InteractionCreate,
  async ({ data: interaction }) => {
    if (interaction.type === InteractionType.ApplicationCommand) {
      const data = interaction.data;
      if (data.type === ApplicationCommandType.ChatInput) {
        const hideOption = data.options?.find(
          (option) => option.name === "hide"
        ) as APIApplicationCommandInteractionDataBooleanOption | undefined;
        const hide = hideOption?.value ?? true;

        if (data.name === RunRuleCommand.name) {
          const option = data.options?.find(
            (option) => option.name == RunRuleCommand.options[0].name
          ) as APIApplicationCommandInteractionDataStringOption | undefined;

          if (!option) {
            return;
          }

          const rule = rules.user.get(option.value);
          if (!rule) {
            return;
          }

          await runRuleCommand(client, interaction, rule, hide);
        }

        if (data.name === RulesCommand.name) {
          const option = data.options?.find(
            (option) => option.name === RulesCommand.options[0].name
          ) as APIApplicationCommandInteractionDataStringOption | undefined;

          if (!option) {
            return;
          }

          const rule = rules.user.get(option.value);
          if (!rule) {
            return;
          }

          await rulesCommand(client, interaction, rule, hide);
        }
      }
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const data = interaction.data;
      const focused = data.options.find(
        (option) =>
          option.type === ApplicationCommandOptionType.String && option?.focused
      );
      if (!focused || focused.type !== ApplicationCommandOptionType.String) {
        return;
      }

      if (
        data.name === RunRuleCommand.name &&
        focused.name === RunRuleCommand.options[0].name
      ) {
        return await runruleAutocomplete(
          client,
          interaction,
          focused.value,
          RuleAutocompleteType.User
        );
      }

      if (
        data.name === RulesCommand.name &&
        focused.name === RulesCommand.options[0].name
      ) {
        const ruleTypeOption = data.options.find(
          (option) =>
            option.type === ApplicationCommandOptionType.String &&
            option.name === RulesCommand.options[1].name
        ) as APIApplicationCommandInteractionDataStringOption | undefined;

        const ruleType =
          ruleTypeOption?.value === "message"
            ? RuleAutocompleteType.Message
            : RuleAutocompleteType.User;

        return await runruleAutocomplete(
          client,
          interaction,
          focused.value,
          ruleType
        );
      }
    }
  }
);

client.ws.connect();
