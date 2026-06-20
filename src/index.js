require('dotenv').config();

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const logger = require('./utils/logger');
const { loadConfig } = require('./config/configManager');
const { connectDatabase } = require('./database/connect');
const { loadCommands, loadEvents } = require('./utils/loaders');

async function main() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is missing from .env');
  }

  loadConfig();
  await connectDatabase();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User]
  });

  client.commands = new Collection();

  loadCommands(client);
  loadEvents(client);

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  logger.error('Bot failed to start.', error);
  process.exit(1);
});
