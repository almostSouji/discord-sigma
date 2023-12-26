import "reflect-metadata";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  type APIApplicationCommandInteractionDataStringOption,
} from "@discordjs/core";
import process from "process";
import { default as Client } from "./client.js";
import { evaluateOmega, loadRulesInto } from "omega-rules";
import { RunRuleCommand } from "./deployment/interactions/runrule.js";
import { fileURLToPath } from "node:url";
import { createRulecaches } from "./util/providers.js";
import { runRuleCommand, runruleAutocomplete } from "./functions/runrule.js";

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
    // console.log("(▶) Received interaction.");
    // console.dir(interaction, { depth: null });
    if (interaction.type === InteractionType.ApplicationCommand) {
      const data = interaction.data;
      if (
        data.name === RunRuleCommand.name &&
        data.type === ApplicationCommandType.ChatInput
      ) {
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

        await runRuleCommand(client, interaction, rule);
      }
    }
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const data = interaction.data;
      const focused = data.options.find(
        (option) =>
          option.type === ApplicationCommandOptionType.String && option?.focused
      );
      if (!focused) {
        return;
      }

      if (
        data.name === RunRuleCommand.name &&
        focused.name === RunRuleCommand.options[0].name
      ) {
        await runruleAutocomplete(client, interaction);
      }
    }
  }
);

client.ws.connect();
