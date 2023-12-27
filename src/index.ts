import "reflect-metadata";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  type APIApplicationCommandInteractionDataStringOption,
  type APIApplicationCommandInteractionDataBooleanOption,
} from "@discordjs/core";
import process from "process";
import { default as Client } from "./client.js";
import { evaluateOmega, loadRulesInto } from "omega-rules";
import { RunRuleCommand } from "./deployment/interactions/runrule.js";
import { fileURLToPath } from "node:url";
import { createRulecaches } from "./util/providers.js";
import {
  RuleAutocompleteType,
  runRuleCommand,
  runruleAutocomplete,
} from "./functions/runrule.js";
import { RulesCommand } from "./deployment/interactions/rules.js";
import { rulesCommand } from "./functions/rules.js";

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

const client = new Client(
  token,
  GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent |
    GatewayIntentBits.GuildMembers
);

client.once(GatewayDispatchEvents.Ready, () => {
  console.log("(·) Client is ready.");
  console.log(`(·) Loaded ${rules.user.size} user rules`);
  console.log(`(·) Loaded ${rules.message.size} message rules`);
});

client.on(GatewayDispatchEvents.MessageCreate, ({ data: message }) => {
  for (const [key, rule] of rules.user.entries()) {
    const result = evaluateOmega(message.author, rule);
    if (result.matches) {
      console.log(
        `(!) User ${message.author.username} (${message.author.id}) matches sigma rule ${key}`
      );
    }
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
