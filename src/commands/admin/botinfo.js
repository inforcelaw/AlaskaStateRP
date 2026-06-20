const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { getConfig } = require('../../config/configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show information about the Alaska State RP bot.'),

  async execute(interaction, client) {
    const config = getConfig();

    return interaction.reply({
      embeds: [
        infoEmbed('Alaska State RP Bot', 'Version `v0.1-base` is the foundation build for the custom roleplay management bot.')
          .addFields(
            { name: 'Server Name', value: config.branding.serverName, inline: true },
            { name: 'Short Name', value: config.branding.shortName, inline: true },
            { name: 'Bot User', value: client.user?.tag ?? 'Unknown', inline: true },
            { name: 'Database', value: 'MongoDB / Mongoose', inline: true },
            { name: 'Commands', value: 'Slash commands', inline: true },
            { name: 'Theme', value: 'Blue / white Alaska style', inline: true }
          )
      ],
      ephemeral: true
    });
  }
};
