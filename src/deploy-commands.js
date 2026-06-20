require('dotenv').config();

const { REST, Routes } = require('discord.js');
const logger = require('./utils/logger');
const { loadConfig } = require('./config/configManager');
const { getJavaScriptFiles } = require('./utils/loaders');
const path = require('node:path');

async function deployCommands() {
  const { branding } = loadConfig().config;

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token) throw new Error('DISCORD_TOKEN is missing from .env');
  if (!clientId) throw new Error('CLIENT_ID is missing from .env');
  if (!guildId) throw new Error('GUILD_ID is missing from .env');

  const commandsPath = path.join(process.cwd(), 'src', 'commands');
  const commandFiles = getJavaScriptFiles(commandsPath);
  const commands = [];

  for (const file of commandFiles) {
    delete require.cache[require.resolve(file)];
    const command = require(file);

    if (!command?.data?.toJSON) {
      logger.warn(`Skipped invalid command file during deploy: ${file}`);
      continue;
    }

    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(token);

  logger.info(`Deploying ${commands.length} slash command(s) for ${branding.serverName}...`);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  logger.success('Slash commands deployed successfully.');
}

deployCommands().catch((error) => {
  logger.error('Failed to deploy slash commands.', error);
  process.exit(1);
});
