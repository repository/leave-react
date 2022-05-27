import dotenv from "dotenv";
import Eris from "eris";
import ExpiryMap from "expiry-map";

dotenv.config();
async function main() {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
  if (!DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is not set");
  }

  const DISCORD_REACTION = process.env.DISCORD_REACTION;
  if (!DISCORD_REACTION) {
    throw new Error("DISCORD_REACTION is not set");
  }

  const client = Eris(DISCORD_TOKEN, {
    intents: ["guildMembers", "guildMessages", "guilds"],
  });

  client.on("ready", () => {
    console.log(`logged in as ${client.user.username}#${client.user.discriminator}`);
  });

  const lastMessages = new ExpiryMap<string, { channelId: string; messageId: string }>(12 * 60 * 60 * 1000);

  client.on("messageCreate", async (msg) => {
    lastMessages.set(msg.guildID + msg.author.id, { channelId: msg.channel.id, messageId: msg.id });
  });

  client.on("guildMemberRemove", async (guild, member) => {
    const lastMessage = lastMessages.get(guild.id + member.id);
    if (lastMessage) {
      client.addMessageReaction(lastMessage.channelId, lastMessage.messageId, DISCORD_REACTION).catch(console.error);
    }
  });

  await client.connect();
}
main();
