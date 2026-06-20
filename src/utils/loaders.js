const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');

function getJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...getJavaScriptFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(entryPath);
    }
  }

  return files;
}

function loadCommands(client) {
  const commandsPath = path.join(process.cwd(), 'src', 'commands');
  const commandFiles = getJavaScriptFiles(commandsPath);

  for (const file of commandFiles) {
    delete require.cache[require.resolve(file)];
    const command = require(file);

    if (!command?.data?.name || typeof command.execute !== 'function') {
      logger.warn(`Skipped invalid command file: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    logger.info(`Loaded command: /${command.data.name}`);
  }

  return client.commands;
}

function loadEvents(client) {
  const eventsPath = path.join(process.cwd(), 'src', 'events');
  const eventFiles = getJavaScriptFiles(eventsPath);

  for (const file of eventFiles) {
    delete require.cache[require.resolve(file)];
    const event = require(file);

    if (!event?.name || typeof event.execute !== 'function') {
      logger.warn(`Skipped invalid event file: ${file}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    logger.info(`Loaded event: ${event.name}`);
  }
}

module.exports = {
  getJavaScriptFiles,
  loadCommands,
  loadEvents
};
