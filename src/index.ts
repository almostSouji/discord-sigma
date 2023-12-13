import "reflect-metadata";
import { GatewayDispatchEvents, GatewayIntentBits } from "@discordjs/core";
import process from "process";
import { default as Client } from "./client.js";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  process.exit(1);
}

const client = new Client(
  token,
  GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent
);

client.once(GatewayDispatchEvents.Ready, () => {
  console.log("(·) Client is ready.");
});

client.on(GatewayDispatchEvents.MessageCreate, ({ data: message }) => {
  console.log(
    `(!) User ${message.author.username} (${message.author.id}) wrote a message`
  );
});

client.ws.connect();
