const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { getConfig } = require('../config/configManager');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const config = getConfig();

    client.user.setPresence({
      activities: [
        {
          name: `${config.branding.shortName} operations`,
          type: ActivityType.Watching
        }
      ],
      status: 'online'
    });

    logger.success(`${client.user.tag} is online.`);
  }
};
